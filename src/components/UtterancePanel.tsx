import { useState } from 'react';
import { useAppStore } from '../store/appStore';

export function UtterancePanel() {
  const [input, setInput] = useState('');
  const utterToCells = useAppStore((s) => s.utterToCells);
  const lastUtterance = useAppStore((s) => s.lastUtterance);
  const selectedForClique = useAppStore((s) => s.selectedForClique);
  const toggleCliqueSelection = useAppStore((s) => s.toggleCliqueSelection);
  const formClique = useAppStore((s) => s.formClique);
  const superCells = useAppStore((s) => s.superCells);
  const cells = useAppStore((s) => s.cells);
  const selectedCellId = useAppStore((s) => s.selectedCellId);

  const handleUtter = () => {
    if (!input.trim()) return;
    utterToCells(input);
    setInput('');
  };

  const handleCliqueToggle = () => {
    if (selectedCellId) toggleCliqueSelection(selectedCellId);
  };

  return (
    <section className="panel utterance-panel">
      <h2>Speak to Cells</h2>
      <p className="hint">
        Utter words to the living grid. Matching cells react — neighbors resonate.
      </p>
      <div className="utter-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUtter()}
          placeholder="Speak a word into the field..."
        />
        <button className="primary" onClick={handleUtter}>
          Utter
        </button>
      </div>
      {lastUtterance && (
        <p className="last-utterance">Last: &ldquo;{lastUtterance}&rdquo;</p>
      )}

      <div className="clique-controls">
        <h3>Cliques</h3>
        <p className="hint">
          Select cells (click + add to clique), then form a super cell.
        </p>
        <div className="clique-actions">
          <button onClick={handleCliqueToggle} disabled={!selectedCellId}>
            {selectedCellId && selectedForClique.includes(selectedCellId)
              ? 'Remove from Clique'
              : 'Add to Clique'}
          </button>
          <button
            className="primary"
            onClick={formClique}
            disabled={selectedForClique.length < 2}
          >
            Form Super Cell ({selectedForClique.length})
          </button>
        </div>
        {selectedForClique.length > 0 && (
          <div className="clique-members">
            {selectedForClique.map((id) => {
              const c = cells.find((cell) => cell.id === id);
              return c ? (
                <span key={id} className="chip">{c.word}</span>
              ) : null;
            })}
          </div>
        )}
        {superCells.length > 0 && (
          <div className="super-cells-list">
            {superCells.map((sc) => (
              <div key={sc.id} className="super-cell-item">
                <strong>{sc.name}</strong>
                <span>{sc.memberIds.length} members</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}