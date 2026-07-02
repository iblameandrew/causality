import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { initOpenRouter } from '../lib/openrouter';
import { generateWords } from '../lib/wordGenerator';
import { generatePersona } from '../lib/personaGenerator';
import { computeGridPositions } from '../lib/gridLayout';
import { createSuperCell, findResonantNeighbors } from '../lib/cliqueManager';
import type { SuperCell, WordCell } from '../types';

interface AppState {
  apiKey: string;
  modelSlug: string;
  scenario: string;
  cells: WordCell[];
  superCells: SuperCell[];
  selectedCellId: string | null;
  selectedForClique: string[];
  isGenerating: boolean;
  isExpandingPersona: boolean;
  lastUtterance: string;
  error: string | null;
  tick: number;

  setApiKey: (key: string) => void;
  setModelSlug: (slug: string) => void;
  setScenario: (s: string) => void;
  generateScenario: () => Promise<void>;
  expandPersona: (cellId: string) => Promise<void>;
  selectCell: (id: string | null) => void;
  toggleCliqueSelection: (id: string) => void;
  formClique: () => void;
  utterToCells: (text: string) => void;
  incrementTick: () => void;
  clearError: () => void;
}

function buildCells(
  related: { word: string; type: 'verb' | 'noun' }[],
  antonyms: { word: string; type: 'verb' | 'noun' }[],
): WordCell[] {
  const all = [
    ...related.map((w) => ({ ...w, polarity: 'related' as const })),
    ...antonyms.map((w) => ({ ...w, polarity: 'antonym' as const })),
  ];
  const positions = computeGridPositions(all.length);

  return all.map((item, i) => ({
    id: uuid(),
    word: item.word,
    type: item.type,
    polarity: item.polarity,
    gridX: positions[i].x,
    gridZ: positions[i].z + (item.polarity === 'antonym' ? 7 : 0),
    isListening: true,
    isReacting: false,
    reactionIntensity: 0,
  }));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      modelSlug: 'openai/gpt-4o-mini',
      scenario: '',
      cells: [],
      superCells: [],
      selectedCellId: null,
      selectedForClique: [],
      isGenerating: false,
      isExpandingPersona: false,
      lastUtterance: '',
      error: null,
      tick: 0,

      setApiKey: (key) => {
        if (key) initOpenRouter(key);
        set({ apiKey: key });
      },
      setModelSlug: (slug) => set({ modelSlug: slug }),
      setScenario: (s) => set({ scenario: s }),

      generateScenario: async () => {
        const { apiKey, modelSlug, scenario } = get();
        if (!apiKey) {
          set({ error: 'Set your OpenRouter API key first.' });
          return;
        }
        if (!scenario.trim()) {
          set({ error: 'Describe a scenario first.' });
          return;
        }

        set({ isGenerating: true, error: null });
        try {
          initOpenRouter(apiKey);
          const words = await generateWords(modelSlug, scenario);
          const cells = buildCells(words.related, words.antonyms);
          set({ cells, superCells: [], selectedCellId: null, selectedForClique: [] });
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Generation failed' });
        } finally {
          set({ isGenerating: false });
        }
      },

      expandPersona: async (cellId) => {
        const { apiKey, modelSlug, scenario, cells } = get();
        const cell = cells.find((c) => c.id === cellId);
        if (!cell || cell.persona) return;
        if (!apiKey) {
          set({ error: 'API key required.' });
          return;
        }

        set({ isExpandingPersona: true, error: null });
        try {
          initOpenRouter(apiKey);
          const persona = await generatePersona(modelSlug, cell, scenario);
          set({
            cells: cells.map((c) => (c.id === cellId ? { ...c, persona } : c)),
            selectedCellId: cellId,
          });
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Persona expansion failed' });
        } finally {
          set({ isExpandingPersona: false });
        }
      },

      selectCell: (id) => set({ selectedCellId: id }),

      toggleCliqueSelection: (id) => {
        const sel = get().selectedForClique;
        set({
          selectedForClique: sel.includes(id)
            ? sel.filter((s) => s !== id)
            : [...sel, id],
        });
      },

      formClique: () => {
        const { selectedForClique, cells, superCells } = get();
        if (selectedForClique.length < 2) return;
        const members = cells.filter((c) => selectedForClique.includes(c.id));
        const superCell = createSuperCell(members);
        const memberSet = new Set(selectedForClique);
        set({
          superCells: [...superCells, superCell],
          cells: cells.map((c) =>
            memberSet.has(c.id) ? { ...c, cliqueId: superCell.id } : c,
          ),
          selectedForClique: [],
        });
      },

      utterToCells: (text) => {
        const lower = text.toLowerCase();
        const words = lower.split(/\s+/);
        set({
          lastUtterance: text,
          cells: get().cells.map((cell) => {
            const match = words.some(
              (w) =>
                cell.word.toLowerCase().includes(w) ||
                w.includes(cell.word.toLowerCase()) ||
                cell.persona?.verbs.some((v) => v.toLowerCase().includes(w)) ||
                cell.persona?.nouns.some((n) => n.toLowerCase().includes(w)),
            );
            const neighbors = findResonantNeighbors(cell, get().cells);
            const neighborReacting = neighbors.some((n) =>
              words.some((w) => n.word.toLowerCase().includes(w)),
            );
            const intensity = match ? 1 : neighborReacting ? 0.5 : 0;
            return {
              ...cell,
              isReacting: intensity > 0,
              reactionIntensity: intensity,
              isListening: true,
            };
          }),
        });

        setTimeout(() => {
          set({
            cells: get().cells.map((c) => ({
              ...c,
              isReacting: false,
              reactionIntensity: 0,
            })),
          });
        }, 2000);
      },

      incrementTick: () => set({ tick: get().tick + 1 }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'causality-settings',
      partialize: (s) => ({
        apiKey: s.apiKey,
        modelSlug: s.modelSlug,
      }),
    },
  ),
);