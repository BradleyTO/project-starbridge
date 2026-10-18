import type { ShipSystems } from '../../engine/types';
import { Panel } from './Panel';

function Bar({ label, value, warn = 50 }: { label: string; value: number; warn?: number }) {
  const tone = value < 25 ? 'crit' : value < warn ? 'warn' : 'ok';
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className={`bar-fill ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="bar-value">{value}%</span>
    </div>
  );
}

export function ShipStatus({ ship }: { ship: ShipSystems }) {
  return (
    <Panel title="Ship Status" code="04-117" accent="amber" testId="ship-status">
      <div className="ship-id">
        <ShipGlyph />
        <div>
          <div className="ship-name">{ship.name}</div>
          <div className="ship-reg">{ship.registry} · Concord Exploration Service</div>
        </div>
      </div>
      <Bar label="Hull" value={ship.hull} />
      <Bar label="Shields" value={ship.shields} />
      <Bar label="Reactor" value={ship.reactor} />
      <Bar label="Impulse" value={ship.impulse} />
      <Bar label="Sensors" value={ship.sensors} />
      <dl className="sys-grid">
        <dt>Shields</dt>
        <dd data-testid="shield-state" className={ship.shieldsRaised ? 'on' : ''}>{ship.shieldsRaised ? 'RAISED' : 'LOWERED'}</dd>
        <dt>Weapons</dt>
        <dd className={ship.weapons !== 'safe' ? 'hot' : ''}>{ship.weapons.toUpperCase()}</dd>
        <dt>Jump drive</dt>
        <dd>{ship.jumpDrive.toUpperCase()}</dd>
        <dt>Tractor</dt>
        <dd className={ship.tractor === 'engaged' ? 'on' : ''}>{ship.tractor.toUpperCase()}</dd>
      </dl>
    </Panel>
  );
}

/** Original top-down silhouette of the CSV Halcyon. */
export function ShipGlyph() {
  return (
    <svg className="ship-glyph" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 4 L40 22 L58 30 L58 36 L40 38 L36 58 L28 58 L24 38 L6 36 L6 30 L24 22 Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="32" cy="26" r="5" fill="currentColor" />
      <path d="M28 50 h8" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
