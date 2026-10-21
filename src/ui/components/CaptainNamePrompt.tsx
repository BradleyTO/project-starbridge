import { useState } from 'react';
import { DEFAULT_CAPTAIN_NAME, NAME_MAX, validateCaptainName } from '../../career/name';

/**
 * v0.7: the one-time naming prompt (new captains, and saves from before v0.7). The captain's name
 * is the only customizable name in the game. Dismissing keeps a default, editable later in the
 * Service Record. The name is always rendered as text.
 */
export function CaptainNamePrompt({ current, onSave, onDismiss }: { current: string | null; onSave(name: string): { ok: true } | { ok: false; reason: string }; onDismiss(): void }) {
  const [value, setValue] = useState(current ?? '');
  const [error, setError] = useState('');
  const submit = () => {
    const v = validateCaptainName(value);
    if (!v.ok) return setError(v.reason);
    const r = onSave(v.name);
    if (!r.ok) setError(r.reason);
  };
  return (
    <div className="ceremony-backdrop" role="dialog" aria-modal="true" aria-labelledby="name-title" data-testid="name-prompt">
      <div className="ceremony">
        <p className="ceremony-header">ISA PERSONNEL · CAPTAIN’S FILE</p>
        <h2 id="name-title">{current ? 'Confirm your name for the record' : 'Your name, Captain'}</h2>
        <p className="muted">The Intergalactic Space Agency records every evaluation and every mission under your name. It is the one name you choose: your ship, crew and everyone you meet keep theirs. You can change it later in the Service Record without losing anything.</p>
        <form
          className="name-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="row">
            Captain
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              maxLength={NAME_MAX + 8}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. Rowan Ashby"
              aria-invalid={!!error}
              aria-describedby="name-help"
              data-testid="name-input"
            />
          </label>
          <p id="name-help" className="muted small">2–{NAME_MAX} characters: letters (accents welcome), spaces, hyphens, apostrophes and periods.</p>
          {error && <p className="notice small" role="alert" data-testid="name-error">{error}</p>}
          <div className="ceremony-actions">
            <button className="btn" type="submit" data-testid="name-save">Enter in the record</button>
            <button className="btn ghost" type="button" onClick={onDismiss} data-testid="name-dismiss">{current ? `Keep ${current}` : `Not now (use ${DEFAULT_CAPTAIN_NAME})`}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
