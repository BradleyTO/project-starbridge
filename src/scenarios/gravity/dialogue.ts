/** Offline dialogue for Gravity's Edge: Director Aalto at Lisle Observatory (contact B). The probe has no voice. */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say } from '../../engine/report';
import { setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { AALTO, OBSERVATORY, PROBE_CAP } from './setup';
import { aaltoRespond } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isObs = (p: Party) => p === 'cruiser';

const FILLER = new Set(['aaltoStatus', 'aaltoAfter']);

export const gravityDialogue: DialogueProvider = {
  id: 'gravity-offline',
  speakerName(_s, party: Party) {
    return isObs(party) ? AALTO : PROBE_CAP;
  },
  vesselName(_s, party: Party) {
    return isObs(party) ? OBSERVATORY : PROBE_CAP;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (!isObs(party)) return done(s, [say('comms', 'probeNoVoice')]);
    return done(aaltoRespond(s, '', r), r);
  },
  respond(s, a) {
    const r: Report[] = [];
    if (!isObs(a.to)) return done(s, [say('comms', 'probeNoVoice')]);
    const t = (a.text ?? '').toLowerCase();
    const len = s.log.length;
    const last = s.log[len - 1];
    const again = (s.characters.aalto?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = aaltoRespond(s, t, r);
    next = setMemory(next, 'aalto', 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key) && !t;
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
