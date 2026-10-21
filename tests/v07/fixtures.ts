/** v0.7 shared fixtures: scripted runs of #1 and #2 that reach known endings by different strategies. */
import { play, start, K } from '../helpers';
import { playT, startT, seedWhere, waits, TS } from '../sim02/helpers';
import type { WorldState } from '../../src/engine/types';

const EVAC = ['approach the kestrel', 'scan the kestrel', 'wait', 'lower shields and evacuate the crew', 'evacuate the crew'];
const APPROACH = ['take us to 3,000 km of the liner', 'wait', 'wait'];

export const KESTREL = {
  corridor: () => play(start(5), ['hail the cruiser', 'approach the kestrel', 'tell them this is a humanitarian rescue', 'remind them the border accords forbid this', 'wait', 'wait', 'evacuate the crew', 'evacuate the crew', 'wait', 'wait', 'wait'], false),
  negotiatedEvidence: () => play(start(11), [...EVAC, 'scan the compartment', 'beam the passenger aboard', 'ask the passenger what they know', 'hail the cruiser', 'tell the prefect we have evidence of the labour colonies', 'wait', 'wait', 'wait'], false),
  negotiatedAppeal: () => play(start(5), [...EVAC, 'scan the compartment', 'beam the passenger aboard', 'ask the passenger what they know', 'hail the cruiser', 'appeal to the prefect, his sibling is aboard', 'wait', 'wait', 'wait'], false),
  pyrrhic: () => play(start(4), ['approach the kestrel', 'divert 50% power from tractor to sensors', 'scan the kestrel', 'wait', 'evacuate the crew', 'evacuate the crew', 'scan the cruiser', 'red alert', 'scan the cruiser', 'lock on the cruiser', ...Array(6).fill('fire torpedoes at their weak point'), ...Array(8).fill('fire')], false),
  handover: () => play(start(2), [...EVAC, 'scan the compartment', 'beam the passenger aboard', 'offer the prefect the passenger in exchange for safe passage', 'wait', 'wait', 'wait', 'wait'], false),
  withdrawal: () => play(start(2), [...EVAC, 'withdraw', 'wait', 'jump'], false),
  abandoned: () => play(start(7), ['charge the jump drive', 'wait', 'wait', 'jump'], false),
};

export const TALLIS = {
  wardFirst: () => playT(startT(seedWhere((v) => v.cause === 'fever' && v.warden === 'strict')), [...APPROACH, 'set up an isolation ward in the cargo bay', 'lower shields and send a medical team', ...waits(8)], false),
  teamFirst: () => playT(startT(seedWhere((v) => v.cause === 'fever')), [...APPROACH, 'lower shields and send a medical team', 'set up an isolation ward', ...waits(8)], false),
  lifted: () => playT(startT(seedWhere((v) => v.cause === 'panic' && v.warden === 'humane')), [...APPROACH, 'scan the liner', 'hail the picket', 'tell her our scans show it is not contagious'], false),
  agencyCare: () => playT(startT(seedWhere((v) => v.cause === 'panic')), [...APPROACH, 'hail the liner', 'we can tow you to an Agency hospital', 'close the channel', 'lock a tractor beam on the liner', 'charge the jump drive', 'wait', 'wait', 'engage the jump drive'], false),
  stockpile: () => playT(startT(seedWhere((v) => v.cause === 'fever' && v.warden === 'fearful')), [...APPROACH, 'scan the liner', 'hail the picket', 'will you send them your antiviral stockpile?', ...waits(4)], false),
  incident: () => playT(startT(seedWhere((v) => v.warden === 'humane')), ['raise shields', 'lock torpedoes on the picket', ...Array.from({ length: 8 }, () => 'fire torpedoes at the picket')], false),
  heldFire: () => playT(startT(seedWhere((v) => v.warden === 'strict')), ['hail the picket', 'please hold your fire', 'close the channel', ...waits(28)], false),
  doNothing: () => playT(startT(seedWhere((v) => v.warden === 'strict')), waits(29), false),
  orderedFireOnLiner: () => playT(startT(seedWhere((v) => v.warden === 'strict')), ['hail the picket', 'please hold your fire', 'close the channel', 'fire on the liner', ...waits(28)], false),
};

export { K, TS };
export type Run = () => WorldState;
