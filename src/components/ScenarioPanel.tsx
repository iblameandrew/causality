import { useAppStore } from '../store/appStore';

export function ScenarioPanel() {
  const scenario = useAppStore((s) => s.scenario);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const cells = useAppStore((s) => s.cells);
  const setScenario = useAppStore((s) => s.setScenario);
  const generateScenario = useAppStore((s) => s.generateScenario);

  return (
    <section className="panel scenario-panel">
      <h2>Scenario</h2>
      <p className="hint">
        Describe a closed system. Two cardinalities — verbs &amp; nouns — will be
        decomposed into 50 related and 50 antonym cells.
      </p>
      <textarea
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
        placeholder="A rain-soaked harbor where forgotten ships whisper contracts to the tide..."
        rows={4}
      />
      <button
        className="primary"
        onClick={generateScenario}
        disabled={isGenerating || !scenario.trim()}
      >
        {isGenerating ? 'Decomposing...' : 'Decompose Scenario'}
      </button>
      {cells.length > 0 && (
        <div className="stats">
          <span className="stat related">{cells.filter((c) => c.polarity === 'related').length} related</span>
          <span className="stat antonym">{cells.filter((c) => c.polarity === 'antonym').length} antonyms</span>
          <span className="stat persona">{cells.filter((c) => c.persona).length} personas</span>
        </div>
      )}
    </section>
  );
}