import type { Ship, SystemId } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { systemLabel } from '../../engine/rules';
import { Panel } from './Panel';

function Bar({ label, value, warn = 50, testId }: { label: string; value: number; warn?: number; testId?: string }) {
  const v = Math.round(value);
  const tone = v < 25 ? 'crit' : v < warn ? 'warn' : 'ok';
  return (
    <div className="bar-row" data-testid={testId}>
      <span className="bar-label">{label}</span>
      <div className="bar-track" role="meter" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className={`bar-fill ${tone}`} style={{ width: `${Math.min(100, v)}%` }} />
      </div>
      <span className="bar-value">{v}%</span>
    </div>
  );
}

const SHORT: Partial<Record<SystemId, string>> = { lifeSupport: 'Life supp.', jumpDrive: 'Jump drive', transporter: 'Transport' };

export function ShipStatus({ ship, torpedoes, targetName }: { ship: Ship; torpedoes: number; targetName: (id: string) => string }) {
  return (
    <Panel title="Ship Status" code="04-117" accent="amber" testId="ship-status">
      <div className="ship-id">
        <ShipGlyph />
        <div>
          <div className="ship-name">{ship.name}</div>
          <div className="ship-reg">{ship.classification} · Intergalactic Space Agency</div>
        </div>
      </div>
      <div className="nav-readout" data-testid="nav-readout">
        <span>HDG <b>{String(Math.round(ship.heading) % 360).padStart(3, '0')}</b></span>
        <span>SPD <b>{Math.round(Math.hypot(ship.velocity.x, ship.velocity.y))}</b> km/s</span>
        <span>POS <b>{Math.round(ship.position.x / 1000)}k, {Math.round(ship.position.y / 1000)}k</b></span>
      </div>
      <Bar label="Hull" value={ship.hull} testId="hull" />
      <Bar label="Shields" value={ship.shields.strength} />
      <Bar label="Jump chg" value={ship.jump.charge} warn={0} />
      <table className="systems" data-testid="systems">
        <thead>
          <tr><th>System</th><th>Health</th><th>Power</th></tr>
        </thead>
        <tbody>
          {SYSTEM_IDS.map((id) => {
            const sys = ship.systems[id];
            return (
              <tr key={id} className={`sys-${sys.status}`} data-system={id}>
                <td>{SHORT[id] ?? systemLabel(id)}</td>
                <td>{Math.round(sys.health)}%</td>
                <td>{Math.round(sys.power)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <dl className="sys-grid">
        <dt>Shields</dt>
        <dd data-testid="shield-state" className={ship.shields.raised ? 'on' : ''}>{ship.shields.raised ? 'RAISED' : 'LOWERED'}</dd>
        <dt>Weapons</dt>
        <dd className={ship.weapons.state !== 'safe' ? 'hot' : ''} data-testid="weapons-state">
          {ship.weapons.state.toUpperCase()}{ship.weapons.target ? ` · ${targetName(ship.weapons.target).toUpperCase()}` : ''}
        </dd>
        <dt>Torpedoes</dt>
        <dd>{torpedoes}</dd>
        <dt>Tractor</dt>
        <dd className={ship.tractor.target ? 'on' : ''}>{ship.tractor.target ? `ON · ${targetName(ship.tractor.target).toUpperCase()}` : 'IDLE'}</dd>
        <dt>Aboard</dt>
        <dd data-testid="souls">{ship.souls}</dd>
      </dl>
    </Panel>
  );
}

/** Original top-down silhouette of the ISV Halcyon. */
export function ShipGlyph() {
  return (
    <svg className="ship-glyph" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 4 L40 22 L58 30 L58 36 L40 38 L36 58 L28 58 L24 38 L6 36 L6 30 L24 22 Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="32" cy="26" r="5" fill="currentColor" />
      <path d="M28 50 h8" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
