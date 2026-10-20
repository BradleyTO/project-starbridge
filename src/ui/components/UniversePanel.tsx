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
  onShowCommission(): void;
  onStart(offerId: string): void;
  onRespond(offerId: string, response: 'decline' | 'ignore' | 'question' | 'refuse' | 'disobey', reason?: string): void;
  onResume(missionId: string): void;
  onAdvance(hours: number): void;
}

export function UniversePanel({ universe, actions }: { universe: Universe; actions: UniverseActions }) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const duty = universe.dutyStatus();
  if (duty === 'pending')
    return (
      <div className="universe locked" data-testid="lu-pending">
        <h3>Active Duty · commission pending</h3>
        <p>Fleet Command's transmission is waiting for your answer.</p>
        <button className="btn" onClick={actions.onShowCommission} data-testid="lu-show-commission">Answer Fleet Command</button>
      </div>
    );
  if (duty === 'reserve') {
    const r = universe.canon();
    const done = r ? Object.values(r.missions).filter((m) => m.status === 'completed').length : 0;
    const under = r ? Object.values(r.missions).filter((m) => m.status === 'active').length : 0;
    return (
      <div className="universe locked reserve" data-testid="lu-reserve">
        <h3>Reserve status · inactive duty</h3>
        <p>Your career is preserved exactly as you left it: {done} completed {done === 1 ? 'mission' : 'missions'}{under ? `, ${under} under way (saved)` : ''}, your ship, your crew, your history and your archive.</p>
        <p>The canonical timeline is frozen while you are in reserve: nothing out there moves on without you. Simulation Mode stays fully available, with unlimited simulations.</p>
        <p className="muted small">Inactive duty is not misconduct and is never recorded as a refusal. Returning to active duty restores the same career.</p>
        <button className="btn" onClick={actions.onEnable} data-testid="lu-enable">Return to active duty (dev)</button>
      </div>
    );
  }
  if (duty === 'simulation')
    return (
      <div className="universe locked" data-testid="lu-locked">
        <h3>Products</h3>
        <div className="products" data-testid="products">
          <div className="product">
            <h4>Simulation Mode · $10 one-time</h4>
            <p>The bridge, your crew and the simulation archive: training scenarios, seeded variations and unlimited replays. Nothing in a simulation changes the real universe.</p>
            <p className="muted small">Included in this build.</p>
          </div>
          <div className="product">
            <h4>Active Duty · $9.99/month</h4>
            <ul>
              <li>Everything in Simulation Mode</li>
              <li>A persistent canonical universe — your career is real</li>
              <li>Dynamic missions that arise from what is happening out there</li>
              <li>History and consequences that carry forward</li>
              <li>A daily allowance of new canonical starts</li>
              <li>Future AI crew and characters</li>
              <li>Every canonical mission auto-archived for replay as a simulation</li>
            </ul>
          </div>
        </div>
        <p className="muted small">Development build: there are no payments. The button below (and the toggle in Settings) stands in for a subscription.</p>
        <button className="btn" onClick={actions.onEnable} data-testid="lu-enable">Activate Active Duty (dev)</button>
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
      {c.events.some((e) => e.classification === 'bulletin') && (
        <>
          <h3>Sector bulletins</h3>
          <ul className="event-list small" data-testid="bulletins">
            {c.events.filter((e) => e.classification === 'bulletin').slice(-4).reverse().map((e) => (
              <li key={e.id} className="event" data-testid={`bulletin-${e.id}`}>{e.summary}</li>
            ))}
          </ul>
        </>
      )}
      {closed.length > 0 && (
        <>
          <h3>Recent decisions</h3>
          <ul className="event-list small">
            {closed.map((o) => (
              <li key={o.id} className="event" data-testid={`closed-${o.id}`}>
                <strong>{o.title}</strong>: {o.status}
                {o.responses.length ? ` (${o.responses.map((r) => r.response).join(', ')})` : ''}
                {(() => {
                  const ev = c.events.find((e) => e.id === o.eventId);
                  const last = ev?.consequences[ev.consequences.length - 1];
                  return ev ? (
                    <div className="muted" data-testid={`closed-${o.id}-event`} data-status={ev.status}>
                      Event {ev.status}{last ? `: ${last}` : ''}
                    </div>
                  ) : null;
                })()}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
