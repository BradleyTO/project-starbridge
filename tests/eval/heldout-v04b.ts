/**
 * HELD-OUT SET v0.4b — written on 2026-10-19 AFTER the v0.4 interpreter work,
 * by someone who had NOT looked at how these phrasings parse, and committed
 * with its first result. The v0.4 set (heldout-v04.ts) was visible while the
 * parser was being built, so it no longer measures generalisation; this one
 * does. Never tune against it.
 */
import type { HeldOutV04 } from './heldout-v04';

const RAISE = { type: 'shields', raise: true };
const ARM = { type: 'weapons', mode: 'arm' };

export const HELD_OUT_V04B: HeldOutV04[] = [
  { order: 'Take us toward the freighter but keep the guns cold', expect: [{ type: 'maneuver', intent: 'approach', target: 'kestrel' }, { type: 'weapons', mode: 'safe' }], forbid: [ARM] },
  { order: 'Under no circumstances arm the weapons', expect: [{ type: 'restrict', subject: 'armWeapons' }], forbid: [ARM] },
  { order: 'Should the warship lock onto the Kestrel, put us between them', expect: [{ type: 'standing', trigger: { kind: 'weapons', ship: 'cruiser', state: 'locked' }, actions: [{ type: 'maneuver', intent: 'interpose' }] }] },
  { order: 'As soon as the cruiser opens fire, raise shields and go to red alert', expect: [{ type: 'standing', trigger: { kind: 'weapons', ship: 'cruiser', state: 'fired' }, actions: [RAISE, { type: 'setAlert', level: 'red' }] }], forbid: [RAISE, { type: 'setAlert' }] },
  { order: 'Once the cruiser is more than 80,000 km away, stand down from red alert', expect: [{ type: 'standing', trigger: { kind: 'range', ship: 'cruiser', op: 'beyond', km: 80000 } }], forbid: [{ type: 'setAlert' }] },
  { order: 'Get us within 5,000 km of the Kestrel and then tractor her', expect: [{ type: 'maneuver', target: 'kestrel' }, { type: 'standing', trigger: { kind: 'helmDone' }, actions: [{ type: 'tractor', engage: true, target: 'kestrel' }] }], forbid: [{ type: 'tractor' }] },
  { order: 'Hail the Kestrel and ask about their cargo, but keep the channel off screen', expect: [{ type: 'communicate', target: 'kestrel', onScreen: false }] },
  { order: 'Shields stay down until the cruiser locks on', expect: [{ type: 'restrict', subject: 'raiseShields', until: { kind: 'weapons', ship: 'cruiser', state: 'locked' } }], forbid: [RAISE] },
  { order: 'Hold position, and if the Kestrel powers up her weapons, scan her', expect: [{ type: 'maneuver', intent: 'holdStation' }, { type: 'standing', trigger: { kind: 'weapons', ship: 'kestrel', state: 'armed' }, actions: [{ type: 'scan', target: 'kestrel' }] }], forbid: [{ type: 'scan' }] },
  { order: 'Keep station on the Kestrel no matter what happens', expect: [{ type: 'maneuver', intent: 'holdStation', target: 'kestrel', persistent: true }] },
  { order: 'Move in slowly and do not lock weapons on anyone', expect: [{ type: 'maneuver', intent: 'approach', speed: 'slow' }, { type: 'restrict', subject: 'armWeapons' }], forbid: [{ type: 'weapons', mode: 'lock' }, ARM] },
  { order: 'Stand off at 30k from the warship', expect: [{ type: 'maneuver', intent: 'standoff', target: 'cruiser', rangeKm: 30000 }] },
  { order: 'Tell her we are coming. Then close to transporter range.', expect: [{ type: 'communicate' }, { type: 'maneuver', intent: 'approach' }], lastTarget: 'kestrel' },
  { order: 'If she arms, back us off to 40,000 km', expect: [{ type: 'standing', trigger: { kind: 'weapons', ship: 'kestrel', state: 'armed' }, actions: [{ type: 'maneuver', rangeKm: 40000 }] }], lastTarget: 'kestrel' },
  { order: "Weapons stay offline, shields stay up, and get between the Kestrel and the cruiser", expect: [{ type: 'restrict', subject: 'armWeapons' }, { type: 'restrict', subject: 'lowerShields' }, { type: 'maneuver', intent: 'interpose' }], forbid: [ARM] },
  { order: 'Fire', ask: true },
  { order: 'Lower shields and raise them again', ask: true },
  { order: 'Do it', ask: true },
  { order: 'Escort her home', expect: [{ type: 'maneuver', intent: 'escort', target: 'kestrel' }], lastTarget: 'kestrel' },
  { order: 'Before you beam anyone over, drop the shields', expect: [{ type: 'shields', raise: false }] },
];
