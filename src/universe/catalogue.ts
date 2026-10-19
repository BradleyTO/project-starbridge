/**
 * Mission catalogue for the Living Universe proof of concept. Offers are
 * generated deterministically from the canonical seed and clock; a future
 * server or AI author can emit the same MissionOffer records.
 */
import { addEvent, nextId, provenance } from './canon';
import type { CanonicalState, MissionOffer, OfferClass, WorldEvent } from './types';

/** Deterministic 31-bit hash of a seed and a label (no RNG state consumed). */
export function hashSeed(seed: number, label: string): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (let i = 0; i < label.length; i++) h = Math.imul(h ^ label.charCodeAt(i), 0x01000193) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return (h >>> 0) % 1_000_000;
}

export const KESTREL = 'kestrel-incident';
export const MODEL_HAULER = 'hauler-distress';
export const MODEL_ESCORT = 'survey-escort';

interface OfferDraft {
  key: string;
  classification: OfferClass;
  authority: MissionOffer['authority'];
  title: string;
  missionTitle: string;
  briefing: string;
  mission: MissionOffer['mission'];
  expiresInMin: number | null;
  event: Pick<WorldEvent, 'title' | 'summary' | 'ships' | 'characters' | 'factions' | 'classification' | 'authority' | 'status'>;
}

function issue(c: CanonicalState, d: OfferDraft, appVersion: string): MissionOffer {
  const ev = addEvent(c, { ...d.event, missionId: null, decisions: [], consequences: [], links: [] }, appVersion);
  const offer: MissionOffer = {
    id: nextId(c, 'OF'),
    classification: d.classification,
    authority: d.authority,
    title: d.title,
    missionTitle: d.missionTitle,
    briefing: d.briefing,
    mission: d.mission,
    seed: hashSeed(c.seed, `${d.key}:${c.nextSeq}`),
    issuedAt: c.clock,
    expiresAt: d.expiresInMin === null ? null : c.clock + d.expiresInMin,
    eventId: ev.id,
    status: 'open',
    responses: [],
    provenance: provenance(appVersion, 'catalogue'),
  };
  c.offers.push(offer);
  return offer;
}

export function issueKestrelDirective(c: CanonicalState, appVersion: string): MissionOffer {
  return issue(
    c,
    {
      key: 'kestrel-directive',
      classification: 'directive',
      authority: 'fleet-command',
      title: 'Fleet Directive 7-Tessarine: the Kestrel distress beacon',
      missionTitle: 'The Kestrel Incident',
      briefing:
        'Fleet Command directs the Halcyon to respond to a civilian distress beacon from the freighter Kestrel inside the disputed Tessarine Reach. A Directorate cruiser is reported in the area. Border Accords rescue exemption applies. Acknowledge within six hours.',
      mission: { kind: 'bridge', scenarioId: KESTREL },
      expiresInMin: 6 * 60,
      event: { title: 'Fleet directive: respond to the Kestrel', summary: 'Mandatory directive issued to the Halcyon by Fleet Command.', ships: ['CSV Halcyon', 'Kestrel'], characters: [], factions: ['concord', 'independent', 'directorate'], classification: 'directive', authority: 'fleet-command', status: 'pending' },
    },
    appVersion,
  );
}

export function issueHaulerDistress(c: CanonicalState, appVersion: string): MissionOffer {
  return issue(
    c,
    {
      key: 'hauler-distress',
      classification: 'distress',
      authority: 'civilian',
      title: 'Distress call: ore hauler Tamsin Grey',
      missionTitle: 'Rescue of the Tamsin Grey',
      briefing:
        'Automated mayday from the independent ore hauler Tamsin Grey (crew of 9): drive failure and a slow hull breach, drifting near the Ashfall Drift about three hours from your position. Other traffic in the area is light. Responding is voluntary; the emergency continues either way.',
      mission: { kind: 'event', model: MODEL_HAULER },
      expiresInMin: null,
      event: { title: 'Mayday: Tamsin Grey', summary: 'Ore hauler Tamsin Grey reports drive failure and a hull breach. Crew of 9.', ships: ['Tamsin Grey'], characters: [], factions: ['independent'], classification: 'distress', authority: 'civilian', status: 'active' },
    },
    appVersion,
  );
}

export function issueSurveyEscort(c: CanonicalState, appVersion: string): MissionOffer {
  return issue(
    c,
    {
      key: 'survey-escort',
      classification: 'voluntary',
      authority: 'local-government',
      title: 'Voluntary: escort the survey tender Lantern',
      missionTitle: 'Lantern escort',
      briefing: 'The Hollin Colony survey office asks whether the Halcyon can escort its tender Lantern through the Ashfall Drift. They will go alone if you decline.',
      mission: { kind: 'event', model: MODEL_ESCORT },
      expiresInMin: 12 * 60,
      event: { title: 'Request: escort the Lantern', summary: 'Hollin Colony asks for an escort through the Ashfall Drift.', ships: ['Lantern'], characters: [], factions: ['independent'], classification: 'assignment', authority: 'local-government', status: 'pending' },
    },
    appVersion,
  );
}

export function issueReachPatrol(c: CanonicalState, appVersion: string): MissionOffer {
  return issue(
    c,
    {
      key: 'reach-patrol',
      classification: 'voluntary',
      authority: 'fleet-command',
      title: 'Voluntary: Reach patrol (new contact)',
      missionTitle: 'Reach patrol: a new Kestrel-class incident',
      briefing: 'Fleet asks for volunteers to patrol the Tessarine Reach, where another distress contact has been reported. A fresh situation every time.',
      mission: { kind: 'bridge', scenarioId: KESTREL },
      expiresInMin: null,
      event: { title: 'Request: Reach patrol', summary: 'Fleet asks for a volunteer patrol of the Tessarine Reach.', ships: ['CSV Halcyon'], characters: [], factions: ['concord'], classification: 'assignment', authority: 'fleet-command', status: 'pending' },
    },
    appVersion,
  );
}

/** The opening board of a new canonical profile. */
export function seedBoard(c: CanonicalState, appVersion: string): CanonicalState {
  issueKestrelDirective(c, appVersion);
  issueHaulerDistress(c, appVersion);
  issueSurveyEscort(c, appVersion);
  return c;
}

/** Keep one Reach patrol on offer once the directive is no longer open. */
export function replenish(c: CanonicalState, appVersion: string): void {
  const directiveOpen = c.offers.some((o) => o.classification === 'directive' && (o.status === 'open' || o.status === 'questioned'));
  const patrolOpen = c.offers.some((o) => o.title.startsWith('Voluntary: Reach patrol') && o.status === 'open');
  if (!directiveOpen && !patrolOpen) issueReachPatrol(c, appVersion);
}
