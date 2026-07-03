export function Legend() {
  return (
    <div className="legend">
      <span className="legend-item"><i className="dot related-verb" /> Related Verb</span>
      <span className="legend-item"><i className="dot related-noun" /> Related Noun</span>
      <span className="legend-item"><i className="dot antonym-verb" /> Antonym Verb</span>
      <span className="legend-item"><i className="dot antonym-noun" /> Antonym Noun</span>
      <span className="legend-item"><i className="dot persona" /> Persona</span>
      <span className="legend-item"><i className="dot clique" /> Clique</span>
      <span className="legend-item legend-sep" />
      <span className="legend-item"><i className="ring-dot surface" /> Surface ring</span>
      <span className="legend-item"><i className="ring-dot memory" /> Memory ring</span>
      <span className="legend-item"><i className="ring-dot deep" /> Deep ring</span>
    </div>
  );
}