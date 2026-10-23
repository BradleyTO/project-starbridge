/**
 * Offline, deterministic DialogueProvider for Reactor Night.
 *
 * Crewman Ines Paley (the work pod Tern) answers by her seeded nerve: steady, she goes when asked;
 * shaken, she goes but freezes on the spine unless someone steadies her first or talks her through
 * it; panicked, she begs not to be sent, goes only if ordered, and freezes whatever is said, until
 * she is recalled, hauled in, beamed out or the helm takes the pod from her. Asking how she is gets
 * an honest answer. She will not clamp on to a manifold the Chief has not rigged.
 *
 * Commander Aurelio Basant (ISV Larkspur) advises by his seeded stance: a mentor gives the cold-
 * bypass procedure and the regulator hint; a by-the-book engineer says eject; a salvage-minded
 * one gives the procedure too, and passes on Fleet Engineering's request to keep the core. It is a
 * request, not a directive, and he says so when pressed.
 */
import type { DialogueProvider, SpeakAction } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms, say as crew } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { Party } from '../../engine/schema';
import type { WorldState } from '../../engine/types';
import { closeChannel, recordLine } from '../../engine/comms';
import { knows, revealFact, setFlag, setMemory } from '../../engine/state';
import { reactor } from './setup';
import { STAGE, TASK, bm, launch, paleyAlive, paleyInPod, pm, podOnSpine, settled, workFor } from './agents';

const RECALL = /\b(come (back|home|in)|return|abort|stand down|get (back|out)|back inside|pull (back|out)|that'?s enough|you'?ve done enough|you have done enough|leave it|head back|dock|bring (it|her|the pod) (in|back|home)|go home|turn (back|around))\b/;
const STEADY = /\b(breathe|breath|breathing|you can do (this|it)|not alone|you'?re doing (well|fine|great|good)|i'?m (here|with you)|we'?re (here|with you)|take your time|one (step|thing) at a time|focus on|talk to me|my voice|stay with me|it'?s (ok|okay|alright|all right)|you'?re safe|i trust you|proud of you|easy|steady|calm|believe in you|right here|i know you can|you'?ve got this|we'?ve got you|together)\b/;
const HOW = /\b(how are you|are you (ok|okay|alright|all right)|you (ok|okay|alright|all right)|scared|afraid|frightened|how do you feel|feeling|honest\w*|tell me the truth|can you do (this|it)|are you able|up to it)\b/;
const VALVE = /\bvalve\b/;
const MANIFOLD = /\b(manifold|bypass|shield loop|cold loop|cross-?connect)\b/;
const ORDER = /\b(now|that'?s an order|i'?m ordering|i order|do it|go!|must|have to|get (out )?there|no choice|immediately)\b/;
const REMOTE = /\b(remote\w*|let (the )?helm|adeyemi|hand (it )?over|fly it for you|hands off|take (the )?controls)\b/;
const FAREWELL = /\b(thank\w*|well done|good work|great work|good job)\b/;

function line(s: WorldState, party: 'kestrel' | 'cruiser', key: string, vars: Record<string, string | number> = {}): { state: WorldState; report: Report } {
  return { state: recordLine(s, { from: party, intents: [], text: key }), report: comms(party === 'cruiser' ? 'basant' : 'paley', key, vars) };
}

// ---------------------------------------------------------------- Paley ---

export function paleyRespond(s: WorldState, a: SpeakAction, _rng: Rng): Applied {
  const r: Report[] = [];
  const I = new Set<string>(a.intents);
  const t = (a.text ?? '').toLowerCase();
  const v = reactor(s);
  const m = pm(s);
  const add = (key: string, vars: Record<string, string | number> = {}) => {
    const l = line(s, 'kestrel', key, vars);
    s = l.state;
    r.push(l.report);
  };
  const done = (): Applied => ({ state: s, reports: r });
  if (!paleyAlive(s)) return { state: closeChannel(s, 'kestrel'), reports: [crew('comms', 'podNoAnswer')] };
  if (!paleyInPod(s)) return { state: closeChannel(s, 'kestrel'), reports: [crew('comms', 'paleyAboardNow')] };
  if (!m.hailed) s = setMemory(s, 'paley', 'hailed', 1);

  // Recall: she comes off the spine (unless she cannot move at all).
  if (RECALL.test(t)) {
    if (m.frozen && v.nerve === 'panicked') {
      s = setFlag(s, 'paleyRecalled');
      add('paleyCantMove');
      r.push(crew('xo', 'marrowRescueOptions'));
      return done();
    }
    if (m.stage === STAGE.standoff) {
      add('paleyAlreadyIn');
      return done();
    }
    if (m.stage === STAGE.inbound) {
      add('paleyOnHerWay');
      return done();
    }
    if (m.frozen || v.nerve === 'panicked' || knows(s, 'paley_state')) s = setFlag(s, 'paleyRecalled');
    s = setMemory(s, 'paley', 'frozen', 0);
    s = setMemory(s, 'paley', 'stage', STAGE.inbound);
    s = setMemory(s, 'paley', 'task', TASK.none);
    s = setMemory(s, 'paley', 'left', 1);
    add('paleyComingBack', { frozen: m.frozen ? 1 : 0 });
    return done();
  }

  // Remote: she hands the pod to the helm.
  if (REMOTE.test(t)) {
    s = setMemory(s, 'paley', 'remote', 1);
    s = setFlag(s, 'remotePod');
    if (m.frozen) {
      s = setMemory(s, 'paley', 'frozen', 0);
      s = setFlag(s, 'paleyRelieved');
    }
    add('paleyHandsOver', { valve: m.task === TASK.valve ? 1 : 0 });
    return done();
  }

  // Steadying words (or the shared reassure / appeal intents).
  const steadying = STEADY.test(t) || I.has('declarePeaceful') || I.has('appeal');
  const asking = HOW.test(t);
  const task = VALVE.test(t) ? TASK.valve : MANIFOLD.test(t) ? TASK.manifold : TASK.none;

  if (asking && task === TASK.none) {
    s = revealFact(s, 'paley_state');
    s = setMemory(s, 'paley', 'asked', 1);
    if (v.nerve !== 'panicked' && steadying) s = steady(s);
    add(`paleyHonest_${v.nerve}`, { out: m.stage === STAGE.standoff ? 0 : 1 });
    return done();
  }

  if (steadying && task === TASK.none) {
    const was = m.frozen;
    s = steady(s);
    if (was && v.nerve !== 'panicked') {
      s = setMemory(s, 'paley', 'frozen', 0);
      s = setFlag(s, 'talkedThrough');
      add('paleyUnfreezes', { task: m.task ?? 0 });
    } else if (was) add('paleyStillPanicked');
    else add(`paleySteadied_${v.nerve}`);
    return done();
  }

  if (task !== TASK.none) {
    if (settled(s)) {
      add('paleyNoNeed');
      return done();
    }
    if (podOnSpine(s) || m.stage === STAGE.inbound) {
      add('paleyAlreadyOut', { task: m.task ?? 0 });
      return done();
    }
    if (task === TASK.manifold && !s.flags.bypassRigged) {
      add('paleyNeedsRig', { planned: s.flags.bypassPlanned ? 1 : 0 });
      return done();
    }
    const ordered = I.has('demand') || ORDER.test(t);
    if (steadying) s = steady(s);
    if (v.nerve === 'panicked' && !ordered && !m.remote) {
      s = revealFact(s, 'paley_state');
      s = setMemory(s, 'paley', 'begged', 1);
      add('paleyBegs');
      return done();
    }
    if (pm(s).steadied) s = setFlag(s, 'steadiedFirst');
    if (v.nerve === 'panicked' && !m.remote) s = setFlag(s, 'orderedPanicked');
    if (v.nerve === 'panicked' && !m.remote && (knows(s, 'paley_state') || s.flags.oseiUnfit)) s = setFlag(s, 'pushedUnfit');
    s = setFlag(s, 'sentPaley');
    s = launch(s, task, r);
    const shaky = (v.nerve === 'shaken' && !pm(s).steadied) || v.nerve === 'panicked';
    add(m.remote ? 'paleyRemoteRide' : shaky ? 'paleyGoesShaky' : 'paleyGoes', { task, left: pm(s).left ?? 0, work: workFor(s, task), deep: task === TASK.valve && v.valveDeep ? 1 : 0 });
    return done();
  }

  if (FAREWELL.test(t)) {
    add('paleyThanks', { done: settled(s) ? 1 : 0 });
    return done();
  }
  add('paleyDefault', { stage: m.stage ?? 0, frozen: m.frozen ?? 0, nerve: v.nerve });
  return done();
}

function steady(s: WorldState): WorldState {
  if (!pm(s).steadied) s = setMemory(s, 'paley', 'steadied', 1);
  return setFlag(s, 'steadied');
}

// ---------------------------------------------------------------- Basant ---

const PROC = /\b(procedure|bypass|how (do|can|should) (we|i)|walk|talk (us|me|her|my chief) through|manual|book|advice|advise|help|suggest\w*|recommend\w*|ideas?|what would you|experience|seen this|what do you|anything|options?)\b/;
const EJECT = /\b(eject\w*|jettison\w*|dump the core|blow the core)\b/;
const DECLINE = /\b(no\b|decline|refuse|won'?t|can'?t|crew first|not worth|my crew|lives|people first|not at the cost)\b/;
const TIME = /\b(how long|when|eta|arrive|how far|how soon|get here)\b/;
const WHO = /\b(who are you|identify|what ship)\b/;

export function basantRespond(s: WorldState, a: SpeakAction, _rng: Rng): Applied {
  const r: Report[] = [];
  const t = (a.text ?? '').toLowerCase();
  const st = reactor(s).stance;
  const add = (key: string, vars: Record<string, string | number> = {}) => {
    const l = line(s, 'cruiser', key, vars);
    s = l.state;
    r.push(l.report);
  };
  const done = (): Applied => ({ state: s, reports: r });
  const first = !bm(s).hailed;
  s = setMemory(s, 'basant', 'hailed', 1);
  s = setMemory(s, 'basant', 'talks', (bm(s).talks ?? 0) + 1);
  s = revealFact(s, 'basant_stance');
  if (first && !t) {
    add(`basantFirst_${st}`, { settled: settled(s) ? 1 : 0 });
    return done();
  }
  if (settled(s)) {
    add('basantAfter', { ejected: s.flags.ejected ? 1 : 0 });
    return done();
  }
  if (TIME.test(t)) {
    add('basantEta');
    return done();
  }
  if (WHO.test(t)) {
    add(`basantFirst_${st}`, { settled: 0 });
    return done();
  }
  if ((s.flags.salvagePressed || st === 'salvage') && DECLINE.test(t) && (bm(s).pressed || s.flags.salvagePressed)) {
    s = setFlag(s, 'declinedSalvage');
    add('basantAccepts');
    return done();
  }
  if (EJECT.test(t)) {
    if (st === 'salvage') {
      s = setFlag(s, 'salvagePressed');
      s = setMemory(s, 'basant', 'pressed', 1);
    }
    if (st === 'byTheBook') s = setFlag(s, 'ejectUrged');
    add(`basantEject_${st}`, { charge: Math.round(s.ships.halcyon.jump.charge) });
    return done();
  }
  if (PROC.test(t) || a.intents.includes('ask' as never) || a.intents.includes('humanitarian' as never)) {
    if (st === 'byTheBook') {
      s = setFlag(s, 'ejectUrged');
      add('basantByTheBook');
      return done();
    }
    const fresh = !knows(s, 'bypass_procedure');
    s = revealFact(s, 'bypass_procedure');
    s = setFlag(s, 'basantHelped');
    if (st === 'salvage') {
      s = setFlag(s, 'salvagePressed');
      s = setMemory(s, 'basant', 'pressed', 1);
    }
    add(`basantProcedure_${st}`, { fresh: fresh ? 1 : 0 });
    return done();
  }
  add(`basantDefault_${st}`);
  return done();
}

// ------------------------------------------------------------- provider ---

const lead = (party: Party) => (party === 'cruiser' ? 'cruiser' : 'kestrel');

export const reactorDialogue: DialogueProvider = {
  id: 'reactor-offline',
  speakerName(_s, party) {
    return lead(party) === 'cruiser' ? 'Cmdr. Aurelio Basant' : 'Crewman Ines Paley';
  },
  vesselName(s, party) {
    return lead(party) === 'cruiser' ? s.ships.cruiser.name : 'work pod Tern';
  },
  greet(s, party, rng) {
    if (lead(party) === 'cruiser') return basantRespond(s, { type: 'speak', to: 'cruiser', text: '', intents: ['greet'], relayed: false } as SpeakAction, rng);
    if (!paleyAlive(s)) return { state: closeChannel(s, 'kestrel'), reports: [crew('comms', 'podNoAnswer')] };
    if (!paleyInPod(s)) return { state: closeChannel(s, 'kestrel'), reports: [crew('comms', 'paleyAboardNow')] };
    const m = pm(s);
    const first = !m.hailed;
    s = setMemory(s, 'paley', 'hailed', 1);
    const l = line(s, 'kestrel', first ? `paleyFirst_${reactor(s).nerve}` : 'paleyAgain', { stage: m.stage ?? 0, frozen: m.frozen ?? 0 });
    return { state: l.state, reports: [l.report] };
  },
  respond(s, a, rng) {
    return lead(a.to) === 'cruiser' ? basantRespond(s, a, rng) : paleyRespond(s, a, rng);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
