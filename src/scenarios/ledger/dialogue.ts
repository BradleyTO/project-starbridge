/**
 * Offline dialogue for Ghost Ledger: the two masters alongside, on the radio.
 *
 * Capt. Hesketh Moll of the Marrick Lark is a packet master who wants to sail on time; asked
 * straight about Mr Vesk's cargo, he will tell the truth, grumbling. Courier-Captain Sabine Thorne
 * of the Amber Script is the thief's handler. She denies everything to a captain with nothing but
 * an accusation; to a captain with the evidence she offers a quiet arrangement.
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { COURIER, MOLL, PACKET, THORNE } from './setup';
import { mollRespond, settled, thorneRespond } from './agents';
import { OFFREC, QUIET } from './words';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isCourier = (p: Party) => p === 'cruiser';

export const ledgerDialogue: DialogueProvider = {
  id: 'ledger-offline',
  speakerName(_s, party: Party) {
    return isCourier(party) ? THORNE : MOLL;
  },
  vesselName(_s, party: Party) {
    return isCourier(party) ? COURIER : PACKET;
  },
  greet(s, party) {
    const r: Report[] = [];
    const who = isCourier(party) ? 'thorne' : 'moll';
    r.push(comms(who, settled(s) ? `${who}After` : `${who}Greet`));
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    if (settled(s)) {
      r.push(comms(isCourier(a.to) ? 'thorne' : 'moll', isCourier(a.to) ? 'thorneAfter' : 'mollAfter'));
      return done(s, r);
    }
    if (isCourier(a.to)) return done(thorneRespond(s, t, r, QUIET, OFFREC), r);
    return done(mollRespond(s, t, r), r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
