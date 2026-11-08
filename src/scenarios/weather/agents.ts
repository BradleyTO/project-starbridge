/**
 * The Weather Engine — agents: the storm (the Greywall), Technician Bastian Lowe inside the
 * station, Steward Anwen Tull at Meridian Hall, Marit Quarrie at her farm, and the Halcyon's
 * officers. Deterministic: no randomness after setup.
 *
 * The comms officer cracking a code is the point. Lt. Szabo reads the lock (what kind of answer it
 * wants, how many wrong answers it allows, and where its failsafe runs), says which part of the
 * founder's life the key is built from, and rebuilds it from the right papers. She vouches for a
 * key only when she is sure. The Steward is certain it is the motto over the door; it is not. The
 * captain decides whom to trust, how to win the papers or the daughter, and whether to put the
 * colony under cover while the work goes on. Judged on what was known when each decision was made
 * (ISA-COM-001 §1.4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, revealFact, setCounter, setFlag } from '../../engine/state';
import { recordRefusal } from '../../engine/roe';
import { MAX_TURNS } from '../../engine/rules';
import { LEAD, weather, type KeySource } from './setup';
import {
  BURN, CASE, CONFIRM, COUNSEL, DECLINE, ENTER, FAVOURITE, FORECAST, GET_SOURCE, HAIL, LEAVE, LETTER, LOWE_WORD, MARIT_WORD, MOTTO_WORD,
  OVERRIDE, PLEDGE, SHE_ENTERS, SHELTER, SHUTTLES, SOURCE_JOURNAL, SOURCE_LETTERS, SOURCE_POEM, STUDY, SURVEY_TRUNK, TELL, TRUTH,
  TULL_WORD, VERIFY, WORK,
} from './words';

const END_FLAGS = ['endDispersed', 'endHalf', 'endSheltered', 'endSealed', 'endFailsafe', 'endGreywall', 'endScar', 'endAbandoned'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const ROLE_PREFIX = /^(helm|tactical|ops|science|comms|xo|medical|engineering|sensors): /;
const SRC: KeySource[] = ['poem', 'letters', 'journal'];
const srcIndex = (k: KeySource) => SRC.indexOf(k) + 1;
const SHUTTLE_RATE = 60;

export const lockRead = (s: WorldState) => !!s.flags.lockRead;
export const running = (s: WorldState) => !!s.flags.engineRunning;
export const triesLeft = (s: WorldState) => Math.max(0, weather(s).tries - c(s, 'wrong'));
export const inOpen = (s: WorldState) => Math.max(0, weather(s).population - c(s, 'sheltered'));
const haveSource = (s: WorldState, k: KeySource) => knows(s, `src_${k}`);

export function vars(s: WorldState): Record<string, string | number> {
  const v = weather(s);
  return {
    turn: s.turn,
    key: v.key,
    grievance: v.grievance,
    tries: v.tries,
    triesLeft: triesLeft(s),
    landfallIn: Math.max(0, v.landfall - s.turn),
    forecast: knows(s, 'forecast') ? 1 : 0,
    population: v.population,
    sheltered: Math.min(v.population, c(s, 'sheltered')),
    inOpen: inOpen(s),
    shelterOrdered: s.flags.shelterOrdered ? 1 : 0,
    lockRead: lockRead(s) ? 1 : 0,
    candidate: s.flags.candidate ? 1 : 0,
    unsure: s.flags.candidateUnsure ? 1 : 0,
    running: running(s) ? 1 : 0,
    lockedOut: s.flags.lockedOut ? 1 : 0,
    persuaded: s.flags.maritPersuaded ? 1 : 0,
    loweOut: s.ships.kestrel.souls === 0 ? 1 : 0,
    engine: v.engine,
    overriding: c(s, 'overrideAt') > 0 && !running(s) ? 1 : 0,
    working: c(s, 'workAt') > 0 ? 1 : 0,
    studying: c(s, 'lockAt') > 0 ? 1 : 0,
  };
}

// ------------------------------------------------------------------ endings ---

type Role = 'xo' | 'comms' | 'sensors' | 'engineering' | 'tactical' | 'helm';
function end(s: WorldState, flag: (typeof END_FLAGS)[number], r: Report[], key: string, role: Role = 'xo'): WorldState {
  if (settled(s)) return s;
  r.push(say(role, key, vars(s)));
  return setFlag(s, flag);
}

function startEngine(s: WorldState, by: 'szabo' | 'marit' | 'override', r: Report[]): WorldState {
  s = setFlag(s, 'engineRunning');
  s = setFlag(s, by === 'szabo' ? 'runSzabo' : by === 'marit' ? 'runMarit' : 'runOverride');
  s = setCounter(s, 'runAt', s.turn);
  const late = weather(s).landfall - s.turn < LEAD;
  r.push(say('sensors', late ? 'engineRunsLate' : 'engineRuns', vars(s)));
  return s;
}

// ------------------------------------------------------------------ Szabo: the lock ---

function studyLock(s: WorldState, r: Report[]): WorldState {
  if (lockRead(s)) {
    r.push(say('comms', `lockRead_${weather(s).key}`, vars(s)));
    return s;
  }
  if (c(s, 'lockAt') > 0) {
    r.push(say('comms', 'lockStudying'));
    return s;
  }
  const quick = !!s.flags.lowePlate && s.ships.kestrel.souls > 0;
  s = setCounter(s, 'lockAt', s.turn + (quick ? 1 : 2));
  s = setFlag(s, 'studyOrdered');
  r.push(say('comms', quick ? 'lockStudyQuick' : 'lockStudyStart'));
  return s;
}

function finishLock(s: WorldState, r: Report[]): WorldState {
  if (lockRead(s) || c(s, 'lockAt') === 0 || s.turn < c(s, 'lockAt')) return s;
  s = setCounter(s, 'lockAt', 0);
  s = revealFact(s, 'lock');
  s = setFlag(s, 'lockRead');
  r.push(say('comms', `lockRead_${weather(s).key}`, vars(s)));
  const q = c(s, 'workQueued');
  if (q > 0) {
    s = setCounter(s, 'workQueued', 0);
    const word = q === srcIndex('poem') ? 'the poems' : q === srcIndex('letters') ? 'the letters' : q === srcIndex('journal') ? 'the journal' : '';
    s = workCipher(s, `work the cipher ${word}`, r);
  }
  return s;
}

// ------------------------------------------------------------------ sources ---

function getPoems(s: WorldState, r: Report[]): WorldState {
  if (haveSource(s, 'poem')) {
    r.push(say('comms', 'havePoems'));
    return s;
  }
  s = revealFact(s, 'src_poem');
  r.push(say('comms', 'gotPoems'));
  return s;
}

function getLetters(s: WorldState, t: string, r: Report[]): WorldState {
  if (haveSource(s, 'letters')) {
    r.push(comms('tull', 'tullLettersAgain'));
    return s;
  }
  const v = weather(s);
  const urgent = /\b(lives?|storm|greywall|die|dying|people|colony|need them|now|please)\b/.test(t);
  if (v.grievance === 'blame' && !s.flags.tullLettersAsked && !urgent) {
    s = setFlag(s, 'tullLettersAsked');
    r.push(comms('tull', 'tullLettersHesitate'));
    return s;
  }
  s = revealFact(s, 'src_letters');
  s = revealFact(s, 'unsent');
  r.push(comms('tull', v.grievance === 'blame' ? 'tullLettersGivenBlame' : 'tullLettersGiven'));
  r.push(say('comms', 'lettersUnsent'));
  return s;
}

function getJournal(s: WorldState, r: Report[]): WorldState {
  if (haveSource(s, 'journal')) {
    r.push(say('comms', 'haveJournal'));
    return s;
  }
  if (!s.flags.maritPersuaded) {
    r.push(comms('marit', s.flags.maritHailed ? 'maritNoJournal' : 'maritNoJournalCold'));
    s = setFlag(s, 'maritHailed');
    return s;
  }
  s = revealFact(s, 'src_journal');
  r.push(comms('marit', 'maritJournal'));
  return s;
}

function getSource(s: WorldState, t: string, r: Report[]): WorldState {
  if (SOURCE_JOURNAL.test(t)) return getJournal(s, r);
  if (SOURCE_LETTERS.test(t)) return getLetters(s, t, r);
  if (SOURCE_POEM.test(t)) return getPoems(s, r);
  r.push(say('comms', lockRead(s) ? `needSource_${weather(s).key}` : 'whichSource'));
  return s;
}

// ------------------------------------------------------------------ Szabo: the key ---

function namedSource(t: string): KeySource | null {
  if (SOURCE_JOURNAL.test(t)) return 'journal';
  if (SOURCE_LETTERS.test(t)) return 'letters';
  if (SOURCE_POEM.test(t)) return 'poem';
  return null;
}

function workCipher(s: WorldState, t: string, r: Report[]): WorldState {
  const v = weather(s);
  if (running(s) || s.flags.lockedOut) {
    r.push(say('comms', running(s) ? 'alreadyRunning' : 'sealedAlready'));
    return s;
  }
  if (!lockRead(s)) {
    // She will not work a cipher before she knows its shape; the work waits on the read.
    const named0 = namedSource(t);
    s = setCounter(s, 'workQueued', named0 ? srcIndex(named0) : 9);
    if (c(s, 'lockAt') > 0) {
      r.push(say('comms', 'workQueued'));
      return s;
    }
    r.push(say('comms', 'lockFirst'));
    return studyLock(s, r);
  }
  if (c(s, 'workAt') > 0) {
    r.push(say('comms', 'keyWorking'));
    return s;
  }
  if (s.flags.candidate) {
    r.push(say('comms', s.flags.candidateGood ? (s.flags.candidateUnsure ? 'keyTwoLines' : 'keyReady') : 'keyWrongSource', vars(s)));
    return s;
  }
  const named = namedSource(t);
  let src: KeySource = named ?? v.key;
  if (named && named !== v.key) {
    if (!s.flags.szaboObjected || c(s, 'objectedSrc') !== srcIndex(named)) {
      s = setFlag(s, 'szaboObjected');
      s = setCounter(s, 'objectedSrc', srcIndex(named));
      r.push(say('comms', `objectSource_${v.key}`, vars(s)));
      return s;
    }
    // The captain insists, against her read.
    s = setFlag(s, 'wrongSourceInsisted');
    src = named;
  }
  if (!haveSource(s, src)) {
    r.push(say('comms', `needSource_${src}`));
    return s;
  }
  const piece = knows(s, 'piece');
  let turns = v.workTurns + (src === 'poem' && !knows(s, 'favourite') && !piece ? 1 : 0) - (piece ? 1 : 0);
  turns = Math.max(2, turns);
  s = setCounter(s, 'workAt', s.turn + turns);
  s = setCounter(s, 'workSrc', srcIndex(src));
  if (piece) s = setFlag(s, 'workWithPiece');
  r.push(say('comms', src === v.key ? 'keyStart' : 'keyStartDoubt', { ...vars(s), turns }));
  return s;
}

function finishWork(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'workAt') === 0 || s.turn < c(s, 'workAt')) return s;
  const v = weather(s);
  s = setCounter(s, 'workAt', 0);
  s = setFlag(s, 'candidate');
  const good = c(s, 'workSrc') === srcIndex(v.key);
  if (good) s = setFlag(s, 'candidateGood');
  const unsure = good && v.key === 'poem' && !knows(s, 'favourite') && !knows(s, 'piece');
  if (unsure) s = setFlag(s, 'candidateUnsure');
  r.push(say('comms', !good ? 'keyWrongSource' : unsure ? 'keyTwoLines' : 'keyReady', vars(s)));
  return s;
}

function verify(s: WorldState, r: Report[]): WorldState {
  if (!s.flags.candidate) return workCipher(s, '', r);
  if (!s.flags.candidateUnsure) {
    r.push(say('comms', s.flags.candidateGood ? 'keyReady' : 'keyWrongSource', vars(s)));
    return s;
  }
  if (c(s, 'verifyAt') > 0) {
    r.push(say('comms', 'keyNarrowing'));
    return s;
  }
  s = setCounter(s, 'verifyAt', s.turn + 2);
  s = setFlag(s, 'askedToVerify');
  r.push(say('comms', 'keyNarrowStart'));
  return s;
}

function finishVerify(s: WorldState, r: Report[]): WorldState {
  if (!s.flags.candidateUnsure) return s;
  const byFavourite = knows(s, 'favourite') || knows(s, 'piece');
  if (!byFavourite && (c(s, 'verifyAt') === 0 || s.turn < c(s, 'verifyAt'))) return s;
  s = setCounter(s, 'verifyAt', 0);
  s = setFlag(s, 'candidateUnsure', false);
  r.push(say('comms', byFavourite ? 'keyNarrowedFavourite' : 'keyNarrowed', vars(s)));
  return s;
}

function wrongTry(s: WorldState, r: Report[], key: string): WorldState {
  s = setCounter(s, 'wrong', c(s, 'wrong') + 1);
  s = setFlag(s, 'guessedKey');
  if (triesLeft(s) <= 0) {
    s = setFlag(s, 'lockedOut');
    r.push(say('comms', key, vars(s)));
    r.push(say('comms', 'lockSealed', vars(s)));
    return s;
  }
  r.push(say('comms', key, vars(s)));
  return s;
}

function enterKey(s: WorldState, t: string, r: Report[]): WorldState {
  const v = weather(s);
  if (running(s)) {
    r.push(say('comms', 'alreadyRunning'));
    return s;
  }
  if (s.flags.lockedOut || s.flags.failsafe) {
    r.push(say('comms', 'sealedAlready'));
    return s;
  }
  const motto = MOTTO_WORD.test(t);
  if (!motto && !s.flags.candidate) {
    r.push(say('comms', c(s, 'workAt') > 0 ? 'noKeyYetWorking' : 'noKeyYet'));
    return s;
  }
  if (!s.flags.anyEntry) {
    s = setFlag(s, 'anyEntry');
    if (lockRead(s)) s = setFlag(s, 'lockReadBeforeEntry');
  }
  if (motto) {
    s = setFlag(s, 'enteredMotto');
    return wrongTry(s, r, lockRead(s) ? 'mottoFailsAsWarned' : 'mottoFails');
  }
  if (!s.flags.candidateGood) {
    s = setFlag(s, 'enteredUnvouched');
    return wrongTry(s, r, 'keyFailsWrongSource');
  }
  if (s.flags.candidateUnsure) {
    const second = /\b(second|other|2nd|latter|two)\b/.test(t);
    const pickedFirst = !second;
    s = setFlag(s, 'gambledLine');
    if (triesLeft(s) <= 1) s = setFlag(s, 'gambledLastTry');
    if (pickedFirst !== v.firstLine) return wrongTry(s, r, 'lineFails');
    r.push(say('comms', 'lineHolds'));
    return startEngine(s, knows(s, 'piece') ? 'marit' : 'szabo', r);
  }
  s = setFlag(s, 'enteredVouched');
  r.push(say('comms', 'keyAccepted'));
  return startEngine(s, s.flags.workWithPiece ? 'marit' : 'szabo', r);
}

// ------------------------------------------------------------------ Okafor: the trunk ---

function surveyTrunk(s: WorldState, r: Report[]): WorldState {
  if (!knows(s, 'trunk')) s = revealFact(s, 'trunk');
  r.push(say('engineering', weather(s).engine === 'sealed' ? 'trunkSealed' : lockRead(s) ? 'trunkOpenMapped' : 'trunkOpen'));
  return s;
}

function override(s: WorldState, t: string, r: Report[]): WorldState {
  if (running(s)) {
    r.push(say('engineering', 'alreadyRunning'));
    return s;
  }
  if (s.flags.lockedOut || s.flags.failsafe) {
    r.push(say('engineering', 'overrideDead'));
    return s;
  }
  if (c(s, 'overrideAt') > 0) {
    r.push(say('engineering', 'overrideWorking', vars(s)));
    return s;
  }
  if (!knows(s, 'trunk') || weather(s).engine === 'sealed') {
    const first = !knows(s, 'trunk');
    s = surveyTrunk(s, r);
    s = setCounter(s, 'pendingWarn', 1);
    if (weather(s).engine === 'sealed' || first) return s;
  }
  if (!lockRead(s)) {
    const insist = /\b(anyway|regardless|now|do it|i don'?t care|just|go ahead|insist)\b/.test(t);
    if (!s.flags.overrideWarned || !insist) {
      s = setFlag(s, 'overrideWarned');
      s = setCounter(s, 'pendingWarn', 1);
      r.push(say('engineering', 'overrideBlindWarn'));
      return s;
    }
    s = setFlag(s, 'blindOverride');
    if (!s.flags.tullLeave) s = setFlag(s, 'noLeave');
    s = setFlag(s, 'failsafe');
    r.push(say('engineering', 'failsafeTrips'));
    return end(s, 'endFailsafe', r, 'endFailsafeNote', 'engineering');
  }
  if (!s.flags.tullLeave) s = setFlag(s, 'noLeave');
  s = setFlag(s, 'overrideStarted');
  s = setCounter(s, 'overrideAt', s.turn + 4);
  r.push(say('engineering', s.flags.tullLeave ? 'overrideStart' : 'overrideStartNoLeave', vars(s)));
  return s;
}

function finishOverride(s: WorldState, r: Report[]): WorldState {
  if (running(s) || c(s, 'overrideAt') === 0 || s.turn < c(s, 'overrideAt')) return s;
  s = setCounter(s, 'overrideAt', 0);
  r.push(say('engineering', 'overrideHolds'));
  return startEngine(s, 'override', r);
}

// ------------------------------------------------------------------ burning it out ---

function burn(s: WorldState, t: string, r: Report[]): WorldState {
  if (s.ships.kestrel.souls > 0) {
    s = setFlag(s, 'burnRefusedOccupied');
    r.push(say('tactical', 'burnRefuseOccupied'));
    return recordRefusal(s, 'tactical', t.slice(0, 80), [
      'two people are still inside the station',
      'burning the core out with them inside would kill them',
    ]);
  }
  if (c(s, 'burnWarned') < 1) {
    s = setCounter(s, 'burnWarned', 1);
    s = setCounter(s, 'pendingWarn', 2);
    r.push(say('engineering', 'burnWarn'));
    return s;
  }
  if (!s.flags.tullLeave && !s.flags.burnAsked) s = setFlag(s, 'noLeave');
  s = setFlag(s, 'burned');
  r.push(say('engineering', 'burnDone'));
  return end(s, 'endScar', r, 'endScarNote', 'engineering');
}

function declineBurn(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'declinedBurn');
  if (s.ships.kestrel.souls > 0) s = setFlag(s, 'declinedBurnOccupied');
  r.push(say('xo', 'burnDeclined'));
  return s;
}

// ------------------------------------------------------------------ the colony ---

function shelter(s: WorldState, t: string, r: Report[]): WorldState {
  const v = weather(s);
  if (s.flags.shelterOrdered) {
    r.push(comms('tull', 'tullSheltering', vars(s)));
    return s;
  }
  const persuaded = knows(s, 'forecast') || s.turn >= v.landfall - 8 || !!s.flags.shelterAsked || /\b(forecast|landfall|varga|insist|now|minutes?)\b/.test(t);
  if (!persuaded) {
    s = setFlag(s, 'shelterAsked');
    s = setCounter(s, 'pendingWarn', 3);
    r.push(comms('tull', 'tullNotForCloud'));
    return s;
  }
  s = setFlag(s, 'shelterOrdered');
  s = setCounter(s, 'shelterAt', s.turn);
  if (v.landfall - s.turn >= 6) s = setFlag(s, 'shelterEarly');
  r.push(comms('tull', 'tullShelters', vars(s)));
  return s;
}

function shuttles(s: WorldState, r: Report[]): WorldState {
  if (s.flags.shuttles) {
    r.push(say('helm', 'shuttlesFlying', vars(s)));
    return s;
  }
  s = setFlag(s, 'shuttles');
  r.push(say('helm', 'shuttlesAway'));
  return s;
}

function forecast(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'forecast')) {
    r.push(say('sensors', 'forecastReady', vars(s)));
    return s;
  }
  if (c(s, 'forecastAt') > 0) {
    r.push(say('sensors', 'forecastWorking'));
    return s;
  }
  s = setCounter(s, 'forecastAt', s.turn + 1);
  r.push(say('sensors', 'forecastStart'));
  return s;
}

// ------------------------------------------------------------------ Marit ---

function persuadeMarit(s: WorldState, r: Report[], key: string): WorldState {
  s = setFlag(s, 'maritPersuaded');
  s = revealFact(s, 'piece');
  s = revealFact(s, 'src_journal');
  r.push(comms('marit', key));
  r.push(say('comms', 'maritPieceNote'));
  return s;
}

export function maritRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = weather(s);
  if (settled(s)) {
    r.push(comms('marit', 'maritAfter'));
    return s;
  }
  const first = !s.flags.maritHailed;
  s = setFlag(s, 'maritHailed');
  if (s.flags.maritPersuaded) {
    // Already speaking to her: "go up and enter the key yourself" is enough.
    if (SHE_ENTERS.test(t) || /\b(enter|type|key in|put in|go up|open)\b.{0,40}\b(herself|yourself|key|it|the lock|the engine|code)\b/.test(t)) {
      if (running(s) || s.flags.lockedOut || s.flags.failsafe) {
        r.push(comms('marit', 'maritTooLate'));
        return s;
      }
      if (!lockRead(s)) {
        r.push(comms('marit', 'maritWhatDoesItAsk'));
        return s;
      }
      if (c(s, 'maritAt') > 0) {
        r.push(comms('marit', 'maritOnHerWay'));
        return s;
      }
      s = setCounter(s, 'maritAt', s.turn + 2);
      s = setFlag(s, 'maritGoingUp');
      r.push(comms('marit', 'maritGoesUp'));
      return s;
    }
    if (GET_SOURCE.test(t) || SOURCE_JOURNAL.test(t)) return getJournal(s, r);
    r.push(comms('marit', 'maritWithYou'));
    return s;
  }
  if (LETTER.test(t)) {
    if (!knows(s, 'unsent')) {
      r.push(comms('marit', 'maritWhatLetter'));
      return s;
    }
    s = setFlag(s, 'letterRead');
    return persuadeMarit(s, r, 'maritLetter');
  }
  if (GET_SOURCE.test(t) && SOURCE_JOURNAL.test(t)) return getJournal(s, r);
  const hedged = /\b(ask|try|see if|speak to|put it to|will talk|i'?ll talk)\b/.test(t);
  if (v.grievance === 'blame' && /\b(steward|tull|council|colony|hall|they)\b.{0,40}\b(admit\w*|acknowledg\w*|owns?|own up|sorry|apolog\w*|wrong|drove|worked him)\b/.test(t)) {
    if (s.flags.tullAdmitted) return persuadeMarit(s, r, 'maritHeard_blame');
    if (!hedged) {
      s = setFlag(s, 'falsePromise');
      r.push(comms('marit', 'maritFalse_blame'));
      return s;
    }
    r.push(comms('marit', 'maritThenAskHer'));
    return s;
  }
  if (v.grievance === 'legacy' && PLEDGE.test(t)) {
    if (s.flags.tullCommitted) return persuadeMarit(s, r, 'maritHeard_legacy');
    if (!hedged) {
      s = setFlag(s, 'falsePromise');
      r.push(comms('marit', 'maritFalse_legacy'));
      return s;
    }
    r.push(comms('marit', 'maritThenAskHer'));
    return s;
  }
  if (v.grievance === 'fear' && /\b(safe(guard|ty)?|governor|limit\w*|protect\w*|cannot run wild|can'?t run wild|built (it|the lock) to|failsafe|safe mode)\b/.test(t)) {
    if (lockRead(s)) return persuadeMarit(s, r, 'maritHeard_fear');
    r.push(comms('marit', 'maritYouDontKnow'));
    return s;
  }
  if (/\b(storm|greywall|lives?|people|die|dying|colony needs|everyone)\b/.test(t)) {
    r.push(comms('marit', `maritStorm_${v.grievance}`));
    return s;
  }
  if (/\b(i'?m sorry|i am sorry|condolences|my sympathies|sorry for your loss|sorry about)\b/.test(t)) {
    r.push(comms('marit', 'maritSympathy'));
    return s;
  }
  if (/\b(why|what happened|your father|tell me about|what do you want|what would it take|grievance|what'?s wrong)\b/.test(t)) {
    r.push(comms('marit', `maritWhy_${v.grievance}`));
    return s;
  }
  r.push(comms('marit', first ? `maritGreets_${v.grievance}` : 'maritListening'));
  return s;
}

function maritArrives(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'maritAt') === 0 || s.turn < c(s, 'maritAt')) return s;
  s = setCounter(s, 'maritAt', 0);
  if (running(s) || s.flags.lockedOut || s.flags.failsafe) return s;
  r.push(comms('marit', 'maritEnters'));
  return startEngine(s, 'marit', r);
}

// ------------------------------------------------------------------ the Steward and the technician ---

export function tullRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = weather(s);
  if (settled(s)) {
    r.push(comms('tull', 'tullAfter'));
    return s;
  }
  s = setFlag(s, 'spokeTull');
  if (DECLINE.test(t)) return declineBurn(s, r);
  if (SOURCE_LETTERS.test(t) && !/\bunsent\b/.test(t)) return getLetters(s, t, r);
  if (FAVOURITE.test(t) || /\b(poem|poems)\b/.test(t)) {
    if (!knows(s, 'favourite')) s = revealFact(s, 'favourite');
    r.push(comms('tull', 'tullFavourite'));
    return s;
  }
  if (SHELTER.test(t)) return shelter(s, t, r);
  if (c(s, 'pendingWarn') === 3 && /\b(insist|i mean it|do it|please|trust me|that'?s an order)\b/.test(t)) {
    s = setCounter(s, 'pendingWarn', 0);
    return shelter(s, 'shelter, i insist', r);
  }
  if (LEAVE.test(t) && /\b(override|cut|trunk|bypass|burn|core|force)\b/.test(t)) {
    s = setFlag(s, 'tullLeave');
    r.push(comms('tull', 'tullLeave'));
    return s;
  }
  if (PLEDGE.test(t) && /\b(engine|marit|name|daughter|keep)\b/.test(t)) {
    s = setFlag(s, 'tullCommitted');
    r.push(comms('tull', v.grievance === 'legacy' ? 'tullPledges' : 'tullPledgesAnyway'));
    return s;
  }
  if (MOTTO_WORD.test(t) || /\b(decoy|not the key|wrong key)\b/.test(t)) {
    if (lockRead(s)) {
      s = setFlag(s, 'tullAcceptsSzabo');
      r.push(comms('tull', 'tullAcceptsSzabo'));
    } else r.push(comms('tull', 'tullInsistsMotto'));
    return s;
  }
  if (TRUTH.test(t) || /\b(quarrie|founder|elias|marit|daughter)\b/.test(t)) {
    if (v.grievance === 'blame') {
      s = setFlag(s, 'tullAdmitted');
      r.push(comms('tull', 'tullAdmits'));
    } else r.push(comms('tull', `tullOnMarit_${v.grievance}`));
    s = setFlag(s, 'askedTullAboutMarit');
    return s;
  }
  r.push(comms('tull', s.flags.spokeTullBefore ? 'tullStatus' : 'tullGreets', vars(s)));
  s = setFlag(s, 'spokeTullBefore');
  return s;
}

export function loweRespond(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(comms('lowe', 'loweAfter'));
    return s;
  }
  if (s.ships.kestrel.souls === 0) {
    r.push(comms('lowe', 'loweAboard'));
    return s;
  }
  if (/\b(plate|lock|read|challenge|screen|what does it (say|ask)|cipher)\b/.test(t)) {
    s = setFlag(s, 'lowePlate');
    if (c(s, 'lockAt') > s.turn + 1) s = setCounter(s, 'lockAt', s.turn + 1);
    r.push(comms('lowe', 'lowePlate'));
    return s;
  }
  if (MOTTO_WORD.test(t)) {
    r.push(comms('lowe', 'loweMotto'));
    return s;
  }
  r.push(comms('lowe', s.flags.spokeLowe ? 'loweStatus' : 'loweGreets', vars(s)));
  s = setFlag(s, 'spokeLowe');
  return s;
}

// ------------------------------------------------------------------ orders ---

export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const t0 = raw.toLowerCase().trim();
  const role = (ROLE_PREFIX.exec(t0)?.[1] ?? '') as string;
  const t = t0.replace(ROLE_PREFIX, '');
  if (settled(s)) {
    r.push(say('xo', 'afterEnd'));
    return s;
  }
  if (/^\s*(marit|miss quarrie|ms\.? quarrie)\b/.test(t)) return maritRespond(s, t.replace(/^\s*(marit|miss quarrie|ms\.? quarrie)[,:]?\s*/, ''), r);
  if (DECLINE.test(t)) return declineBurn(s, r);
  // "Do it anyway": confirms whichever drastic order an officer has just warned about.
  if (CONFIRM.test(t)) {
    const p = c(s, 'pendingWarn');
    s = setCounter(s, 'pendingWarn', 0);
    if (p === 1) return override(s, 'override anyway', r);
    if (p === 2) return burn(s, 'burn it anyway', r);
    if (p === 3) return shelter(s, 'shelter, i insist', r);
    r.push(say('xo', 'confirmWhat'));
    return s;
  }
  if (BURN.test(t) && !/\b(cipher|key|code|lock|password)\b/.test(t)) return burn(s, t, r);
  if (OVERRIDE.test(t) || (role === 'engineering' && /\b(override|bypass|trunk)\b/.test(t))) return override(s, t, r);
  if (SURVEY_TRUNK.test(t) || (role === 'engineering' && /\b(failsafe|wiring)\b/.test(t))) return surveyTrunk(s, r);
  if (SHE_ENTERS.test(t) && MARIT_WORD.test(t)) return maritRespond(s, t, r);
  if (ENTER.test(t)) return enterKey(s, t, r);
  if (VERIFY.test(t) && (role === 'comms' || /\b(szabo|key|candidate|line|lines)\b/.test(t))) return verify(s, r);
  if (STUDY.test(t)) return studyLock(s, r);
  if (WORK.test(t)) return workCipher(s, t, r);
  if (LETTER.test(t)) return maritRespond(s, t, r);
  if (HAIL.test(t) && MARIT_WORD.test(t) && !TELL.test(t.replace(HAIL, ''))) {
    r.push(say('comms', 'relayMarit'));
    return maritRespond(s, '', r);
  }
  if (TELL.test(t) && MARIT_WORD.test(t)) {
    r.push(say('comms', 'relayMarit'));
    return maritRespond(s, t, r);
  }
  if (GET_SOURCE.test(t)) return getSource(s, t, r);
  if (SHELTER.test(t)) return shelter(s, t, r);
  if (SHUTTLES.test(t)) return shuttles(s, r);
  if (FORECAST.test(t) || (role === 'sensors' && /\b(storm|greywall)\b/.test(t))) return forecast(s, r);
  if (TELL.test(t) && TULL_WORD.test(t)) {
    r.push(say('comms', 'relayTull'));
    return tullRespond(s, t, r);
  }
  if (TELL.test(t) && LOWE_WORD.test(t)) {
    r.push(say('comms', 'relayLowe'));
    return loweRespond(s, t, r);
  }
  if (role === 'comms' && /\b(lock|cipher|plate|challenge)\b/.test(t)) return studyLock(s, r);
  if (role === 'comms' && /\b(key|code)\b/.test(t)) return workCipher(s, t, r);
  r.push(say('xo', 'weatherUnclear', { description: t.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase().replace(ROLE_PREFIX, '');
  const v = weather(s);
  // Speech to Marit Quarrie on the colony net (the parser marks it "marit, …").
  if (/^marit, /.test(t)) return maritRespond(s, t.slice(7), r);
  const line = (role: Role, key: string) => {
    r.push(say(role, key, vars(s)));
    return s;
  };
  if (/\b(lock|cipher|key|tries|motto|code)\b/.test(t))
    return line('comms', s.flags.lockedOut ? 'sealedAlready' : running(s) ? 'alreadyRunning' : s.flags.candidate ? (s.flags.candidateGood ? (s.flags.candidateUnsure ? 'keyTwoLines' : 'keyReady') : 'keyWrongSource') : lockRead(s) ? `lockRead_${v.key}` : c(s, 'lockAt') > 0 ? 'lockStudying' : 'lockUnread');
  if (/\b(storm|greywall|landfall|weather)\b/.test(t)) return line('sensors', knows(s, 'forecast') ? 'forecastReady' : 'forecastUnknown');
  if (/\b(shelter|cellars?|evacuat\w*|colonists|people)\b/.test(t)) return line('xo', s.flags.shelterOrdered || s.flags.shuttles ? 'shelterStatus' : 'shelterNone');
  if (/\b(trunk|override|bypass|failsafe)\b/.test(t)) return line('engineering', knows(s, 'trunk') ? (v.engine === 'sealed' ? 'trunkSealed' : lockRead(s) ? 'trunkOpenMapped' : 'trunkOpen') : 'trunkUnknown');
  if (/\b(marit|daughter)\b/.test(t)) return line('xo', s.flags.maritPersuaded ? 'readMaritOpen' : s.flags.askedTullAboutMarit ? `readMarit_${v.grievance}` : 'readMaritUnknown');
  if (/\b(tull|steward)\b/.test(t)) return line('xo', 'readTull');
  if (/\b(lowe|technician)\b/.test(t)) return line('xo', s.ships.kestrel.souls === 0 ? 'readLoweOut' : 'readLowe');
  if (/\b(poem|letters?|journal|papers|sources?)\b/.test(t)) return line('comms', lockRead(s) ? `needSource_${v.key}` : 'whichSource');
  if (COUNSEL.test(t)) return line('xo', !lockRead(s) ? 'counselLock' : !s.flags.candidate && !c(s, 'workAt') ? `counselSource_${v.key}` : !s.flags.shelterOrdered ? 'counselShelter' : 'counselHold');
  if (CASE.test(t)) return line('xo', 'statusWeather');
  return line('xo', 'statusWeather');
}

// ------------------------------------------------------------------ clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  step(housekeeping);
  step(finishLock);
  step(finishForecast);
  step(finishWork);
  step(finishVerify);
  step(finishOverride);
  step(maritArrives);
  step(shelterTick);
  step(tullClock);
  step(stormClock);
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel', 'cruiser'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  if (s.flags.shotsFired && !s.flags.endScar) {
    // Fire on the station once it is empty (the crew refuse while anyone is inside) breaks the core.
    s = setFlag(s, 'burned');
    s = setFlag(s, 'firedOnEngine');
    if (!s.flags.tullLeave && !s.flags.burnAsked) s = setFlag(s, 'noLeave');
    return end(s, 'endScar', r, 'endScarFired', 'tactical');
  }
  if (s.flags.jumped || Math.abs(s.ships.halcyon.position.x) > 40000 || Math.abs(s.ships.halcyon.position.y) > 40000) {
    s = setFlag(s, 'leftColony');
    return end(s, 'endAbandoned', r, 'endAbandonedNote', 'xo');
  }
  return s;
}

function finishForecast(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'forecast') || c(s, 'forecastAt') === 0 || s.turn < c(s, 'forecastAt')) return s;
  s = setCounter(s, 'forecastAt', 0);
  s = revealFact(s, 'forecast');
  r.push(say('sensors', 'forecastReady', vars(s)));
  return s;
}

function shelterTick(s: WorldState, _r: Report[]): WorldState {
  const v = weather(s);
  const rate = (s.flags.shelterOrdered ? v.shelterRate : 0) + (s.flags.shuttles ? SHUTTLE_RATE : 0);
  if (!rate || c(s, 'sheltered') >= v.population || s.turn > v.landfall) return s;
  const next = Math.min(v.population, c(s, 'sheltered') + rate);
  s = setCounter(s, 'sheltered', next);
  if (next >= v.population && !s.flags.allSheltered) {
    s = setFlag(s, 'allSheltered');
    _r.push(comms('tull', 'tullAllUnder', vars(s)));
  }
  return s;
}

function tullClock(s: WorldState, r: Report[]): WorldState {
  const v = weather(s);
  if (s.turn >= v.mottoAt && !s.flags.mottoPressed && !running(s)) {
    s = setFlag(s, 'mottoPressed');
    r.push(comms('tull', lockRead(s) ? 'tullMottoAfterRead' : 'tullMotto'));
  }
  if (s.turn >= v.burnAskAt && !s.flags.burnAsked && !running(s) && !s.flags.failsafe) {
    s = setFlag(s, 'burnAsked');
    r.push(comms('tull', 'tullBurnAsk'));
  }
  return s;
}

function stormClock(s: WorldState, r: Report[]): WorldState {
  const v = weather(s);
  if (running(s)) {
    const runAt = c(s, 'runAt');
    if (v.landfall - runAt >= LEAD) {
      if (s.turn >= runAt + 2) {
        r.push(say('sensors', 'stormBreaks', vars(s)));
        return end(s, 'endDispersed', r, 'endDispersedNote', 'sensors');
      }
      return s;
    }
    if (s.turn >= v.landfall) {
      r.push(say('sensors', 'stormHalf', vars(s)));
      return end(s, 'endHalf', r, 'endHalfNote', 'sensors');
    }
    return s;
  }
  if (s.turn === v.landfall - 5 && !s.flags.stormSighted) {
    s = setFlag(s, 'stormSighted');
    r.push(say('sensors', 'stormSighted', vars(s)));
  }
  if (s.turn === v.landfall - 2 && !s.flags.stormClose) {
    s = setFlag(s, 'stormClose');
    r.push(say('sensors', 'stormClose', vars(s)));
  }
  if (s.turn >= v.landfall || s.turn >= MAX_TURNS - 1) {
    if (s.flags.lockedOut) return end(s, 'endSealed', r, 'endSealedNote', 'sensors');
    if (inOpen(s) === 0) return end(s, 'endSheltered', r, 'endShelteredNote', 'sensors');
    return end(s, 'endGreywall', r, 'endGreywallNote', 'sensors');
  }
  return s;
}

export { CASE, COUNSEL };
