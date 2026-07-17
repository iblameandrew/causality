import { useState } from "react";
import { useMatchStore } from "../store/matchStore";

export function ChartForm() {
  const people = useMatchStore((s) => s.people);
  const updatePerson = useMatchStore((s) => s.updatePerson);
  const addPerson = useMatchStore((s) => s.addPerson);
  const addMany = useMatchStore((s) => s.addMany);
  const removePerson = useMatchStore((s) => s.removePerson);
  const loadPresets = useMatchStore((s) => s.loadPresets);
  const generate = useMatchStore((s) => s.generate);
  const loading = useMatchStore((s) => s.loading);
  const error = useMatchStore((s) => s.error);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [bulkCount, setBulkCount] = useState(5);

  const toggle = (i: number) =>
    setExpanded((e) => ({ ...e, [i]: !e[i] }));

  return (
    <div>
      <h1>Rotatory Attention</h1>
      <p className="muted">
        Social simulacra: each chart is a faction of agentic thoughts. Add as many
        people as you want — there is no faction cap.
      </p>

      <div className="faction-count-bar">
        <strong>{people.length}</strong>
        <span className="muted">
          {people.length === 1 ? "faction" : "factions"} · unlimited
        </span>
      </div>

      <div className="actions">
        <button type="button" onClick={() => loadPresets(2)}>
          2 presets
        </button>
        <button type="button" onClick={() => loadPresets(3)}>
          3 presets
        </button>
        <button type="button" onClick={() => loadPresets(people.length || 3)}>
          Refresh presets
        </button>
      </div>

      <div className="actions">
        <button type="button" onClick={() => addPerson()}>
          + Add chart
        </button>
        <button type="button" onClick={() => addMany(5)}>
          +5 charts
        </button>
        <div className="bulk-add">
          <input
            type="number"
            min={1}
            max={200}
            value={bulkCount}
            onChange={(e) =>
              setBulkCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))
            }
            aria-label="Bulk chart count"
          />
          <button type="button" onClick={() => addMany(bulkCount)}>
            Add N
          </button>
        </div>
      </div>

      {people.map((p, i) => {
        // Few charts: expanded by default; many: collapsed until opened
        const show =
          people.length <= 4
            ? expanded[i] !== false
            : expanded[i] === true;
        return (
          <div className="person-card" key={i}>
            <header>
              <button
                type="button"
                className="ghost-header"
                onClick={() => toggle(i)}
              >
                <span className="faction-index">#{i + 1}</span>
                <span>{p.name || `Faction ${i + 1}`}</span>
                <span className="muted">{show ? "▾" : "▸"}</span>
              </button>
              <button
                type="button"
                disabled={people.length <= 1}
                onClick={() => removePerson(i)}
              >
                Remove
              </button>
            </header>
            {show && (
              <>
                <div className="field">
                  <label>Name</label>
                  <input
                    value={p.name}
                    onChange={(e) => updatePerson(i, { name: e.target.value })}
                  />
                </div>
                <div className="row">
                  <div className="field">
                    <label>Year</label>
                    <input
                      type="number"
                      value={p.year}
                      onChange={(e) =>
                        updatePerson(i, { year: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Month</label>
                    <input
                      type="number"
                      value={p.month}
                      onChange={(e) =>
                        updatePerson(i, { month: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label>Day</label>
                    <input
                      type="number"
                      value={p.day}
                      onChange={(e) =>
                        updatePerson(i, { day: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Hour</label>
                    <input
                      type="number"
                      value={p.hour}
                      onChange={(e) =>
                        updatePerson(i, { hour: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label>Minute</label>
                    <input
                      type="number"
                      value={p.minute}
                      onChange={(e) =>
                        updatePerson(i, { minute: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Timezone</label>
                    <input
                      value={p.tz_str}
                      onChange={(e) => updatePerson(i, { tz_str: e.target.value })}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label>Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={p.lat}
                      onChange={(e) =>
                        updatePerson(i, { lat: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={p.lng}
                      onChange={(e) =>
                        updatePerson(i, { lng: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button
          type="button"
          className="primary"
          disabled={loading || people.length < 1}
          onClick={() => void generate()}
        >
          {loading
            ? `Spawning ${people.length} factions…`
            : `Generate match (${people.length})`}
        </button>
      </div>
    </div>
  );
}
