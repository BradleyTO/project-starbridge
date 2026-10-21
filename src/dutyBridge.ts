/**
 * v0.5 (M3.1) the Active Duty bridge: glue between the bridge WorldState and the canonical universe.
 *
 * The engine only records what the captain asked for (uiRequest); this module carries it out through
 * the Universe API (patrol, answer a call, set a course, record first contact) and turns the result
 * into crew and comms lines. Pure apart from the Universe calls, so tests drive it exactly as the app does.
 *
 * What is waiting on the bridge (the call awaiting an answer, the civilization in orbit) is derived
 * from the canon every time, so a reload restores it.
 */
import type { Report } from './engine/report';
import { say } from './engine/report';
import { appendReports } from './engine/turn';
import type { DutyBridge, FirstContactState, IncomingCall, SurveySystem, WorldState } from './engine/types';
import { closeChannel, commsOf } from './engine/comms';
import { defaultSurvey } from './scenarios/bridge';
import { scenarioFor } from './scenarios/registry';
import type { Universe } from './universe/controller';
import type { Traffic } from './universe/delivery';
import { distanceLy, placeName, resolvePlace, STATION, systemById } from './universe/exploration';
import type { Exploration, MissionOffer } from './universe/types';
import type { DeepReadonly } from './universe/freeze';
import type { CanonicalSession } from './universe/sessions';

const OFFSTAGE = { x: 9_000_000, y: 9_000_000 };
const fleet = (key: string, vars: Report['vars'], label = 'Fleet Command'): Report => ({ channel: 'comms', speaker: { label }, key, vars });

function fromOf(o: DeepReadonly<MissionOffer>): string {
  if (o.authority === 'fleet-command') return 'Fleet Command';
  if (o.authority === 'local-government') return 'the Hollin Colony survey office';
  return o.title.replace(/^Distress call:\s*/i, '');
}

function incomingOf(u: Universe, e: DeepReadonly<Exploration>): IncomingCall | null {
  const c = u.canon();
  if (!c) return null;
  for (let i = e.traffic.length - 1; i >= 0; i--) {
    const t = e.traffic[i];
    if (t.kind !== 'hail' && t.kind !== 'distress' && t.kind !== 'request') continue;
    const o = c.offers.find((x) => x.id === t.ref);
    if (o && (o.status === 'open' || o.status === 'questioned') && (o.expiresAt === null || o.expiresAt > c.clock))
      return { offerId: o.id, channel: t.kind, classification: o.classification, from: fromOf(o), title: o.title, briefing: o.briefing };
  }
  return null;
}

function contactFor(e: DeepReadonly<Exploration>, prev: FirstContactState | null): FirstContactState | null {
  const inv = e.investigation;
  if (inv && inv.arrivedAt !== null && e.location === inv.systemId) {
    const sys = systemById(e as Exploration, inv.systemId);
    if (sys?.civ && !sys.contacted) {
      if (prev && prev.systemId === sys.id) return prev;
      return { systemId: sys.id, system: sys.name, people: sys.civ.people, leader: sys.civ.leader, station: sys.civ.station, disposition: sys.civ.disposition, stage: 'arrived', asks: 0, approach: null, outcome: null };
    }
  }
  // After contact is recorded, the conversation stays on screen while the Halcyon remains in orbit.
  if (prev && prev.stage === 'concluded' && e.location === prev.systemId) return prev;
  return null;
}

function placeContact(s: WorldState, c: FirstContactState | null): WorldState {
  const k = s.ships.kestrel;
  if (!c) {
    if (!k.detected) return s;
    let next: WorldState = { ...s, ships: { ...s.ships, kestrel: { ...k, detected: false, position: OFFSTAGE, velocity: { x: 0, y: 0 }, nav: null, scanLevel: 0, disposition: 'unknown' } } };
    if (commsOf(next).channels.some((x) => x.party === 'kestrel')) next = closeChannel(next, 'kestrel');
    return next;
  }
  if (k.detected && k.name === c.station) return s;
  const souls = c.disposition === 'guarded' ? 60 : c.disposition === 'isolationist' ? 90 : c.disposition === 'cautious' ? 120 : 340;
  const cls = c.disposition === 'guarded' ? 'Armed system guardship' : c.disposition === 'isolationist' ? 'Civilian orbital lattice' : c.disposition === 'cautious' ? 'Civilian orbital platform' : 'Civilian orbital station';
  const a = s.characters.arden;
  return {
    ...s,
    ships: { ...s.ships, kestrel: { ...k, name: c.station, classification: cls, faction: 'independent', detected: true, position: { x: 4000, y: 18000 }, velocity: { x: 0, y: 0 }, nav: null, scanLevel: 1, disposition: 'neutral', hull: 100, containment: 100, souls } },
    characters: { ...s.characters, arden: { ...a, name: c.leader, role: c.people, status: 'active', memory: {} } },
  };
}

/** Overlay the Active Duty state (live survey, waiting call, first contact) onto an idle-bridge WorldState. */
export function withDuty(u: Universe, s: WorldState): WorldState {
  if (s.scenarioId !== 'bridge') return s;
  const live = u.dutyStatus() === 'active';
  const e = live ? u.exploration() : null;
  if (!live || !e) {
    const off: DutyBridge = { live: false, location: 'ISA survey space', incoming: null, contact: null };
    const survey = s.survey?.live ? { systems: defaultSurvey(s.seed), course: null } : s.survey;
    return placeContact({ ...s, survey, duty: off }, null);
  }
  const systems: SurveySystem[] = e.systems.map((x) => ({ id: x.id, name: x.name, star: x.star, distanceLy: x.distanceLy, signal: x.signal, note: x.note, contacted: x.contacted, investigated: x.investigated }));
  const contact = contactFor(e, s.duty?.contact ?? null);
  const duty: DutyBridge = { live: true, location: placeName(e as Exploration, e.location), incoming: incomingOf(u, e), contact };
  return placeContact({ ...s, survey: { systems, course: e.investigation?.systemId ?? null, live: true }, duty }, contact);
}

/** The lines a piece of traffic produces when it reaches the bridge. */
export function trafficReports(u: Universe, t: Traffic | null): Report[] {
  if (!t) return [];
  const c = u.canon();
  if (t.kind === 'science') {
    const sys = systemById(u.exploration() as Exploration, t.systemId);
    return sys ? [say('sensors', 'scienceDiscovery', { system: sys.name, note: sys.note })] : [];
  }
  if (t.kind === 'bulletin') return [say('comms', 'bulletin', { text: t.text })];
  const o = c?.offers.find((x) => x.id === t.offerId);
  if (!o) return [];
  const head = t.channel === 'hail' ? say('comms', 'incomingHail') : t.channel === 'distress' ? say('comms', 'incomingDistress') : say('comms', 'incomingRequest', { from: fromOf(o) });
  return [head, fleet('incomingBody', { briefing: o.briefing }, fromOf(o) === 'Fleet Command' ? 'Fleet Command' : fromOf(o)), say('xo', `incomingPrompt_${o.classification}`)];
}

export interface DutyOutcome {
  state: WorldState;
  enter?: { session: CanonicalSession; title: string };
  flash?: string;
}

const say2 = (s: WorldState, reports: Report[]) => appendReports(s, scenarioFor(s.scenarioId), reports);

/** Answer the call waiting on the bridge. */
function respond(u: Universe, s: WorldState, offerId: string, spoken: string): DutyOutcome {
  const [response, reason = 'none'] = spoken.split(':');
  const o = u.canon()?.offers.find((x) => x.id === offerId);
  if (!o || (o.status !== 'open' && o.status !== 'questioned')) return { state: say2(s, [say('xo', 'respondUnavailable')]) };
  const r: Report[] = [];
  const kind = o.classification;
  if (response === 'accept') {
    const res = u.startCanonical(offerId);
    if (!res.ok) return { state: say2(s, [say('xo', res.reason === 'no-credits' ? 'respondNoCredits' : 'respondUnavailable')]), flash: res.reason === 'no-credits' ? 'No new canonical starts left today. Simulations are unlimited.' : undefined };
    const m = u.canon()!.missions[res.missionId];
    if (res.session) return { state: say2(s, [say('xo', 'respondAccept', { title: m.title })]), enter: { session: res.session, title: m.title } };
    r.push(say('xo', 'respondAccept', { title: m.title }));
    if (m.outcome) r.push(say('xo', 'respondEventDone', { title: m.outcome.title, summary: m.outcome.summary }));
    return { state: say2(s, r), flash: `${m.title}: ${m.outcome?.title ?? 'under way'}. 1 credit used.` };
  }
  if (response === 'question') {
    if (kind !== 'directive') return { state: say2(s, [say('comms', 'respondDetails', { briefing: o.briefing })]) };
    const c = u.respond(offerId, 'question');
    const reply = c.offers.find((x) => x.id === offerId)?.responses.at(-1)?.detail ?? '';
    return { state: say2(s, [say('comms', 'respondQuestioned'), fleet('incomingBody', { briefing: reply })]) };
  }
  if (kind === 'directive') {
    if (response === 'ignore') return { state: say2(s, [say('xo', 'respondDirectiveIgnore')]) };
    u.respond(offerId, 'refuse', reason);
    return { state: say2(s, [say('xo', 'respondRefused')]), flash: 'Directive refused. A review will weigh your reasons. No credit used.' };
  }
  if (kind === 'voluntary') {
    u.respond(offerId, 'decline');
    return { state: say2(s, [say('comms', 'respondDeclined', { title: o.title })]), flash: 'Declined. No credit used.' };
  }
  u.respond(offerId, 'ignore');
  return { state: say2(s, [say('xo', 'respondIgnored', { title: fromOf(o) })]), flash: 'Logged: no response. No credit used.' };
}

/** Carry out a duty request raised on the bridge. Returns the next bridge state (and a mission to enter, if one began). */
export function handleDutyRequest(u: Universe, s0: WorldState, req: NonNullable<WorldState['uiRequest']>): DutyOutcome {
  let s = withDuty(u, s0);
  const done = (o: DutyOutcome): DutyOutcome => ({ ...o, state: withDuty(u, o.state) });
  switch (req.kind) {
    case 'respond':
      return done(respond(u, s, req.id ?? s.duty?.incoming?.offerId ?? '', req.response ?? 'accept'));
    case 'patrol': {
      const r: Report[] = [];
      const waiting = s.duty?.incoming;
      if (waiting?.classification === 'directive') return done({ state: say2(s, [say('xo', 'respondPendingDirective')]) });
      if (waiting) {
        // Carrying on past a call is an answer: the hauler is logged as ignored, the request as declined (both free).
        const o = respond(u, s, waiting.offerId, 'ignore');
        s = withDuty(u, o.state);
      }
      const res = u.patrol(req.hours ?? 6);
      if (!res.ok) return done({ state: say2(s, [say('xo', res.reason === 'no-credits-paused' ? 'dutyPatrolPaused' : 'dutyPatrolTraining')]) });
      if (res.traffic) r.push(say('xo', 'dutyPatrolHours', { hours: res.hours }), ...trafficReports(u, res.traffic));
      else r.push(say('xo', 'dutyPatrolQuiet', { hours: res.hours }));
      return done({ state: say2(s, r) });
    }
    case 'course': {
      const e = u.exploration();
      if (!e) return done({ state: say2(s, [say('helm', 'dutyCourseTraining')]) });
      const id = resolvePlace(e as Exploration, req.response ?? '');
      if (!id) return done({ state: say2(s, [say('helm', 'courseUnknown', { name: req.response ?? '' })]) });
      const name = placeName(e as Exploration, id);
      const from = e.location;
      const res = u.setCourse(id);
      if (!res.ok) {
        const key = res.reason === 'here' ? 'courseHere' : res.reason === 'no-credits' ? 'courseNoCredits' : res.reason === 'no-credits-paused' ? 'dutyPatrolPaused' : 'courseUnknown';
        return done({ state: say2(s, [say(key === 'courseNoCredits' || key === 'dutyPatrolPaused' ? 'xo' : 'helm', key, { name })]) });
      }
      const after = u.exploration()!;
      const r: Report[] = [say('helm', 'courseSet', { name, ly: distanceLy(e as Exploration, from, id), hours: res.hours })];
      if (res.investigating && res.charged) r.push(say('xo', 'courseInvestigation'));
      r.push(say('helm', 'courseArrived', { name: id === STATION ? 'the Tessarine patrol station' : name }));
      const sys = id === STATION ? null : systemById(after as Exploration, id);
      if (sys?.civ && res.investigating) r.push(say('sensors', 'arrivalScience', { people: sys.civ.people, note: sys.note }));
      else if (sys) r.push(say('sensors', 'arrivalNothing', { name: sys.name, note: sys.contacted ? `We made contact here before: the ${sys.civ?.people}.` : sys.note }));
      r.push(...trafficReports(u, res.traffic));
      return done({ state: say2(s, r), flash: res.charged ? `Investigation under way: ${name}. 1 credit used.` : undefined });
    }
    case 'firstContact': {
      const res = u.recordFirstContact(req.id ?? '', (req.response as 'peaceful' | 'firm' | 'hostile') ?? 'peaceful');
      if (!res.ok) return done({ state: s });
      const text = u.canon()!.captain.career.at(-1)?.text ?? '';
      return done({ state: say2(s, [say('xo', 'contactRecorded', { text })]), flash: 'First contact recorded in canonical history.' });
    }
    default:
      return done({ state: s });
  }
}


/** Priority traffic waiting when the captain arrives on the Active Duty bridge (a Fleet directive). */
export function arriveOnBridge(u: Universe, s: WorldState): WorldState {
  s = withDuty(u, s);
  if (!s.duty?.live || s.duty.incoming) return s;
  const t = u.checkTraffic();
  return t ? withDuty(u, say2(s, trafficReports(u, t))) : s;
}
