import type { Universe } from '../../universe/controller';
import type { ResetPolicy } from '../../universe/types';

const DUTY_LABEL = { simulation: 'Simulation Mode (not commissioned)', pending: 'Commission awaiting your answer', active: 'Active duty', reserve: 'Reserve status (inactive duty)' } as const;

export function SettingsPanel({ universe, onChange, onDuty }: { universe: Universe; onChange(msg: string): void; onDuty(on: boolean): void }) {
  const ent = universe.entitlements();
  const l = universe.credits();
  const setPolicy = (v: string) => {
    const policy: ResetPolicy = v === 'rolling' ? { kind: 'rolling-24h' } : { kind: 'local-midnight', hour: Number(v) };
    universe.configureCredits({ policy });
    onChange('Reset policy updated.');
  };
  return (
    <div className="settings" data-testid="settings">
      <h3>Entitlements (development)</h3>
      <p className="muted small">Simulation Mode ($10 one-time) is the base game and is always enabled here. Active Duty ($9.99/month) is toggled locally; there are no real payments in this build. Turning Active Duty off puts the captain on reserve status: the career is preserved and the canonical timeline freezes until you return.</p>
      <label className="row">
        <input type="checkbox" checked={ent.activeDuty} onChange={(e) => onDuty(e.target.checked)} data-testid="dev-lu-toggle" />
        Active Duty subscription (dev toggle)
      </label>
      <p className="muted small" data-testid="duty-status-setting">Duty status: {DUTY_LABEL[universe.dutyStatus()]}</p>
      <h3>Daily canonical allowance</h3>
      <label className="row">
        New canonical missions per day
        <input type="number" min={0} max={1000} value={l.dailyLimit} onChange={(e) => { universe.configureCredits({ dailyLimit: Number(e.target.value) }); onChange(`Daily limit set to ${e.target.value}.`); }} data-testid="dev-credit-limit" />
      </label>
      <label className="row">
        Reset policy
        <select value={l.policy.kind === 'rolling-24h' ? 'rolling' : String(l.policy.hour)} onChange={(e) => setPolicy(e.target.value)} data-testid="dev-credit-policy">
          <option value="0">Local midnight</option>
          <option value="4">Local 04:00</option>
          <option value="rolling">Rolling 24 hours from first use</option>
        </select>
      </label>
      <div className="offer-actions">
        <button className="btn ghost" onClick={() => { universe.resetCreditsNow(); onChange('Allowance reset (dev).'); }} data-testid="dev-credit-reset">Reset allowance now</button>
      </div>
      <p className="notice small" data-testid="credits-disclaimer">
        The allowance is enforced in this browser only and is not tamper-proof: anyone can edit local storage. Server-side enforcement, tied to an account and subscription, is planned for a later milestone.
      </p>
    </div>
  );
}
