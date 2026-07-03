import { ROTATION_PERIODS } from '../lib/attentionEngine';
import { buildRuntimePrompt } from '../lib/agentResponder';
import { useAppStore } from '../store/appStore';
import type { AttentionDepth } from '../types';

const DEPTH_LABELS: Record<AttentionDepth, string> = {
  surface: 'Surface (fast)',
  memory: 'Memory (mid)',
  deep: 'Deep (slow)',
};

export function PersonaPanel() {
  const cells = useAppStore((s) => s.cells);
  const selectedCellId = useAppStore((s) => s.selectedCellId);
  const lastUtterance = useAppStore((s) => s.lastUtterance);
  const isGeneratingPersonas = useAppStore((s) => s.isGeneratingPersonas);

  const cell = cells.find((c) => c.id === selectedCellId);
  const attention = cell?.attention;
  const runtimePrompt = cell && lastUtterance ? buildRuntimePrompt(cell, lastUtterance) : null;

  if (!cell) {
    return (
      <section className="panel persona-panel empty">
        <h2>Persona</h2>
        <p className="hint">Click a cell to inspect its persona and rotatory attention.</p>
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
          <p>Emanating persona...</p>
          {isGeneratingPersonas && <div className="gestating-pulse" />}
        </div>
      ) : (
        <div className="persona-detail">
          <h3>{cell.persona.name}</h3>

          {attention && (
            <div className="attention-system">
              <h4>Rotatory Attention</h4>
              {attention.deepListening && (
                <div className="deep-listening-badge">Deep listening — slow rotation at peak</div>
              )}

              <div className="ensemble-active">
                <span className="ensemble-label">Ensemble</span>
                {attention.ensemble.length > 0 ? (
                  attention.ensemble.map((el) => (
                    <span key={el.id} className={`ensemble-chip ${el.depth}`}>
                      {el.qualifier}
                    </span>
                  ))
                ) : (
                  <span className="hint">No active ensemble</span>
                )}
              </div>

              <p className="focus-prompt">{attention.focusPrompt}</p>

              <div className="rotation-rings">
                {attention.rings.map((ring) => {
                  const activeId = ring.elementIds[ring.activeIndex];
                  const activeEl = attention.elements.find((e) => e.id === activeId);
                  return (
                    <div key={ring.depth} className={`rotation-ring ${ring.depth}`}>
                      <div className="ring-header">
                        <span>{DEPTH_LABELS[ring.depth]}</span>
                        <span className="ring-period">{ROTATION_PERIODS[ring.depth]}t/cycle</span>
                      </div>
                      <div className="ring-phase">
                        <div
                          className="ring-phase-fill"
                          style={{ width: `${ring.phase * 100}%` }}
                        />
                        <div
                          className="ring-phase-marker"
                          style={{ left: `${ring.phase * 100}%` }}
                        />
                      </div>
                      {activeEl && (
                        <div className="ring-active">
                          <strong>{activeEl.qualifier}</strong>
                          <span className="referents">
                            → {activeEl.referents.slice(0, 4).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {attention.salience > 0 && (
                <div className="salience-bar">
                  <span>Salience</span>
                  <div className="salience-track">
                    <div
                      className="salience-fill"
                      style={{ width: `${attention.salience * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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

          {runtimePrompt && (
            <details>
              <summary>Runtime Prompt (ensemble-filtered)</summary>
              <pre>{`SYSTEM:\n${runtimePrompt.system}\n\nUSER:\n${runtimePrompt.user}`}</pre>
            </details>
          )}

          <details open>
            <summary>Memory Registry</summary>
            <div className="memory-layers">
              {cell.persona.memoryRegistry.map((layer, i) => {
                const isDeepActive = attention?.ensemble.some(
                  (e) => e.sourceId === layer.id && e.depth === 'deep',
                );
                const isMemActive = attention?.ensemble.some(
                  (e) => e.sourceId === layer.id && e.depth === 'memory',
                );
                return (
                  <div
                    key={layer.id}
                    className={`memory-layer${isDeepActive ? ' deep-active' : ''}${isMemActive ? ' mem-active' : ''}`}
                  >
                    <div className="layer-header">
                      <span className="layer-index">L{i + 1}</span>
                      <strong>{layer.title}</strong>
                      <span className="tone">{layer.emotionalTone}</span>
                    </div>
                    <p>{layer.narrative}</p>
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}