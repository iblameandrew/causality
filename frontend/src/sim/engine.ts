import { ATTACK_INTERVAL } from "./balance";
import {
  countNearby,
  dist,
  regenEnergy,
  resolveExchange,
} from "./combat";
import {
  isAlly,
  isEnemy,
  pickTarget,
  seek,
  softSeparation,
  stanceBetween,
  wander,
} from "./behaviors";
import type { MatchManifest, SimUnit } from "./types";

export interface SimState {
  units: SimUnit[];
  time: number;
  attackTimer: Record<string, number>;
  seed: number;
  rngState: number;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSimFromMatch(match: MatchManifest): SimState {
  const rng = mulberry32(match.map.seed);
  const mapW = match.map.size[0] ?? 64;
  const mapH = match.map.size[1] ?? 64;
  const factions = match.factions;
  const units: SimUnit[] = [];

  const nF = Math.max(1, factions.length);
  // Spawn radius grows with faction count so unlimited charts don't stack
  const ringRadius = Math.min(mapW, mapH) * (0.18 + Math.min(0.22, nF * 0.012));

  factions.forEach((faction, fi) => {
    const angle = (fi / nF) * Math.PI * 2 - Math.PI / 2;
    const cx = mapW / 2 + Math.cos(angle) * ringRadius;
    const cy = mapH / 2 + Math.sin(angle) * ringRadius;

    faction.roster.forEach((u, ui) => {
      const ring = 1 + Math.floor(ui / 6);
      const a = (ui / Math.max(1, faction.roster.length)) * Math.PI * 2 + angle;
      const spread = 0.9 + ring * 1.15;
      const baseline = clamp01(0.45 + 0.35 * (u.attributes.will / 1.5));
      units.push({
        id: u.unit_id,
        factionId: faction.chart_id,
        color: faction.color,
        name: u.name,
        summary: u.summary,
        voicePrompt: u.voice_prompt || "",
        tier: u.tier,
        lineage: u.lineage,
        featureId: u.feature_id,
        role: u.role,
        style: u.style,
        maxHp: u.attributes.hp,
        hp: u.attributes.hp,
        pos: [
          cx + Math.cos(a) * spread + (rng() - 0.5) * 0.6,
          cy + Math.sin(a) * spread + (rng() - 0.5) * 0.6,
        ],
        vel: [0, 0],
        attrs: { ...u.attributes },
        skills: u.skills,
        memories: u.memories,
        skillCd: {},
        energy: baseline,
        baselineEnergy: baseline,
        targetId: null,
        alive: true,
        alliesNear: 0,
        enemiesNear: 0,
      });
    });
  });

  return {
    units,
    time: 0,
    attackTimer: {},
    seed: match.map.seed,
    rngState: match.map.seed,
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function nextRng(state: SimState): number {
  // xorshift
  let x = state.rngState || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.rngState = x >>> 0;
  return (state.rngState >>> 0) / 4294967296;
}

export function stepSim(state: SimState, match: MatchManifest, dt: number): SimState {
  const relations = match.relations;
  const units = state.units;
  state.time += dt;

  const allyFn = (a: SimUnit, b: SimUnit) => isAlly(relations, a, b);
  const enemyFn = (a: SimUnit, b: SimUnit) => isEnemy(relations, a, b);

  // Density pass
  for (const u of units) {
    if (!u.alive) continue;
    const n = countNearby(u, units, allyFn, enemyFn);
    u.alliesNear = n.alliesNear;
    u.enemiesNear = n.enemiesNear;
  }

  // Movement + targeting
  for (const u of units) {
    if (!u.alive) continue;
    u.targetId = pickTarget(u, units, relations);
    const target = u.targetId
      ? units.find((x) => x.id === u.targetId && x.alive)
      : null;

    let dx = 0;
    let dy = 0;
    if (target) {
      const st = stanceBetween(relations, u.factionId, target.factionId);
      const mode = st === "affiliation" ? "support" : "attack";
      const s = seek(u, target, dt, mode);
      dx += s[0];
      dy += s[1];
    } else {
      const w = wander(u, dt, state.time);
      dx += w[0];
      dy += w[1];
    }
    const sep = softSeparation(u, units, dt);
    dx += sep[0];
    dy += sep[1];

    u.pos[0] += dx;
    u.pos[1] += dy;
    // Soft bounds
    const W = match.map.size[0] ?? 64;
    const H = match.map.size[1] ?? 64;
    u.pos[0] = Math.max(1, Math.min(W - 1, u.pos[0]));
    u.pos[1] = Math.max(1, Math.min(H - 1, u.pos[1]));
  }

  // Combat / support
  for (const u of units) {
    if (!u.alive) continue;
    const inCombat = u.enemiesNear > 0 || (u.targetId != null && u.enemiesNear >= 0);
    const target = u.targetId
      ? units.find((x) => x.id === u.targetId && x.alive)
      : null;

    u.energy = regenEnergy(u, dt, u.alliesNear, Boolean(target && isEnemy(relations, u, target)));

    if (!target) continue;
    const st = stanceBetween(relations, u.factionId, target.factionId);
    const d = dist(u.pos, target.pos);

    if (st === "affiliation" && d <= u.attrs.range * 1.2) {
      // Heal / bolster
      const heal = 4 * u.attrs.empathy * dt * (0.5 + 0.5 * u.energy);
      target.hp = Math.min(target.maxHp, target.hp + heal);
      target.energy = Math.min(1, target.energy + 0.05 * dt);
      continue;
    }

    if (st !== "conflict") continue;
    if (d > u.attrs.range) continue;

    const key = u.id;
    state.attackTimer[key] = (state.attackTimer[key] ?? 0) - dt;
    if (state.attackTimer[key] > 0) continue;
    state.attackTimer[key] = ATTACK_INTERVAL / Math.max(0.5, u.attrs.speed);

    const alliesOnTarget = units.filter(
      (x) =>
        x.alive &&
        x.id !== u.id &&
        x.targetId === target.id &&
        isAlly(relations, u, x)
    ).length;

    const nearA = countNearby(u, units, allyFn, enemyFn);
    const nearD = countNearby(target, units, allyFn, enemyFn);

    const result = resolveExchange({
      attacker: u,
      defender: target,
      alliesNearA: nearA.alliesNear,
      sameFeatureAlliesA: nearA.sameFeatureAllies,
      enemiesNearA: nearA.enemiesNear,
      alliesNearD: nearD.alliesNear,
      sameFeatureAlliesD: nearD.sameFeatureAllies,
      enemiesNearD: nearD.enemiesNear,
      alliesAttackingSameTarget: alliesOnTarget,
      rng: () => nextRng(state),
    });

    target.hp -= result.damage;
    u.energy = result.energyAttacker;
    target.energy = result.energyDefender;
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      target.targetId = null;
    }
  }

  // Neutrals that were hit become temporary conflict via low HP aggression is already handled by enemy targeting from conflict stances only.
  // Hit neutrals: if someone damaged them... simplified: units with enemiesNear from faction that attacked — skip for v1.

  return state;
}
