export const R = 88;
const MIN_KM = 1000;
const MAX_KM = 250000;

/** Log-scaled radial position so both 1,500 km and 210,000 km fit on one plot. */
export function plotPosition(c: { range: number; bearing: number }): { x: number; y: number } {
  const r = (R * Math.log(Math.max(c.range, MIN_KM) / MIN_KM)) / Math.log(MAX_KM / MIN_KM);
  const a = (c.bearing * Math.PI) / 180;
  return { x: 100 + r * Math.sin(a), y: 100 - r * Math.cos(a) };
}
