import { useState } from 'react';
import type { Universe } from '../../universe/controller';
import { clockLabel } from '../../universe/archive';
import { formatDuration } from '../../universe/credits';
import { REFUSAL_REASONS } from '../../universe/world';

const CLASS: Record<string, { label: string; cls: string; note: string }> = {
  voluntary: { label: 'Voluntary assignment', cls: 'voluntary', note: 'You may decline. Declining has no disciplinary consequence.' },
  distress: { label: 'Distress call', cls: 'distress', note: 'You may ignore it, but the emergency continues without you.' },
  directive: { label: 'Fleet directive · mandatory', cls: 'directive', note: 'Accept, question, refuse or do not comply. Refusal or non-compliance opens a disciplinary review; its finding depends on the circumstances and Fleet regulations.' },
};

export interface UniverseActions {
  onEnable(): void;
  onStart(offerId: string): void;
  onRespond(offerId: string, response: 'decline' | 'ignore' | 'question' | 'refuse' | 'disobey', reason?: string): void;
  onResume(missionId: string): void;
  onAdvance(hours: number): void;
}

export function UniversePanel({ universe, actions }: { universe: Universe; actions: UniverseActions }) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  if (!universe.entitlements().livingUniverse)
    return (
      <div className="universe locked" data-testid="lu-locked">
        <h3>Living Universe · premium ($9.99/month)</h3>
        <p>A persistent galaxy: canonical missions, factions, characters and history that carry forward, with a daily allowance of new canonical missions. Every canonical mission you begin also becomes replayable in your simulation archive.</p>
        <p className="muted small">Development build: no payments. The toggle below (and in Settings) stands in for a subscription.</p>
        <button className="btn" onClick={actions.onEnable} data-testid="lu-enable">Enable Living Universe (dev)</button>
      </div>
    );
  const c = universe.ensureCanon();
  if (!c) return null;
  const left = universe.creditsRemaining();
  const limit = universe.credits().dailyLimit;
  const resetIn = formatDuration(universe.msUntilCreditReset());
  const open = c.offers.filter((o) => o.status === 'open' || o.status === 'questioned');
  const active = Object.values(c.missions).filter((m) => m.status === 'active' && m.mission.kind === 'bridge');
  const closed = c.offers.filter((o) => o.status !== 'open' && o.status !== 'questioned').slice(-6).reverse();
  return (
    <div className="universe" data-testid="universe">
      <div className="universe-status">
        <span className="tag canon">CANONICAL</span>
        <span data-testid="canon-clock">Galaxy time: {clockLabel(c.clock)}</span>
        <span className={`credits-line ${left === 0 ? 'empty' : ''}`} data-testid="credits-remaining" data-remaining={left}>
          New canonical missions left today: <strong>{left}</strong> of {limit} · resets in {resetIn}
        </span>
      </div>
      <p className="muted small">Starting a new canonical mission uses one. Viewing, declining or ignoring offers, saving, resuming and finishing missions, and every simulation, are free.</p>
      {left === 0 && (
        <p className="notice" data-testid="credits-exhausted">
          Today's allowance of new canonical missions is used up. Your history and missions already under way stay available, Simulation Mode is unlimited, and canonical time is paused, so nothing out there moves on without you until the allowance resets.
        </p>
      )}
      {active.length > 0 && (
        <>
          <h3>Under way</h3>
          <ul className="offer-list">
            {active.map((m) => (
              <li key={m.id} className="offer" data-testid={`active-${m.id}`}>
                <strong>{m.title}</strong> <span className="muted small">{m.id}</span>
                <div className="offer-actions">
                  <button className="btn" onClick={() => actions.onResume(m.id)} data-testid={`resume-${m.id}`}>Resume (free)</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <h3>Assignments & signals</h3>
      {open.length === 0 && <p className="muted">Nothing on the board right now.</p>}
      <ul className="offer-list">
        {open.map((o) => {
          const k = CLASS[o.classification];
          const startLabel = o.classification === 'distress' ? 'Respond' : 'Accept';
          return (
            <li key={o.id} className={`offer offer-${o.classification}`} data-testid={`offer-${o.id}`} data-class={o.classification}>
              <div className="archive-head">
                <span className={`tag ${k.cls}`}>{k.label}</span>
                <strong>{o.title}</strong>
                {o.expiresAt !== null && <span className="muted small">deadline {clockLabel(o.expiresAt)}</span>}
                {o.status === 'questioned' && <span className="tag">questioned</span>}
              </div>
              <p>{o.briefing}</p>
              {o.responses.filter((r) => r.response === 'question').map((r, i) => (
                <p key={i} className="fleet-reply small" data-testid={`fleet-reply-${o.id}`}>Fleet Command: {r.detail}</p>
              ))}
              <p className="muted small">{k.note}</p>
              <div className="offer-actions">
                <button className="btn" disabled={left === 0} onClick={() => actions.onStart(o.id)} data-testid={`offer-${o.id}-start`} title={left === 0 ? 'No new canonical missions left today' : 'Uses one of today’s new canonical missions'}>
                  {startLabel} (1 credit)
                </button>
                {o.classification === 'voluntary' && <button className="btn ghost" onClick={() => actions.onRespond(o.id, 'decline')} data-testid={`offer-${o.id}-decline`}>Decline</button>}
                {o.classification === 'distress' && <button className="btn ghost" onClick={() => actions.onRespond(o.id, 'ignore')} data-testid={`offer-${o.id}-ignore`}>Ignore</button>}
                {o.classification === 'directive' && (
                  <>
                    {o.status !== 'questioned' && <button className="btn ghost" onClick={() => actions.onRespond(o.id, 'question')} data-testid={`offer-${o.id}-question`}>Question</button>}
                    <select value={reasons[o.id] ?? 'none'} onChange={(e) => setReasons({ ...reasons, [o.id]: e.target.value })} data-testid={`offer-${o.id}-reason`} aria-label="Reason for refusal">
                      {REFUSAL_REASONS.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <button className="btn restart" onClick={() => actions.onRespond(o.id, 'refuse', reasons[o.id] ?? 'none')} data-testid={`offer-${o.id}-refuse`}>Refuse</button>
                    <button className="btn ghost" onClick={() => actions.onRespond(o.id, 'disobey')} data-testid={`offer-${o.id}-disobey`}>Do not comply</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="offer-actions">
        <button className="btn ghost" disabled={left === 0} onClick={() => actions.onAdvance(6)} data-testid="advance-time" title={left === 0 ? 'Canonical time is paused until the allowance resets' : 'Let six hours of canonical time pass'}>
          Continue patrol (+6 h)
        </button>
      </div>
      {closed.length > 0 && (
        <>
          <h3>Recent decisions</h3>
          <ul className="event-list small">
            {closed.map((o) => (
              <li key={o.id} className="event" data-testid={`closed-${o.id}`}>
                <strong>{o.title}</strong>: {o.status}
                {o.responses.length ? ` (${o.responses.map((r) => r.response).join(', ')})` : ''}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
