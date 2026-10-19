import type { ContactView } from '../view';
import { formatRange } from '../../engine/state';
import { Panel } from './Panel';
import { plotPosition } from './radarMath';

export function Tactical({ contacts, shieldsRaised }: { contacts: ContactView[]; shieldsRaised: boolean }) {
  const visible = contacts;
  return (
    <Panel title="Tactical / Sensors" code="12-090" accent="sky" testId="tactical">
      <svg className="radar" viewBox="0 0 200 200" role="img" aria-label="Tactical plot">
        <defs>
          <radialGradient id="radarGlow">
            <stop offset="0%" stopColor="#1d3a5c" />
            <stop offset="100%" stopColor="#070d18" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="94" fill="url(#radarGlow)" stroke="#3b6ea8" strokeWidth="1" />
        {[22, 44, 66, 88].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#2a4b74" strokeWidth="0.6" strokeDasharray="2 3" />
        ))}
        <line x1="100" y1="6" x2="100" y2="194" stroke="#2a4b74" strokeWidth="0.6" />
        <line x1="6" y1="100" x2="194" y2="100" stroke="#2a4b74" strokeWidth="0.6" />
        <g className="radar-sweep">
          <path d="M100 100 L100 6 A94 94 0 0 1 166 33 Z" fill="rgba(110,180,255,0.12)" />
        </g>
        {shieldsRaised && <circle cx="100" cy="100" r="9" fill="none" stroke="#6fe0ff" strokeWidth="1.2" />}
        <path d="M100 94 L104 104 L100 102 L96 104 Z" fill="#ffb347" />
        {visible.map((c) => {
          const p = plotPosition(c);
          const color = c.destroyed ? '#6b7280' : c.disposition === 'hostile' ? '#ff5d5d' : c.disposition === 'distressed' ? '#ffd166' : c.disposition === 'neutral' || c.disposition === 'evacuated' ? '#9fd3ff' : '#c9a0ff';
          return (
            <g key={c.id} data-contact={c.id}>
              {c.id === 'cruiser' ? (
                <path d={`M${p.x} ${p.y - 5} L${p.x + 5} ${p.y + 4} L${p.x - 5} ${p.y + 4} Z`} fill={color} />
              ) : (
                <rect x={p.x - 4} y={p.y - 4} width="8" height="8" fill={color} />
              )}
              <text x={p.x > 120 ? p.x - 7 : p.x + 7} y={p.y + 3} textAnchor={p.x > 120 ? 'end' : 'start'} fill={color} fontSize="8">{c.name.toUpperCase()}</text>
            </g>
          );
        })}
        <text x="8" y="196" fill="#4f7cb1" fontSize="7">LOG SCALE · 1,000–250,000 KM</text>
      </svg>
      <ul className="contacts">
        {visible.length === 0 && <li className="muted">No contacts.</li>}
        {visible.map((c) => (
          <li key={c.id} data-testid={`contact-${c.id}`}>
            <div className="contact-head">
              <span className={`disp disp-${c.disposition}`}>{c.disposition}</span>
              <strong>{c.name}</strong>
              <span className="contact-range">{formatRange(c.range)} · {String((c.bearing + 360) % 360).padStart(3, '0')}°</span>
            </div>
            <div className="contact-sub">{c.classification} — {c.faction}</div>
            {c.details.length > 0 && (
              <ul className="contact-details">
                {c.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
            {!c.scanned && !c.destroyed && <div className="contact-sub muted">Not yet scanned</div>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
