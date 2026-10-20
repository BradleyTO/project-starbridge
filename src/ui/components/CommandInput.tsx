import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createRecognizer, speechRecognitionSupported } from '../speech';
import type { RecognitionLike } from '../speech';

interface Props {
  onCommand: (text: string) => void;
  suggestions: string[];
  /** v0.5: a comms channel is open — the input takes both dialogue and crew orders. */
  onChannel?: boolean;
  disabled?: boolean;
  /** Shown when disabled (the run has ended). */
  endedHint?: string;
  busy?: boolean;
  clarification?: { question: string; options: string[] } | null;
}

export function CommandInput({ onCommand, suggestions, disabled, busy, clarification, endedHint = 'Simulation ended — restart or load', onChannel = false }: Props) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState('');
  const recRef = useRef<RecognitionLike | null>(null);
  const micSupported = speechRecognitionSupported();

  useEffect(() => () => recRef.current?.stop(), []);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || busy || disabled) return;
    onCommand(t);
    setText('');
    setMicNote('');
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = createRecognizer();
    if (!rec) return;
    recRef.current = rec;
    rec.onresult = (ev) => {
      const transcript = ev.results[0]?.[0]?.transcript ?? '';
      if (transcript) {
        setText(transcript);
        setMicNote(`Heard: "${transcript}" — press Enter or Transmit to confirm.`);
      }
    };
    rec.onerror = (ev) => setMicNote(`Voice input error: ${ev.error}. Typed commands still work.`);
    rec.onend = () => setListening(false);
    setMicNote('Listening…');
    setListening(true);
    rec.start();
  }

  return (
    <section className="command" aria-label="Captain's command input" data-testid="command">
      <form onSubmit={submit} className="command-form">
        <label htmlFor="cmd" className="command-label">Captain's Orders</label>
        <input
          id="cmd"
          data-testid="command-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? endedHint : onChannel ? 'Speak to them, or give the crew an order ("We mean no harm", "Raise shields")' : 'Give any order, e.g. "Lower shields and beam the crew over"'}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={`btn mic ${listening ? 'live' : ''}`}
          onClick={toggleMic}
          disabled={!micSupported}
          title={micSupported ? 'Speak an order' : 'Voice input is not supported in this browser — type your orders'}
          aria-pressed={listening}
          data-testid="mic-button"
        >
          {listening ? '■ Stop' : '🎙 Voice'}
        </button>
        <button type="submit" className="btn transmit" data-testid="command-submit" disabled={busy || disabled}>{busy ? 'Working…' : 'Transmit'}</button>
      </form>
      {(micNote || !micSupported) && (
        <p className="mic-note">{micNote || 'Voice input unavailable in this browser; typed orders are fully supported.'}</p>
      )}
      {clarification && !disabled ? (
        <div className="clarify" data-testid="clarification">
          <span className="clarify-q">{clarification.question}</span>
          <div className="chips" aria-label="Clarification options">
            {clarification.options.map((o) => (
              <button key={o} type="button" className="chip chip-clarify" onClick={() => !busy && onCommand(o)}>{o}</button>
            ))}
          </div>
        </div>
      ) : (
        !disabled && (
          <div className="chips" aria-label={onChannel ? 'Suggested replies' : 'Suggested orders'} data-testid="suggestions">
            {suggestions.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => !busy && onCommand(s)}>{s}</button>
            ))}
          </div>
        )
      )}
    </section>
  );
}
