import { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import { initOpenRouter } from './lib/openrouter';
import { VoxelWorld } from './components/VoxelWorld';
import { SettingsPanel } from './components/SettingsPanel';
import { ScenarioPanel } from './components/ScenarioPanel';
import { PersonaPanel } from './components/PersonaPanel';
import { UtterancePanel } from './components/UtterancePanel';
import { Legend } from './components/Legend';
import { ViewControls } from './components/ViewControls';
import './App.css';

type MobilePanel = 'controls' | 'persona' | null;

export default function App() {
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);
  const apiKey = useAppStore((s) => s.apiKey);
  const selectedCellId = useAppStore((s) => s.selectedCellId);
  const selectCell = useAppStore((s) => s.selectCell);

  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

  useEffect(() => {
    if (apiKey) initOpenRouter(apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (selectedCellId && window.matchMedia('(max-width: 900px)').matches) {
      setMobilePanel('persona');
    }
  }, [selectedCellId]);

  const closeMobile = () => setMobilePanel(null);

  return (
    <div className={`app${mobilePanel ? ' panel-open' : ''}`}>
      <header className="header">
        <div className="header-inner">
          <div className="header-text">
            <h1>Causality</h1>
            <p>Closed-system semantic decomposition · Two cardinalities · Living voxel personas</p>
          </div>
          <nav className="mobile-tabs" aria-label="Panel navigation">
            <button
              type="button"
              className={`mobile-tab${mobilePanel === 'controls' ? ' active' : ''}`}
              onClick={() => setMobilePanel(mobilePanel === 'controls' ? null : 'controls')}
              aria-expanded={mobilePanel === 'controls'}
            >
              Controls
            </button>
            <button
              type="button"
              className={`mobile-tab${mobilePanel === 'persona' ? ' active' : ''}`}
              onClick={() => setMobilePanel(mobilePanel === 'persona' ? null : 'persona')}
              aria-expanded={mobilePanel === 'persona'}
            >
              Persona
              {selectedCellId && <span className="tab-dot" />}
            </button>
          </nav>
        </div>
      </header>

      <div className="layout">
        <aside className={`sidebar${mobilePanel === 'controls' ? ' mobile-open' : ''}`}>
          <button
            type="button"
            className="mobile-close"
            onClick={closeMobile}
            aria-label="Close panel"
          >
            ✕
          </button>
          <SettingsPanel />
          <ScenarioPanel />
          <UtterancePanel />
        </aside>

        <main className="viewport">
          <VoxelWorld />
          <ViewControls />
          <Legend />
        </main>

        <aside className={`detail-sidebar${mobilePanel === 'persona' ? ' mobile-open' : ''}`}>
          <button
            type="button"
            className="mobile-close"
            onClick={closeMobile}
            aria-label="Close panel"
          >
            ✕
          </button>
          {selectedCellId && (
            <button
              type="button"
              className="mobile-deselect"
              onClick={() => {
                selectCell(null);
                closeMobile();
              }}
            >
              Deselect cell
            </button>
          )}
          <PersonaPanel />
        </aside>
      </div>

      {mobilePanel && (
        <div
          className="scrim"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {error && (
        <div className="error-toast" onClick={clearError}>
          {error}
          <span className="dismiss">✕</span>
        </div>
      )}
    </div>
  );
}