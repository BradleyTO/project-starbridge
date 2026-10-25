/** Scenario-specific meaning of scans, one-shot comm actions, improvised orders, queries and officers' bridge talk for Ion Season. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows, patchShip, revealFact, setCounter, setFlag } from '../../engine/state';
import type { Channel, Hauler } from './setup';
import { BAND_NAME, CAPTAIN_SHORT, HAULERS, SHIP_NAME, SLOT, ion, otherCh, unfitText } from './setup';
import {
  adrift, alone, band, calmNow, captainAlive, captainKnownUnfit, charge, chargeH, chCode, cm, cross, crewLost, crewOff, discharge, edge, evacuate, gutLean, gutRead, handled,
  inConvoy, isUnfit, modelLine, over, probeLean, remote, remoteHelm, shipLeft, spateMaw, through, towed, turnBack, vars,
} from './agents';
import { captainRespond } from './dialogue';
import { ASK_CHARGE, ASK_FIT, ASK_GUT, ASK_MODEL, BACKING, CHANNEL, CROSS, DISCHARGE, EVAC, GOGUT, GOMODEL, GOPROBE, IS_QUESTION, PROBE, REMOTE, TURNBACK, WAKE } from './words';

/** Nothing left to decide about the crossing (over, or through with only a rescue left). */
const done = (s: WorldState) => over(s) || through(s);

export const haulerIn = (t: string): Hauler | null => {
  const m = /\b(mule|saffron|brack|odran|quill)\b/.test(t);
  const g = /\b(gannet'?s?|teague|rosalind|hollow)\b/.test(t);
  return m && !g ? 'mule' : g && !m ? 'gannet' : null;
};
export const channelIn = (t: string): Channel | null => {
  const hi = /\b(high|upper|top)\b/.test(t);
  const lo = /\b(low|lower|bottom)\b/.test(t);
  return hi && !lo ? 'high' : lo && !hi ? 'low' : null;
};

// ------------------------------------------------------------------ scan ---

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  if (target === 'kestrel' || target === 'cruiser') {
    const h: Hauler = target === 'kestrel' ? 'mule' : 'gannet';
    return { state: s, reports: [say('sensors', 'scanHauler', vars(s, h, { charge: charge(s, h), adrift: adrift(s, h) ? 1 : 0, gone: inConvoy(s, h) ? 0 : 1, souls: s.ships[SLOT[h]].souls }))] };
  }
  if (target === 'area') return modelReport(s);
  if (target === 'halcyon') return { state: s, reports: [say('engineering', 'chargeReport', chargeVars(s))] };
  return { state: s, reports: [say('sensors', 'scanNoCompartment')] };
}

function modelReport(s: WorldState): Applied {
  if (done(s)) return { state: s, reports: [say('sensors', 'modelOver')] };
  const m = modelLine(s);
  s = setCounter(s, 'modelBand', band(s) + 1);
  s = setFlag(s, 'askedModel');
  return { state: s, reports: [say('sensors', 'modelRead', { ch: m.ch, firm: m.firm ? 1 : 0, spate: m.bothRough ? 1 : 0, band: BAND_NAME[band(s)] })] };
}

const chargeVars = (s: WorldState) => ({ mule: inConvoy(s, 'mule') && !adrift(s, 'mule') ? charge(s, 'mule') : -1, gannet: inConvoy(s, 'gannet') && !adrift(s, 'gannet') ? charge(s, 'gannet') : -1, halcyon: chargeH(s), left: 3 - (s.counters.discharges ?? 0) });

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;
function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const text = a.intent === 'ask' ? 'which channel would you take' : a.intent === 'reassure' ? 'hold on, stay with us' : '';
  const line = { type: 'speak' as const, to: a.target === 'cruiser' ? ('cruiser' as const) : ('kestrel' as const), text, intents: (a.intent === 'ask' ? ['ask'] : []) as never, topic: undefined, relayed: false };
  return captainRespond(s, line, rng);
}

// ------------------------------------------------------------ improvise ---

function probe(s: WorldState, t: string, r: Report[]): WorldState {
  const torpedo = /\btorpedo/.test(t);
  const ch = channelIn(t);
  if (done(s)) {
    r.push(say('sensors', 'modelOver'));
    return s;
  }
  if (!ch) {
    r.push(say(torpedo ? 'tactical' : 'sensors', 'probeWhich'));
    return s;
  }
  if ((s.counters.probeLeft ?? 0) > 0) {
    r.push(say('sensors', 'probeBusy'));
    return s;
  }
  s = setCounter(s, 'probeAsked', band(s) + 1);
  if (torpedo) {
    const n = s.counters.torpedoes ?? 0;
    if (n <= 0) {
      r.push(say('tactical', 'noTorpedoes'));
      return s;
    }
    s = setCounter(s, 'torpedoes', n - 1);
    s = setCounter(s, 'probeLeft', 1);
    s = setCounter(s, 'probeBand', band(s));
    s = setCounter(s, 'probeCh', chCode(ch));
    s = setFlag(s, 'torpedoProbe');
    r.push(say('tactical', 'torpedoProbe', { ch }));
    return s;
  }
  const p = s.counters.probes ?? 0;
  if (p <= 0) {
    r.push(say('sensors', 'probesGone'));
    return s;
  }
  s = setCounter(s, 'probes', p - 1);
  s = setCounter(s, 'probeLeft', 2);
  s = setCounter(s, 'probeBand', band(s));
  s = setCounter(s, 'probeCh', chCode(ch));
  r.push(say('sensors', 'probeAway', { ch, left: p - 1 }));
  return s;
}

/** The captain names no channel: the helm takes the one already named for this band, or asks. */
function crossDefault(s: WorldState, t: string, r: Report[]): WorldState {
  const g = gutLean(s);
  const p = probeLean(s);
  if (p) return cross(s, p, r, 'probe');
  if (g) return cross(s, g, r, 'gut');
  if (spateMaw(s) && /\bnow\b/.test(t) && calmNow(s, ion(s).calm[2])) {
    // "Now!" in a lull the helm can feel: he takes the slack channel.
    return cross(s, ion(s).calm[2], r, 'lull');
  }
  r.push(say('helm', 'whichChannel', { band: BAND_NAME[band(s)] }));
  return s;
}

function goGut(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'backedHelm');
  s = setCounter(s, 'gutAsked', band(s) + 1);
  const g = gutRead(s);
  const v = ion(s);
  switch (g.kind) {
    case 'unsure': {
      const guess = v.guessRight ? v.calm[band(s)] : otherCh(v.calm[band(s)]);
      s = setCounter(s, 'gutBand', band(s) + 1);
      s = setCounter(s, 'gutCh', chCode(guess));
      r.push(say('helm', 'gutGuess', { ch: guess }));
      s = setFlag(s, 'guessed');
      return cross(s, guess, r, 'gut');
    }
    case 'lean':
    case 'lullNow':
      s = setCounter(s, 'gutBand', band(s) + 1);
      s = setCounter(s, 'gutCh', chCode(g.ch));
      return cross(s, g.ch, r, g.kind === 'lullNow' ? 'lull' : 'gut');
    case 'lullComing':
      r.push(say('helm', 'gutWait', { mins: g.mins, ch: g.ch }));
      return s;
    case 'rough':
      r.push(say('helm', 'gutRoughGo', { ch: g.ch }));
      return cross(s, g.ch, r, 'gut');
  }
}

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  const t = a.description.toLowerCase();
  if (a.method === 'shieldExtend') {
    if (done(s)) return { state: s, reports: [say('tactical', 'shieldsAfter')] };
    s = patchShip(s, 'halcyon', { shields: { ...s.ships.halcyon.shields, raised: true } });
    s = setFlag(s, 'shieldsOver');
    return { state: s, reports: [say('tactical', 'shieldsOverDone')] };
  }
  if (a.method !== 'other') return { state: s, reports: [say('xo', 'impNotHere')] };
  if (over(s)) return { state: s, reports: [say('xo', 'impOver')] };
  if (through(s)) {
    // Out of the Maw with a dark hull behind: only the rescue is left to do.
    if (EVAC.test(t)) s = evacuate(s, haulerIn(t), r);
    else r.push(say('xo', 'strandedOnly'));
    return { state: s, reports: r };
  }
  if (TURNBACK.test(t)) s = turnBack(s, r);
  else if (EVAC.test(t)) s = evacuate(s, haulerIn(t), r);
  else if (REMOTE.test(t)) {
    const h = haulerIn(t) ?? HAULERS.find((x) => captainKnownUnfit(s, x)) ?? null;
    if (!h) r.push(say('helm', 'remoteWhich'));
    else s = remoteHelm(s, h, r);
  } else if (DISCHARGE.test(t)) s = discharge(s, r);
  else if (PROBE.test(t)) s = probe(s, t, r);
  else if (WAKE.test(t)) {
    s = setFlag(s, 'wake');
    r.push(say('helm', 'wakeFormed'));
  } else if (GOPROBE.test(t)) {
    const p = probeLean(s);
    if (p) s = cross(s, p, r, 'probe');
    else r.push(say('sensors', 'noProbeYet'));
  } else if (GOMODEL.test(t)) {
    const m = modelLine(s);
    s = setCounter(s, 'modelBand', band(s) + 1);
    if (m.bothRough) r.push(say('sensors', 'modelNoLine'));
    else s = cross(s, m.ch, r, 'model');
  } else if (GOGUT.test(t)) s = goGut(s, r);
  else if (channelIn(t) && (CROSS.test(t) || CHANNEL.test(t))) s = cross(s, channelIn(t)!, r, 'own');
  else if (CROSS.test(t)) s = crossDefault(s, t, r);
  else r.push(say('xo', 'impOtherIon', { description: a.description.slice(0, 80) }));
  return { state: s, reports: r };
}

// ------------------------------------------------------- officers on the bridge ---


const HELM = /\b(adeyemi|kofi|helm|helmsman|ensign|duarte)\b/;
const SCIENCE = /\b(varga|oona|sensors?|science|hale)\b/;
const DOCTOR = /\b(osei|ama|doctor|doc|medical|ruiz|nurse)\b/;
const XO = /\b(marrow|xo|number one|first officer|commander|holt)\b/;
const COMMS = /\b(szabo|mirela|comms|communications|kerr)\b/;
const ENG = /\b(okafor|chief|engineering|engineer|cho)\b/;
const TAC = /\b(rask|tactical|pell)\b/;
const EXPLICIT = /\b(gut|instinct\w*|hunch|feel\w*|sense|your (own )?read|you think|you reckon|your hands|what do you say)\b/;
const PRESS = /\b(guess|best guess|if you had to|pick one|must choose|have to choose)\b/;

/** The vocative at the start of a line ("Adeyemi, ...") or the officer the parser named. */
function whoOf(officer: string, t: string): string {
  const head = t.split(/[,:;.!?]/)[0] ?? '';
  for (const [k, re] of [['helm', HELM], ['science', SCIENCE], ['doctor', DOCTOR], ['xo', XO], ['comms', COMMS], ['eng', ENG], ['tac', TAC]] as const) if (re.test(officer)) return k;
  for (const [k, re] of [['helm', HELM], ['science', SCIENCE], ['doctor', DOCTOR], ['xo', XO], ['comms', COMMS], ['eng', ENG], ['tac', TAC]] as const) if (re.test(head) && head.split(/\s+/).length <= 3) return k;
  return '';
}

function adeyemi(s: WorldState, t: string, r: Report[]): WorldState {
  if (done(s)) {
    r.push(say('helm', 'helmAfter'));
    return s;
  }
  const v = ion(s);
  const b = band(s);
  if (BACKING.test(t)) {
    const again = !!s.flags.saidBacking;
    s = setFlag(s, 'backedHelm');
    s = setFlag(s, 'saidBacking');
    // "I trust your gut." on its own is encouragement, not yet a question.
    if (!IS_QUESTION.test(t)) {
      r.push(say('helm', again ? 'helmBackedAgain' : 'helmBacked'));
      return s;
    }
  }
  const explicit = EXPLICIT.test(t) || BACKING.test(t);
  if (explicit) s = setFlag(s, 'backedHelm');
  s = setCounter(s, 'gutAsked', b + 1);
  s = setFlag(s, 'askedHelm');
  const g = gutRead(s);
  const m = modelLine(s);
  if (!v.confident && !explicit && !s.flags.backedHelm) {
    if (m.bothRough) {
      r.push(say('helm', 'helmDefersSpate'));
      return s;
    }
    const differs = g.kind === 'lean' && g.ch !== m.ch;
    r.push(say('helm', 'helmDefers', { ch: m.ch, hesitant: differs ? 1 : 0 }));
    if (differs && !s.flags.marrowHinted) {
      s = setFlag(s, 'marrowHinted');
      r.push(say('xo', 'marrowHint'));
    }
    return s;
  }
  switch (g.kind) {
    case 'unsure':
      if (PRESS.test(t)) {
        const guess = v.guessRight ? v.calm[b] : otherCh(v.calm[b]);
        s = setCounter(s, 'gutBand', b + 1);
        s = setCounter(s, 'gutCh', chCode(guess));
        s = setFlag(s, 'guessed');
        r.push(say('helm', 'gutGuessOnly', { ch: guess }));
      } else r.push(say('helm', 'gutUnsure', { band: BAND_NAME[b] }));
      return s;
    case 'lean':
      s = setCounter(s, 'gutBand', b + 1);
      s = setCounter(s, 'gutCh', chCode(g.ch));
      r.push(say('helm', 'gutLean', { ch: g.ch, agrees: g.ch === m.ch ? 1 : 0, modelKnown: (s.counters.modelBand ?? 0) === b + 1 ? 1 : 0, confident: v.confident ? 1 : 0 }));
      return s;
    case 'lullComing':
      r.push(say('helm', 'gutLullComing', { mins: g.mins, ch: g.ch }));
      return s;
    case 'lullNow':
      s = setCounter(s, 'gutBand', b + 1);
      s = setCounter(s, 'gutCh', chCode(g.ch));
      r.push(say('helm', 'gutLullNow', { ch: g.ch }));
      return s;
    case 'rough':
      r.push(say('helm', 'gutRough', { ch: g.ch }));
      return s;
  }
}

function osei(s: WorldState, t: string, r: Report[]): WorldState {
  const named = haulerIn(t);
  const heard = HAULERS.filter((h) => (cm(s, h).spoke ?? 0) > 0);
  const list = named ? [named] : heard;
  if (!list.length || (named && !(cm(s, named).spoke ?? 0))) {
    r.push(say('medical', 'oseiNeedToHear', named ? vars(s, named) : {}));
    return s;
  }
  s = setFlag(s, 'askedOsei');
  for (const h of list) {
    if (!captainAlive(s, h)) {
      r.push(say('medical', 'oseiGone', vars(s, h)));
      continue;
    }
    if (isUnfit(s, h)) {
      s = revealFact(s, 'unfit');
      s = setFlag(s, 'foundUnfit');
      r.push(say('medical', handled(s, h) ? 'oseiUnfitHandled' : 'oseiUnfit', vars(s, h, { text: unfitText(h) })));
    } else r.push(say('medical', 'oseiFit', vars(s, h)));
  }
  return s;
}

function bridge(s: WorldState, action: Extract<ProposedAction, { type: 'bridge' }>, _rng: Rng): Applied {
  if (action.op !== 'chat') return { state: s, reports: [say('xo', 'bridgeNotNow')] };
  const t = (action.text ?? '').toLowerCase();
  const who = whoOf((action.officer ?? '').toLowerCase(), t);
  const r: Report[] = [];
  if (who === 'doctor') return { state: osei(s, t, r), reports: r };
  if (who === 'eng') {
    if (DISCHARGE.test(t) && !done(s)) return { state: discharge(s, r), reports: r };
    return { state: s, reports: [say('engineering', 'chargeReport', chargeVars(s))] };
  }
  if (who === 'science') {
    if (PROBE.test(t)) return { state: probe(s, t, r), reports: r };
    return modelReport(s);
  }
  if (who === 'tac') {
    if (PROBE.test(t)) return { state: probe(s, t, r), reports: r };
    return { state: s, reports: [say('tactical', 'raskStorm', { torpedoes: s.counters.torpedoes ?? 0, probes: s.counters.probes ?? 0 })] };
  }
  if (who === 'comms') return { state: s, reports: [say('comms', 'szaboNet', { teague: alone(s) ? 2 : cm(s, 'gannet').warned ? 1 : 0, mule: inConvoy(s, 'mule') ? 1 : 0 })] };
  if (who === 'xo') return { state: s, reports: [marrowRead(s)] };
  if (who === 'helm') return { state: adeyemi(s, t, r), reports: r };
  if (!who) {
    // Nobody named (the interpreter's crossing questions): the officer whose question it is answers.
    if (ASK_FIT.test(t) && !ASK_CHARGE.test(t)) return { state: osei(s, t, r), reports: r };
    if (ASK_MODEL.test(t)) return modelReport(s);
    if (ASK_CHARGE.test(t) && !ASK_GUT.test(t)) return { state: s, reports: [say('engineering', 'chargeReport', chargeVars(s))] };
    if (ASK_GUT.test(t) || BACKING.test(t) || EXPLICIT.test(t)) return { state: adeyemi(s, t, r), reports: r };
  }
  return { state: s, reports: [] };
}

function marrowRead(s: WorldState): Report {
  return say('xo', 'marrowRead', { options: suggestOptions(s).join('; '), unfitKnown: knows(s, 'unfit') ? 1 : 0, edge: edge(s) });
}

// ---------------------------------------------------------------- query ---

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  if (s.outcome || done(s)) return out;
  const b = band(s);
  for (const h of HAULERS) if (adrift(s, h) && !crewOff(s, h) && !crewLost(s, h) && !shipLeft(s, h)) out.push(`take the ${SHIP_NAME[h]}'s crew off`);
  for (const h of HAULERS) if (captainKnownUnfit(s, h) && !handled(s, h) && inConvoy(s, h)) out.push(`ask ${CAPTAIN_SHORT[h]} to hand the helm to the mate`);
  if ((s.counters.gutAsked ?? 0) !== b + 1) out.push('Adeyemi, what does your gut say?');
  if ((s.counters.modelBand ?? 0) !== b + 1) out.push('Varga, what does the model say?');
  if (!s.flags.askedOsei && HAULERS.some((h) => (cm(s, h).spoke ?? 0) > 0)) out.push(`Doctor, how does ${CAPTAIN_SHORT[HAULERS.find((h) => (cm(s, h).spoke ?? 0) > 0)!]} sound to you?`);
  if (!HAULERS.some((h) => (cm(s, h).spoke ?? 0) > 0)) out.push(`hail ${CAPTAIN_SHORT.mule}`);
  if ((s.counters.probes ?? 0) > 0 && (s.counters.probeLeft ?? 0) === 0 && (s.counters.probedBand ?? 0) !== b + 1) out.push('send a probe down the high channel');
  const g = gutLean(s);
  if (g) out.push(`take us through the ${g} channel`);
  if (out.length < 4) out.push('turn the convoy back');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status': {
      const hs = (h: Hauler) =>
        crewLost(s, h) ? 'lost with her crew' : shipLeft(s, h) ? 'left in the storm; crew aboard the Halcyon' : h === 'gannet' && alone(s) ? (s.flags.teagueThrough ? 'through on her own' : 'running her own line') : adrift(s, h) ? `dark and adrift${crewOff(s, h) ? ', crew aboard the Halcyon' : ''}${towed(s, h) ? ', under tow' : ''}` : `charge ${charge(s, h)}${remote(s, h) ? ', flown from our helm' : cm(s, h).relieved ? ', mate at the helm' : towed(s, h) ? ', under tow' : ''}`;
      return {
        state: s,
        reports: [say('xo', 'statusIon', { where: through(s) ? `through to ${'Hesper Deep'}` : s.flags.turnedBack ? 'turned back' : `at the edge of ${BAND_NAME[band(s)]}, ${edge(s)} minute${edge(s) === 1 ? '' : 's'} waiting`, mule: hs('mule'), gannet: hs('gannet'), halcyon: chargeH(s) })],
      };
    }
    case 'systems':
      return { state: s, reports: [say('engineering', 'chargeReport', chargeVars(s))] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'contactsIon')] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') || 'nothing more from the bridge' })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query, bridge };
