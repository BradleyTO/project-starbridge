/**
 * Pure functions over CanonicalState. They are meant to run INSIDE
 * CanonStore.commit(ctx, draft => …): they receive a mutable draft copy and
 * return the next state. Nothing here touches storage.
 */
import type { ScenarioModule } from '../engine/scenario';
import type { WorldState } from '../engine/types';
import { clone, deepFreeze, type DeepReadonly } from './freeze';
import type { CanonicalSession } from './sessions';
import { stamp, withFamiliarity } from './sessions';
import type { CanonicalMissionRecord, CanonicalState, MissionKind, ModelParams, OfferClass, Provenance, WorldEvent } from './types';
import { UNIVERSE_SCHEMA_VERSION } from './types';

export const CONTENT_VERSION = 'reach-1';

export function provenance(appVersion: string, source: Provenance['source'] = 'engine'): Provenance {
  return { source, appVersion, contentVersion: CONTENT_VERSION };
}

export function newCanon(opts: { profileId: string; seed: number; appVersion: string; captain?: string }): CanonicalState {
  return {
    schema: 'starbridge.canon',
    version: UNIVERSE_SCHEMA_VERSION,
    profileId: opts.profileId,
    revision: 0,
    seed: opts.seed,
    clock: 8 * 60, // 08:00 on day 1
    nextSeq: 1,
    captain: { name: opts.captain ?? 'Captain', career: [] },
    ship: { hull: 100, updatedAt: 8 * 60 },
    factions: { concord: { standing: 50 }, directorate: { standing: 20 }, independent: { standing: 40 } },
    tension: 20,
    offers: [],
    missions: {},
    events: [],
    crew: {},
    discipline: [],
    news: [],
    provenance: provenance(opts.appVersion, 'player'),
  };
}

export function nextId(c: CanonicalState, prefix: string): string {
  const id = `${prefix}-${String(c.nextSeq).padStart(4, '0')}`;
  c.nextSeq += 1;
  return id;
}

export function addEvent(c: CanonicalState, e: Omit<WorldEvent, 'id' | 'at' | 'updatedAt' | 'provenance'> & { at?: number }, appVersion: string): WorldEvent {
  const ev: WorldEvent = { ...e, id: nextId(c, 'EV'), at: e.at ?? c.clock, updatedAt: e.at ?? c.clock, provenance: provenance(appVersion) };
  c.events.push(ev);
  return ev;
}

export function getEvent(c: CanonicalState | DeepReadonly<CanonicalState>, id: string): WorldEvent | undefined {
  return (c.events as WorldEvent[]).find((e) => e.id === id);
}

export function updateEvent(c: CanonicalState, id: string, patch: Partial<Pick<WorldEvent, 'status' | 'summary'>> & { decision?: string; consequence?: string; link?: string }): void {
  const e = c.events.find((x) => x.id === id);
  if (!e) return;
  if (patch.status) e.status = patch.status;
  if (patch.summary) e.summary = patch.summary;
  if (patch.decision) e.decisions.push(patch.decision);
  if (patch.consequence) e.consequences.push(patch.consequence);
  if (patch.link && !e.links.includes(patch.link)) e.links.push(patch.link);
  e.updatedAt = c.clock;
}

export function addCareer(c: CanonicalState, text: string, missionId: string | null = null, eventId: string | null = null): void {
  c.captain.career.push({ id: nextId(c, 'CR'), at: c.clock, missionId, eventId, text });
}

export interface BeginBridge {
  offerId: string;
  title: string;
  classification: OfferClass;
  scenario: ScenarioModule;
  scenarioVersion: string;
  seed: number;
  startedAtIso: string;
  appVersion: string;
  eventId: string;
  /** Applied to the freshly created scenario (canonical crew, ship condition, bulletins). */
  prepare?: (s: WorldState) => WorldState;
}

/** Start a canonical bridge mission: capture its initial conditions as a frozen snapshot. */
export function beginBridgeMission(c: CanonicalState, b: BeginBridge): { canon: CanonicalState; missionId: string } {
  const missionId = nextId(c, 'MSN');
  let initial = stamp(b.scenario.create(b.seed), 'canonical', { missionId, archiveId: missionId });
  if (b.prepare) initial = b.prepare(initial);
  const record: CanonicalMissionRecord = {
    id: missionId,
    offerId: b.offerId,
    title: b.title,
    classification: b.classification,
    mission: { kind: 'bridge', scenarioId: b.scenario.id },
    startedAt: c.clock,
    startedAtIso: b.startedAtIso,
    status: 'active',
    snapshot: { id: nextId(c, 'SNP'), missionId, scenarioId: b.scenario.id, scenarioVersion: b.scenarioVersion, seed: b.seed, capturedAt: c.clock, initial: clone(initial), eventParams: null },
    progress: null,
    outcome: null,
    decisions: [],
    eventId: b.eventId,
    provenance: provenance(b.appVersion, 'catalogue'),
  };
  c.missions[missionId] = record;
  return { canon: c, missionId };
}

/** Event-model missions (resolved by a deterministic model rather than played on the bridge). */
export function beginEventMission(c: CanonicalState, b: { offerId: string; title: string; classification: OfferClass; model: string; seed: number; params: ModelParams; startedAtIso: string; appVersion: string; eventId: string }): string {
  const missionId = nextId(c, 'MSN');
  const mission: MissionKind = { kind: 'event', model: b.model };
  c.missions[missionId] = {
    id: missionId,
    offerId: b.offerId,
    title: b.title,
    classification: b.classification,
    mission,
    startedAt: c.clock,
    startedAtIso: b.startedAtIso,
    status: 'active',
    snapshot: { id: nextId(c, 'SNP'), missionId, scenarioId: b.model, scenarioVersion: CONTENT_VERSION, seed: b.seed, capturedAt: c.clock, initial: null, eventParams: { ...b.params } },
    progress: null,
    outcome: null,
    decisions: [],
    eventId: b.eventId,
    provenance: provenance(b.appVersion, 'catalogue'),
  };
  return missionId;
}

/** The canonical session for an active bridge mission (resume from progress, or from the start). */
export function canonicalSession(c: DeepReadonly<CanonicalState>, missionId: string, drilled: Record<string, number> = {}): CanonicalSession {
  const m = c.missions[missionId];
  if (!m || m.mission.kind !== 'bridge') throw new Error(`No canonical bridge mission ${missionId}`);
  const base = clone((m.progress ?? m.snapshot.initial) as WorldState);
  const state = m.progress ? base : withFamiliarity(base, drilled);
  return { timeline: 'canonical', scenarioId: m.mission.scenarioId, state, archiveId: missionId, missionId };
}

/** Save progress of an active canonical mission (free; costs no credit). */
export function recordProgress(c: CanonicalState, session: CanonicalSession): CanonicalState {
  const m = c.missions[session.missionId];
  if (!m || m.status !== 'active') throw new Error('Mission is not active.');
  if (session.state.provenance.timeline !== 'canonical' || session.state.provenance.missionId !== session.missionId) throw new Error('Session state does not belong to this mission.');
  m.progress = clone(session.state);
  return c;
}

/** Concise list of what the captain did (captain log lines), for the record. */
export function decisionsOf(s: WorldState, max = 12): string[] {
  return s.log.filter((e) => e.channel === 'captain').slice(-max).map((e) => e.text);
}

export function freezeCanon(c: CanonicalState): DeepReadonly<CanonicalState> {
  return deepFreeze(clone(c));
}

export interface CompletionHooks {
  /** Extra canonical consequences (crew experience, faction shifts…) applied in the same commit. */
  after?: (c: CanonicalState, record: CanonicalMissionRecord, final: WorldState) => void;
}

/** Record a finished canonical bridge mission. Only a CanonicalSession can be passed here. */
export function completeBridgeMission(c: CanonicalState, session: CanonicalSession, hooks: CompletionHooks = {}): CanonicalState {
  const m = c.missions[session.missionId];
  const s = session.state;
  if (!m || m.status !== 'active') throw new Error('Mission is not active.');
  if (s.provenance.timeline !== 'canonical' || s.provenance.missionId !== m.id) throw new Error('Session state does not belong to this mission.');
  if (!s.outcome) throw new Error('Mission has not ended.');
  // Mission time (one minute per turn) plus an hour to stand down and report.
  c.clock += s.turn + 60;
  m.status = 'completed';
  m.progress = clone(s);
  m.outcome = { ...s.outcome, turn: s.turn, endedAt: c.clock };
  m.decisions = decisionsOf(s);
  updateEvent(c, m.eventId, { status: 'resolved', consequence: `${s.outcome.title}: ${s.outcome.summary}`, decision: `Captain carried out the mission (${m.decisions.length} orders logged).` });
  addCareer(c, `${m.title}: ${s.outcome.title}.`, m.id, m.eventId);
  hooks.after?.(c, m, s);
  return c;
}
