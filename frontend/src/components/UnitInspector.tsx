import { useMatchStore } from "../store/matchStore";
import { UnitDialogue } from "./UnitDialogue";

export function UnitInspector() {
  const unit = useMatchStore((s) => s.selectedUnit());

  if (!unit) {
    return (
      <div>
        <h2>Inspector</h2>
        <p className="muted">
          Select a unit on the field or roster to inspect and dialogue with it.
        </p>
      </div>
    );
  }

  const hpPct = (unit.hp / Math.max(1, unit.maxHp)) * 100;
  const ePct = unit.energy * 100;

  return (
    <div>
      <h2>Inspector</h2>
      <h1 style={{ fontSize: "1rem" }}>{unit.name}</h1>
      <p className="muted">{unit.lineage}</p>
      <p style={{ fontSize: "0.85rem" }}>{unit.summary}</p>
      <div className="badge" style={{ marginBottom: 8 }}>
        <span className="dot" style={{ background: unit.color }} />
        {unit.tier} · {unit.alive ? "alive" : "down"}
      </div>

      <UnitDialogue unit={unit} />

      <h2>HP</h2>
      <div className="meter">
        <span style={{ width: `${hpPct}%`, background: unit.color }} />
      </div>
      <div className="muted">
        {unit.hp.toFixed(0)} / {unit.maxHp.toFixed(0)}
      </div>

      <h2>Energization</h2>
      <div className="meter">
        <span style={{ width: `${ePct}%` }} />
      </div>
      <div className="muted">
        {(unit.energy * 100).toFixed(0)}% · baseline{" "}
        {(unit.baselineEnergy * 100).toFixed(0)}%
      </div>

      <h2>Local density</h2>
      <p style={{ fontSize: "0.9rem", margin: 0 }}>
        Allies in aura: <strong>{unit.alliesNear}</strong>
        <br />
        Enemies in aura: <strong>{unit.enemiesNear}</strong>
      </p>
      <p className="muted">
        Combat power scales with energy and ally cohesion; overcrowding and focus
        fire dilute efficiency.
      </p>

      <h2>Attributes</h2>
      <div className="muted" style={{ fontSize: "0.8rem" }}>
        dmg {unit.attrs.damage.toFixed(1)} · armor {unit.attrs.armor.toFixed(2)} ·
        speed {unit.attrs.speed.toFixed(2)} · range {unit.attrs.range.toFixed(2)}
        <br />
        will {unit.attrs.will.toFixed(2)} · empathy {unit.attrs.empathy.toFixed(2)} ·
        structure {unit.attrs.structure.toFixed(2)}
      </div>

      <h2>Skills</h2>
      <ul className="unit-list">
        {unit.skills.map((s) => (
          <li key={s.id}>
            {s.name}{" "}
            <span className="muted">
              {s.kind} · {s.effect}
            </span>
          </li>
        ))}
      </ul>

      <h2>Memories</h2>
      {unit.memories.map((m, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <strong style={{ fontSize: "0.85rem" }}>{m.title}</strong>
          <p className="muted" style={{ margin: "0.15rem 0" }}>
            {m.vignette}
          </p>
        </div>
      ))}
    </div>
  );
}
