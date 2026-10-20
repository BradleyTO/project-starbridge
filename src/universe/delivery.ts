/**
 * v0.5 (M3.1) organic mission delivery on Active Duty.
 *
 * There is no mission menu. Offers, emergencies and discoveries exist in the canonical world;
 * what reaches the bridge, and when, depends on the world as it is: galaxy time, where the
 * Halcyon is, her condition, faction standing, border tension, what the captain did before,
 * and how recently the bridge last heard something. Most hours are quiet.
 *
 * Deterministic: the same canon gives the same traffic. Fleet priority traffic (a directive)
 * always gets through; everything else competes with "nothing happens" for each hour that passes.
 */
import { hashSeed } from './hash';
import { explorationOf, nearPatrolArea } from './exploration';
import { repairedHull } from './world';
import type { CanonicalState, Exploration, MissionOffer } from './types';

export type Traffic =
  | { kind: 'offer'; offerId: string; channel: 'hail' | 'distress' | 'request' }
  | { kind: 'science'; systemId: string }
  | { kind: 'bulletin'; eventId: string; text: string };

/** Minimum quiet after anything reaches the bridge (canonical minutes). */
export const QUIET_MIN = 180;

const isOpen = (o: Pick<MissionOffer, 'status' | 'expiresAt'>, now: number) => (o.status === 'open' || o.status === 'questioned') && (o.expiresAt === null || o.expiresAt > now);

export function channelFor(o: Pick<MissionOffer, 'classification' | 'authority'>): 'hail' | 'distress' | 'request' {
  return o.classification === 'distress' ? 'distress' : o.classification === 'directive' || o.authority === 'fleet-command' ? 'hail' : 'request';
}

/** Weights for everything that could reach the bridge in the next hour (quiet included). Exposed for tests. */
export function trafficWeights(c: CanonicalState, e: Exploration = explorationOf(c)): { t: Traffic | null; w: number; why: string }[] {
  const out: { t: Traffic | null; w: number; why: string }[] = [];
  const near = nearPatrolArea(e);
  const hull = repairedHull(c);
  const rescues = Object.values(c.missions).filter((m) => m.classification === 'distress' && m.status === 'completed').length;
  for (const o of c.offers) {
    if (!isOpen(o, c.clock) || e.delivered.includes(o.id)) continue;
    const t: Traffic = { kind: 'offer', offerId: o.id, channel: channelFor(o) };
    if (o.classification === 'distress') out.push({ t, w: near ? 5 * (1 + Math.min(rescues, 2) * 0.5) : 0, why: near ? 'distress call in range' : 'out of range of the patrol area' });
    else if (o.authority === 'local-government') out.push({ t, w: near ? (c.factions.independent.standing >= -10 ? 3 : 0.5) : 0, why: 'colony request' });
    else if (o.classification === 'voluntary') {
      // Fleet asks for volunteers once other ships have passed on it, and never asks a damaged ship.
      const asked = c.clock - o.issuedAt >= 6 * 60;
      out.push({ t, w: hull >= 50 && asked ? 2 * (c.tension > 60 ? 2 : 1) : 0, why: hull < 50 ? 'Fleet will not ask a damaged ship' : asked ? 'Fleet request' : 'Fleet has not asked yet' });
    }
  }
  const hidden = e.systems.find((x) => x.civ && x.signal === 'none');
  if (hidden && c.clock - (c.commission?.at ?? 0) >= 12 * 60) out.push({ t: { kind: 'science', systemId: hidden.id }, w: 2 + e.systems.filter((x) => x.investigated).length, why: 'science reading' });
  const news = c.news.find((n) => !e.delivered.includes(`news:${n.eventId}`));
  if (news) out.push({ t: { kind: 'bulletin', eventId: news.eventId, text: news.text }, w: 2, why: 'bulletin' });
  out.push({ t: null, w: 12, why: 'quiet' });
  return out.filter((x) => x.w > 0);
}

/** What (if anything) reaches the bridge now. */
export function pickTraffic(c: CanonicalState, opts: { priorityOnly?: boolean } = {}): Traffic | null {
  const e = explorationOf(c);
  const directive = c.offers.find((o) => o.classification === 'directive' && isOpen(o, c.clock) && !e.delivered.includes(o.id));
  if (directive) return { kind: 'offer', offerId: directive.id, channel: 'hail' };
  if (opts.priorityOnly) return null;
  if (e.lastDeliveryAt !== null && c.clock - e.lastDeliveryAt < QUIET_MIN) return null;
  const ws = trafficWeights(c, e);
  const total = ws.reduce((a, x) => a + x.w, 0);
  let r = (hashSeed(c.seed, `traffic:${c.clock}:${e.traffic.length}`) / 1_000_000) * total;
  for (const x of ws) {
    r -= x.w;
    if (r < 0) return x.t;
  }
  return null;
}

/** Mark traffic as delivered (inside a commit). */
export function markDelivered(c: CanonicalState, e: Exploration, t: Traffic): void {
  const ref = t.kind === 'offer' ? t.offerId : t.kind === 'science' ? t.systemId : `news:${t.eventId}`;
  e.delivered.push(ref);
  e.lastDeliveryAt = c.clock;
  e.traffic.push({ at: c.clock, kind: t.kind === 'offer' ? t.channel : t.kind, ref });
}
