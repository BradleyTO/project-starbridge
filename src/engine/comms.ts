/**
 * v0.5 comms sessions: channels (open / hold / muted, private), the conversation history,
 * the captain's declared intentions, promises and agreements, and the other party's
 * commitments. Generic engine code: what a character SAYS lives in the scenario's
 * DialogueProvider; what is binding (and how it is checked) lives here.
 */
import type { Party, PromiseKind } from './schema';
import type { Report } from './report';
import { say } from './report';
import type { CommsLine, CommsPromise, CommsState, NpcCommitment, WorldState } from './types';
import type { DialogueProvider } from './dialogue';
import type { Rng } from './rng';
import { range } from './rules';

export const HISTORY_MAX = 40;

/** Simulated seconds that comms activity costs (one consistent clock; see README time table). */
export const COMMS_SECONDS = { speak: 10, hail: 15, channelOp: 5, relay: 15, legacyMessage: 20 } as const;

export function emptyComms(): CommsState {
  return { channels: [], active: null, history: [], topic: null, declared: [], promises: [], commitments: [], pending: null, threats: {}, requests: {}, repeats: {}, suggestions: [], nextId: 1 };
}

export function commsOf(s: WorldState): CommsState {
  return s.comms ?? emptyComms();
}

function put(s: WorldState, c: CommsState): WorldState {
  return { ...s, comms: c };
}

export function channelOf(s: WorldState, party: Party) {
  return commsOf(s).channels.find((c) => c.party === party) ?? null;
}

/** The open (not held) channel, if any. */
export function openChannel(s: WorldState) {
  const c = commsOf(s);
  return c.active ? (c.channels.find((x) => x.party === c.active && x.state !== 'hold') ?? null) : null;
}

/** Open (or switch to) a channel. Any other open channel goes on hold: one conversation at a time. */
export function openChannelTo(s: WorldState, party: Party, opts: { private?: boolean; incoming?: boolean } = {}): WorldState {
  const c = commsOf(s);
  const channels = c.channels.map((x) => (x.party !== party && x.state !== 'hold' ? { ...x, state: 'hold' as const } : x));
  const existing = channels.find((x) => x.party === party);
  const next = existing
    ? channels.map((x) => (x.party === party ? { ...x, state: 'open' as const, private: opts.private ?? x.private } : x))
    : [...channels, { party, state: 'open' as const, private: !!opts.private, openedAt: s.time, incoming: !!opts.incoming }];
  return put(s, { ...c, channels: next, active: party, suggestions: [] });
}

export function closeChannel(s: WorldState, party: Party): WorldState {
  const c = commsOf(s);
  const channels = c.channels.filter((x) => x.party !== party);
  // The most recent held channel does not reopen by itself; the captain resumes it.
  return put(s, { ...c, channels, active: c.active === party ? null : c.active, pending: c.pending?.party === party ? null : c.pending, suggestions: [] });
}

export function setChannelState(s: WorldState, party: Party, state: 'open' | 'hold' | 'muted'): WorldState {
  if (state === 'open') return openChannelTo(s, party);
  const c = commsOf(s);
  return put(s, { ...c, channels: c.channels.map((x) => (x.party === party ? { ...x, state } : x)), active: state === 'hold' && c.active === party ? null : c.active });
}

export function recordLine(s: WorldState, line: Omit<CommsLine, 'time' | 'turn'>): WorldState {
  const c = commsOf(s);
  const history = [...c.history, { ...line, time: s.time, turn: s.turn }].slice(-HISTORY_MAX);
  return put(s, { ...c, history });
}

export function patchComms(s: WorldState, patch: Partial<CommsState> | ((c: CommsState) => Partial<CommsState>)): WorldState {
  const c = commsOf(s);
  return put(s, { ...c, ...(typeof patch === 'function' ? patch(c) : patch) });
}

/** Count a (party:intent) use and return how many times it had been used before. */
export function bumpRepeat(s: WorldState, key: string): { state: WorldState; before: number } {
  const c = commsOf(s);
  const before = c.repeats[key] ?? 0;
  return { state: put(s, { ...c, repeats: { ...c.repeats, [key]: before + 1 } }), before };
}

export function declare(s: WorldState, what: string): WorldState {
  const c = commsOf(s);
  return c.declared.includes(what) ? s : put(s, { ...c, declared: [...c.declared, what] });
}

/** Record a promise (replacing an active one of the same kind to the same party). */
export function promise(s: WorldState, party: Party, kind: PromiseKind, untilTurn: number | null = null): { state: WorldState; promise: CommsPromise; fresh: boolean } {
  const c = commsOf(s);
  const prior = c.promises.find((p) => p.party === party && p.kind === kind && p.status === 'active');
  if (prior) return { state: s, promise: prior, fresh: false };
  const ref = kind === 'protect' ? s.ships.kestrel.hull : 0;
  const p: CommsPromise = { id: c.nextId, party, kind, madeTurn: s.turn, status: 'active', untilTurn, ref };
  return { state: put(s, { ...c, promises: [...c.promises, p], nextId: c.nextId + 1 }), promise: p, fresh: true };
}

export function activePromise(s: WorldState, party: Party, kind: PromiseKind): CommsPromise | null {
  return commsOf(s).promises.find((p) => p.party === party && p.kind === kind && p.status === 'active') ?? null;
}

export function commit(s: WorldState, x: NpcCommitment): WorldState {
  const c = commsOf(s);
  return put(s, { ...c, commitments: [...c.commitments.filter((y) => !(y.party === x.party && y.kind === x.kind)), x] });
}

export function commitment(s: WorldState, party: Party, kind: NpcCommitment['kind']): NpcCommitment | null {
  const x = commsOf(s).commitments.find((y) => y.party === party && y.kind === kind);
  if (!x) return null;
  return x.untilTurn === null || s.turn < x.untilTurn ? x : null;
}

/** Is a promise being broken right now? (Generic, checkable conditions on world state.) */
export function promiseBroken(s: WorldState, p: CommsPromise): boolean {
  const h = s.ships.halcyon;
  switch (p.kind) {
    case 'weaponsDown':
      // Firing always breaks it. Armed weapons are allowed until the compliance deadline
      // (untilTurn, set when the promise was made with weapons armed); after that, or once
      // they have been made safe (deadline cleared), arming breaks it.
      if ((s.counters.playerFiredTurn ?? -99) > p.madeTurn) return true;
      if (h.weapons.state === 'safe') return false;
      return p.untilTurn === null || s.turn >= p.untilTurn;
    case 'shieldsDown':
      return h.shields.raised;
    case 'stay':
      return !!s.flags.jumped;
    case 'protect':
      return !s.ships.kestrel.destroyed ? s.ships.kestrel.hull < p.ref : true;
    case 'noInterfere':
      return (s.counters.playerFiredTurn ?? -99) > p.madeTurn;
    case 'withdraw':
      return p.untilTurn !== null && s.turn >= p.untilTurn && range(s, 'halcyon', 'kestrel') < 30000;
  }
}

/** Check every active promise; broken ones are marked and the provider reacts in character. */
export function checkPromises(s: WorldState, provider: DialogueProvider | undefined): { state: WorldState; reports: Report[] } {
  const reports: Report[] = [];
  for (const p of commsOf(s).promises) {
    if (p.status !== 'active') continue;
    if (p.kind === 'withdraw' && p.untilTurn !== null && s.turn >= p.untilTurn && !promiseBroken(s, p)) {
      s = patchComms(s, (c) => ({ promises: c.promises.map((x) => (x.id === p.id ? { ...x, status: 'kept' as const } : x)) }));
      continue;
    }
    if (!promiseBroken(s, p)) {
      // Weapons made safe within the window: compliance achieved, the window closes.
      if (p.kind === 'weaponsDown' && p.untilTurn !== null && s.ships.halcyon.weapons.state === 'safe') s = patchComms(s, (c) => ({ promises: c.promises.map((x) => (x.id === p.id ? { ...x, untilTurn: null } : x)) }));
      continue;
    }
    s = patchComms(s, (c) => ({ promises: c.promises.map((x) => (x.id === p.id ? { ...x, status: 'broken' as const } : x)) }));
    reports.push(say('xo', 'promiseBroken', { kind: p.kind, party: p.party }));
    if (provider) {
      const r = provider.onPromiseBroken(s, { ...p, status: 'broken' });
      s = r.state;
      reports.push(...r.reports);
    }
  }
  if (provider?.tick) {
    const t = provider.tick(s);
    s = t.state;
    reports.push(...t.reports);
  }
  return { state: s, reports };
}

/** For UI / tests: the channel indicator. */
export function channelView(s: WorldState, provider: DialogueProvider | undefined) {
  const c = commsOf(s);
  const shown = openChannel(s) ?? c.channels.find((x) => x.state === 'hold') ?? null;
  if (!shown) return null;
  return {
    party: shown.party,
    state: shown.state,
    private: shown.private,
    speaker: provider?.speakerName(s, shown.party) ?? shown.party,
    vessel: provider?.vesselName(s, shown.party) ?? shown.party,
    held: c.channels.filter((x) => x.state === 'hold' && x.party !== shown.party).map((x) => provider?.vesselName(s, x.party) ?? x.party),
  };
}

export type { Rng };
