import { FormEvent, useEffect, useRef, useState } from "react";
import { useMatchStore } from "../store/matchStore";
import type { SimUnit } from "../sim/types";

export function UnitDialogue({ unit }: { unit: SimUnit }) {
  const messages = useMatchStore((s) => s.dialogues[unit.id] ?? []);
  const busy = useMatchStore((s) => s.dialogueBusy);
  const error = useMatchStore((s) => s.dialogueError);
  const send = useMatchStore((s) => s.sendUnitMessage);
  const clear = useMatchStore((s) => s.clearDialogue);
  const [draft, setDraft] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    const text = draft;
    setDraft("");
    void send(unit.id, text);
  };

  return (
    <div className="dialogue">
      <h2>Dialogue</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Speak with this thought-agent. It answers from its own voice prompt.
      </p>

      <button
        type="button"
        className="linkish"
        onClick={() => setShowPrompt((v) => !v)}
      >
        {showPrompt ? "Hide voice prompt" : "Show voice prompt"}
      </button>
      {showPrompt && (
        <pre className="voice-prompt">{unit.voicePrompt || "(empty)"}</pre>
      )}

      <div className="chat-log">
        {messages.length === 0 && (
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Try: “Who are you?” · “How do you feel?” · “What do you remember?”
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-bubble ${m.role === "user" ? "user" : "unit"}`}
          >
            <div className="chat-role">
              {m.role === "user" ? "You" : unit.name}
            </div>
            <div>{m.content}</div>
          </div>
        ))}
        {busy && <div className="muted">…thinking</div>}
        <div ref={bottomRef} />
      </div>

      {error && <div className="error">{error}</div>}

      <form className="chat-form" onSubmit={onSubmit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${unit.name}…`}
          disabled={busy}
        />
        <button type="submit" className="primary" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
      {messages.length > 0 && (
        <button
          type="button"
          style={{ marginTop: 6 }}
          onClick={() => clear(unit.id)}
        >
          Clear chat
        </button>
      )}
    </div>
  );
}
