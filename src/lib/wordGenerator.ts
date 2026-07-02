import { chatCompletion } from './openrouter';
import type { GeneratedWords, WordType } from '../types';

const SYSTEM = `You are a semantic decomposition engine. Given a scenario description, you break it into a closed system with exactly two cardinalities: VERBS (actions, processes) and NOUNS (entities, objects, concepts).

Return valid JSON with this exact structure:
{
  "related": [{"word": "string", "type": "verb"|"noun"}, ...],
  "antonyms": [{"word": "string", "type": "verb"|"noun"}, ...]
}

Rules:
- "related" must contain exactly 50 entries (mix of verbs and nouns deeply tied to the scenario)
- "antonyms" must contain exactly 50 entries (semantic opposites/contrasts to the scenario)
- Each half should have roughly equal verbs and nouns
- Words should be evocative, specific, and scenario-grounded
- No duplicates across both lists`;

export async function generateWords(
  model: string,
  scenario: string,
): Promise<GeneratedWords> {
  const raw = await chatCompletion(
    model,
    SYSTEM,
    `Scenario: "${scenario}"\n\nDecompose this closed system into 50 related verbs/nouns and 50 antonym verbs/nouns.`,
  );

  const parsed = JSON.parse(raw) as GeneratedWords;
  return {
    related: normalizeList(parsed.related, 'related'),
    antonyms: normalizeList(parsed.antonyms, 'antonym'),
  };
}

function normalizeList(
  items: { word: string; type: string }[] | undefined,
  _label: string,
): { word: string; type: WordType }[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i) => i?.word)
    .map((i) => ({
      word: String(i.word).trim(),
      type: i.type === 'verb' ? 'verb' : 'noun',
    }));
}