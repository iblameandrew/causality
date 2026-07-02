import { useAppStore } from '../store/appStore';

export function PersonaPanel() {
  const cells = useAppStore((s) => s.cells);
  const selectedCellId = useAppStore((s) => s.selectedCellId);
  const isExpandingPersona = useAppStore((s) => s.isExpandingPersona);
  const expandPersona = useAppStore((s) => s.expandPersona);

  const cell = cells.find((c) => c.id === selectedCellId);

  if (!cell) {
    return (
      <section className="panel persona-panel empty">
        <h2>Persona</h2>
        <p className="hint">Click a cell to select. Double-click to emanate a persona.</p>
      </section>
    );
  }

  return (
    <section className="panel persona-panel">
      <h2>
        {cell.word}
        <span className={`badge ${cell.type}`}>{cell.type}</span>
        <span className={`badge ${cell.polarity}`}>{cell.polarity}</span>
      </h2>

      {!cell.persona ? (
        <div className="expand-prompt">
          <p>This cell awaits personality emanation.</p>
          <button
            className="primary"
            onClick={() => expandPersona(cell.id)}
            disabled={isExpandingPersona}
          >
            {isExpandingPersona ? 'Emanating...' : 'Emanate Persona'}
          </button>
        </div>
      ) : (
        <div className="persona-detail">
          <h3>{cell.persona.name}</h3>

          {cell.persona.traits.length > 0 && (
            <div className="traits">
              {cell.persona.traits.map((t) => (
                <span key={t} className="trait">{t}</span>
              ))}
            </div>
          )}

          <div className="word-groups">
            <div>
              <h4>Verbs</h4>
              <div className="word-chips">
                {cell.persona.verbs.map((v) => (
                  <span key={v} className="chip verb">{v}</span>
                ))}
              </div>
            </div>
            <div>
              <h4>Nouns</h4>
              <div className="word-chips">
                {cell.persona.nouns.map((n) => (
                  <span key={n} className="chip noun">{n}</span>
                ))}
              </div>
            </div>
          </div>

          <details>
            <summary>System Prompt</summary>
            <pre>{cell.persona.systemPrompt}</pre>
          </details>

          <details open>
            <summary>Memory Registry</summary>
            <div className="memory-layers">
              {cell.persona.memoryRegistry.map((layer, i) => (
                <div key={layer.id} className="memory-layer">
                  <div className="layer-header">
                    <span className="layer-index">L{i + 1}</span>
                    <strong>{layer.title}</strong>
                    <span className="tone">{layer.emotionalTone}</span>
                  </div>
                  <p>{layer.narrative}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}