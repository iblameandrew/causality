import { chatCompletion } from './openrouter';
import { initAttentionState } from './attentionEngine';
import type { AttentionDepth, MemoryLayer, Persona, RotationParams, WordCell } from '../types';
import { DEFAULT_ROTATION_PARAMS } from './attentionEngine';

const BATCH_SIZE = 5;

const SYSTEM = `You are a persona architect. Given words from a scenario's semantic field, you emanate full living personalities for each.

Each persona is an ingenious rotatory attention system. Personality elements rotate at hierarchical speeds to ensemble attention — e.g. "hot + sticky" means the agent attends ONLY to what is referential to those qualities combined.

Return valid JSON:
{
  "personas": [
    {
      "index": 0,
      "name": "persona name derived from the word",
      "verbs": ["5 verbs this persona embodies"],
      "nouns": ["5 nouns this persona possesses/relates to"],
      "traits": ["3-5 personality traits"],
      "systemPrompt": "A detailed system prompt (150+ words) defining how this persona thinks, speaks, and acts within the scenario",
      "attentionElements": [
        {
          "qualifier": "a sensory/personality quality like hot, sticky, wary",
          "referents": ["things this quality attends to — words, concepts, sensations"],
          "depth": "surface | memory | deep",
          "sourceType": "trait | verb | noun | memory | generated"
        }
      ],
      "memoryRegistry": [
        {
          "title": "layer title",
          "narrative": "A rich story fragment of something this persona has lived",
          "emotionalTone": "the feeling of this memory"
        }
      ]
    }
  ]
}

For each word:
- Create 4-6 memory layers forming a layered autobiography (oldest/deepest layers first in the array).
- Create 6-10 attentionElements across depths: surface (fast traits/verbs/nouns), memory (mid history), deep (rooted in oldest memories).
- Deep elements must reference the oldest memory layers — slow rotations surface what is rooted in the cell's history.
Each persona must be unique and grounded in the scenario world.`;

interface RawAttentionElement {
  qualifier: string;
  referents: string[];
  depth: AttentionDepth;
  sourceType: 'trait' | 'verb' | 'noun' | 'memory' | 'generated';
}

interface RawPersona {
  index: number;
  name: string;
  verbs: string[];
  nouns: string[];
  traits: string[];
  systemPrompt: string;
  attentionElements?: RawAttentionElement[];
  memoryRegistry: { title: string; narrative: string; emotionalTone: string }[];
}

function parsePersona(cell: WordCell, raw: RawPersona): Persona {
  const layers = raw.memoryRegistry ?? [];
  const memoryRegistry: MemoryLayer[] = layers.map((m, i) => ({
    id: `mem-${cell.id}-${i}`,
    timestamp: Date.now() - (layers.length - i) * 86400000,
    title: m.title,
    narrative: m.narrative,
    emotionalTone: m.emotionalTone,
  }));

  const attentionElements = (raw.attentionElements ?? []).map((el, i) => ({
    id: `att-${cell.id}-gen-${i}`,
    qualifier: el.qualifier,
    referents: el.referents ?? [],
    depth: el.depth ?? 'surface',
    sourceType: el.sourceType ?? 'generated',
  }));

  const persona: Persona = {
    id: `persona-${cell.id}`,
    sourceWord: cell.word,
    name: raw.name ?? cell.word,
    verbs: raw.verbs ?? [],
    nouns: raw.nouns ?? [],
    systemPrompt: raw.systemPrompt ?? '',
    memoryRegistry,
    traits: raw.traits ?? [],
    attentionElements: attentionElements.length > 0 ? attentionElements : undefined,
  };

  return persona;
}

export async function generatePersonasBatch(
  model: string,
  cells: WordCell[],
  scenario: string,
): Promise<Map<string, Persona>> {
  const wordList = cells
    .map((c, i) => `${i}: "${c.word}" (${c.type}, ${c.polarity})`)
    .join('\n');

  const raw = await chatCompletion(
    model,
    SYSTEM,
    `Scenario world: "${scenario}"

Emanate a full persona for each word below:
${wordList}

Return one persona per word, using the matching index.`,
  );

  const parsed = JSON.parse(raw) as { personas: RawPersona[] };
  const result = new Map<string, Persona>();

  for (const p of parsed.personas ?? []) {
    const cell = cells[p.index];
    if (cell) result.set(cell.id, parsePersona(cell, p));
  }

  return result;
}

export async function generateAllPersonas(
  model: string,
  cells: WordCell[],
  scenario: string,
  onBatch: (personas: Map<string, Persona>, completed: number, total: number) => void,
): Promise<void> {
  const total = cells.length;
  let completed = 0;

  for (let i = 0; i < cells.length; i += BATCH_SIZE) {
    const batch = cells.slice(i, i + BATCH_SIZE);
    const personas = await generatePersonasBatch(model, batch, scenario);
    completed += batch.length;
    onBatch(personas, completed, total);
  }
}

export function attachPersonaToCell(
  cell: WordCell,
  persona: Persona,
  rotationParams: RotationParams = DEFAULT_ROTATION_PARAMS,
): WordCell {
  return {
    ...cell,
    persona,
    attention: initAttentionState(persona, cell.id, rotationParams),
  };
}