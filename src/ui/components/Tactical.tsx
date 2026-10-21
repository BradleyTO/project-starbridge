import { useState } from 'react';
import type { ContactView, HelmView } from '../view';
import { formatRange } from '../../engine/state';
import { Panel } from './Panel';
import { niceGrid, makeFrame, type Frame } from './radarMath';

const COLOR = (c: ContactView) =>
  c.destroyed ? '#6b7280' : c.disposition === 'hostile' ? '#ff5d5d' : c.disposition === 'distressed' ? '#ffd166' : c.disposition === 'neutral' || c.disposition === 'evacuated' ? '#9fd3ff' : '#c9a0ff';

/**
 * North-up plot in real coordinates (linear, auto-zoomed), centred on the
 * action. Shows each ship's heading and velocity vector, the active helm
 * order's guidance point and the projected course for the next three minutes.
 */
export function Tactical({ contacts, helm, shieldsRaised }: { contacts: ContactView[]; helm: HelmView; shieldsRaised: boolean }) {
  const [zoom, setZoom] = useState<'all' | 'near'>('all');
  const pts = [helm.position, ...contacts.filter((c) => !c.destroyed).map((c) => c.position), ...(helm.goal ? [helm.goal] : []), ...helm.path];
  const frame: Frame = makeFrame(zoom === 'near' ? [helm.position, ...(helm.goal ? [helm.goal] : [])] : pts, zoom === 'near' ? 30000 : 8000, zoom === 'near' ? helm.position : null);
  const grid = niceGrid(frame.span);
  const P = frame.toSvg;
  const hp = P(helm.position);
  const near = (q: { x: number; y: number }) => Math.hypot(q.x - hp.x, q.y - hp.y) < 16;
  const crowded = contacts.some((c) => near(P(c.position)));
  const vecEnd = (pos: { x: number; y: number }, heading: number, speed: number) => {
    const r = (heading * Math.PI) / 180;
    return P({ x: pos.x + Math.sin(r) * speed * 60, y: pos.y + Math.cos(r) * speed * 60 });
  };
  const gridLines: number[] = [];
  for (let g = Math.ceil((frame.cx - frame.span / 2) / grid) * grid; g <= frame.cx + frame.span / 2; g += grid) gridLines.push(g);
  const gridLinesY: number[] = [];
  for (let g = Math.ceil((frame.cy - frame.span / 2) / grid) * grid; g <= frame.cy + frame.span / 2; g += grid) gridLinesY.push(g);
  const borderY = helm.border !== null ? P({ x: frame.cx, y: helm.border }).y : null;

  return (
    <Panel title="Tactical / Sensors" code="12-090" accent="sky" testId="tactical">
      <div className="tactical-tools">
        <span className="muted">N↑ · GRID {grid.toLocaleString('en-US')} KM</span>
        <button className={`chip ${zoom === 'all' ? 'on' : ''}`} onClick={() => setZoom('all')} data-testid="zoom-all">Fit all</button>
        <button className={`chip ${zoom === 'near' ? 'on' : ''}`} onClick={() => setZoom('near')} data-testid="zoom-near">Local</button>
      </div>
      <svg className="radar" viewBox="0 0 200 200" role="img" aria-label="Tactical plot" data-testid="tactical-plot" data-span={Math.round(frame.span)}>
        <defs>
          <clipPath id="plotClip">
            <rect x="4" y="4" width="192" height="192" rx="6" />
          </clipPath>
        </defs>
        <rect x="4" y="4" width="192" height="192" rx="6" fill="#070d18" stroke="#3b6ea8" strokeWidth="1" />
        <g clipPath="url(#plotClip)">
          {gridLines.map((g) => {
            const x = P({ x: g, y: frame.cy }).x;
            return <line key={`gx${g}`} x1={x} y1="4" x2={x} y2="196" stroke="#1d3556" strokeWidth="0.5" />;
          })}
          {gridLinesY.map((g) => {
            const y = P({ x: frame.cx, y: g }).y;
            return <line key={`gy${g}`} x1="4" y1={y} x2="196" y2={y} stroke="#1d3556" strokeWidth="0.5" />;
          })}
          {borderY !== null && borderY > 4 && borderY < 196 && (
            <g data-testid="border-line">
              <line x1="4" y1={borderY} x2="196" y2={borderY} stroke="#4ade80" strokeWidth="0.8" strokeDasharray="4 3" />
              <text x="8" y={borderY - 2} fill="#4ade80" fontSize="6">ISA BORDER</text>
            </g>
          )}
          {helm.path.length > 1 && (
            <polyline data-testid="course-line" points={helm.path.map((p) => { const q = P(p); return `${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join(' ')} fill="none" stroke="#ffb347" strokeWidth="0.9" strokeDasharray="3 2" opacity="0.85" />
          )}
          {helm.goal && (() => {
            const g = P(helm.goal);
            return (
              <g data-testid="course-goal" data-x={Math.round(helm.goal.x)} data-y={Math.round(helm.goal.y)}>
                <circle cx={g.x} cy={g.y} r="3.2" fill="none" stroke="#ffb347" strokeWidth="0.8" />
                <line x1={g.x - 5} y1={g.y} x2={g.x + 5} y2={g.y} stroke="#ffb347" strokeWidth="0.6" />
                <line x1={g.x} y1={g.y - 5} x2={g.x} y2={g.y + 5} stroke="#ffb347" strokeWidth="0.6" />
              </g>
            );
          })()}
          {contacts.map((c) => {
            const p = P(c.position);
            const color = COLOR(c);
            const v = vecEnd(c.position, c.heading, c.speed);
            return (
              <g key={c.id} data-contact={c.id} data-x={Math.round(c.position.x)} data-y={Math.round(c.position.y)}>
                {c.speed > 1 && !c.destroyed && <line x1={p.x} y1={p.y} x2={v.x} y2={v.y} stroke={color} strokeWidth="0.6" opacity="0.7" />}
                {c.id === 'cruiser' ? (
                  <path d="M0 -5 L4.5 4 L-4.5 4 Z" transform={`translate(${p.x} ${p.y}) rotate(${c.heading})`} fill={color} />
                ) : (
                  <rect x={p.x - 3.5} y={p.y - 3.5} width="7" height="7" fill={color} />
                )}
                <text x={p.x > 130 ? p.x - 7 : p.x + 7} y={near(p) ? p.y - 5 : p.y + 3} textAnchor={p.x > 130 ? 'end' : 'start'} fill={color} fontSize="7">{c.name.toUpperCase()}</text>
              </g>
            );
          })}
          <g data-testid="tactical-halcyon" data-x={Math.round(helm.position.x)} data-y={Math.round(helm.position.y)} data-heading={helm.heading}>
            {helm.speed > 1 && (() => { const v = vecEnd(helm.position, helm.heading, helm.speed); return <line x1={hp.x} y1={hp.y} x2={v.x} y2={v.y} stroke="#ffb347" strokeWidth="0.7" />; })()}
            {shieldsRaised && <circle cx={hp.x} cy={hp.y} r="7" fill="none" stroke="#6fe0ff" strokeWidth="1" />}
            <path d="M0 -5.5 L4 4.5 L0 2.5 L-4 4.5 Z" transform={`translate(${hp.x} ${hp.y}) rotate(${helm.heading})`} fill="#ffb347" />
            {crowded ? (
              <text x={hp.x} y={hp.y + 13} textAnchor="middle" fill="#ffb347" fontSize="6.5">HALCYON</text>
            ) : (
              <text x={hp.x + 7} y={hp.y + 9} fill="#ffb347" fontSize="6.5">HALCYON</text>
            )}
          </g>
        </g>
        <text x="8" y="194" fill="#4f7cb1" fontSize="6.5">HDG {String(helm.heading).padStart(3, '0')} · {helm.speed} KM/S</text>
      </svg>
      <ul className="contacts">
        {contacts.length === 0 && <li className="muted">No contacts.</li>}
        {contacts.map((c) => (
          <li key={c.id} data-testid={`contact-${c.id}`}>
            <div className="contact-head">
              <span className={`disp disp-${c.disposition}`}>{c.disposition}</span>
              <strong>{c.name}</strong>
              <span className="contact-range">{formatRange(c.range)} · {String((c.bearing + 360) % 360).padStart(3, '0')}°</span>
            </div>
            <div className="contact-sub">
              {c.classification} — {c.faction}
              {!c.destroyed && (
                <span className="contact-motion">
                  {' '}· {c.speed} km/s{Math.abs(c.closing) >= 5 ? (c.closing > 0 ? ` · closing ${c.closing}` : ` · opening ${-c.closing}`) : ''}
                </span>
              )}
            </div>
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
