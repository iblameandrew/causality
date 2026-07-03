import { useAppStore } from '../store/appStore';
import type { RotationParams } from '../types';

const MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-large-2411',
  'deepseek/deepseek-chat',
];

const ROTATION_FIELDS: {
  key: keyof RotationParams;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: 'surfacePeriod',
    label: 'Surface period',
    hint: 'Ticks per surface cycle (traits, verbs, nouns)',
    min: 1,
    max: 32,
    step: 1,
  },
  {
    key: 'memoryPeriod',
    label: 'Memory period',
    hint: 'Ticks per memory cycle (mid-history)',
    min: 1,
    max: 128,
    step: 1,
  },
  {
    key: 'deepPeriod',
    label: 'Deep period',
    hint: 'Ticks per deep cycle (oldest history)',
    min: 1,
    max: 512,
    step: 1,
  },
  {
    key: 'tickIntervalMs',
    label: 'Tick interval (ms)',
    hint: 'Real-time speed of one simulation tick',
    min: 100,
    max: 5000,
    step: 50,
  },
  {
    key: 'deepPeakWindow',
    label: 'Deep peak window',
    hint: 'Fraction of deep slot that triggers deep listening',
    min: 0.05,
    max: 0.5,
    step: 0.01,
  },
  {
    key: 'deepSalienceBoost',
    label: 'Deep salience boost',
    hint: 'Multiplier while deep listening',
    min: 1,
    max: 3,
    step: 0.05,
  },
  {
    key: 'neighborSalienceDecay',
    label: 'Neighbor decay',
    hint: 'How much neighbor salience propagates',
    min: 0,
    max: 1,
    step: 0.05,
  },
];

export function SettingsPanel() {
  const apiKey = useAppStore((s) => s.apiKey);
  const modelSlug = useAppStore((s) => s.modelSlug);
  const rotationParams = useAppStore((s) => s.rotationParams);
  const setApiKey = useAppStore((s) => s.setApiKey);
  const setModelSlug = useAppStore((s) => s.setModelSlug);
  const setRotationParams = useAppStore((s) => s.setRotationParams);
  const resetRotationParams = useAppStore((s) => s.resetRotationParams);

  return (
    <>
      <section className="panel settings-panel">
        <h2>OpenRouter</h2>
        <label>
          API Key
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-..."
          />
        </label>
        <label>
          Model
          <select value={modelSlug} onChange={(e) => setModelSlug(e.target.value)}>
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <input
          className="model-custom"
          type="text"
          value={modelSlug}
          onChange={(e) => setModelSlug(e.target.value)}
          placeholder="or type any model slug"
        />
      </section>

      <section className="panel simulation-panel">
        <h2>Rotation Parameters</h2>
        <p className="hint">
          Control how each cell cycles attention. Slower periods surface deeper history.
        </p>

        {ROTATION_FIELDS.map(({ key, label, hint, min, max, step }) => (
          <label key={key} className="param-label">
            <span className="param-header">
              <span>{label}</span>
              <span className="param-value">{rotationParams[key]}</span>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={rotationParams[key]}
              onChange={(e) =>
                setRotationParams({ [key]: Number(e.target.value) } as Partial<RotationParams>)
              }
            />
            <span className="param-hint">{hint}</span>
          </label>
        ))}

        <button type="button" className="reset-params" onClick={resetRotationParams}>
          Reset to defaults
        </button>
      </section>
    </>
  );
}