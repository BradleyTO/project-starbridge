/**
 * Offline dialogue for Ion Season: the two hauler masters on the convoy net.
 *
 * Captain Odran Brack of the Saffron Mule is old, slow-spoken and proud; he has crossed the Corrie
 * Drift for thirty seasons and knows the Fringe as well as anyone alive. Captain Rosalind Teague of
 * Gannet's Luck is quick, blunt and in a hurry. If one of them is unfit to fly the Maw, they will
 * not say so to a stranger on an open channel. They may say so to a captain who asks plainly, who
 * has earned some trust, who asks in private, or who already has the evidence.
 */
import type { DialogueProvider, SpeakAction } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { closeChannel, openChannel } from '../../engine/comms';
import { knows, setCounter, setFlag, setMemory } from '../../engine/state';
import type { Hauler } from './setup';
import { CAPTAIN, CAPTAIN_NAME, SHIP_NAME, SLOT, haulerOfParty, ion, otherCh } from './setup';
import { adjustHaulerTrust, admit, alone, band, captainAlive, cm, crewOff, handled, isUnfit, relieve, remoteHelm, speak, through, trustOf, vars } from './agents';

export const FITNESS = /\b(fit|unfit|well|all right|alright|okay|ok|tired|sleep|slept|rest(ed)?|hands?|shak\w*|trembl\w*|tremor|steady|how are you|feeling|unwell|sick|awake|exhausted|honest(ly)?|truth|is something wrong|what'?s wrong)\b/;
export const RELIEVE = /\b(hand (over|the helm|it over|off)|let (your|the) mate|(your|the) mate (take|fly|have)|mate (take|fly|have)|reliev\w*|stand down|step (back|down|away) from the helm|take a rest|get some (sleep|rest)|let someone else|quill|hollow)\b/;
export const REMOTE_ASK = /\b(slave (your|the) helm|fly (her|it|your ship|the \w+) (for you|from here)|let us fly|let (my|our) helm(sman)? fly|remote|by wire|we('ll| will| can) fly (her|it|your ship))\b/;
export const HOLD = /\b(hold|wait|stay|patience|trust me|stick with|keep with|stay with|together|don'?t go|we'?ll get you through|bear with|one more minute|almost|not yet|nearly|steady on|easy)\b/;
export const LORE = /\b(which|channel|high|low|way through|line|know (it|the|this)|been through|advice|what would you|your read|how do you (cross|run|take)|fringe|combs|maw|thirty seasons|seasons)\b/;

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });

export function captainRespond(s: WorldState, a: SpeakAction, _rng: Rng): Applied {
  const r: Report[] = [];
  const h = haulerOfParty(a.to);
  const t = (a.text ?? '').toLowerCase();
  const priv = !!openChannel(s)?.private;
  if (!captainAlive(s, h)) return done(closeChannel(s, a.to), [say('comms', 'noAnswerHauler', vars(s, h))]);
  if (crewOff(s, h) || s.characters[CAPTAIN[h]].ship === 'halcyon') return done(s, [say('comms', 'captainAboard', vars(s, h))]);
  if (through(s) || s.flags.turnedBack) return done(speak(s, h, 'afterwards', r), r);
  if (h === 'gannet' && alone(s)) return done(speak(s, h, 'aloneBusy', r), r);
  if (REMOTE_ASK.test(t)) return done(remoteHelm(s, h, r), r);
  if (RELIEVE.test(t)) return done(relieve(s, h, r), r);
  if (FITNESS.test(t)) return done(fitness(s, h, priv, r), r);
  if (h === 'gannet' && HOLD.test(t)) return done(steady(s, r), r);
  if (LORE.test(t) || a.intents.includes('ask' as never)) return done(lore(s, h, r), r);
  if (HOLD.test(t)) return done(speak(s, h, 'brackHolds', r, { tell: tell(s, h) }), r);
  s = adjustHaulerTrust(s, h, 1);
  return done(speak(s, h, 'chatter', r, { tell: tell(s, h) }), r);
}

/** An unfit, unrelieved master gives themself away in their voice (for those who listen). */
export const tell = (s: WorldState, h: Hauler) => (isUnfit(s, h) && !handled(s, h) ? 1 : 0);

function fitness(s: WorldState, h: Hauler, priv: boolean, r: Report[]): WorldState {
  s = setMemory(s, CAPTAIN[h], 'asked', (cm(s, h).asked ?? 0) + 1);
  if (!isUnfit(s, h)) {
    s = adjustHaulerTrust(s, h, (cm(s, h).asked ?? 0) > 1 ? -4 : 0);
    return speak(s, h, 'fitFine', r);
  }
  if (cm(s, h).admitted) return speak(s, h, 'admitsAgain', r);
  const evidence = knows(s, 'drift') || knows(s, 'unfit');
  const t = trustOf(s, h);
  if (evidence || t >= 60 || (priv && t >= 45)) return admit(s, h, r);
  s = adjustHaulerTrust(s, h, priv ? 8 : 4);
  return speak(s, h, 'deflects', r, { tell: 1 });
}

function steady(s: WorldState, r: Report[]): WorldState {
  const n = cm(s, 'gannet').steadied ?? 0;
  if (n >= 2) return speak(s, 'gannet', 'teagueNoMore', r);
  s = setMemory(s, 'teague', 'steadied', n + 1);
  s = setCounter(s, 'teagueHold', 0);
  s = setFlag(s, 'steadiedTeague');
  s = adjustHaulerTrust(s, 'gannet', 3);
  return speak(s, 'gannet', 'teagueHolds', r, { tell: tell(s, 'gannet') });
}

function lore(s: WorldState, h: Hauler, r: Report[]): WorldState {
  const v = ion(s);
  const b = band(s);
  s = setCounter(s, 'loreBand', b + 1);
  if (h === 'gannet') return speak(s, h, 'teagueLean', r, { ch: v.teagueLean[b], b });
  if (b > 0) return speak(s, h, 'brackDefers', r, { tell: tell(s, h) });
  return speak(s, h, 'brackLore', r, { ch: isUnfit(s, 'mule') && !handled(s, 'mule') ? otherCh(v.calm[0]) : v.calm[0], tell: tell(s, h) });
}

export const ionDialogue: DialogueProvider = {
  id: 'ion-offline',
  speakerName(_s, party: Party) {
    return CAPTAIN_NAME[haulerOfParty(party)];
  },
  vesselName(_s, party: Party) {
    return SHIP_NAME[haulerOfParty(party)];
  },
  greet(s, party, _rng, opts) {
    const h = haulerOfParty(party);
    const r: Report[] = [];
    if (!captainAlive(s, h)) return done(closeChannel(s, party), [say('comms', 'noAnswerHauler', vars(s, h))]);
    if (crewOff(s, h) || s.characters[CAPTAIN[h]].ship !== SLOT[h]) return done(closeChannel(s, party), [say('comms', 'captainAboard', vars(s, h))]);
    if (through(s) || s.flags.turnedBack) return done(speak(s, h, 'afterwards', r), r);
    if (h === 'gannet' && alone(s)) return done(speak(s, h, 'aloneBusy', r), r);
    const first = !cm(s, h).met;
    s = setMemory(s, CAPTAIN[h], 'met', 1);
    return done(speak(s, h, first ? 'greetFirst' : 'greet', r, { tell: tell(s, h), priv: opts.private ? 1 : 0, relieved: cm(s, h).relieved ? 1 : 0 }), r);
  },
  respond(s, a, rng) {
    return captainRespond(s, a, rng);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
