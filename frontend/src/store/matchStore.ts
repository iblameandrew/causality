import { create } from "zustand";
import { createMatch, sendDialogue } from "../api/client";
import { createSimFromMatch, stepSim, type SimState } from "../sim/engine";
import type { BirthInput, ChatMessage, MatchManifest, SimUnit } from "../sim/types";

export const PRESETS: BirthInput[] = [
  {
    name: "Ada",
    year: 1990,
    month: 7,
    day: 15,
    hour: 10,
    minute: 30,
    lat: 41.9028,
    lng: 12.4964,
    tz_str: "Europe/Rome",
  },
  {
    name: "Niko",
    year: 1988,
    month: 12,
    day: 3,
    hour: 18,
    minute: 15,
    lat: 40.7128,
    lng: -74.006,
    tz_str: "America/New_York",
  },
  {
    name: "Mira",
    year: 1995,
    month: 3,
    day: 21,
    hour: 8,
    minute: 5,
    lat: 35.6762,
    lng: 139.6503,
    tz_str: "Asia/Tokyo",
  },
];

interface Store {
  people: BirthInput[];
  match: MatchManifest | null;
  sim: SimState | null;
  playing: boolean;
  speed: number;
  /** Simulation parameter: units spawned from each planet/root feature. */
  unitsPerPlanet: number;
  selectedUnitId: string | null;
  loading: boolean;
  error: string | null;
  /** Per-unit chat transcripts */
  dialogues: Record<string, ChatMessage[]>;
  dialogueBusy: boolean;
  dialogueError: string | null;
  setPeople: (p: BirthInput[]) => void;
  addPerson: () => void;
  addMany: (count: number) => void;
  removePerson: (index: number) => void;
  updatePerson: (index: number, patch: Partial<BirthInput>) => void;
  loadPresets: (count?: number) => void;
  setUnitsPerPlanet: (n: number) => void;
  generate: () => Promise<void>;
  setPlaying: (v: boolean) => void;
  setSpeed: (v: number) => void;
  selectUnit: (id: string | null) => void;
  tick: (dt: number) => void;
  selectedUnit: () => SimUnit | null;
  clearDialogue: (unitId: string) => void;
  sendUnitMessage: (unitId: string, message: string) => Promise<void>;
}

const LOCATIONS = [
  { lat: 51.5074, lng: -0.1278, tz_str: "Europe/London" },
  { lat: 40.7128, lng: -74.006, tz_str: "America/New_York" },
  { lat: 41.9028, lng: 12.4964, tz_str: "Europe/Rome" },
  { lat: 35.6762, lng: 139.6503, tz_str: "Asia/Tokyo" },
  { lat: -33.8688, lng: 151.2093, tz_str: "Australia/Sydney" },
  { lat: 19.4326, lng: -99.1332, tz_str: "America/Mexico_City" },
  { lat: 55.7558, lng: 37.6173, tz_str: "Europe/Moscow" },
  { lat: 1.3521, lng: 103.8198, tz_str: "Asia/Singapore" },
];

const emptyPerson = (index: number): BirthInput => {
  const loc = LOCATIONS[index % LOCATIONS.length];
  // Spread birth years so charts diversify when bulk-adding
  const year = 1975 + (index * 7) % 35;
  const month = 1 + (index * 3) % 12;
  const day = 1 + (index * 5) % 28;
  const hour = (index * 5) % 24;
  return {
    name: `Person ${index + 1}`,
    year,
    month,
    day,
    hour,
    minute: (index * 11) % 60,
    lat: loc.lat,
    lng: loc.lng,
    tz_str: loc.tz_str,
  };
};

export const useMatchStore = create<Store>((set, get) => ({
  people: PRESETS.slice(0, 2),
  match: null,
  sim: null,
  playing: true,
  speed: 1,
  unitsPerPlanet: 3,
  selectedUnitId: null,
  loading: false,
  error: null,
  dialogues: {},
  dialogueBusy: false,
  dialogueError: null,

  setPeople: (p) => set({ people: p }),
  addPerson: () =>
    set((s) => ({
      people: [...s.people, emptyPerson(s.people.length)],
    })),
  addMany: (count) =>
    set((s) => {
      const n = Math.max(0, Math.floor(count));
      if (n === 0) return s;
      const next = [...s.people];
      for (let i = 0; i < n; i++) {
        next.push(emptyPerson(next.length));
      }
      return { people: next };
    }),
  removePerson: (index) =>
    set((s) => ({ people: s.people.filter((_, i) => i !== index) })),
  updatePerson: (index, patch) =>
    set((s) => ({
      people: s.people.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    })),
  loadPresets: (count = 2) => {
    // Presets can be repeated/cycled so "load N" works past the short list
    const n = Math.max(1, count);
    const people: BirthInput[] = [];
    for (let i = 0; i < n; i++) {
      if (i < PRESETS.length) {
        people.push({ ...PRESETS[i] });
      } else {
        people.push(emptyPerson(i));
      }
    }
    set({ people });
  },

  setUnitsPerPlanet: (n) =>
    set({
      unitsPerPlanet: Math.max(1, Math.min(24, Math.floor(n) || 1)),
    }),

  generate: async () => {
    set({ loading: true, error: null });
    try {
      const unitsPerPlanet = get().unitsPerPlanet;
      const match = await createMatch(get().people, {
        units_per_planet: unitsPerPlanet,
        include_mixtures: true,
      });
      const sim = createSimFromMatch(match);
      set({
        match,
        sim,
        loading: false,
        playing: true,
        selectedUnitId: null,
        dialogues: {},
        dialogueError: null,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  setPlaying: (v) => set({ playing: v }),
  setSpeed: (v) => set({ speed: v }),
  selectUnit: (id) => set({ selectedUnitId: id, dialogueError: null }),

  tick: (dt) => {
    const { sim, match, playing, speed } = get();
    if (!playing || !sim || !match) return;
    stepSim(sim, match, dt * speed);
    // trigger re-render
    set({ sim: { ...sim, units: [...sim.units] } });
  },

  selectedUnit: () => {
    const { sim, selectedUnitId } = get();
    if (!sim || !selectedUnitId) return null;
    return sim.units.find((u) => u.id === selectedUnitId) ?? null;
  },

  clearDialogue: (unitId) =>
    set((s) => {
      const next = { ...s.dialogues };
      delete next[unitId];
      return { dialogues: next, dialogueError: null };
    }),

  sendUnitMessage: async (unitId, message) => {
    const text = message.trim();
    if (!text) return;
    const { sim, match, dialogues } = get();
    const unit = sim?.units.find((u) => u.id === unitId);
    if (!unit) return;

    const history = dialogues[unitId] ?? [];
    const withUser: ChatMessage[] = [...history, { role: "user", content: text }];
    set({
      dialogues: { ...dialogues, [unitId]: withUser },
      dialogueBusy: true,
      dialogueError: null,
    });

    const faction = match?.factions.find((f) => f.chart_id === unit.factionId);

    try {
      const res = await sendDialogue({
        unit_id: unit.id,
        match_id: match?.match_id,
        name: unit.name,
        voice_prompt: unit.voicePrompt,
        summary: unit.summary,
        lineage: unit.lineage,
        role: unit.role,
        style: unit.style,
        tier: unit.tier,
        skills: unit.skills,
        memories: unit.memories,
        runtime: {
          hp: unit.hp,
          max_hp: unit.maxHp,
          energy: unit.energy,
          allies_near: unit.alliesNear,
          enemies_near: unit.enemiesNear,
          alive: unit.alive,
          faction_name: faction?.name,
        },
        history,
        message: text,
      });
      const withReply: ChatMessage[] = [
        ...withUser,
        { role: "assistant", content: res.reply },
      ];
      set((s) => ({
        dialogues: { ...s.dialogues, [unitId]: withReply },
        dialogueBusy: false,
      }));
    } catch (e) {
      set({
        dialogueBusy: false,
        dialogueError: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
