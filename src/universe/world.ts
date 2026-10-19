/**
 * Canonical world rules: what happens to offers and events as canonical time
 * passes, and how finished missions feed back into the world. Pure functions
 * over a CanonicalState draft (called inside the commit gate).
 */
import type { ScenarioModule } from '../engine/scenario';
import type { WorldState } from '../engine/types';
import { SCENARIO_VERSION } from '../scenarios/kestrel/setup';
import { updateEvent } from './canon';
import type { OfferResponse } from './controller';
import type { CanonicalMissionRecord, CanonicalState, MissionOffer } from './types';

/** Reasons a captain can log when refusing a directive (checked against evidence by the review). */
export const REFUSAL_REASONS = [
  { id: 'none', label: 'No reason given' },
  { id: 'unfit', label: 'Ship not fit for duty' },
  { id: 'prior-rescue', label: 'Already committed to a lifesaving response' },
  { id: 'accords', label: 'Directive conflicts with the Border Accords' },
] as const;

export function scenarioVersion(sc: ScenarioModule): string {
  return sc.id === 'kestrel-incident' ? SCENARIO_VERSION : '1.0.0';
}

/** Apply canonical conditions (crew, ship, news) to a freshly created bridge mission. */
export function prepareBridge(_c: CanonicalState, s: WorldState): WorldState {
  return s;
}

export function eventParams(_c: CanonicalState, o: MissionOffer): Record<string, number | string> {
  return { seed: o.seed };
}

export function resolveEventMission(c: CanonicalState, missionId: string, _appVersion: string): void {
  const m = c.missions[missionId];
  m.status = 'completed';
  m.outcome = { id: 'completed', title: 'Completed', summary: 'Mission completed.', success: true, turn: 0, endedAt: c.clock };
  updateEvent(c, m.eventId, { status: 'resolved' });
}

const RESPONSE_STATUS: Record<OfferResponse, MissionOffer['status']> = { decline: 'declined', ignore: 'ignored', question: 'questioned', refuse: 'refused', disobey: 'ignored' };

export function respondToOffer(c: CanonicalState, offerId: string, response: OfferResponse, reason: string, _appVersion: string): void {
  const o = c.offers.find((x) => x.id === offerId);
  if (!o || (o.status !== 'open' && o.status !== 'questioned')) throw new Error('That offer is no longer open.');
  o.status = RESPONSE_STATUS[response];
  o.responses.push({ at: c.clock, response, detail: reason || undefined });
  updateEvent(c, o.eventId, { decision: `Captain: ${response}${reason ? ` (${reason})` : ''}.` });
}

export function afterBridgeMission(_c: CanonicalState, _record: CanonicalMissionRecord, _final: WorldState, _appVersion: string): void {}

/** Canonical time passed: lapse expired offers. */
export function advanceWorld(c: CanonicalState, _minutes: number, _appVersion: string, _opts: { from: number }): void {
  for (const o of c.offers) {
    if (o.status === 'open' && o.expiresAt !== null && c.clock >= o.expiresAt) {
      o.status = 'lapsed';
      updateEvent(c, o.eventId, { status: 'expired', consequence: 'The offer lapsed without a response.' });
    }
  }
}
