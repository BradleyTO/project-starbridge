/**
 * Canonical world rules: what happens to offers and events as canonical time
 * passes, and how finished missions feed back into the world. Pure functions
 * over a CanonicalState draft (always called inside the canonical commit gate).
 *
 * Nothing here rewards or punishes the captain automatically: situations
 * unfold from seeded parameters and world conditions, and the disciplinary
 * review applies written rules to the evidence available when it was opened.
 */
import type { ScenarioModule } from '../engine/scenario';
import { addLog } from '../engine/state';
import type { WorldState } from '../engine/types';
import { ROLE_HOLDERS, SCENARIO_VERSION } from '../scenarios/kestrel/setup';
import { addCareer, addEvent, getEvent, nextId, updateEvent } from './canon';
import { MODEL_ESCORT, MODEL_HAULER } from './catalogue';
import type { OfferResponse } from './controller';
import { escortOutcome, haulerTimeline, kestrelUnattended, type EscortParams, type HaulerParams, type Stage } from './models';
import type { CanonicalMissionRecord, CanonicalState, DisciplinaryCase, MissionOffer, ModelParams } from './types';

const H = 60;
/** Hours before a disciplinary review returns its finding. */
export const REVIEW_HOURS = 12;
/** Hull points the Halcyon recovers per hour between canonical missions. */
export const REPAIR_PER_HOUR = 2;

/** Reasons a captain can log when refusing a directive (checked against evidence by the review). */
export const REFUSAL_REASONS = [
  { id: 'none', label: 'No reason given' },
  { id: 'unfit', label: 'Ship not fit for duty' },
  { id: 'prior-rescue', label: 'Already committed to a lifesaving response' },
  { id: 'accords', label: 'Directive conflicts with the Border Accords' },
] as const;

/** What a captain may do with each class of offer. Accepting/responding is separate (it costs a credit). */
export const ALLOWED_RESPONSES: Record<MissionOffer['classification'], OfferResponse[]> = {
  voluntary: ['decline'],
  distress: ['ignore'],
  directive: ['question', 'refuse', 'disobey'],
};

export const FLEET_REPLY =
  'Directive stands. The Kestrel reports reactor instability, and the Halcyon is the only Agency ship within six hours. The Border Accords rescue exemption (Art. 4) covers entry into the Reach to render aid. You are not authorised to initiate hostilities.';

export function scenarioVersion(sc: ScenarioModule): string {
  return sc.id === 'kestrel-incident' ? SCENARIO_VERSION : '1.0.0';
}

// ------------------------------------------------------------- ship & crew --

export function repairedHull(c: Pick<CanonicalState, 'ship' | 'clock'>): number {
  return Math.min(100, Math.round(c.ship.hull + (Math.max(0, c.clock - c.ship.updatedAt) / H) * REPAIR_PER_HOUR));
}

const OFFICER_IDS: readonly string[] = Object.values(ROLE_HOLDERS).flat();

/**
 * Apply canonical conditions to a freshly created bridge mission: the Halcyon's
 * repaired hull, the crew's canonical status and trust, border tension, and news
 * that has reached the ship since the last mission (evidence of events that
 * happened without the player).
 */
export function prepareBridge(c: CanonicalState, s0: WorldState): WorldState {
  let s = structuredClone(s0);
  const h = s.ships.halcyon;
  if (h) h.hull = Math.min(h.hull, repairedHull(c));
  for (const [id, x] of Object.entries(c.crew)) {
    const ch = s.characters[id];
    if (!ch) continue;
    ch.trust = x.trust;
    if (x.status === 'dead') {
      ch.status = 'dead';
      ch.memory = { ...ch.memory, deathTurn: -1 };
    } else if (x.status === 'injured') ch.status = 'injured';
  }
  if (c.tension >= 50) s.relations.tension = Math.min(100, s.relations.tension + 10);
  const missionId = s.provenance.missionId;
  for (const n of c.news) {
    if (n.deliveredTo) continue;
    s = addLog(s, 'system', 'Sector bulletin', n.text);
    n.deliveredTo = missionId;
  }
  const lost = Object.values(c.crew).filter((x) => x.status === 'dead');
  if (lost.length) s = addLog(s, 'system', 'Duty roster', `Relief officers stand in for ${lost.map((x) => x.name).join(', ')} (lost in the line of duty).`);
  return s;
}

/** A canonical bridge mission finished: carry its real consequences forward. */
export function afterBridgeMission(c: CanonicalState, record: CanonicalMissionRecord, final: WorldState, _appVersion: string): void {
  const h = final.ships.halcyon;
  if (h) c.ship = { hull: Math.max(0, Math.round(h.hull)), updatedAt: c.clock };
  c.tension = Math.round((c.tension + final.relations.tension) / 2);
  const kestrel = final.ships.kestrel;
  const outcome = final.outcome;
  if (outcome) {
    c.factions.independent.standing += kestrel && !kestrel.destroyed ? 5 : -5;
    c.factions.directorate.standing += final.relations.tension < 50 ? 5 : -10;
  }
  for (const id of OFFICER_IDS) {
    const ch = final.characters[id];
    if (!ch || ch.ship !== 'halcyon') continue;
    const prev = c.crew[id];
    if (prev?.status === 'dead') continue; // already lost on an earlier canonical mission
    const x = prev ?? { id, name: ch.name, role: ch.role, status: 'active' as const, trust: ch.trust, loyalty: 50, missions: [], experiences: [], disciplinary: [] };
    // Relief officers only join the record once they have actually stood a watch.
    if (!prev && id.startsWith('relief_') && !final.log.some((e) => e.speaker.startsWith(ch.name))) continue;
    x.trust = ch.trust;
    x.missions = [...x.missions, record.id];
    x.loyalty = Math.min(100, x.loyalty + 2);
    if (ch.status === 'dead') {
      x.status = 'dead';
      x.experiences = [...x.experiences, { missionId: record.id, eventId: record.eventId, text: `Killed in the line of duty during ${record.title}.` }];
    } else {
      x.status = ch.status === 'injured' ? 'injured' : 'active';
      x.experiences = [...x.experiences, { missionId: record.id, eventId: record.eventId, text: `${record.title}: ${outcome?.title ?? 'served'}${ch.status === 'injured' ? ' (injured)' : ''}.` }];
    }
    c.crew[id] = x;
  }
}

// ---------------------------------------------------------- event missions --

export function eventParams(_c: CanonicalState, o: MissionOffer): ModelParams {
  return { ...(o.model?.params ?? { seed: o.seed }) };
}

/** Apply one model stage to the canonical record (once). */
function applyStage(c: CanonicalState, o: MissionOffer, st: Stage, appVersion: string, opts: { news: boolean }): void {
  const key = `${st.kind}@${st.at}`;
  if (!o.model) o.model = { params: { seed: o.seed }, applied: [] };
  if (o.model.applied.includes(key)) return;
  o.model.applied.push(key);
  updateEvent(c, o.eventId, { consequence: st.text });
  if (!st.final) return;
  const lost = st.kind === 'lost';
  updateEvent(c, o.eventId, { status: lost ? 'expired' : 'resolved' });
  if (o.status === 'open' || o.status === 'questioned') o.status = 'lapsed';
  if (!opts.news) return;
  const parent = getEvent(c, o.eventId);
  const bulletin = addEvent(
    c,
    { at: st.at, missionId: null, title: `Sector bulletin: ${parent?.title ?? o.title}`, summary: st.text, ships: parent?.ships ?? [], characters: [], factions: parent?.factions ?? [], classification: 'bulletin', authority: 'observed', decisions: [], consequences: [], links: [o.eventId], status: 'resolved' },
    appVersion,
  );
  updateEvent(c, o.eventId, { link: bulletin.id });
  c.news.push({ eventId: bulletin.id, text: st.text, deliveredTo: null });
}

/** The captain answered an event-model offer (the credit is already spent): play the model out. */
export function resolveEventMission(c: CanonicalState, missionId: string, appVersion: string): void {
  const m = c.missions[missionId];
  const o = c.offers.find((x) => x.id === m.offerId);
  if (!o) throw new Error('Mission has no offer.');
  const from = c.clock;
  let final: Stage;
  if (m.mission.kind === 'event' && m.mission.model === MODEL_HAULER) {
    const stages = haulerTimeline(o.model!.params as unknown as HaulerParams, c.clock);
    for (const st of stages) applyStage(c, o, st, appVersion, { news: false });
    final = stages[stages.length - 1];
  } else {
    final = escortOutcome(o.model!.params as unknown as EscortParams, true);
    applyStage(c, o, final, appVersion, { news: false });
  }
  const success = final.kind === 'rescued-halcyon';
  c.clock = Math.max(c.clock, final.at) + H; // stand down and report
  m.status = 'completed';
  m.outcome = { id: final.kind, title: success ? 'Mission accomplished' : 'Overtaken by events', summary: final.text, success, turn: 0, endedAt: c.clock };
  m.decisions = [...m.decisions, success ? 'Halcyon completed the response.' : 'Halcyon arrived after the situation had resolved.'];
  addCareer(c, `${m.title}: ${final.text}`, m.id, m.eventId);
  for (const x of Object.values(c.crew)) if (x.status !== 'dead') x.experiences = [...x.experiences, { missionId, eventId: m.eventId, text: `${m.title}: ${success ? 'completed' : 'arrived late'}.` }];
  advanceWorld(c, c.clock - from, appVersion, { from });
}

// ---------------------------------------------------------------- offers --

const RESPONSE_STATUS: Record<OfferResponse, MissionOffer['status']> = { decline: 'declined', ignore: 'ignored', question: 'questioned', refuse: 'refused', disobey: 'ignored' };

/** Is a lifesaving response under way or recently completed (evidence for Reg. 7.3)? */
function lifesavingCommitment(c: CanonicalState): string | null {
  for (const o of c.offers) {
    if (o.classification !== 'distress' || o.status !== 'accepted') continue;
    const at = o.responses.find((r) => r.response === 'responded')?.at ?? -Infinity;
    if (c.clock - at <= 6 * H) return `Halcyon responded to "${o.title}" ${Math.round((c.clock - at) / H)} h earlier.`;
  }
  return null;
}

/** Open a disciplinary review. The evidence is fixed now; the finding follows deterministically. */
export function openReview(c: CanonicalState, o: MissionOffer, trigger: DisciplinaryCase['trigger'], reason: string, appVersion: string): DisciplinaryCase {
  const hull = repairedHull(c);
  const lifesaving = lifesavingCommitment(c);
  const evidence: string[] = [`Halcyon hull at ${hull}% when the directive was ${trigger}.`, lifesaving ?? 'No lifesaving response under way.', 'The directive cites the Border Accords rescue exemption (Art. 4).'];
  let rule: string;
  if (trigger === 'disobeyed') rule = 'Reg. 12: failure to carry out a lawful directive. Mitigated where the captain was saving life.';
  else if (reason === 'unfit') rule = 'Reg. 7.2: a directive may be declined when the ship is not fit for duty (hull below 60%).';
  else if (reason === 'prior-rescue') rule = 'Reg. 7.3: an existing lifesaving commitment takes precedence over a directive.';
  else if (reason === 'accords') rule = 'Reg. 7.4: a directive that would breach treaty law may be refused.';
  else rule = 'Reg. 7.1: a directive refused without a stated reason.';
  const ev = addEvent(
    c,
    { missionId: null, title: `Disciplinary review: ${o.missionTitle}`, summary: `Fleet Command opened a review after the directive was ${trigger}.`, ships: ['ISV Halcyon'], characters: [], factions: ['concord'], classification: 'disciplinary', authority: 'fleet-command', decisions: [], consequences: [], links: [o.eventId], status: 'pending' },
    appVersion,
  );
  const dc: DisciplinaryCase = { id: nextId(c, 'DSC'), eventId: ev.id, directiveOfferId: o.id, openedAt: c.clock, trigger, reason: reason || 'none', rule, evidence, finding: 'pending', resolvedAt: null };
  c.discipline.push(dc);
  updateEvent(c, o.eventId, { link: ev.id });
  return dc;
}

/** The deterministic finding: the rule applied to the evidence recorded when the review opened. */
export function reviewFinding(dc: { trigger: DisciplinaryCase['trigger']; reason: string; evidence: readonly string[] }): { finding: 'no-action' | 'reprimand'; text: string } {
  const hull = Number(/hull at (\d+)%/.exec(dc.evidence[0] ?? '')?.[1] ?? 100);
  const lifesaving = !(dc.evidence[1] ?? '').startsWith('No lifesaving');
  let valid: boolean;
  let why: string;
  if (dc.trigger === 'disobeyed') {
    valid = lifesaving;
    why = valid ? 'the captain was engaged in saving life at the time' : 'no mitigating circumstances were found';
  } else if (dc.reason === 'unfit') {
    valid = hull < 60;
    why = valid ? `the ship was not fit for duty (hull ${hull}%)` : `the ship was fit for duty (hull ${hull}%)`;
  } else if (dc.reason === 'prior-rescue') {
    valid = lifesaving;
    why = valid ? 'a lifesaving response was under way' : 'no lifesaving response was under way';
  } else if (dc.reason === 'accords') {
    valid = false;
    why = 'the rescue exemption made the directive lawful under the Accords';
  } else {
    valid = false;
    why = 'no reason was given';
  }
  return valid ? { finding: 'no-action', text: `Review closed with no action: ${why}.` } : { finding: 'reprimand', text: `Formal reprimand entered in the captain's record: ${why}.` };
}

function resolveReview(c: CanonicalState, dc: DisciplinaryCase, at: number): void {
  const r = reviewFinding(dc);
  dc.finding = r.finding;
  dc.resolvedAt = at;
  updateEvent(c, dc.eventId, { status: 'resolved', consequence: r.text });
  addCareer(c, `Disciplinary review (${dc.rule.split(':')[0]}): ${r.text}`, null, dc.eventId);
}

/** The directive was refused, disobeyed or let lapse: the Kestrel situation goes on without the Halcyon. */
function abandonDirective(c: CanonicalState, o: MissionOffer): void {
  o.model = { params: { seed: o.seed, t0: c.clock, kind: 'kestrel-unattended' }, applied: o.model?.applied ?? [] };
  updateEvent(c, o.eventId, { status: 'active', consequence: 'The Halcyon did not go. The Kestrel situation continues without her.' });
}

export function respondToOffer(c: CanonicalState, offerId: string, response: OfferResponse, reason: string, appVersion: string): void {
  const o = c.offers.find((x) => x.id === offerId);
  if (!o || (o.status !== 'open' && o.status !== 'questioned')) throw new Error('That offer is no longer open.');
  if (!ALLOWED_RESPONSES[o.classification].includes(response)) throw new Error(`A ${o.classification} offer cannot be answered with "${response}".`);
  const label = REFUSAL_REASONS.find((r) => r.id === reason)?.label;
  if (response === 'question') {
    o.status = 'questioned';
    o.responses.push({ at: c.clock, response, detail: FLEET_REPLY });
    updateEvent(c, o.eventId, { decision: 'Captain questioned the directive.', consequence: `Fleet Command replied: ${FLEET_REPLY}` });
    return;
  }
  o.status = RESPONSE_STATUS[response];
  o.responses.push({ at: c.clock, response, detail: label });
  updateEvent(c, o.eventId, { decision: `Captain ${response === 'disobey' ? 'did not comply' : `${response}d`}${label && reason !== 'none' ? ` (${label})` : ''}.` });
  if (o.classification === 'voluntary') {
    updateEvent(c, o.eventId, { status: 'active', consequence: o.mission.kind === 'event' ? 'The Lantern will make the crossing alone.' : 'Fleet will look for another volunteer.' });
    if (o.mission.kind === 'bridge') updateEvent(c, o.eventId, { status: 'expired' });
  }
  if (o.classification === 'directive') {
    openReview(c, o, response === 'refuse' ? 'refused' : 'disobeyed', reason, appVersion);
    abandonDirective(c, o);
  }
  // A distress call that is ignored stays active; its model keeps running in advanceWorld.
}

// -------------------------------------------------------------- world time --

/** Canonical time passed (from → c.clock): emergencies progress, offers lapse, reviews conclude. */
export function advanceWorld(c: CanonicalState, _minutes: number, appVersion: string, _opts: { from: number }): void {
  const to = c.clock;
  for (const o of c.offers) {
    // Lapse expired offers first (their consequences then play out below).
    if ((o.status === 'open' || o.status === 'questioned') && o.expiresAt !== null && to >= o.expiresAt) {
      o.status = 'lapsed';
      updateEvent(c, o.eventId, { decision: 'No response before the deadline.' });
      if (o.classification === 'directive') {
        const at = c.clock;
        c.clock = o.expiresAt; // evidence as it stood at the deadline
        openReview(c, o, 'disobeyed', 'none', appVersion);
        abandonDirective(c, o);
        c.clock = at;
      } else if (o.mission.kind === 'event') updateEvent(c, o.eventId, { status: 'active', consequence: 'No escort came; the Lantern will make the crossing alone.' });
      else updateEvent(c, o.eventId, { status: 'expired', consequence: 'The offer lapsed.' });
    }
    const stages: Stage[] = [];
    if (o.mission.kind === 'event' && o.mission.model === MODEL_HAULER && (o.status === 'open' || o.status === 'ignored' || o.status === 'lapsed') && o.model) {
      stages.push(...haulerTimeline(o.model.params as unknown as HaulerParams, null));
    } else if (o.mission.kind === 'event' && o.mission.model === MODEL_ESCORT && (o.status === 'declined' || o.status === 'lapsed') && o.model) {
      stages.push(escortOutcome(o.model.params as unknown as EscortParams, false));
    } else if (o.model?.params.kind === 'kestrel-unattended') {
      stages.push(kestrelUnattended(Number(o.model.params.seed), Number(o.model.params.t0)));
    }
    for (const st of stages) if (st.at <= to) applyStage(c, o, st, appVersion, { news: true });
  }
  for (const dc of c.discipline) if (dc.finding === 'pending' && dc.openedAt + REVIEW_HOURS * H <= to) resolveReview(c, dc, dc.openedAt + REVIEW_HOURS * H);
}
