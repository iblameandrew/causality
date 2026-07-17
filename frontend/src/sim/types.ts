export type Stance = "conflict" | "affiliation" | "neutrality";

export interface Attributes {
  hp: number;
  speed: number;
  range: number;
  armor: number;
  will: number;
  empathy: number;
  structure: number;
  damage: number;
}

export interface SkillSpec {
  id: string;
  name: string;
  kind: "attack" | "support" | "control" | "passive";
  cooldown: number;
  effect: string;
  power: number;
}

export interface MemorySpec {
  title: string;
  vignette: string;
}

export interface UnitSpec {
  unit_id: string;
  faction_id: string;
  feature_id: string;
  agent_path: string[];
  name: string;
  summary: string;
  /** Conversational system prompt for dialogue with this thought-unit. */
  voice_prompt: string;
  tier: "captain" | "squad" | "hybrid";
  lineage: string;
  attributes: Attributes;
  skills: SkillSpec[];
  memories: MemorySpec[];
  role?: string | null;
  style?: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FactionManifest {
  chart_id: string;
  name: string;
  color: string;
  roots: unknown[];
  mixtures: unknown[];
  agents: unknown[];
  roster: UnitSpec[];
}

export interface PartisanRelation {
  chart_a: string;
  chart_b: string;
  name_a: string;
  name_b: string;
  stance: Stance;
  score: number;
  drivers: { role_a: string; role_b: string; link: string; weight: number }[];
}

export interface MatchManifest {
  match_id: string;
  factions: FactionManifest[];
  relations: PartisanRelation[];
  map: { size: number[]; seed: number };
  meta: Record<string, unknown>;
}

export interface BirthInput {
  id?: string;
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lat: number;
  lng: number;
  tz_str: string;
}

export interface SimUnit {
  id: string;
  factionId: string;
  color: string;
  name: string;
  summary: string;
  voicePrompt: string;
  tier: UnitSpec["tier"];
  lineage: string;
  featureId: string;
  role?: string | null;
  style?: string | null;
  maxHp: number;
  hp: number;
  pos: [number, number];
  vel: [number, number];
  attrs: Attributes;
  skills: SkillSpec[];
  memories: MemorySpec[];
  skillCd: Record<string, number>;
  /** Energization 0..1 */
  energy: number;
  baselineEnergy: number;
  targetId: string | null;
  alive: boolean;
  alliesNear: number;
  enemiesNear: number;
}

export interface CombatEvent {
  t: number;
  attackerId: string;
  defenderId: string;
  damage: number;
  energyA: number;
  energyD: number;
}
