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
      d.commission = { at: d.clock, atIso, ship: 'CSV Halcyon', by: 'Admiral Odessa Kaine, Concord Fleet Command' };
      d.captain.career.push({ id: `career-commission`, at: d.clock, missionId: null, eventId: null, text: 'Commissioned to active duty in command of the CSV Halcyon, Tessarine border survey.' });
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
