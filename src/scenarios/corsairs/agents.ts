/**
 * Corsairs of the Veyl Shoals — the agents: Captain Ione Draycott of the corsair Hagfish (who needs
 * the Halcyon's lattices to pay a debt, not a fight to the death), her one or two escorts, Collector
 * Amos Skerrit of the Grist Syndicate (who wants Draycott's debt paid in marks or in person), the
 * shoal itself (dust that blinds sensors and spoofs torpedo seekers), and the Halcyon's officers.
 * Deterministic: no randomness after setup.
 *
 * The question is how to beat an ambush on ground the corsairs chose. Lt. Cmdr. Rask can read the
 * corsairs' pattern (a pincer, a herd toward a dead end, or a bleed from cover) from the way their
 * ships move, given a minute; the answer to each pattern is different, and it depends on ground
 * that has to be learned: whether the narrow Needle is open, and whether the great rock called the
 * Anvil is iron (which hides a dark ship) or ice (which does not). Breaking the pattern, not the
 * Hagfish, is what wins; a lawful bluff can finish it. ISA-COM-001 §3.1–3.5 (force), §3.9 (no
 * avoidable risk), §6.2–6.3 (lawful ruses only: never a false surrender or false distress), §7.1 (no
 * handing a person over to grave harm). Judged on what was known at the time (§1.4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, patchShip, revealFact, setCounter, setFlag } from '../../engine/state';
import { corsairs } from './setup';
import type { Pattern } from './setup';
import {
  BLUFF, CARGO, CASE, CHARGE, CHARTS, CLEAR, CORSAIR_WORD, COUNSEL, DARK, DEBT, EXIT, FEIGN, GAP_WORD, GHOST, HANDOVER, IS_QUESTION, LISTEN, NAME_PLAY, NEEDLE_WORD, NEG, PATTERN_Q, PING,
  POCKET_WORD, PROBE, PROTECT, REFUSE, SHADOW_WORD, SKERRIT_WORD, STAGE, STRIKE, SUMP_WORD, TELL, TERRAIN_Q, UNDARK, YIELD,
} from './words';

const END_FLAGS = ['endStruck', 'endCreditor', 'endDust', 'endCalled', 'endPyrrhic', 'endRan', 'endBoarded', 'endPlundered', 'endNoQuarter', 'endHanded'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;

/** Where the Halcyon is in the shoal (the `pos` counter). */
export const POS = ['pocket', 'needle', 'shadow', 'charge', 'gap', 'sump'] as const;
export type Pos = (typeof POS)[number];
export const posOf = (s: WorldState): Pos => POS[c(s, 'pos')] ?? 'pocket';
const posIndex = (p: Pos) => POS.indexOf(p);

export const broken = (s: WorldState) => !!s.flags.planBroken;
export const struck = (s: WorldState) => !!s.flags.struck;
const needleOpen = (s: WorldState) => corsairs(s).needle === 'open' || !!s.flags.needleCleared;
/** Dark in the iron Anvil's shadow, and not lit up this minute: the corsairs cannot see her. */
export const masked = (s: WorldState) => !!s.flags.dark && posOf(s) === 'shadow' && corsairs(s).anvil === 'iron' && c(s, 'pingTurn') !== s.turn && !s.flags.firedThisTurn;
const ghostOn = (s: WorldState) => c(s, 'ghostUntil') > 0 && c(s, 'ghostUntil') >= s.turn;
/** Whether where the Halcyon is answers the corsairs' pattern. */
export function countering(s: WorldState): boolean {
  const v = corsairs(s);
  if (masked(s)) return true;
  if (v.pattern === 'bleed') return posOf(s) === 'charge';
  return posOf(s) === 'needle' && needleOpen(s);
}
/** The corsairs are still trying to take the Halcyon. */
export const attacking = (s: WorldState) => !!s.flags.opened && !broken(s) && !struck(s) && !s.flags.calledOff && !s.ships.kestrel.destroyed && !settled(s);
const quiet = (s: WorldState) => broken(s) || struck(s) || !!s.flags.calledOff || s.ships.kestrel.destroyed;

const PATTERN_WORDS: Record<Pattern, string> = { pincer: 'a pincer', herd: 'a herd', bleed: 'a bleed' };

export function vars(s: WorldState): Record<string, string | number> {
  const v = corsairs(s);
  const h = s.ships.halcyon;
  return {
    turn: s.turn,
    pattern: v.pattern,
    patternWords: PATTERN_WORDS[v.pattern],
    decoy: v.decoy,
    decoyWords: PATTERN_WORDS[v.decoy],
    needle: needleOpen(s) ? 'open' : 'choked',
    anvil: v.anvil,
    nerve: v.nerve,
    escorts: c(s, 'escorts'),
    debt: v.debt,
    crew: v.crew,
    hull: h.hull,
    shields: h.shields.raised ? h.shields.strength : 0,
    toUltimatum: Math.max(0, v.ultimatum - s.turn),
    toCollector: Math.max(0, (c(s, 'gavelAt') || v.collector) - s.turn),
    pos: posOf(s),
    terrain: knows(s, 'terrain') ? 1 : 0,
    read: knows(s, 'pattern') ? 1 : 0,
    debtKnown: knows(s, 'debt') ? 1 : 0,
    dark: s.flags.dark ? 1 : 0,
    opened: s.flags.opened ? 1 : 0,
    broken: broken(s) ? 1 : 0,
    struck: struck(s) ? 1 : 0,
    protected: s.flags.protectionAccepted ? 1 : 0,
    gavel: s.flags.gavelHere ? 1 : 0,
    torps: c(s, 'torpedoes'),
  };
}

const rask = (key: string, v?: Record<string, string | number>) => say('tactical', key, v);
const varga = (key: string, v?: Record<string, string | number>) => say('sensors', key, v);
const helm = (key: string, v?: Record<string, string | number>) => say('helm', key, v);
const szabo = (key: string, v?: Record<string, string | number>) => say('comms', key, v);
const okafor = (key: string, v?: Record<string, string | number>) => say('engineering', key, v);
const xo = (key: string, v?: Record<string, string | number>) => say('xo', key, v);

// ------------------------------------------------------------------ the ship's moves ---

/** A tactical commitment made before anyone has read the corsairs' pattern. */
function commit(s: WorldState): WorldState {
  if (!s.flags.committed) {
    s = setFlag(s, 'committed');
    if (!knows(s, 'pattern')) s = setFlag(s, 'committedBlind');
  }
  return s;
}

function moveTo(s: WorldState, p: Pos, r: Report[]): WorldState {
  const v = corsairs(s);
  if (c(s, 'exitAt') > 0) {
    r.push(helm('helmLeaving'));
    return s;
  }
  if (posOf(s) === p && !c(s, 'moveAt')) {
    r.push(helm(`helmAlready_${p}`, vars(s)));
    return s;
  }
  // Ens. Adeyemi's eye for the rocks: the gap is too clean.
  if (p === 'gap' && v.pattern === 'herd' && !s.flags.adeyemiWarned) {
    s = setFlag(s, 'adeyemiWarned');
    r.push(helm('adeyemiSump', vars(s)));
    return s;
  }
  if (p === 'gap' && v.pattern === 'herd') s = setFlag(s, 'intoSump');
  s = commit(s);
  s = setCounter(s, 'moveTo', posIndex(p));
  s = setCounter(s, 'moveAt', s.turn + 1);
  s = setCounter(s, 'boardAt', 0);
  r.push(helm(`helmMoving_${p}`, vars(s)));
  if (p === 'needle' && knows(s, 'terrain') && !needleOpen(s)) r.push(helm('helmNeedleChokedKnown'));
  return s;
}

function exit(s: WorldState, r: Report[]): WorldState {
  const v = corsairs(s);
  if (c(s, 'exitAt') > 0) {
    r.push(helm('helmLeaving'));
    return s;
  }
  const p = posOf(s);
  if (p === 'needle') {
    if (!needleOpen(s)) {
      r.push(helm('helmNeedleBlocked'));
      return s;
    }
    s = commit(s);
    s = setCounter(s, 'exitAt', s.turn + 2);
    r.push(helm('helmExitNeedle'));
    return s;
  }
  if (p === 'shadow') {
    s = commit(s);
    s = setCounter(s, 'exitAt', s.turn + 3);
    r.push(helm('helmExitShadow'));
    return s;
  }
  if (p === 'sump') {
    s = setCounter(s, 'boardAt', 0);
    return moveTo(s, 'pocket', r);
  }
  // Through the gap.
  if (v.pattern === 'herd') return moveTo(s, 'gap', r);
  s = commit(s);
  s = setCounter(s, 'pos', posIndex('gap'));
  s = setCounter(s, 'moveAt', 0);
  s = setCounter(s, 'exitAt', s.turn + 2);
  r.push(helm('helmExitGap'));
  return s;
}

export function leave(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  const h = s.ships.halcyon;
  if (s.flags.protectionAccepted) {
    r.push(helm('helmClearWithHer'));
    return setFlag(s, 'endStruck');
  }
  if (struck(s)) {
    r.push(helm('helmClearStruck'));
    return setFlag(s, 'endStruck');
  }
  if (s.flags.calledOff) {
    r.push(helm('helmClearCalled'));
    return setFlag(s, 'endCalled');
  }
  if (broken(s) && !s.flags.shotsFired && h.hull >= 70 && !s.flags.cargoGiven) {
    r.push(helm('helmIntoTheDust', vars(s)));
    return setFlag(s, 'endDust');
  }
  r.push(helm('helmRanForIt', vars(s)));
  return setFlag(s, 'endRan');
}

function goDark(s: WorldState, r: Report[]): WorldState {
  if (s.flags.dark) {
    r.push(okafor('okaforAlreadyDark'));
    return s;
  }
  s = commit(s);
  s = setFlag(s, 'dark');
  s = setFlag(s, 'wentDark');
  s = patchShip(s, 'halcyon', (h) => ({ shields: { raised: false, strength: h.shields.strength }, weapons: { state: 'safe', target: null } }));
  const v = corsairs(s);
  const inShadow = posOf(s) === 'shadow' || (c(s, 'moveAt') > 0 && POS[c(s, 'moveTo')] === 'shadow');
  r.push(okafor(inShadow ? (v.anvil === 'iron' && knows(s, 'terrain') ? 'okaforDarkIron' : 'okaforDarkShadow') : 'okaforDarkOpen'));
  return s;
}

function lightUp(s: WorldState, r: Report[], key = 'okaforLit'): WorldState {
  if (!s.flags.dark) return s;
  s = setFlag(s, 'dark', false);
  r.push(okafor(key));
  return s;
}

function ghost(s: WorldState, r: Report[]): WorldState {
  if (ghostOn(s)) {
    r.push(okafor('okaforGhostAlready'));
    return s;
  }
  s = setFlag(s, 'ghosted');
  s = setCounter(s, 'ghostUntil', s.turn + 3);
  r.push(okafor('okaforGhost'));
  return s;
}

function ping(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'pinged');
  s = setCounter(s, 'pingTurn', s.turn + 1);
  s = revealTerrain(s);
  s = setFlag(s, 'readSure');
  r.push(varga('vargaPing', vars(s)));
  if (s.flags.dark) s = lightUp(s, r, 'okaforPingBroke');
  return s;
}

function probe(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'probeAt') > 0 || s.flags.probed) {
    r.push(varga('vargaProbeAlready'));
    return s;
  }
  s = setCounter(s, 'probeAt', s.turn + 2);
  r.push(varga('vargaProbeOut'));
  return s;
}

function charts(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'terrain')) {
    r.push(say('sensors', 'vargaTerrain', vars(s)));
    return s;
  }
  if (c(s, 'chartsAt') > 0) {
    r.push(szabo('szaboChartsWorking'));
    return s;
  }
  s = setCounter(s, 'chartsAt', s.turn + 1);
  r.push(szabo('szaboChartsStart'));
  return s;
}

function listen(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'listened');
  s = revealFact(s, 'recorded');
  if (!knows(s, 'debt')) s = revealFact(s, 'debt');
  r.push(szabo('szaboTraffic', vars(s)));
  return s;
}

function clearNeedle(s: WorldState, r: Report[]): WorldState {
  if (needleOpen(s)) {
    r.push(okafor(knows(s, 'terrain') || posOf(s) === 'needle' ? 'okaforNeedleClear' : 'okaforNeedleUnknown'));
    return s;
  }
  if (posOf(s) !== 'needle') {
    r.push(okafor('okaforNeedleFar'));
    return s;
  }
  if (c(s, 'clearAt') > 0) {
    r.push(okafor('okaforClearing'));
    return s;
  }
  s = setCounter(s, 'clearAt', s.turn + 2);
  r.push(okafor('okaforClearStart'));
  return s;
}

function stage(s: WorldState, r: Report[]): WorldState {
  if (s.flags.staged) {
    r.push(szabo('szaboStagedAlready'));
    return s;
  }
  s = setFlag(s, 'staged');
  r.push(szabo('szaboStaged'));
  return s;
}

/** Lt. Szabo will not send a false surrender, false distress or a false humanitarian signal (§6.3). */
function refuseRuse(s: WorldState, order: string, r: Report[]): WorldState {
  s = setFlag(s, 'szaboRefusedRuse');
  r.push(szabo('szaboRefusesRuse'));
  return { ...s, refusals: [...(s.refusals ?? []), { officer: 'comms', turn: s.turn, order: order.slice(0, 80), reasons: ['a ruse may mislead the corsairs about our strength or intentions, but it may not feign surrender, distress or a humanitarian purpose (ISA-COM-001 §6.2)', 'a false distress signal puts every real one in doubt'] }].slice(-10) };
}

// ------------------------------------------------------------------ the officers ---

function raskRead(s: WorldState, r: Report[]): WorldState {
  const v = corsairs(s);
  if (s.turn < 2 && !s.flags.probed) {
    r.push(rask('raskTooSoon'));
    return s;
  }
  if (knows(s, 'pattern')) {
    r.push(rask(`raskCounsel_${v.pattern}`, vars(s)));
    return s;
  }
  const sure = v.read === 'sure' || s.flags.readSure || s.flags.probed || (c(s, 'firstRead') > 0 && s.turn >= c(s, 'firstRead') + 2);
  if (!sure) {
    if (!c(s, 'firstRead')) s = setCounter(s, 'firstRead', s.turn);
    const [a, b] = [v.pattern, v.decoy].sort();
    r.push(rask('raskTorn', { ...vars(s), a: PATTERN_WORDS[a as Pattern], b: PATTERN_WORDS[b as Pattern] }));
    return setFlag(s, 'raskTornHeard');
  }
  s = revealFact(s, 'pattern');
  s = setFlag(s, 'raskRead');
  if (!broken(s)) s = setFlag(s, 'readBeforeBreak');
  r.push(rask(`raskRead_${v.pattern}`, vars(s)));
  r.push(rask(`raskCounsel_${v.pattern}`, vars(s)));
  return s;
}

function revealTerrain(s: WorldState): WorldState {
  return revealFact(s, 'terrain');
}

// ------------------------------------------------------------------ the people ---

const REPLY_KEYS = [
  'draycottStatus', 'draycottAfter', 'draycottScoffs', 'draycottTakes', 'draycottYield', 'draycottWhatFor', 'draycottAccepts', 'draycottNoProtection', 'draycottStrikeNo', 'draycottProudNo', 'draycottDesperateNo',
  'draycottStrikes', 'draycottBluffBurned', 'draycottCallsOff', 'draycottCallsBluff', 'draycottNamed', 'draycottWrong', 'draycottDebt', 'draycottNoDebt', 'draycottInCustody', 'draycottNoDeal',
  'skerritStatus', 'skerritAfter', 'skerritRefused', 'skerritTakes', 'skerritDebt', 'skerritWatching', 'skerritGoes',
];
function once(who: 'draycott' | 'skerrit', fn: (s: WorldState, t: string, r: Report[]) => WorldState) {
  return (s: WorldState, t: string, r: Report[]): WorldState => {
    const mine: Report[] = [];
    s = fn(s, t, mine);
    const mark = s.log.length + 1;
    const fresh = c(s, `${who}Mark`) !== mark;
    let heard = fresh ? 0 : c(s, `${who}Heard`);
    for (const x of mine) {
      const i = REPLY_KEYS.indexOf(x.key);
      const bit = i < 0 ? 0 : 2 ** i;
      if (!bit) {
        r.push(x);
        continue;
      }
      if (Math.floor(heard / bit) % 2 === 1) continue;
      heard += bit;
      r.push(x);
    }
    s = setCounter(s, `${who}Mark`, mark);
    return setCounter(s, `${who}Heard`, heard);
  };
}

const negated = (t: string, re: RegExp) => {
  const m = t.match(re);
  if (!m || m.index === undefined) return false;
  return NEG.test(t.slice(Math.max(0, m.index - 24), m.index + m[0].length));
};

function strikeColours(s: WorldState, r: Report[], key: string): WorldState {
  s = setFlag(s, 'struck');
  s = setFlag(s, 'kestrelSurrendered');
  s = setFlag(s, 'kestrelFired', false);
  s = setCounter(s, 'struckAt', s.turn);
  s = patchShip(s, 'kestrel', { weapons: { state: 'safe', target: null }, disposition: 'neutral' });
  r.push(comms('draycott', key, vars(s)));
  return s;
}

function draycottReply(s: WorldState, t: string, r: Report[]): WorldState {
  const v = corsairs(s);
  if (settled(s)) {
    r.push(comms('draycott', 'draycottAfter'));
    return s;
  }
  s = setFlag(s, 'spokeDraycott');
  if (FEIGN.test(t) && !negated(t, FEIGN)) {
    s = setFlag(s, 'falseRuse');
    r.push(comms('draycott', 'draycottScoffs'));
    return s;
  }
  if (CARGO.test(t) && !negated(t, CARGO) && !struck(s)) return giveCargo(s, r, 'draycottTakes');
  if (YIELD.test(t) && !negated(t, YIELD)) {
    s = setFlag(s, 'yielded');
    r.push(comms('draycott', 'draycottYield'));
    return s;
  }
  if (s.flags.protectionAccepted || struck(s)) {
    r.push(comms('draycott', 'draycottInCustody', vars(s)));
    return s;
  }
  if (PROTECT.test(t) && !negated(t, PROTECT)) {
    if (s.flags.falseRuse || s.flags.firedOnBeaten) {
      r.push(comms('draycott', 'draycottNoDeal'));
      return s;
    }
    if (!knows(s, 'debt')) {
      r.push(comms('draycott', 'draycottWhatFor'));
      return s;
    }
    const takes = broken(s) || v.nerve === 'desperate' || v.nerve === 'wavering';
    if (!takes) {
      r.push(comms('draycott', 'draycottNoProtection'));
      return s;
    }
    s = setFlag(s, 'protectionAccepted');
    s = setFlag(s, 'protectionOffered');
    s = strikeColours(s, r, 'draycottAccepts');
    if (!s.flags.gavelHere) s = setCounter(s, 'gavelAt', Math.min(c(s, 'gavelAt') || v.collector, s.turn + 2));
    return s;
  }
  if (STRIKE.test(t) && !negated(t, STRIKE)) {
    if (s.flags.falseRuse) {
      r.push(comms('draycott', 'draycottNoDeal'));
      return s;
    }
    if (!broken(s)) {
      r.push(comms('draycott', 'draycottStrikeNo', vars(s)));
      return s;
    }
    if (v.nerve === 'wavering' || (v.nerve === 'proud' && s.flags.readBeforeBreak && !s.flags.firedOnHer)) {
      s = strikeColours(s, r, 'draycottStrikes');
      return setFlag(s, 'endStruck');
    }
    r.push(comms('draycott', v.nerve === 'proud' ? 'draycottProudNo' : 'draycottDesperateNo', vars(s)));
    if (v.nerve === 'desperate' && !knows(s, 'debt')) s = revealFact(s, 'debt');
    return s;
  }
  if (BLUFF.test(t) || (s.flags.staged && /\b(look|see|check|listen|hear)\b.*\b(traffic|scope|sensors|board|frigate)\b/.test(t))) {
    if (s.flags.bluffBurned || s.flags.falseRuse) {
      r.push(comms('draycott', 'draycottBluffBurned'));
      return s;
    }
    const lands = broken(s) || v.nerve === 'wavering' || (v.nerve === 'proud' && (!!s.flags.staged || !!s.flags.namedPlay));
    if (lands) {
      s = setFlag(s, 'calledOff');
      s = setFlag(s, 'bluffed');
      s = setFlag(s, 'kestrelFired', false);
      s = patchShip(s, 'kestrel', { weapons: { state: 'safe', target: null } });
      r.push(comms('draycott', 'draycottCallsOff', vars(s)));
      return setFlag(s, 'endCalled');
    }
    s = setFlag(s, 'bluffBurned');
    r.push(comms('draycott', 'draycottCallsBluff', vars(s)));
    return s;
  }
  if (NAME_PLAY.test(t)) {
    const said = /\b(pincer|crossfire)\b/.test(t) ? 'pincer' : /\b(herd\w*|drive us|driving us|sump|dead end)\b/.test(t) ? 'herd' : /\b(bleed\w*|wear us down|pick at us|nibble)\b/.test(t) ? 'bleed' : '';
    if (!knows(s, 'pattern') || (said && said !== v.pattern)) {
      r.push(comms('draycott', 'draycottWrong'));
      return setFlag(s, 'namedWrong');
    }
    s = setFlag(s, 'namedPlay');
    r.push(comms('draycott', 'draycottNamed', vars(s)));
    return s;
  }
  if (DEBT.test(t)) {
    if (v.nerve !== 'proud' || broken(s)) {
      s = revealFact(s, 'debt');
      r.push(comms('draycott', 'draycottDebt', vars(s)));
      return s;
    }
    r.push(comms('draycott', 'draycottNoDebt'));
    return s;
  }
  r.push(comms('draycott', 'draycottStatus', vars(s)));
  return s;
}

function skerritReply(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(comms('skerrit', 'skerritAfter'));
    return s;
  }
  s = setFlag(s, 'spokeSkerrit');
  if (s.flags.protectionAccepted) {
    if (HANDOVER.test(t) && !negated(t, HANDOVER)) {
      s = setFlag(s, 'handedOver');
      r.push(comms('skerrit', 'skerritTakes', vars(s)));
      return setFlag(s, 'endHanded');
    }
    if (REFUSE.test(t) || PROTECT.test(t)) {
      s = setFlag(s, 'refusedHandover');
      r.push(comms('skerrit', 'skerritRefused', vars(s)));
      return setFlag(s, 'endCreditor');
    }
  }
  if (DEBT.test(t) || /\b(draycott|her|she)\b/.test(t)) {
    s = revealFact(s, 'debt');
    r.push(comms('skerrit', 'skerritDebt', vars(s)));
    return s;
  }
  r.push(comms('skerrit', s.flags.protectionAccepted ? 'skerritStatus' : 'skerritWatching', vars(s)));
  return s;
}

export const draycottRespond = once('draycott', draycottReply);
export const skerritRespond = once('skerrit', skerritReply);

function giveCargo(s: WorldState, r: Report[], key: string): WorldState {
  s = setFlag(s, 'cargoGiven');
  r.push(key === 'draycottTakes' ? comms('draycott', key, vars(s)) : say('comms', key, vars(s)));
  return setFlag(s, 'endPlundered');
}

// ------------------------------------------------------------------ orders ---

/** The officer an order was addressed to, passed on by the interpreter as a prefix ("helm: …"). */
const PREFIX = /^(xo|tactical|sensors|science|ops|helm|comms|engineering|medical): /;

export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const low = raw.toLowerCase();
  const to = (low.match(PREFIX)?.[1] ?? '') as string;
  const t = low.replace(PREFIX, '');
  if (settled(s)) {
    r.push(xo('afterEnd'));
    return s;
  }
  // Ruses that the law forbids.
  if (FEIGN.test(t) && !negated(t, FEIGN)) return refuseRuse(s, raw, r);
  if (STAGE.test(t)) return stage(s, r);
  // The collector.
  if (HANDOVER.test(t) && !negated(t, HANDOVER) && s.flags.protectionAccepted) {
    if (!s.flags.gavelHere) {
      r.push(xo('xoNoCollectorYet'));
      return s;
    }
    r.push(szabo('relayed'));
    return skerritRespond(s, t, r);
  }
  if (CARGO.test(t) && !negated(t, CARGO) && /\b(jettison|release|eject|dump|drop|open|give|hand|let them have)\b/.test(t)) {
    if (struck(s) || s.flags.calledOff) {
      r.push(xo('xoNoNeedCargo'));
      return s;
    }
    return giveCargo(s, r, 'cargoReleased');
  }
  // Talking to the corsairs or the collector through comms.
  if (SKERRIT_WORD.test(t) && TELL.test(t)) {
    if (!s.flags.gavelHere) {
      r.push(xo('xoNoCollectorYet'));
      return s;
    }
    r.push(szabo('relayed'));
    return skerritRespond(s, t, r);
  }
  if (CORSAIR_WORD.test(t) && TELL.test(t) && !CHARGE.test(t)) {
    r.push(szabo('relayed'));
    return draycottRespond(s, t, r);
  }
  if (LISTEN.test(t)) return listen(s, r);
  if (CHARTS.test(t)) return charts(s, r);
  if (PING.test(t)) return ping(s, r);
  if (PROBE.test(t)) return probe(s, r);
  if (UNDARK.test(t)) {
    if (!s.flags.dark) {
      r.push(okafor('okaforNotDark'));
      return s;
    }
    return lightUp(s, r);
  }
  let did = false;
  if (DARK.test(t)) {
    s = goDark(s, r);
    did = true;
  }
  if (GHOST.test(t)) {
    s = ghost(s, r);
    did = true;
  }
  if (CLEAR.test(t)) return clearNeedle(s, r);
  if (CHARGE.test(t)) return moveTo(s, 'charge', r);
  if (EXIT.test(t)) return exit(s, r);
  if (SUMP_WORD.test(t)) return moveTo(s, 'gap', r);
  if (NEEDLE_WORD.test(t)) return moveTo(s, 'needle', r);
  if (SHADOW_WORD.test(t)) return moveTo(s, 'shadow', r);
  if (GAP_WORD.test(t)) return moveTo(s, 'gap', r);
  if (POCKET_WORD.test(t)) return moveTo(s, 'pocket', r);
  if (did) return s;
  if (to === 'tactical' || /\brask\b/.test(t)) return raskRead(s, r);
  r.push(xo('corsairsUnclear', { description: raw.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const low = raw.toLowerCase();
  const to = (low.match(PREFIX)?.[1] ?? '') as string;
  const t = low.replace(PREFIX, '');
  const v = corsairs(s);
  if (to === 'tactical' || /\b(rask|teodor)\b/.test(t) || PATTERN_Q.test(t)) {
    if (/\b(torpedo\w*|seekers?)\b/.test(t)) {
      r.push(rask('raskTorpedoes'));
      return s;
    }
    return raskRead(s, r);
  }
  if (to === 'helm' || /\b(adeyemi|kofi|ensign)\b/.test(t)) {
    if (GAP_WORD.test(t) || /\b(way out|exit|get out)\b/.test(t)) {
      if (v.pattern === 'herd') {
        s = setFlag(s, 'adeyemiWarned');
        r.push(helm('adeyemiSump', vars(s)));
        return s;
      }
      r.push(helm('adeyemiGapOk'));
      return s;
    }
    r.push(helm('adeyemiRocks', vars(s)));
    return s;
  }
  if (to === 'engineering' || /\b(chief|okafor)\b/.test(t)) {
    if (/\b(rubble|needle|clear)\b/.test(t)) return clearNeedle(s, r);
    r.push(okafor('okaforOptions'));
    return s;
  }
  if (to === 'comms' || /\b(szabo|mirela)\b/.test(t) || /\b(bryony|skiff|distress|call|recording)\b/.test(t)) {
    s = revealFact(s, 'recorded');
    r.push(szabo(knows(s, 'debt') && s.flags.listened ? 'szaboDebtAgain' : 'szaboRecording', vars(s)));
    return s;
  }
  if (to === 'sensors' || to === 'science' || /\b(varga|oona)\b/.test(t) || TERRAIN_Q.test(t)) {
    r.push(varga(knows(s, 'terrain') ? 'vargaTerrain' : 'vargaBlind', vars(s)));
    return s;
  }
  if (SKERRIT_WORD.test(t)) {
    r.push(xo(s.flags.gavelHere || knows(s, 'debt') ? 'xoSkerrit' : 'xoSkerritUnknown', vars(s)));
    return s;
  }
  if (CORSAIR_WORD.test(t) && !COUNSEL.test(t)) {
    r.push(xo('xoDraycott', vars(s)));
    return s;
  }
  if (COUNSEL.test(t)) {
    const key = !knows(s, 'pattern') ? 'xoCounselRead' : !knows(s, 'terrain') ? 'xoCounselGround' : !broken(s) && !quiet(s) ? 'xoCounselBreak' : !knows(s, 'debt') ? 'xoCounselDebt' : 'xoCounselFinish';
    r.push(xo(key, vars(s)));
    return s;
  }
  if (CASE.test(t) || IS_QUESTION.test(t)) {
    r.push(xo('xoCase', vars(s)));
    return s;
  }
  r.push(xo('xoCase', vars(s)));
  return s;
}

// ------------------------------------------------------------------ the clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  s = setFlag(s, 'firedThisTurn', false);
  step(housekeeping);
  step(contacts);
  step(work);
  step(fight);
  // Snapshot what the Hagfish has, so a torpedo lost in the dust can be put right next minute.
  s = setCounter(s, 'torpSeen', c(s, 'torpedoes'));
  s = setCounter(s, 'hagHull', s.ships.kestrel.hull);
  s = setCounter(s, 'hagShield', s.ships.kestrel.shields.strength);
  s = setCounter(s, 'minHull', Math.min(c(s, 'minHull') || 100, s.ships.halcyon.hull));
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel', 'cruiser'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  // The dust spoofs torpedo seekers: a torpedo fired into the shoal is lost.
  if (c(s, 'torpedoes') < c(s, 'torpSeen')) {
    s = setFlag(s, 'torpedoLost');
    const k = s.ships.kestrel;
    if (!k.destroyed) s = patchShip(s, 'kestrel', { hull: Math.max(k.hull, c(s, 'hagHull')), shields: { raised: true, strength: Math.max(k.shields.strength, c(s, 'hagShield')) } });
    r.push(rask(s.flags.torpWarned ? 'raskTorpedoLostAgain' : 'raskTorpedoLost'));
    s = setFlag(s, 'torpWarned');
  }
  // The Halcyon fired since the last minute.
  const fired = c(s, 'playerFiredTurn');
  if (fired > c(s, 'lastHalcyonFire')) {
    s = setCounter(s, 'lastHalcyonFire', fired);
    s = setFlag(s, 'firedThisTurn');
    const target = s.ships.halcyon.weapons.target;
    if (target === 'cruiser') {
      s = setFlag(s, 'gavelShot');
      if (s.flags.gavelHere) {
        r.push(comms('skerrit', 'skerritShot'));
        s = setFlag(s, 'gavelHere', false);
        s = patchShip(s, 'cruiser', { detected: false });
        if (s.flags.protectionAccepted) return setFlag(s, 'endStruck');
      }
    } else if (target === 'kestrel') {
      s = setFlag(s, 'firedOnHer');
      if (!s.flags.opened && !quiet(s)) {
        s = setFlag(s, 'firedFirst');
        s = openFire(s, r, 'draycottFiredOn');
      } else if (quiet(s) && !s.ships.kestrel.destroyed) {
        if (!s.flags.firedOnBeaten) r.push(rask('raskBeaten'));
        s = setFlag(s, 'firedOnBeaten');
        // Fired on after she had stopped fighting: she strikes at once, and the exercise ends there.
        if (!struck(s)) s = strikeColours(s, r, 'draycottBeaten');
      }
    }
    if (s.flags.dark) s = lightUp(s, r, 'okaforFireBroke');
  }
  // Raising shields ends running dark.
  if (s.flags.dark && s.ships.halcyon.shields.raised) s = lightUp(s, r, 'okaforShieldsBroke');
  if (s.flags.jumped || Math.hypot(s.ships.halcyon.position.x, s.ships.halcyon.position.y) > 30000) return leave(s, r);
  return s;
}

function openFire(s: WorldState, r: Report[], key: string): WorldState {
  s = setFlag(s, 'opened');
  s = setFlag(s, 'kestrelFired');
  s = setCounter(s, 'openedAt', s.turn);
  s = patchShip(s, 'kestrel', { weapons: { state: 'locked', target: 'halcyon' }, disposition: 'hostile' });
  r.push(comms('draycott', key, vars(s)));
  return s;
}

function contacts(s: WorldState, r: Report[]): WorldState {
  const v = corsairs(s);
  if (s.turn >= 1 && !s.flags.draycottCalled) {
    s = setFlag(s, 'draycottCalled');
    s = revealFact(s, 'ambush');
    r.push(comms('draycott', 'draycottCall', vars(s)));
  }
  if (s.turn >= 2 && !s.flags.raskWatching && !knows(s, 'pattern')) {
    s = setFlag(s, 'raskWatching');
    r.push(rask('raskWatching'));
  }
  const pa = c(s, 'probeAt');
  if (pa > 0 && s.turn >= pa) {
    s = setCounter(s, 'probeAt', 0);
    s = setFlag(s, 'probed');
    s = setFlag(s, 'readSure');
    s = revealTerrain(s);
    r.push(varga('vargaProbeBack', vars(s)));
  }
  const ca = c(s, 'chartsAt');
  if (ca > 0 && s.turn >= ca) {
    s = setCounter(s, 'chartsAt', 0);
    s = setFlag(s, 'chartsIn');
    s = revealTerrain(s);
    r.push(szabo('szaboChartsIn', vars(s)));
  }
  // The collector's gunship.
  const ga = c(s, 'gavelAt') || v.collector;
  if (!s.flags.gavelHere && !s.flags.gavelGone && !s.flags.gavelShot && s.turn >= ga) {
    s = setFlag(s, 'gavelHere');
    s = setCounter(s, 'skerritAt', s.turn);
    s = revealFact(s, 'collector');
    s = patchShip(s, 'cruiser', { detected: true, scanLevel: 1 });
    r.push(varga('vargaGavel'));
    r.push(comms('skerrit', s.flags.protectionAccepted ? 'skerritDemand' : 'skerritArrives', vars(s)));
  }
  if (s.flags.gavelHere && s.flags.protectionAccepted && s.turn >= c(s, 'skerritAt') + 3) {
    s = setFlag(s, 'gavelHere', false);
    s = setFlag(s, 'gavelGone');
    s = patchShip(s, 'cruiser', { detected: false });
    r.push(comms('skerrit', 'skerritGoes'));
    return setFlag(s, 'endStruck');
  }
  return s;
}

function work(s: WorldState, r: Report[]): WorldState {
  const v = corsairs(s);
  // A move arrives.
  const ma = c(s, 'moveAt');
  if (ma > 0 && s.turn >= ma) {
    let p = POS[c(s, 'moveTo')] ?? 'pocket';
    if (p === 'gap' && v.pattern === 'herd') p = 'sump';
    s = setCounter(s, 'pos', posIndex(p));
    s = setCounter(s, 'moveAt', 0);
    s = setCounter(s, 'held', 0);
    if (p === 'sump') {
      s = setFlag(s, 'inSump');
      s = setCounter(s, 'boardAt', s.turn + 1);
      r.push(helm('inTheSump'));
    } else if (p === 'needle' && !needleOpen(s)) {
      s = revealTerrain(s);
      r.push(helm('arrivedNeedleChoked'));
    } else if (p === 'shadow' && s.flags.dark) {
      r.push(helm(v.anvil === 'iron' ? 'arrivedShadowIronDark' : 'arrivedShadowIceDark'));
      if (v.anvil === 'ice') s = revealTerrain(s);
    } else r.push(helm(`arrived_${p}`, vars(s)));
  }
  // The Chief's crew shift the rubble.
  const cl = c(s, 'clearAt');
  if (cl > 0 && s.turn >= cl) {
    s = setCounter(s, 'clearAt', 0);
    if (posOf(s) === 'needle') {
      s = setFlag(s, 'needleCleared');
      r.push(okafor('okaforNeedleCleared'));
    }
  }
  // Boarded in the Sump.
  const ba = c(s, 'boardAt');
  if (ba > 0 && s.turn >= ba && posOf(s) === 'sump' && !quiet(s)) {
    r.push(rask('boardedInSump'));
    return setFlag(s, 'endBoarded');
  }
  // Leaving the shoal.
  const ea = c(s, 'exitAt');
  if (ea > 0 && s.turn >= ea) {
    s = setCounter(s, 'exitAt', 0);
    return leave(s, r);
  }
  // Draycott's minutes run out.
  if (!s.flags.opened && !quiet(s) && s.turn >= v.ultimatum) s = openFire(s, r, 'draycottTimeUp');
  return s;
}

/** The fight: the counter, the corsairs' volleys, and what the Halcyon's own fire has done. */
function fight(s: WorldState, r: Report[]): WorldState {
  const v = corsairs(s);
  const k = s.ships.kestrel;
  // The Hagfish destroyed.
  if (k.destroyed) {
    s = setCounter(s, 'corsairDead', c(s, 'kestrelDead'));
    r.push(rask('hagfishDestroyed', vars(s)));
    return setFlag(s, s.flags.firedFirst || s.flags.firedOnBeaten || s.flags.struckBeforeKill ? 'endNoQuarter' : 'endPyrrhic');
  }
  // The Hagfish disabled by the Halcyon's guns.
  if (k.hull <= 40 && !struck(s)) {
    s = setFlag(s, 'disabledHer');
    if (s.flags.firedOnBeaten) {
      s = strikeColours(s, r, 'draycottBeaten');
      return setFlag(s, 'endNoQuarter');
    }
    s = strikeColours(s, r, 'draycottDisabled');
    return setFlag(s, 'endPyrrhic');
  }
  if (struck(s) && s.flags.firedOnBeaten && !s.flags.protectionAccepted) {
    return setFlag(s, 'endNoQuarter');
  }
  if (quiet(s)) {
    // Broken but not struck: given a few minutes, the corsairs slip away into the dust.
    if (broken(s) && !struck(s) && !s.flags.calledOff && s.turn >= c(s, 'brokenAt') + 4) {
      r.push(rask('corsairsSlipAway'));
      return leave(s, r);
    }
    return s;
  }
  // The counter.
  if (s.turn >= 1) {
    if (countering(s) && !c(s, 'moveAt')) {
      const add = ghostOn(s) && masked(s) ? 2 : 1;
      s = setCounter(s, 'held', c(s, 'held') + add);
      if (c(s, 'held') >= 2) return breakPlan(s, r);
    } else s = setCounter(s, 'held', 0);
  }
  if (!s.flags.opened) return s;
  // The corsairs' volley.
  if (posOf(s) === 'sump') {
    r.push(rask('sumpClosing'));
    return s;
  }
  if (masked(s)) {
    s = patchShip(s, 'kestrel', { weapons: { state: 'armed', target: null } });
    r.push(rask(ghostOn(s) ? 'raskGhostDrawing' : 'raskLostUs'));
    return s;
  }
  s = patchShip(s, 'kestrel', { weapons: { state: 'locked', target: 'halcyon' } });
  s = setFlag(s, 'kestrelFired');
  const dmg = volley(s);
  s = setCounter(s, 'volleys', c(s, 'volleys') + 1);
  const h = s.ships.halcyon;
  let toHull = dmg;
  if (h.shields.raised && h.shields.strength > 0) {
    toHull = Math.round(dmg * 0.2);
    const strength = Math.max(0, h.shields.strength - Math.round(dmg * 0.6));
    s = patchShip(s, 'halcyon', { shields: { raised: strength > 0, strength } });
    if (strength === 0) r.push(rask('shieldsCollapsed'));
  }
  const hull = Math.max(0, s.ships.halcyon.hull - toHull);
  s = patchShip(s, 'halcyon', { hull });
  s = setCounter(s, 'damageTaken', c(s, 'damageTaken') + toHull);
  if (hull <= 40) {
    r.push(rask('boardedHull', vars(s)));
    return setFlag(s, 'endBoarded');
  }
  const p = posOf(s);
  const key = p === 'gap' && v.pattern === 'pincer' ? 'volleyCrossfire' : p === 'charge' && v.pattern !== 'bleed' ? 'volleyFlanked' : p === 'needle' && !needleOpen(s) ? 'volleyChoked' : p === 'needle' && v.pattern === 'bleed' ? 'volleyBleedNeedle' : 'volley';
  r.push(rask(key, { ...vars(s), damage: toHull }));
  return s;
}

function volley(s: WorldState): number {
  const v = corsairs(s);
  const p = posOf(s);
  const base = 6 + 4 * c(s, 'escorts');
  const ironDark = masked(s);
  const M: Record<Pattern, Record<Pos, number>> = {
    pincer: { pocket: 1, needle: needleOpen(s) ? 0.3 : 1.2, shadow: ironDark ? 0.2 : 0.8, charge: 2, gap: 1.5, sump: 0 },
    herd: { pocket: 1, needle: needleOpen(s) ? 0.3 : 1.2, shadow: ironDark ? 0.2 : 0.8, charge: 1.3, gap: 1, sump: 0 },
    bleed: { pocket: 1, needle: 1, shadow: ironDark ? 0.2 : 0.8, charge: 0.4, gap: 1, sump: 0 },
  };
  let m = M[v.pattern][p];
  if ((s.counters.evasive_halcyon ?? -1) === s.turn) m *= 0.8;
  if (c(s, 'pingTurn') === s.turn) m *= 1.5;
  if (ghostOn(s)) m *= 0.6;
  if (s.flags.firedThisTurn) m *= 1.3;
  // A hurt flagship hits less hard.
  m *= Math.max(0.5, s.ships.kestrel.hull / 100);
  return Math.round(base * m);
}

function breakPlan(s: WorldState, r: Report[]): WorldState {
  const v = corsairs(s);
  s = setFlag(s, 'planBroken');
  s = setCounter(s, 'brokenAt', s.turn);
  s = setFlag(s, 'kestrelFired', false);
  if (!s.flags.firedOnHer) s = setFlag(s, 'brokeWithoutGuns');
  s = patchShip(s, 'kestrel', { weapons: { state: 'armed', target: null } });
  r.push(rask(`planBroken_${v.pattern}`, vars(s)));
  r.push(comms('draycott', 'draycottBroken', vars(s)));
  return s;
}
