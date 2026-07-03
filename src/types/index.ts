export type WordType = 'verb' | 'noun';
export type WordPolarity = 'related' | 'antonym';

/** Depth tier — slower rotation implies deeper roots in cell history */
export type AttentionDepth = 'surface' | 'memory' | 'deep';

export interface AttentionElement {
  id: string;
  qualifier: string;
  referents: string[];
  depth: AttentionDepth;
  sourceType: 'trait' | 'verb' | 'noun' | 'memory' | 'generated';
  sourceId?: string;
}

export interface RotationRing {
  depth: AttentionDepth;
  period: number;
  elementIds: string[];
  phase: number;
  activeIndex: number;
}

export interface AttentionState {
  elements: AttentionElement[];
  rings: RotationRing[];
  ensemble: AttentionElement[];
  salience: number;
  focusPrompt: string;
  deepListening: boolean;
}

export interface WordCell {
  id: string;
  word: string;
  type: WordType;
  polarity: WordPolarity;
  gridX: number;
  gridZ: number;
  semanticX: number;
  semanticY: number;
  persona?: Persona;
  attention?: AttentionState;
  isListening: boolean;
  isReacting: boolean;
  reactionIntensity: number;
  cliqueId?: string;
}

export interface MemoryLayer {
  id: string;
  timestamp: number;
  title: string;
  narrative: string;
  emotionalTone: string;
}

export interface Persona {
  id: string;
  sourceWord: string;
  name: string;
  verbs: string[];
  nouns: string[];
  systemPrompt: string;
  memoryRegistry: MemoryLayer[];
  traits: string[];
  attentionElements?: AttentionElement[];
}

export interface SuperCell {
  id: string;
  memberIds: string[];
  name: string;
  combinedPrompt: string;
  centerX: number;
  centerZ: number;
  ensemblePrompt?: string;
  deepListening?: boolean;
}

export interface GeneratedWord {
  word: string;
  type: WordType;
  semanticX: number;
  semanticY: number;
}

export interface GeneratedWords {
  related: GeneratedWord[];
  antonyms: GeneratedWord[];
}

export interface AppSettings {
  apiKey: string;
  modelSlug: string;
}