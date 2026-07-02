# Causality

A Three.js semantic decomposition system. Given a scenario description, the closed system breaks down into two cardinalities — **verbs** and **nouns** — generating 50 related words and 50 antonyms via OpenRouter LLM.

Each word lives as a voxel cell on a Conway-inspired isometric grid. Double-click a cell to emanate a full persona (5 verbs, 5 nouns, system prompt, layered memory registry). Cells listen and react to uttered words, and can form cliques into super cells.

## Setup

```bash
npm install
npm run dev
```

## Usage

1. Enter your [OpenRouter](https://openrouter.ai) API key and select a model slug
2. Describe a scenario and click **Decompose Scenario**
3. Explore the isometric voxel grid — related cells on top, antonyms below
4. **Click** to select a cell, **double-click** to emanate a persona
5. **Utter** words to make cells react; neighboring cells resonate
6. Select multiple cells and **Form Super Cell** to create cliques

## Stack

- React + TypeScript + Vite
- Three.js via @react-three/fiber + @react-three/drei
- OpenAI SDK → OpenRouter backend
- Zustand state management