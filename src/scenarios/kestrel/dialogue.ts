/**
 * v0.5 offline DialogueProvider for The Kestrel Incident.
 *
 * Deterministic: replies depend on the line's classified intents, the session (what the other
 * side last asked, promises, repetition), the world (weapons, locks, range, reactor) and the
 * character (Vane's temperament, Arden's trust). Game effects reuse the v0.4 talk functions
 * (patience, trust, agreements, revelations); this layer adds conversational context.
 */
import type { DialogueProvider, SpeakAction } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { CommIntent, Party } from '../../engine/schema';
import type { CommsPromise, WorldState } from '../../engine/types';
import { activePromise, bumpRepeat, closeChannel, commit, commitment, commsOf, declare, openChannelTo, patchComms, promise, recordLine } from '../../engine/comms';
import { addTension, adjustTrust, knows, revealFact, setMemory } from '../../engine/state';
import { range } from '../../engine/rules';
import { talkToArden, talkToPassenger, talkToVane, turnsToBreach } from './hooks';

type Comm = Parameters<typeof talkToVane>[1];
const comm = (target: Party, intent: CommIntent, extra: Partial<Comm> = {}): Comm => ({ type: 'communicate', target, intent, onScreen: false, ...extra }) as Comm;

/** Keep the effects of a v0.4 talk function but replace its conversational line (agreements and revelations stay). */
const KEEP = /^(vaneAgreement_|vaneYields|vaneBluff|vaneLegalShaken|vaneAppealWavers|vaneInCombat|vaneHoldsAgreement|ardenReveals|ardenBetrayed|ardenDeflects|passenger)/;
function effectsOnly(a: Applied, character: string): Applied {
  return { state: a.state, reports: a.reports.filter((r) => !(r.channel === 'comms' && typeof r.speaker === 'object' && 'character' in r.speaker && r.speaker.character === character && !KEEP.test(r.key))) };
}
const spoke = (a: Applied, character: string) => a.reports.some((r) => r.channel === 'comms' && typeof r.speaker === 'object' && 'character' in r.speaker && r.speaker.character === character);

function line(s: WorldState, party: Party, key: string, vars: Record<string, string | number> = {}): { state: WorldState; report: Report } {
  const who = party === 'cruiser' ? 'vane' : party === 'kestrel' ? 'arden' : 'passenger';
  return { state: recordLine(s, { from: party, intents: [], text: key }), report: comms(who, key, vars) };
}

/** Pick a variant index that cycles with use, so the same situation is not answered with the same words. */
function variant(s: WorldState, key: string, n: number): { state: WorldState; v: number } {
  const b = bumpRepeat(s, `say:${key}`);
  return { state: b.state, v: b.before % n };
}

const PERSUADE = new Set(['humanitarian', 'declarePeaceful', 'legal', 'appeal', 'offerCooperation', 'promise', 'challenge', 'warn', 'bluff']);

// -------------------------------------------------------------------- Vane ---

function vaneGreet(s: WorldState, rng: Rng): Applied {
  const mem = s.characters.vane.memory;
  if (mem.agreement) return talkToVane(s, comm('cruiser', 'open'), rng);
  if (!mem.hailed) {
    const a = effectsOnly(talkToVane(s, comm('cruiser', 'open'), rng), 'vane');
    s = patchComms(a.state, { pending: { party: 'cruiser', kind: 'explain', turn: a.state.turn } });
    const l = line(s, 'cruiser', 'vaneGreetFirst');
    return { state: l.state, reports: [...a.reports, l.report] };
  }
  s = setMemory(s, 'vane', 'talks', (mem.talks ?? 0) + 1);
  const v = variant(s, 'vaneGreetAgain', 3);
  const l = line(v.state, 'cruiser', 'vaneGreetAgain', { v: v.v, locked: s.ships.cruiser.weapons.state === 'locked' ? 1 : 0 });
  return { state: l.state, reports: [l.report] };
}

function graceFor(s: WorldState, asked: number): number {
  const temp = s.variant.temperament;
  const vane = s.characters.vane;
  const patience = vane.memory.patience ?? 0;
  const armed = s.ships.halcyon.weapons.state !== 'safe';
  const kept = !!activePromise(s, 'cruiser', 'weaponsDown');
  let cap = temp === 'cautious' ? 12 : temp === 'pragmatic' ? 8 : 5;
  if (armed) cap = Math.floor(cap / 2);
  if (kept) cap += 2;
  if (patience < -2 || vane.trust < -30) cap = Math.min(cap, temp === 'cautious' ? 4 : 0);
  if (temp === 'hardliner' && (armed || vane.trust < 0)) cap = 0;
  return Math.max(0, Math.min(asked, cap));
}

function vaneRespond(s: WorldState, a: SpeakAction, rng: Rng): Applied {
  const r: Report[] = [];
  const temp = s.variant.temperament;
  const mem = s.characters.vane.memory;
  const I = new Set(a.intents);
  const c = commsOf(s);
  const pend = c.pending?.party === 'cruiser' ? c.pending : null;
  const add = (key: string, vars: Record<string, string | number> = {}) => {
    const l = line(s, 'cruiser', key, vars);
    s = l.state;
    r.push(l.report);
  };
  const legacy = (intent: CommIntent, extra: Partial<Comm> = {}, keepLine = true) => {
    const res = talkToVane(s, comm('cruiser', intent, extra), rng);
    const out = keepLine ? res : effectsOnly(res, 'vane');
    s = out.state;
    r.push(...out.reports);
    return spoke(out, 'vane');
  };
  const done = (): Applied => ({ state: s, reports: r });
  s = setMemory(s, 'vane', 'hailed', 1);

  if (mem.attacking) {
    legacy(a.offer === 'passenger' ? 'trade' : I.has('warn') || I.has('demand') ? 'warn' : 'ask', a.offer ? { offer: a.offer } : {});
    return done();
  }
  if (I.has('end')) {
    add('vaneEnd', { temp });
    return { state: closeChannel(s, 'cruiser'), reports: r };
  }
  if (mem.agreement && !(I.has('trade') && a.offer === 'passenger')) {
    if (I.has('ask') || I.has('unknown') || I.has('greet')) add('vaneAgreementReminder', { kind: mem.agreement });
    else legacy('open');
    return done();
  }

  // Repetition stops paying: the third time a persuasion line is used it costs patience instead.
  const lead = a.intents.find((i) => PERSUADE.has(i));
  if (lead) {
    const rep = bumpRepeat(s, `cruiser:${lead}`);
    s = rep.state;
    if (rep.before >= 2 && !pend && !a.minutes && !I.has('trade')) {
      const v = variant(s, 'vaneRepeatVar', 3);
      s = v.state;
      if (rep.before >= 3) s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) - 1);
      add('vaneRepeatVar', { v: v.v, n: rep.before });
      return done();
    }
  }

  const stays = a.promise === 'stay' || (I.has('refuse') && /\b(abandon|leave|withdraw|freighter|kestrel|back down|stand aside|retreat)\b/i.test(a.text));
  if (stays) s = declare(s, 'stay');
  if (I.has('declarePeaceful')) s = declare(s, 'peaceful');
  if (I.has('humanitarian')) s = declare(s, 'rescue');

  // 1. Answering what he asked.
  if (pend?.kind === 'explain' && (I.has('humanitarian') || I.has('declarePeaceful') || I.has('requestAssist') || I.has('offerCooperation') || I.has('legal'))) {
    legacy(I.has('humanitarian') ? 'humanitarian' : I.has('legal') ? 'legal' : 'reassure', {}, false);
    const armed = s.ships.halcyon.weapons.state !== 'safe';
    s = patchComms(s, { pending: { party: 'cruiser', kind: 'lowerWeapons', turn: s.turn } });
    add(armed ? 'vanePowerDownFirst' : 'vaneThenWeaponsDown', { temp });
    if (stays) add('vaneStay', { temp });
    return done();
  }
  if (pend?.kind === 'lowerWeapons' && (I.has('agree') || a.promise === 'weaponsDown')) {
    const armed = s.ships.halcyon.weapons.state !== 'safe';
    const p = promise(s, 'cruiser', 'weaponsDown', armed ? s.turn + 2 : null);
    s = p.state;
    if (p.fresh) {
      s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) + 1);
      s = adjustTrust(s, 'vane', 5);
      s = addTension(s, -3);
    }
    s = patchComms(s, { pending: null });
    add(stays ? 'vaneAgreedButStay' : 'vaneAgreedWeapons', { temp, armed: armed ? 1 : 0 });
    return done();
  }
  if (pend?.kind === 'lowerWeapons' && I.has('refuse') && !stays) {
    s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) - 2);
    s = addTension(s, 5);
    s = patchComms(s, { pending: null });
    add('vaneRefusedWeapons', { temp });
    return done();
  }
  if (pend?.kind === 'withdraw' && (I.has('agree') || a.promise === 'withdraw') && !stays) {
    s = promise(s, 'cruiser', 'withdraw', s.turn + 4).state;
    s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) + 2);
    s = patchComms(s, { pending: null });
    add('vaneWithdrawAccepted');
    return done();
  }

  // 2. Time: "We need ten minutes to evacuate the crew."
  if (a.minutes) {
    const prior = commitment(s, 'cruiser', 'grace');
    if (prior) {
      add('vaneGraceAlready', { left: Math.max(0, (prior.untilTurn ?? s.turn) - s.turn) });
      return done();
    }
    if (mem.graceAsked && !prior) {
      add('vaneGraceNoMore');
      return done();
    }
    s = setMemory(s, 'vane', 'graceAsked', 1);
    const g = graceFor(s, a.minutes);
    if (g > 0) {
      s = commit(s, { party: 'cruiser', kind: 'grace', untilTurn: s.turn + g, madeTurn: s.turn });
      s = addTension(s, -3);
      add('vaneGrantsTime', { asked: a.minutes, granted: g, temp });
    } else {
      s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) - 1);
      add('vaneRefusesTime', { asked: a.minutes, temp, armed: s.ships.halcyon.weapons.state !== 'safe' ? 1 : 0 });
    }
    return done();
  }

  // 3. Offers and the v0.4 diplomacy (agreements, bluffs, legal and personal appeals).
  if (I.has('trade')) {
    legacy('trade', { offer: a.offer ?? 'unspecified' });
    return done();
  }
  if (I.has('bluff')) {
    legacy('bluff');
    return done();
  }
  if (I.has('appeal')) {
    legacy('appeal');
    return done();
  }
  if (I.has('offerAsylum')) {
    legacy('offerAsylum');
    return done();
  }

  // 4. Demands of him.
  if (I.has('demand') && a.demand) {
    s = patchComms(s, (x) => ({ requests: { ...x.requests, cruiser: (x.requests.cruiser ?? 0) + 1 } }));
    const c2 = s.ships.cruiser;
    const patience = s.characters.vane.memory.patience ?? 0;
    if ((a.demand === 'releaseLock' || a.demand === 'lowerWeapons' || a.demand === 'holdFire') && c2.weapons.state === 'locked') {
      const yields = temp === 'cautious' || (temp === 'pragmatic' && patience >= 2 && s.ships.halcyon.weapons.state === 'safe');
      if (yields) {
        s = setMemory(s, 'vane', 'lockedOn', 0);
        s = { ...s, pending: s.pending.filter((e) => e.kind !== 'cruiserFire'), ships: { ...s.ships, cruiser: { ...c2, weapons: { state: 'armed', target: null } } } };
        s = commit(s, { party: 'cruiser', kind: 'releasedLock', untilTurn: s.turn + 3, madeTurn: s.turn });
        s = addTension(s, -5);
        add('vaneReleasesLock');
      } else {
        s = setMemory(s, 'vane', 'patience', patience - 1);
        add('vaneNoDemands', { temp });
      }
      return done();
    }
    if (a.demand === 'lowerWeapons' || a.demand === 'holdFire' || a.demand === 'standDown') {
      add('vaneWeaponsMyBusiness', { temp, armed: c2.weapons.state === 'safe' ? 0 : 1 });
      return done();
    }
    if (a.demand === 'withdraw' || a.demand === 'keepDistance') {
      if (temp !== 'hardliner') s = setMemory(s, 'vane', 'patience', patience - 1);
      else s = addTension(s, 5);
      add('vaneYouWithdraw', { temp });
      return done();
    }
    if (a.demand === 'explain') {
      s = revealFact(s, 'cruiser_intent');
      add('vaneExplains', { name: s.characters.passenger.name, known: knows(s, 'passenger_identity') ? 1 : 0 });
      return done();
    }
  }

  if (I.has('warn')) {
    s = patchComms(s, (x) => ({ threats: { ...x.threats, cruiser: (x.threats.cruiser ?? 0) + 1 } }));
    legacy('warn');
    return done();
  }

  // 5. Commitments the captain offers unprompted.
  if (a.promise && a.promise !== 'stay') {
    const p = promise(s, 'cruiser', a.promise, a.promise === 'withdraw' ? s.turn + 4 : null);
    s = p.state;
    if (p.fresh) s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) + 1);
    if (pend?.kind === 'lowerWeapons' && a.promise === 'weaponsDown') s = patchComms(s, { pending: null });
    add(p.fresh ? 'vanePromiseNoted' : 'vanePromiseAgain', { kind: a.promise });
    return done();
  }
  if (stays) {
    if (temp === 'hardliner') s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) - 1);
    if (temp !== 'hardliner' && !pend) s = patchComms(s, { pending: { party: 'cruiser', kind: 'lowerWeapons', turn: s.turn } });
    if (pend?.kind === 'withdraw') s = patchComms(s, { pending: temp === 'hardliner' ? null : { party: 'cruiser', kind: 'lowerWeapons', turn: s.turn } });
    add('vaneStay', { temp });
    return done();
  }

  // 6. Peaceful words, the law, questions, challenges.
  if (I.has('humanitarian') || I.has('declarePeaceful') || I.has('legal')) {
    const armed = s.ships.halcyon.weapons.state !== 'safe';
    if (I.has('declarePeaceful') && !I.has('humanitarian') && !I.has('legal') && armed) {
      legacy('reassure', {}, false);
      s = patchComms(s, { pending: { party: 'cruiser', kind: 'lowerWeapons', turn: s.turn } });
      add('vanePowerDownFirst', { temp });
      return done();
    }
    legacy(I.has('legal') ? 'legal' : I.has('humanitarian') ? 'humanitarian' : 'reassure');
    return done();
  }
  if (I.has('agree')) {
    add(pend ? 'vaneAgreeUnclear' : 'vaneAgreeNothing');
    return done();
  }
  if (I.has('refuse')) {
    add('vaneRefuseNothing', { temp });
    return done();
  }
  if (I.has('challenge')) {
    if (temp === 'hardliner') s = addTension(s, 3);
    s = adjustTrust(s, 'vane', temp === 'cautious' ? 0 : -3);
    const v = variant(s, 'vaneChallenged', 2);
    s = v.state;
    add('vaneChallenged', { temp, v: v.v, territory: /\b(space|territory|claim|yours|border)\b/i.test(a.text) ? 1 : 0 });
    return done();
  }
  if (I.has('ask')) {
    const topic = a.topic ?? 'general';
    if (topic === 'intentions' || topic === 'passenger' || topic === 'cargo') s = revealFact(s, 'cruiser_intent');
    const v = variant(s, `vaneAsk_${topic}`, 2);
    s = v.state;
    add(`vaneAsk_${topic}`, { temp, v: v.v, name: s.characters.passenger.name, known: knows(s, 'passenger_identity') ? 1 : 0, locked: s.ships.cruiser.weapons.state === 'locked' ? 1 : 0, reinf: Math.max(1, s.variant.reinforcementTurn - s.turn) });
    return done();
  }
  if (I.has('requestAssist') || I.has('offerCooperation')) {
    s = adjustTrust(s, 'vane', temp === 'hardliner' ? 0 : 3);
    add('vaneCooperation', { temp });
    return done();
  }
  if (I.has('greet')) {
    add('vaneGreetAgain', { v: 0, locked: s.ships.cruiser.weapons.state === 'locked' ? 1 : 0 });
    return done();
  }
  return unclear(s, 'cruiser', r);
}

/** Never silently ignore: ask what was meant, offer readings, and grow impatient with nonsense. */
function unclear(s: WorldState, party: Party, r: Report[]): Applied {
  const b = bumpRepeat(s, `${party}:unknown`);
  s = b.state;
  const who = party === 'cruiser' ? 'vane' : party === 'kestrel' ? 'arden' : 'passenger';
  if (party === 'cruiser' && b.before >= 2) s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) - 1);
  const suggestions =
    party === 'cruiser'
      ? ['We are here to rescue the Kestrel’s crew.', 'We need ten minutes to evacuate the crew.', 'Release your weapons lock, Prefect.', 'Close the channel.']
      : party === 'kestrel'
        ? ['How many people are aboard?', 'Get your people ready to beam over.', 'What’s in your shielded compartment?', 'Close the channel.']
        : ['Are you all right?', 'We are offering you asylum.', 'Close the channel.'];
  s = patchComms(s, { suggestions });
  const l = line(s, party, `${who}Unclear`, { v: b.before % 3, n: b.before });
  return { state: l.state, reports: [...r, l.report] };
}

// ------------------------------------------------------------------- Arden ---

function ardenRespond(s: WorldState, a: SpeakAction, _rng: Rng): Applied {
  const r: Report[] = [];
  const I = new Set(a.intents);
  const add = (key: string, vars: Record<string, string | number> = {}) => {
    const l = line(s, 'kestrel', key, vars);
    s = l.state;
    r.push(l.report);
  };
  const legacy = (intent: CommIntent, extra: Partial<Comm> = {}, keepLine = true) => {
    const res = talkToArden(s, comm('kestrel', intent, extra));
    const out = keepLine ? res : effectsOnly(res, 'arden');
    s = out.state;
    r.push(...out.reports);
  };
  const done = (): Applied => ({ state: s, reports: r });
  const k = s.ships.kestrel;
  if (!s.characters.arden.memory.hailed) s = setMemory(s, 'arden', 'hailed', 1);
  if (I.has('end')) {
    add('ardenEnd');
    return { state: closeChannel(s, 'kestrel'), reports: r };
  }
  if (I.has('trade') && a.offer === 'passenger') {
    legacy('trade', { offer: 'passenger' });
    return done();
  }
  if (I.has('offerAsylum')) {
    legacy('offerAsylum');
    return done();
  }
  if (a.promise === 'protect' || (I.has('promise') && /\b(cruiser|warship|them|protect|defend|off your back)\b/i.test(a.text))) {
    const p = promise(s, 'kestrel', 'protect');
    s = p.state;
    if (p.fresh) s = adjustTrust(s, 'arden', 10);
    add('ardenPromised', { fresh: p.fresh ? 1 : 0 });
    return done();
  }
  if (I.has('requestAssist') || (I.has('demand') && (a.demand === 'prepareEvacuation' || a.demand === 'standBy'))) {
    s = commit(s, { party: 'kestrel', kind: 'ready', untilTurn: null, madeTurn: s.turn });
    s = setMemory(s, 'arden', 'ready', 1);
    s = adjustTrust(s, 'arden', 5);
    add('ardenReady', { souls: k.souls, trapped: s.counters.trapped ?? 0 });
    return done();
  }
  if (I.has('ask')) {
    const topic = a.topic ?? 'general';
    if (topic === 'crew') {
      s = revealFact(s, 'kestrel_status');
      add('ardenAskCrew', { souls: k.souls, trapped: s.counters.trapped ?? 0 });
    } else if (topic === 'reactor') {
      s = revealFact(s, 'kestrel_status');
      add('ardenAskReactor', { turns: turnsToBreach(s), containment: Math.round(k.containment), stable: s.flags.kestrelStable ? 1 : 0 });
    } else if (topic === 'cargo' || topic === 'passenger') legacy('ask', { topic: topic === 'passenger' ? 'passenger' : 'cargo' });
    else if (topic === 'intentions') add('ardenAskIntentions');
    else if (topic === 'weapons') add('ardenAskWeapons', { armed: k.weapons.state === 'safe' ? 0 : 1 });
    else if (/\b(vent|eject|dump|shut down)\b/i.test(a.text)) add('ardenAskEject');
    else {
      const v = variant(s, 'ardenAskGeneral', 2);
      s = v.state;
      add('ardenAskGeneral', { v: v.v, turns: turnsToBreach(s), souls: k.souls });
    }
    return done();
  }
  if (I.has('challenge')) {
    if (knows(s, 'compartment_exists') && !knows(s, 'passenger_identity') && s.characters.arden.trust >= 30) {
      legacy('ask', { topic: 'cargo' });
      return done();
    }
    s = adjustTrust(s, 'arden', -5);
    add(knows(s, 'compartment_exists') ? 'ardenChallengedCompartment' : 'ardenChallenged');
    return done();
  }
  if (I.has('warn') || I.has('demand')) {
    legacy('warn', {}, false);
    add('ardenThreatened');
    return done();
  }
  if (I.has('humanitarian') || I.has('declarePeaceful') || I.has('offerCooperation') || I.has('promise')) {
    const rep = bumpRepeat(s, 'kestrel:reassure');
    s = rep.state;
    if (rep.before < 2) legacy(I.has('humanitarian') ? 'humanitarian' : 'reassure', {}, false);
    const v = variant(s, 'ardenReassured', 3);
    s = v.state;
    add('ardenReassured', { v: v.v, turns: turnsToBreach(s), stable: s.flags.kestrelStable ? 1 : 0 });
    return done();
  }
  if (I.has('agree')) {
    add('ardenAgree');
    return done();
  }
  if (I.has('refuse')) {
    add('ardenRefused');
    return done();
  }
  if (I.has('greet')) {
    add('ardenGreetAgain', { turns: turnsToBreach(s), stable: s.flags.kestrelStable ? 1 : 0 });
    return done();
  }
  return unclear(s, 'kestrel', r);
}

// ---------------------------------------------------------------- provider ---

export const kestrelDialogue: DialogueProvider = {
  id: 'kestrel-offline',
  speakerName(s, party) {
    if (party === 'cruiser') return knows(s, 'cruiser_identity') || s.characters.vane.memory.hailed ? 'Prefect Vane' : 'the warship';
    if (party === 'kestrel') return 'Captain Arden';
    return s.characters.passenger.name;
  },
  vesselName(s, party) {
    if (party === 'cruiser') return knows(s, 'cruiser_identity') || s.characters.vane.memory.hailed ? s.ships.cruiser.name : 'warship';
    if (party === 'kestrel') return 'Kestrel';
    return 'Kestrel (passenger)';
  },
  greet(s, party, rng) {
    if (party === 'cruiser') return vaneGreet(s, rng);
    if (party === 'kestrel') {
      if (!s.characters.arden.memory.hailed) return talkToArden(s, comm('kestrel', 'open'));
      const l = line(s, 'kestrel', 'ardenGreetAgain', { turns: turnsToBreach(s), stable: s.flags.kestrelStable ? 1 : 0 });
      return { state: l.state, reports: [l.report] };
    }
    return talkToPassenger(s, comm('passenger', 'ask'));
  },
  respond(s, a, rng) {
    if (a.to === 'cruiser') return vaneRespond(s, a, rng);
    if (a.to === 'kestrel') return ardenRespond(s, a, rng);
    const I = new Set(a.intents);
    if (I.has('end')) return { state: closeChannel(s, 'passenger'), reports: [comms('passenger', 'passengerEnd')] };
    return talkToPassenger(s, comm('passenger', I.has('offerAsylum') ? 'offerAsylum' : I.has('humanitarian') || I.has('declarePeaceful') ? 'reassure' : 'ask'));
  },
  onPromiseBroken(s: WorldState, p: CommsPromise): Applied {
    const r: Report[] = [];
    if (p.party === 'cruiser' && !s.ships.cruiser.destroyed && !s.flags.cruiserGone) {
      if (commsOf(s).active !== 'cruiser') {
        r.push(say('comms', 'incomingHail'));
        s = openChannelTo(s, 'cruiser', { incoming: true });
      }
      const loss = p.kind === 'weaponsDown' ? 4 : 3;
      s = setMemory(s, 'vane', 'patience', (s.characters.vane.memory.patience ?? 0) - loss);
      s = adjustTrust(s, 'vane', -25);
      s = addTension(s, 15);
      s = patchComms(s, (c) => ({ commitments: c.commitments.filter((x) => !(x.party === 'cruiser' && x.kind === 'grace')) }));
      const l = line(s, 'cruiser', 'vaneWordBroken', { kind: p.kind, temp: s.variant.temperament });
      return { state: l.state, reports: [...r, l.report] };
    }
    if (p.party === 'kestrel' && s.characters.arden.status !== 'dead') {
      s = adjustTrust(s, 'arden', -15);
      const l = line(s, 'kestrel', 'ardenWordBroken', { kind: p.kind });
      return { state: l.state, reports: [l.report] };
    }
    return { state: s, reports: r };
  },
  tick(s) {
    const r: Report[] = [];
    const g = commsOf(s).commitments.find((x) => x.party === 'cruiser' && x.kind === 'grace');
    if (g && g.untilTurn !== null && s.turn >= g.untilTurn && !s.ships.cruiser.destroyed && !s.flags.cruiserGone && !s.characters.vane.memory.agreement) {
      s = patchComms(s, (c) => ({ commitments: c.commitments.filter((x) => x !== g) }));
      const stillThere = range(s, 'halcyon', 'kestrel') < 30000 && !s.ships.kestrel.destroyed && s.ships.kestrel.souls > 0;
      if (stillThere) s = setMemory(s, 'vane', 'patience', Math.min(s.characters.vane.memory.patience ?? 0, 1));
      const l = line(s, 'cruiser', 'vaneTimeUp', { souls: s.ships.kestrel.souls, still: stillThere ? 1 : 0 });
      s = l.state;
      r.push(l.report);
    }
    return { state: s, reports: r };
  },
};
