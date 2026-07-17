import type { BirthInput, ChatMessage, MatchManifest, MemorySpec, SkillSpec } from "../sim/types";

export async function createMatch(
  people: BirthInput[],
  options?: { max_units_per_faction?: number; include_mixtures?: boolean }
): Promise<MatchManifest> {
  const res = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ people, options: options ?? {} }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Match failed");
  }
  return res.json();
}

export async function healthCheck(): Promise<{ ok: boolean; agent_mode: string }> {
  const res = await fetch("/health");
  if (!res.ok) throw new Error("API offline");
  return res.json();
}

export interface DialoguePayload {
  unit_id: string;
  match_id?: string;
  name: string;
  voice_prompt: string;
  summary?: string;
  lineage?: string;
  role?: string | null;
  style?: string | null;
  tier?: string;
  skills?: SkillSpec[];
  memories?: MemorySpec[];
  runtime?: {
    hp?: number;
    max_hp?: number;
    energy?: number;
    allies_near?: number;
    enemies_near?: number;
    alive?: boolean;
    faction_name?: string;
  };
  history?: ChatMessage[];
  message: string;
}

export async function sendDialogue(
  payload: DialoguePayload
): Promise<{ reply: string; mode: string; unit_id: string }> {
  const res = await fetch("/api/dialogue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === "string" ? err.detail : "Dialogue failed"
    );
  }
  return res.json();
}
