import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { initOpenRouter } from '../lib/openrouter';
import { generateWords } from '../lib/wordGenerator';
import {
  DEFAULT_ROTATION_PARAMS,
  advanceCellAttention,
  applyCollusionMembership,
  applyUtteranceAttention,
  computeEnsembleSalience,
  detectCollusions,
  refreshCellRotationParams,
} from '../lib/attentionEngine';
import { attachPersonaToCell, generateAllPersonas } from '../lib/personaGenerator';
import { setLayoutCenter } from '../lib/gridLayout';
import { layoutSemanticGradient } from '../lib/semanticLayout';
import { createSuperCell, findResonantNeighbors } from '../lib/cliqueManager';
import type { Collusion, RotationParams, SuperCell, WordCell } from '../types';

interface AppState {
  apiKey: string;
  modelSlug: string;
  scenario: string;
  cells: WordCell[];
  superCells: SuperCell[];
  collusions: Collusion[];
  selectedCellId: string | null;
  selectedForClique: string[];
  isGenerating: boolean;
  isGeneratingPersonas: boolean;
  personaProgress: { completed: number; total: number };
  lastUtterance: string;
  error: string | null;
  tick: number;
  rotationParams: RotationParams;
  viewYaw: number;
  viewTilt: number;
  viewZoom: number;

  setApiKey: (key: string) => void;
  setModelSlug: (slug: string) => void;
  setRotationParams: (params: Partial<RotationParams>) => void;
  resetRotationParams: () => void;
  setScenario: (s: string) => void;
  generateScenario: () => Promise<void>;
  selectCell: (id: string | null) => void;
  toggleCliqueSelection: (id: string) => void;
  formClique: () => void;
  utterToCells: (text: string) => void;
  incrementTick: () => void;
  clearError: () => void;
  setViewYaw: (yaw: number) => void;
  setViewTilt: (tilt: number) => void;
  setViewZoom: (zoom: number) => void;
  rotateViewYaw: (deltaSteps: number) => void;
  resetView: () => void;
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

/**
 * Merge newly-detected collusions with previously-active ones. Collusions
 * whose members have rotated apart linger for `collusionLingerTicks` ticks
 * before dissolving, so the visual doesn't strobe every cycle.
 */
function persistCollusions(
  fresh: Collusion[],
  previous: Collusion[],
  tick: number,
  params: RotationParams,
): { collusions: Collusion[]; marked: WordCell[] | null } {
  const freshIds = new Set(fresh.map((c) => c.id));
  const lingering = previous.filter(
    (c) => !freshIds.has(c.id) && tick - c.tick <= params.collusionLingerTicks,
  );
  return { collusions: [...fresh, ...lingering], marked: null };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      modelSlug: 'openai/gpt-4o-mini',
      scenario: '',
      cells: [],
      superCells: [],
      collusions: [],
      selectedCellId: null,
      selectedForClique: [],
      isGenerating: false,
      isGeneratingPersonas: false,
      personaProgress: { completed: 0, total: 0 },
      lastUtterance: '',
      error: null,
      tick: 0,
      rotationParams: { ...DEFAULT_ROTATION_PARAMS },
      viewYaw: Math.PI / 4,
      viewTilt: 0.7,
      viewZoom: 1,

      setApiKey: (key) => {
        if (key) initOpenRouter(key);
        set({ apiKey: key });
      },
      setModelSlug: (slug) => set({ modelSlug: slug }),

      setRotationParams: (params) => {
        const rotationParams = { ...get().rotationParams, ...params };
        const tick = get().tick;
        set({
          rotationParams,
          cells: get().cells.map((c) => refreshCellRotationParams(c, tick, rotationParams)),
        });
      },

      resetRotationParams: () => {
        const rotationParams = { ...DEFAULT_ROTATION_PARAMS };
        const tick = get().tick;
        set({
          rotationParams,
          cells: get().cells.map((c) => refreshCellRotationParams(c, tick, rotationParams)),
        });
      },

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
            collusions: [],
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
                return persona
                  ? attachPersonaToCell(c, persona, get().rotationParams)
                  : c;
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
        const { cells, rotationParams, collusions } = get();
        const salienceMap = new Map<string, number>();
        const collusionByCell = new Map<string, string>();
        for (const col of collusions) {
          for (const id of col.memberIds) collusionByCell.set(id, col.id);
        }

        for (const cell of cells) {
          if (!cell.attention) continue;
          salienceMap.set(
            cell.id,
            computeEnsembleSalience(cell.attention, text, cell, rotationParams),
          );
        }

        set({
          lastUtterance: text,
          cells: cells.map((cell) => {
            const neighbors = findResonantNeighbors(cell, cells);
            const neighborSalience = Math.max(
              0,
              ...neighbors.map((n) => salienceMap.get(n.id) ?? 0),
            );
            const inCollusion = collusionByCell.has(cell.id);
            const boost = inCollusion ? rotationParams.collusionSalienceBoost : 1;
            return applyUtteranceAttention(
              cell,
              text,
              neighborSalience * rotationParams.neighborSalienceDecay,
              boost,
            );
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
        const { rotationParams } = get();
        const tick = get().tick + 1;
        const advanced = get().cells.map((c) => advanceCellAttention(c, tick, rotationParams));
        const { collusions, cellCollusionMap } = detectCollusions(advanced, tick, rotationParams);
        const persisted = persistCollusions(collusions, get().collusions, tick, rotationParams);
        const marked = applyCollusionMembership(persisted.marked ?? advanced, cellCollusionMap, rotationParams);
        set({
          tick,
          cells: marked,
          collusions: persisted.collusions,
        });
      },
      clearError: () => set({ error: null }),

      setViewYaw: (yaw) => set({ viewYaw: yaw }),
      setViewTilt: (tilt) => set({ viewTilt: Math.max(0.2, Math.min(1.2, tilt)) }),
      setViewZoom: (zoom) => set({ viewZoom: Math.max(0.4, Math.min(2, zoom)) }),
      rotateViewYaw: (deltaSteps) => set({ viewYaw: get().viewYaw + deltaSteps * (Math.PI / 4) }),
      resetView: () => set({ viewYaw: Math.PI / 4, viewTilt: 0.7, viewZoom: 1 }),
    }),
    {
      name: 'causality-settings',
      partialize: (s) => ({
        apiKey: s.apiKey,
        modelSlug: s.modelSlug,
        rotationParams: s.rotationParams,
        viewYaw: s.viewYaw,
        viewTilt: s.viewTilt,
        viewZoom: s.viewZoom,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AppState>),
        rotationParams: {
          ...DEFAULT_ROTATION_PARAMS,
          ...((persisted as Partial<AppState>)?.rotationParams ?? {}),
        },
      }),
    },
  ),
);