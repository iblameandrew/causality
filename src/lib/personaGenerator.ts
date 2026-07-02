import { chatCompletion } from './openrouter';
import type { MemoryLayer, Persona, WordCell } from '../types';

const SYSTEM = `You are a persona architect. Given a single word from a scenario's semantic field, you emanate a full living personality.

Return valid JSON:
{
  "name": "persona name derived from the word",
  "verbs": ["5 verbs this persona embodies"],
  "nouns": ["5 nouns this persona possesses/relates to"],
  "traits": ["3-5 personality traits"],
  "systemPrompt": "A detailed system prompt (200+ words) defining how this persona thinks, speaks, and acts within the scenario",
  "memoryRegistry": [
    {
      "title": "layer title",
      "narrative": "A rich story fragment of something this persona has lived",
      "emotionalTone": "the feeling of this memory"
    }
  ]
}

Create 4-6 memory layers forming a layered autobiography — earliest foundations to most recent experiences. Each layer should feel lived-in and specific to the scenario world.`;

export async function generatePersona(
  model: string,
  cell: WordCell,
  scenario: string,
): Promise<Persona> {
  const raw = await chatCompletion(
    model,
    SYSTEM,
    `Scenario world: "${scenario}"
Source word: "${cell.word}" (${cell.type}, ${cell.polarity})
Emanate this word into a full persona with 5 verbs, 5 nouns, system prompt, and layered memory registry.`,
  );

  const parsed = JSON.parse(raw);
  const memoryRegistry: MemoryLayer[] = (parsed.memoryRegistry ?? []).map(
    (m: { title: string; narrative: string; emotionalTone: string }, i: number) => ({
      id: `mem-${Date.now()}-${i}`,
      timestamp: Date.now() - (parsed.memoryRegistry.length - i) * 86400000,
      title: m.title,
      narrative: m.narrative,
      emotionalTone: m.emotionalTone,
    }),
  );

  return {
    id: `persona-${cell.id}`,
    sourceWord: cell.word,
    name: parsed.name ?? cell.word,
    verbs: parsed.verbs ?? [],
    nouns: parsed.nouns ?? [],
    systemPrompt: parsed.systemPrompt ?? '',
    memoryRegistry,
    traits: parsed.traits ?? [],
  };
}