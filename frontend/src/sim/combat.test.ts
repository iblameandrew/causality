import { describe, expect, it } from "vitest";
import {
  cohesionBonus,
  focusFactor,
  overcrowdPenalty,
  pressureFactor,
  resolveExchange,
} from "./combat";
import type { SimUnit } from "./types";

function unit(partial: Partial<SimUnit> & { id: string }): SimUnit {
  return {
    factionId: "a",
    color: "#fff",
    name: "U",
    summary: "",
    voicePrompt: "You are a test unit.",
    tier: "squad",
    lineage: "x",
    featureId: "f",
    maxHp: 100,
    hp: 100,
    pos: [0, 0],
    vel: [0, 0],
    attrs: {
      hp: 100,
      speed: 1,
      range: 1.5,
      armor: 1,
      will: 1,
      empathy: 1,
      structure: 1,
      damage: 12,
    },
    skills: [],
    memories: [],
    skillCd: {},
    energy: 0.7,
    baselineEnergy: 0.7,
    targetId: null,
    alive: true,
    alliesNear: 0,
    enemiesNear: 0,
    ...partial,
  };
}

describe("density modifiers", () => {
  it("cohesion grows with allies", () => {
    expect(cohesionBonus(0, 0)).toBe(0);
    expect(cohesionBonus(3, 1)).toBeGreaterThan(cohesionBonus(1, 0));
  });

  it("overcrowd kicks in past soft cap", () => {
    expect(overcrowdPenalty(3)).toBe(0);
    expect(overcrowdPenalty(10)).toBeGreaterThan(0);
  });

  it("focus dilutes with more attackers", () => {
    expect(focusFactor(0)).toBe(1);
    expect(focusFactor(4)).toBeLessThan(focusFactor(1));
  });

  it("pressure grows with enemies", () => {
    expect(pressureFactor(5)).toBeGreaterThan(pressureFactor(1));
  });
});

describe("resolveExchange", () => {
  it("high energy deals more than low energy", () => {
    const def = unit({ id: "d", factionId: "b", energy: 0.5 });
    const high = unit({ id: "h", energy: 1.0 });
    const low = unit({ id: "l", energy: 0.2 });
    const rng = () => 0.5;
    const base = {
      defender: def,
      alliesNearA: 1,
      sameFeatureAlliesA: 0,
      enemiesNearA: 1,
      alliesNearD: 0,
      sameFeatureAlliesD: 0,
      enemiesNearD: 1,
      alliesAttackingSameTarget: 0,
      rng,
    };
    const dHigh = resolveExchange({ ...base, attacker: high }).damage;
    const dLow = resolveExchange({ ...base, attacker: low }).damage;
    expect(dHigh).toBeGreaterThan(dLow);
  });

  it("ally cohesion boosts power", () => {
    const atk = unit({ id: "a", energy: 0.8 });
    const def = unit({ id: "d", factionId: "b", energy: 0.5 });
    const rng = () => 0.5;
    const alone = resolveExchange({
      attacker: atk,
      defender: def,
      alliesNearA: 0,
      sameFeatureAlliesA: 0,
      enemiesNearA: 1,
      alliesNearD: 0,
      sameFeatureAlliesD: 0,
      enemiesNearD: 1,
      alliesAttackingSameTarget: 0,
      rng,
    });
    const stacked = resolveExchange({
      attacker: atk,
      defender: def,
      alliesNearA: 4,
      sameFeatureAlliesA: 2,
      enemiesNearA: 1,
      alliesNearD: 0,
      sameFeatureAlliesD: 0,
      enemiesNearD: 1,
      alliesAttackingSameTarget: 0,
      rng,
    });
    expect(stacked.damage).toBeGreaterThan(alone.damage);
  });
});
