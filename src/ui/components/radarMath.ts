import type { Vec2 } from '../../engine/types';

export interface Frame {
  cx: number;
  cy: number;
  /** World span (km) across the 184-unit plot. */
  span: number;
  toSvg: (p: Vec2) => { x: number; y: number };
}

/** Linear north-up frame that fits the given points (or a fixed span around `centre`). */
export function makeFrame(points: Vec2[], minSpan: number, centre: Vec2 | null = null): Frame {
  let cx: number;
  let cy: number;
  let span: number;
  if (centre) {
    cx = centre.x;
    cy = centre.y;
    span = minSpan;
  } else {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    cx = (minX + maxX) / 2;
    cy = (minY + maxY) / 2;
    span = Math.max(minSpan, (maxX - minX) * 1.25, (maxY - minY) * 1.25);
  }
  const k = 184 / span;
  return { cx, cy, span, toSvg: (p) => ({ x: 100 + (p.x - cx) * k, y: 100 - (p.y - cy) * k }) };
}

/** A round grid spacing giving roughly four divisions. */
export function niceGrid(span: number): number {
  const raw = span / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}
