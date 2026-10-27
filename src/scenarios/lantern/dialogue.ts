/**
 * Offline dialogue for The Lantern Drift: the custodian Wick (speaking for the Eventide), the
 * charter's Speaker once she is awake, and the salvor on the Kittiwake.
 *
 * Wick speaks slowly and formally, counts everything, and calls the sleepers "my nine hundred".
 * What it needs before it lets anyone wake them depends on what three centuries alone have done to
 * it (seeded): evidence, honesty about the cost, or the doctor's own hands on the pods.
 * Salvage-Master Corwin Vollan is brisk and practical; whether his licence is any good is seeded.
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { EVENTIDE, SPEAKER, TUG, VOLLAN, WICK } from './setup';
import { settled, vars, vollanRespond, wickRespond } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isTug = (p: Party) => p === 'cruiser';
const speakerUp = (s: WorldState) => !!s.flags.speakerAwake && !s.flags.speakerDied;

const FILLER = new Set(['wickKeeping', 'vollanWaiting', 'vollanDealDone', 'orreyAfter']);

export const lanternDialogue: DialogueProvider = {
  id: 'lantern-offline',
  speakerName(s, party: Party) {
    return isTug(party) ? VOLLAN : speakerUp(s) ? SPEAKER : WICK;
  },
  vesselName(_s, party: Party) {
    return isTug(party) ? TUG : EVENTIDE;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isTug(party)) r.push(comms('vollan', settled(s) ? 'vollanAfter' : 'vollanGreet', vars(s)));
    else if (speakerUp(s)) r.push(comms('orrey', 'orreyGreet', vars(s)));
    else r.push(comms('wick', settled(s) ? 'wickAfter' : s.flags.lockdown ? 'wickSealed' : 'wickGreet', vars(s)));
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    if (settled(s)) {
      r.push(isTug(a.to) ? comms('vollan', 'vollanAfter') : comms('wick', 'wickAfter'));
      return done(s, r);
    }
    const who = isTug(a.to) ? 'vollan' : 'wick';
    const len = s.log.length;
    const last = s.log[len - 1];
    // Two sentences of one line reach here as two utterances: the second does not earn a stock
    // "standing by" reply when the first already drew an answer.
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isTug(a.to) ? vollanRespond(s, t, r) : wickRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
