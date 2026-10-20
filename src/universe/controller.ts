/**
 * Universe: the application service the UI (and integration tests) drive.
 * It owns no game rules; it routes sessions to the right store and enforces
 * the product rules (entitlements, credits) around the canonical commit gate.
 */
import type { ScenarioModule } from '../engine/scenario';
import type { TurnResult } from '../engine/turn';
import type { Timeline, WorldState } from '../engine/types';
import { buildArchive, TRAINING, type ArchiveEntry } from './archive';
import { clone, type DeepReadonly } from './freeze';
import { EVENT_CHOICES, simulateEvent } from './models';
import type { UniverseRepository } from './repository';
import { replaySnapshot, replayVariation, startTraining, type SimulationSession } from './sessions';
import type { CanonicalState, CreditLedger, Entitlements, FamiliarityMemory, MissionOffer, ResetPolicy, SimRunRecord } from './types';
import { learnFromCommand, recordSimulationEnd } from './familiarity';
import { openCanonicalContext, type CanonicalContext } from './gate';
import { beginBridgeMission, beginEventMission, canonicalSession, completeBridgeMission, newCanon, recordProgress, updateEvent } from './canon';
import type { CanonicalSession } from './sessions';
import { replenish, seedBoard } from './catalogue';
import { charge, configure, msUntilReset, refresh, remaining, resetNow } from './credits';
import * as world from './world';
import * as explore from './exploration';
import { markDelivered, pickTraffic, type Traffic } from './delivery';
import type { Exploration } from './types';

export type PatrolResult = { ok: true; hours: number; traffic: Traffic | null } | { ok: false; reason: 'no-credits-paused' | 'not-entitled' };
export type CourseResult =
  | { ok: true; to: string; hours: number; charged: boolean; investigating: boolean; traffic: Traffic | null }
  | { ok: false; reason: 'not-entitled' | 'no-credits' | 'no-credits-paused' | 'unknown' | 'here' | 'contacted' };

export type StartResult = { ok: true; session: CanonicalSession | null; missionId: string; charged: boolean } | { ok: false; reason: 'not-entitled' | 'no-credits' | 'not-open' | 'unknown' };
export type OfferResponse = 'decline' | 'ignore' | 'question' | 'refuse' | 'disobey';

export interface UniverseOptions {
  repo: UniverseRepository;
  appVersion: string;
  scenarios: Record<string, ScenarioModule>;
  now?: () => Date;
}

export class Universe {
  readonly repo: UniverseRepository;
  readonly appVersion: string;
  readonly scenarios: Record<string, ScenarioModule>;
  readonly now: () => Date;

  constructor(o: UniverseOptions) {
    this.repo = o.repo;
    this.appVersion = o.appVersion;
    this.scenarios = o.scenarios;
    this.now = o.now ?? (() => new Date());
  }

  canon(): DeepReadonly<CanonicalState> | null {
    return this.repo.canon.read();
  }
  familiarity(): FamiliarityMemory {
    return this.repo.familiarity.read();
  }
  archive(): ArchiveEntry[] {
    return buildArchive(this.canon(), this.repo.sims.read());
  }

  private scenario(id: string): ScenarioModule {
    const s = this.scenarios[id];
    if (!s) throw new Error(`Unknown scenario ${id}`);
    return s;
  }

  private newRun(archiveId: string, seed: number, conditions: SimRunRecord['conditions']): string {
    let id = '';
    this.repo.sims.update((v) => {
      id = `SIM-${String(v.nextSeq).padStart(4, '0')}`;
      return { ...v, nextSeq: v.nextSeq + 1, runs: [...v.runs, { id, archiveId, startedAtIso: this.now().toISOString(), seed, conditions, outcome: null }].slice(-200) };
    });
    return id;
  }

  // ------------------------------------------------------------ simulation --

  startTraining(trainingId: string, seed: number | string): SimulationSession {
    const t = TRAINING.find((x) => x.id === trainingId);
    if (!t) throw new Error(`Unknown training mission ${trainingId}`);
    const sc = this.scenario(t.scenarioId);
    const probe = sc.create(seed);
    const runId = this.newRun(trainingId, probe.seed, 'training');
    return startTraining(sc, seed, runId, trainingId, this.familiarity().training.drilled);
  }

  /** Replay a canonical mission's exact original conditions as a simulation. */
  replayOriginal(missionId: string): SimulationSession {
    const m = this.canon()?.missions[missionId];
    if (!m) throw new Error(`No canonical mission ${missionId}`);
    if (m.mission.kind !== 'bridge') throw new Error('Event missions replay through the event model.');
    const runId = this.newRun(missionId, m.snapshot.seed, 'original');
    return replaySnapshot(m.snapshot, runId, this.familiarity().training.drilled);
  }

  /** A new randomised variation of an archived mission (training or canonical). */
  replayVariation(archiveId: string, seed: number): SimulationSession {
    const m = this.canon()?.missions[archiveId];
    const t = TRAINING.find((x) => x.id === archiveId);
    const scenarioId = m ? (m.mission.kind === 'bridge' ? m.mission.scenarioId : null) : t?.scenarioId;
    if (!scenarioId) throw new Error(`Cannot vary ${archiveId}`);
    const runId = this.newRun(archiveId, seed, 'variation');
    return replayVariation(this.scenario(scenarioId), archiveId, seed, runId, this.familiarity().training.drilled);
  }

  /**
   * Replay an archived EVENT mission in the simulator with a different choice.
   * Uses a clone of the original parameters; the result goes to simulation history only.
   */
  simulateEventMission(missionId: string, choice: string): SimRunRecord {
    const m = this.canon()?.missions[missionId];
    if (!m || m.mission.kind !== 'event' || !m.snapshot.eventParams) throw new Error(`No archived event mission ${missionId}`);
    const st = simulateEvent(m.mission.model, clone(m.snapshot.eventParams), choice);
    const label = EVENT_CHOICES[m.mission.model]?.find((c) => c.id === choice)?.label ?? choice;
    const runId = this.newRun(missionId, m.snapshot.seed, 'original');
    const outcome = { id: st.kind, title: `${label}: ${st.kind.replace('-', ' ')}`, summary: st.text, success: st.kind === 'rescued-halcyon' || st.kind === 'rescued-other' || st.kind === 'self-repaired', turn: 0 };
    let run: SimRunRecord | undefined;
    this.repo.sims.update((v) => ({ ...v, runs: v.runs.map((r) => (r.id === runId ? (run = { ...r, outcome }) : r)) }));
    this.repo.familiarity.update((f) => ({ ...f, training: { ...f.training, simRuns: f.training.simRuns + 1, outcomes: { ...f.training.outcomes, [st.kind]: (f.training.outcomes[st.kind] ?? 0) + 1 } } }));
    return run!;
  }

  // ---------------------------------------------------------- entitlements --

  /** Entitlements, migrated: v0.4 stored the Active Duty flag as `livingUniverse`. */
  entitlements(): Entitlements {
    const e = this.repo.entitlements.read();
    const activeDuty = e.activeDuty ?? e.livingUniverse ?? false;
    return { ...e, activeDuty, livingUniverse: activeDuty };
  }
  /** Local development toggle standing in for the Active Duty subscription. Turning it off never touches the career. */
  setActiveDuty(on: boolean): Entitlements {
    this.repo.entitlements.update((e) => {
      const { livingUniverse: _legacy, ...rest } = e;
      void _legacy;
      return { ...rest, activeDuty: on, source: 'dev-toggle' };
    });
    return this.entitlements();
  }
  /** @deprecated v0.4 name for setActiveDuty. */
  setLivingUniverse(on: boolean): Entitlements {
    return this.setActiveDuty(on);
  }

  /**
   * Duty status:
   *   simulation — never commissioned, no subscription (Simulation Mode)
   *   pending    — subscribed, commission not yet accepted (Fleet Command is waiting)
   *   active     — on active duty; the canonical timeline runs
   *   reserve    — subscription inactive; career preserved, canonical timeline frozen (never misconduct)
   */
  dutyStatus(): 'simulation' | 'pending' | 'active' | 'reserve' {
    const on = this.entitlements().activeDuty;
    const c = this.canon();
    if (on) return c ? 'active' : 'pending';
    return c ? 'reserve' : 'simulation';
  }

  /** Accept the commission (first activation): the canonical career begins. */
  acceptCommission(): DeepReadonly<CanonicalState> | null {
    if (!this.entitlements().activeDuty) return null;
    const c = this.ensureCanon();
    if (!c) return null;
    if (c.commission) return c;
    const atIso = this.now().toISOString();
    return this.repo.canon.commit(this.ctx(), (d) => {
      d.commission = { at: d.clock, atIso, ship: 'ISV Halcyon', by: 'Admiral Odessa Kaine, ISA Fleet Command' };
      d.captain.career.push({ id: `career-commission`, at: d.clock, missionId: null, eventId: null, text: 'Commissioned to active duty in command of the ISV Halcyon, Tessarine border survey.' });
      return d;
    });
  }

  // --------------------------------------------------------------- credits --

  credits(): CreditLedger {
    const l = refresh(this.repo.credits.read(), this.now());
    return l;
  }
  creditsRemaining(): number {
    return remaining(this.repo.credits.read(), this.now());
  }
  msUntilCreditReset(): number {
    return msUntilReset(this.repo.credits.read(), this.now());
  }
  configureCredits(opts: { dailyLimit?: number; policy?: ResetPolicy }): CreditLedger {
    return this.repo.credits.update((l) => configure(l, opts, this.now()));
  }
  resetCreditsNow(): CreditLedger {
    return this.repo.credits.update((l) => resetNow(l, this.now()));
  }

  // ------------------------------------------------------------- canonical --

  private ctx(): CanonicalContext {
    return openCanonicalContext(this.entitlements());
  }

  /** Create the canonical profile on first entry to Active Duty. */
  ensureCanon(): DeepReadonly<CanonicalState> | null {
    if (!this.entitlements().activeDuty) return null;
    const cur = this.canon();
    if (cur) return cur;
    const seed = Math.floor((this.now().getTime() / 1000) % 1_000_000);
    const profileId = `local-${seed.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
    return this.repo.canon.initialise(this.ctx(), seedBoard(newCanon({ profileId, seed, appVersion: this.appVersion }), this.appVersion));
  }

  offers(): readonly DeepReadonly<MissionOffer>[] {
    return this.canon()?.offers ?? [];
  }

  /** Start a NEW canonical mission from an offer. The only thing that costs a credit. */
  startCanonical(offerId: string): StartResult {
    if (!this.entitlements().activeDuty) return { ok: false, reason: 'not-entitled' };
    const c = this.ensureCanon();
    const offer = c?.offers.find((o) => o.id === offerId);
    if (!c || !offer) return { ok: false, reason: 'unknown' };
    if (offer.status !== 'open' && offer.status !== 'questioned') return { ok: false, reason: 'not-open' };
    const charged = charge(this.repo.credits.read(), `offer:${offerId}`, this.now());
    if (!charged.ok) {
      this.repo.credits.write(charged.ledger);
      return { ok: false, reason: 'no-credits' };
    }
    let missionId = '';
    const iso = this.now().toISOString();
    const next = this.repo.canon.commit(this.ctx(), (d) => {
      const o = d.offers.find((x) => x.id === offerId)!;
      o.status = 'accepted';
      o.responses.push({ at: d.clock, response: o.classification === 'distress' ? 'responded' : 'accepted' });
      updateEvent(d, o.eventId, { status: 'active', decision: o.classification === 'distress' ? 'Halcyon responded to the call.' : 'Captain accepted the assignment.' });
      if (o.mission.kind === 'bridge') {
        const sc = this.scenario(o.mission.scenarioId);
        missionId = beginBridgeMission(d, { offerId, title: o.missionTitle, classification: o.classification, scenario: sc, scenarioVersion: world.scenarioVersion(sc), seed: o.seed, startedAtIso: iso, appVersion: this.appVersion, eventId: o.eventId, prepare: (s) => world.prepareBridge(d, s) }).missionId;
      } else {
        missionId = beginEventMission(d, { offerId, title: o.missionTitle, classification: o.classification, model: o.mission.model, seed: o.seed, params: world.eventParams(d, o), startedAtIso: iso, appVersion: this.appVersion, eventId: o.eventId });
        world.resolveEventMission(d, missionId, this.appVersion);
      }
      d.missions[missionId].decisions.push(`${o.classification === 'distress' ? 'Responded to' : 'Accepted'}: ${o.title}`);
      replenish(d, this.appVersion);
      return d;
    });
    // The credit is recorded only once the canonical commit has succeeded.
    this.repo.credits.write(charged.ledger);
    const m = next.missions[missionId];
    return { ok: true, missionId, charged: charged.charged, session: m.mission.kind === 'bridge' ? canonicalSession(next, missionId, this.familiarity().training.drilled) : null };
  }

  /** Decline / ignore / question / refuse / disobey: always free. */
  respond(offerId: string, response: OfferResponse, reason = ''): DeepReadonly<CanonicalState> {
    const c = this.ensureCanon();
    if (!c) throw new Error('Active Duty is not enabled (reserve status: the canonical timeline is frozen).');
    return this.repo.canon.commit(this.ctx(), (d) => {
      world.respondToOffer(d, offerId, response, reason, this.appVersion);
      replenish(d, this.appVersion);
      return d;
    });
  }

  /** Resume an active canonical bridge mission from its last committed progress (free). */
  resumeCanonical(missionId: string): CanonicalSession {
    const c = this.canon();
    if (!c) throw new Error('No canonical profile.');
    return canonicalSession(c, missionId, this.familiarity().training.drilled);
  }

  /** Save canonical progress (free). Accepts only canonical sessions. */
  saveCanonical(session: CanonicalSession): void {
    this.repo.canon.commit(this.ctx(), (d) => recordProgress(d, session));
  }

  /** File a finished canonical mission and let the world move on by the mission's duration. */
  finishCanonical(session: CanonicalSession): DeepReadonly<CanonicalState> {
    return this.repo.canon.commit(this.ctx(), (d) => {
      if (d.missions[session.missionId]?.status === 'completed') return d;
      const before = d.clock;
      completeBridgeMission(d, session, { after: (cc, record, final) => world.afterBridgeMission(cc, record, final, this.appVersion) });
      world.advanceWorld(d, d.clock - before, this.appVersion, { from: before });
      replenish(d, this.appVersion);
      return d;
    });
  }

  /** "Continue patrol": let canonical time pass (free). Paused while the daily allowance is spent. */
  advanceTime(hours: number): { ok: true } | { ok: false; reason: 'no-credits-paused' | 'not-entitled' } {
    if (!this.ensureCanon()) return { ok: false, reason: 'not-entitled' };
    if (this.creditsRemaining() <= 0) return { ok: false, reason: 'no-credits-paused' };
    this.repo.canon.commit(this.ctx(), (d) => {
      const from = d.clock;
      d.clock += Math.round(hours * 60);
      world.advanceWorld(d, d.clock - from, this.appVersion, { from });
      replenish(d, this.appVersion);
      return d;
    });
    return { ok: true };
  }

  // ------------------------------------------------------------ exploration --

  /** The long-range survey and the Halcyon's position (read-only; seeded view before first use). */
  exploration(): DeepReadonly<Exploration> | null {
    const c = this.canon();
    return c ? explore.explorationOf(c) : null;
  }

  /**
   * Hold the patrol for up to `hours` of canonical time. Each hour the world moves on; the patrol
   * stops early when something reaches the bridge (a hail, a distress call, a science reading).
   * Free; paused while the daily allowance is spent (as "continue patrol" always was).
   */
  patrol(hours: number): PatrolResult {
    if (!this.ensureCanon()) return { ok: false, reason: 'not-entitled' };
    if (this.creditsRemaining() <= 0) return { ok: false, reason: 'no-credits-paused' };
    let passed = 0;
    let traffic: Traffic | null = null;
    this.repo.canon.commit(this.ctx(), (d) => {
      const e = explore.ensureExploration(d);
      for (let h = 0; h < Math.max(1, Math.round(hours)); h++) {
        const from = d.clock;
        d.clock += 60;
        passed++;
        world.advanceWorld(d, 60, this.appVersion, { from });
        replenish(d, this.appVersion);
        traffic = pickTraffic(d);
        if (traffic) {
          this.deliver(d, e, traffic);
          break;
        }
      }
      return d;
    });
    return { ok: true, hours: passed, traffic };
  }

  /** Priority traffic waiting for the Halcyon right now (Fleet directives), without time passing. Free. */
  checkTraffic(): Traffic | null {
    const c = this.canon();
    if (!c || !this.entitlements().activeDuty) return null;
    const t = pickTraffic(clone(c) as CanonicalState, { priorityOnly: true });
    if (!t) return null;
    this.repo.canon.commit(this.ctx(), (d) => {
      this.deliver(d, explore.ensureExploration(d), t);
      return d;
    });
    return t;
  }

  private deliver(d: CanonicalState, e: Exploration, t: Traffic): void {
    markDelivered(d, e, t);
    if (t.kind === 'science') explore.detectCivilization(d, e, t.systemId, this.appVersion);
  }

  /**
   * "Helm, set a course for Veyra." Travel takes canonical time. A course to a civilization that
   * has not been contacted is an investigation: a new canonical start, charged once (credit rules unchanged).
   */
  setCourse(placeId: string): CourseResult {
    if (!this.ensureCanon()) return { ok: false, reason: 'not-entitled' };
    const e0 = explore.explorationOf(this.canon()!);
    const target = placeId === explore.STATION ? null : explore.systemById(e0 as Exploration, placeId);
    if (placeId !== explore.STATION && !target) return { ok: false, reason: 'unknown' };
    if (e0.location === placeId) return { ok: false, reason: 'here' };
    const investigating = !!(target?.civ && target.signal !== 'none' && !target.contacted);
    let charged = false;
    let ledger: CreditLedger | null = null;
    if (investigating) {
      const r = charge(this.repo.credits.read(), `investigate:${placeId}`, this.now());
      if (!r.ok) {
        this.repo.credits.write(r.ledger);
        return { ok: false, reason: 'no-credits' };
      }
      charged = r.charged;
      ledger = r.ledger;
    } else if (this.creditsRemaining() <= 0) return { ok: false, reason: 'no-credits-paused' };
    const hours = explore.travelHours(e0 as Exploration, e0.location, placeId);
    let traffic: Traffic | null = null;
    this.repo.canon.commit(this.ctx(), (d) => {
      const e = explore.ensureExploration(d);
      if (investigating && e.investigation?.systemId !== placeId) e.investigation = { systemId: placeId, startedAt: d.clock, arrivedAt: null };
      const from = d.clock;
      d.clock += hours * 60;
      world.advanceWorld(d, hours * 60, this.appVersion, { from });
      replenish(d, this.appVersion);
      explore.arrive(d, e, placeId, this.appVersion);
      if (investigating) d.captain.career.push({ id: `career-investigate-${placeId}-${d.nextSeq++}`, at: d.clock, missionId: null, eventId: null, text: `Investigated possible civilization signals at ${target!.name}.` });
      traffic = pickTraffic(d, { priorityOnly: true });
      if (traffic) this.deliver(d, e, traffic);
      return d;
    });
    if (ledger) this.repo.credits.write(ledger);
    return { ok: true, to: placeId, hours, charged, investigating, traffic };
  }

  /** First contact concluded on the bridge: record what it settled (once). */
  recordFirstContact(systemId: string, approach: explore.Approach): { ok: true; outcome: import('./types').ContactOutcome } | { ok: false; reason: 'not-entitled' | 'not-investigating' } {
    const c = this.canon();
    if (!c || !this.entitlements().activeDuty) return { ok: false, reason: 'not-entitled' };
    const e = explore.explorationOf(c);
    const sys = explore.systemById(e as Exploration, systemId);
    if (!sys?.civ || sys.contacted || e.investigation?.systemId !== systemId || e.investigation.arrivedAt === null) return { ok: false, reason: 'not-investigating' };
    let outcome: import('./types').ContactOutcome = 'wary-contact';
    this.repo.canon.commit(this.ctx(), (d) => {
      outcome = explore.recordContact(d, explore.ensureExploration(d), systemId, approach, this.appVersion);
      return d;
    });
    return { ok: true, outcome };
  }

  /** Learn from a command in any mode (terminology, comms preferences, sim drills). */
  noteCommand(timeline: Timeline, text: string, results: TurnResult['results']): FamiliarityMemory {
    return this.repo.familiarity.update((f) => learnFromCommand(f, timeline, text, results));
  }

  /** A simulation ended: store its outcome in simulation history and training stats only. */
  finishSimulation(session: SimulationSession, final: WorldState): void {
    if (!final.outcome) return;
    const outcome = { ...final.outcome, turn: final.turn };
    this.repo.sims.update((v) => ({ ...v, runs: v.runs.map((r) => (r.id === session.runId && !r.outcome ? { ...r, outcome } : r)) }));
    this.repo.familiarity.update((f) => recordSimulationEnd(f, final));
  }
}
