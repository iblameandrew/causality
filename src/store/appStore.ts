import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { initOpenRouter } from '../lib/openrouter';
import { generateWords } from '../lib/wordGenerator';
import {
  advanceCellAttention,
  applyUtteranceAttention,
  computeEnsembleSalience,
} from '../lib/attentionEngine';
import { attachPersonaToCell, generateAllPersonas } from '../lib/personaGenerator';
import { setLayoutCenter } from '../lib/gridLayout';
import { layoutSemanticGradient } from '../lib/semanticLayout';
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
  isGeneratingPersonas: boolean;
  personaProgress: { completed: number; total: number };
  lastUtterance: string;
  error: string | null;
  tick: number;

  setApiKey: (key: string) => void;
  setModelSlug: (slug: string) => void;
  setScenario: (s: string) => void;
  generateScenario: () => Promise<void>;
  selectCell: (id: string | null) => void;
  toggleCliqueSelection: (id: string) => void;
  formClique: () => void;
  utterToCells: (text: string) => void;
  incrementTick: () => void;
  clearError: () => void;
}

function buildCells(
  related: { word: string; type: 'verb' | 'noun'; semanticX: number; semanticY: number }[],
  antonyms: { word: string; type: 'verb' | 'noun'; semanticX: number; semanticY: number }[],
): WordCell[] {
  const { positions, centerX, centerZ } = layoutSemanticGradient(related, antonyms);
  setLayoutCenter(centerX, centerZ);

  const all = [
    ...related.map((w) => ({ ...w, polarity: 'related' as const })),
    ...antonyms.map((w) => ({ ...w, polarity: 'antonym' as const })),
  ];

  return all.map((item, i) => ({
    id: uuid(),
    word: item.word,
    type: item.type,
    polarity: item.polarity,
    gridX: positions[i].x,
    gridZ: positions[i].z,
    semanticX: item.semanticX,
    semanticY: item.semanticY,
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
      isGeneratingPersonas: false,
      personaProgress: { completed: 0, total: 0 },
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
          set({
            cells,
            superCells: [],
            selectedCellId: null,
            selectedForClique: [],
            isGenerating: false,
            isGeneratingPersonas: true,
            personaProgress: { completed: 0, total: cells.length },
          });

          await generateAllPersonas(modelSlug, cells, scenario, (personas, completed, total) => {
            set({
              cells: get().cells.map((c) => {
                const persona = personas.get(c.id);
                return persona ? attachPersonaToCell(c, persona) : c;
              }),
              personaProgress: { completed, total },
            });
          });
        } catch (e) {
          set({ error: e instanceof Error ? e.message : 'Generation failed' });
        } finally {
          set({ isGenerating: false, isGeneratingPersonas: false });
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
        const cells = get().cells;
        const salienceMap = new Map<string, number>();

        for (const cell of cells) {
          if (!cell.attention) continue;
          salienceMap.set(cell.id, computeEnsembleSalience(cell.attention, text, cell));
        }

        set({
          lastUtterance: text,
          cells: cells.map((cell) => {
            const neighbors = findResonantNeighbors(cell, cells);
            const neighborSalience = Math.max(
              0,
              ...neighbors.map((n) => salienceMap.get(n.id) ?? 0),
            );
            return applyUtteranceAttention(cell, text, neighborSalience);
          }),
        });

        setTimeout(() => {
          set({
            cells: get().cells.map((c) => ({
              ...c,
              isReacting: false,
              reactionIntensity: 0,
              attention: c.attention
                ? { ...c.attention, salience: 0 }
                : undefined,
            })),
          });
        }, 2000);
      },

      incrementTick: () => {
        const tick = get().tick + 1;
        set({
          tick,
          cells: get().cells.map((c) => advanceCellAttention(c, tick)),
        });
      },
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