import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { initOpenRouter } from './lib/openrouter';
import { VoxelWorld } from './components/VoxelWorld';
import { SettingsPanel } from './components/SettingsPanel';
import { ScenarioPanel } from './components/ScenarioPanel';
import { PersonaPanel } from './components/PersonaPanel';
import { UtterancePanel } from './components/UtterancePanel';
import { Legend } from './components/Legend';
import './App.css';

export default function App() {
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);
  const apiKey = useAppStore((s) => s.apiKey);

  useEffect(() => {
    if (apiKey) initOpenRouter(apiKey);
  }, [apiKey]);

  return (
    <div className="app">
      <header className="header">
        <h1>Causality</h1>
        <p>Closed-system semantic decomposition · Two cardinalities · Living voxel personas</p>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <SettingsPanel />
          <ScenarioPanel />
          <UtterancePanel />
        </aside>

        <main className="viewport">
          <VoxelWorld />
          <Legend />
        </main>

        <aside className="detail-sidebar">
          <PersonaPanel />
        </aside>
      </div>

      {error && (
        <div className="error-toast" onClick={clearError}>
          {error}
          <span className="dismiss">✕</span>
        </div>
      )}
    </div>
  );
}