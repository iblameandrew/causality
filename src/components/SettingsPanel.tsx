import { useAppStore } from '../store/appStore';

const MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-large-2411',
  'deepseek/deepseek-chat',
];

export function SettingsPanel() {
  const apiKey = useAppStore((s) => s.apiKey);
  const modelSlug = useAppStore((s) => s.modelSlug);
  const setApiKey = useAppStore((s) => s.setApiKey);
  const setModelSlug = useAppStore((s) => s.setModelSlug);

  return (
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
  );
}