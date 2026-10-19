/**
 * HELD-OUT EVALUATION SET v0.4 — written on 2026-10-19 BEFORE any v0.4
 * interpreter work (multiple instructions, negation, conditionals, sequencing,
 * standing orders, references, clarification) and never used as a tuning
 * target. Do not edit entries to make them pass.
 *
 * The two critical regression orders from the M3 brief are deliberately NOT
 * here: they are explicit targets with their own tests (tests/v04/).
 *
 * Matching: every `expect` item must be matched by some top-level action
 * (deep partial match; arrays are alternatives). `forbid` items must match
 * no top-level action. `ask: true` means the interpreter must ask (clarify)
 * or decline to act, never guess.
 */
export type Partial = Record<string, unknown>;
export interface HeldOutV04 {
  order: string;
  expect?: (Partial | Partial[])[];
  forbid?: Partial[];
  ask?: true;
  /** Optional context: a previous target for pronoun resolution. */
  lastTarget?: 'kestrel' | 'cruiser';
}

const ARM = { type: 'weapons', mode: 'arm' };
const RAISE = { type: 'shields', raise: true };

export const HELD_OUT_V04: HeldOutV04[] = [
  // ---- multiple instructions + negation
  { order: 'Approach the Kestrel, raise shields, and keep weapons cold', expect: [{ type: 'maneuver', intent: 'approach', target: 'kestrel' }, RAISE, [{ type: 'restrict', subject: 'armWeapons' }, { type: 'weapons', mode: 'safe' }]], forbid: [ARM] },
  { order: "Don't arm weapons", expect: [{ type: 'restrict', subject: 'armWeapons' }], forbid: [ARM] },
  { order: 'Hail the cruiser without raising shields', expect: [{ type: 'communicate', target: 'cruiser' }, { type: 'restrict', subject: 'raiseShields' }], forbid: [RAISE] },
  { order: 'Keep the shields down no matter what', expect: [{ type: 'restrict', subject: 'raiseShields' }], forbid: [RAISE] },
  { order: 'Do not lower shields', expect: [{ type: 'restrict', subject: 'lowerShields' }], forbid: [{ type: 'shields', raise: false }] },
  { order: 'Arm weapons but do not fire', expect: [ARM, { type: 'restrict', subject: 'fireWeapons' }], forbid: [{ type: 'weapons', mode: 'fire' }] },
  { order: 'Keep shields up and weapons offline', expect: [RAISE, [{ type: 'restrict', subject: 'armWeapons' }, { type: 'weapons', mode: 'safe' }]], forbid: [ARM] },
  { order: 'Tactical, stand down weapons', expect: [{ type: 'weapons', mode: 'safe' }] },
  // ---- conditionals
  { order: 'If the cruiser locks on to us, raise shields', expect: [{ type: 'standing', trigger: { kind: 'weapons', ship: 'cruiser', state: 'locked' }, actions: [RAISE] }], forbid: [RAISE] },
  { order: 'Raise shields only if the Kestrel arms its weapons', expect: [{ type: 'standing', trigger: { kind: 'weapons', ship: 'kestrel', state: 'armed' }, actions: [RAISE] }], forbid: [RAISE] },
  { order: "Don't fire unless fired upon", expect: [{ type: 'restrict', subject: 'fireWeapons', until: { kind: 'weapons', ship: 'cruiser', state: 'fired' } }], forbid: [{ type: 'weapons', mode: 'fire' }] },
  { order: 'When we are within 20,000 km of the Kestrel, lower shields and beam the crew over', expect: [{ type: 'standing', trigger: { kind: 'range', ship: 'kestrel', op: 'within', km: 20000 }, actions: [{ type: 'shields', raise: false }, { type: 'transport', payload: 'crew' }] }], forbid: [{ type: 'shields', raise: false }, { type: 'transport' }] },
  { order: 'Lower shields when the cruiser is beyond 60,000 km', expect: [{ type: 'standing', trigger: { kind: 'range', ship: 'cruiser', op: 'beyond', km: 60000 }, actions: [{ type: 'shields', raise: false }] }], forbid: [{ type: 'shields', raise: false }] },
  { order: 'If the cruiser fires, return fire', expect: [{ type: 'standing', trigger: { kind: 'weapons', ship: 'cruiser', state: 'fired' }, actions: [{ type: 'weapons', mode: 'fire', target: 'cruiser' }] }], forbid: [{ type: 'weapons', mode: 'fire' }] },
  { order: 'When the Kestrel is within 10,000 km, lock a tractor beam on her', expect: [{ type: 'standing', trigger: { kind: 'range', ship: 'kestrel', op: 'within', km: 10000 }, actions: [{ type: 'tractor', engage: true, target: 'kestrel' }] }], forbid: [{ type: 'tractor' }] },
  // ---- sequencing
  { order: 'Close on the Kestrel, then beam the crew aboard', expect: [{ type: 'maneuver', intent: 'approach', target: 'kestrel' }, { type: 'standing', trigger: { kind: 'helmDone' }, actions: [{ type: 'transport', payload: 'crew' }] }], forbid: [{ type: 'transport' }] },
  { order: 'Head for the Kestrel; once we arrive, hail her', expect: [{ type: 'maneuver', intent: 'approach', target: 'kestrel' }, { type: 'standing', trigger: { kind: 'helmDone' }, actions: [{ type: 'communicate', target: 'kestrel' }] }] },
  { order: 'Scan the Kestrel. Then hail her.', expect: [{ type: 'scan', target: 'kestrel' }, { type: 'communicate', target: 'kestrel' }] },
  // ---- standing / persistent manoeuvres and ranges
  { order: 'Interpose between the Kestrel and the cruiser and hold that position whatever happens', expect: [{ type: 'maneuver', intent: 'interpose', persistent: true }] },
  { order: 'Keep 40k between us and the cruiser', expect: [{ type: 'maneuver', intent: 'standoff', target: 'cruiser', rangeKm: 40000 }] },
  { order: 'Hold at twenty five thousand kilometres from the Kestrel', expect: [{ type: 'maneuver', intent: 'standoff', target: 'kestrel', rangeKm: 25000 }] },
  { order: 'Move us closer to the freighter, slowly', expect: [{ type: 'maneuver', intent: 'approach', target: 'kestrel', speed: 'slow' }] },
  { order: 'Route all available power to the shields', expect: [{ type: 'power', to: 'shields' }] },
  { order: "Get between them and the freighter", expect: [{ type: 'maneuver', intent: 'interpose' }], lastTarget: 'cruiser' },
  // ---- references
  { order: 'Scan it', expect: [{ type: 'scan', target: 'cruiser' }], lastTarget: 'cruiser' },
  { order: 'Open a channel to them', expect: [{ type: 'communicate', target: 'kestrel' }], lastTarget: 'kestrel' },
  { order: "What's the cruiser doing?", expect: [[{ type: 'scan', target: 'cruiser' }, { type: 'query' }]] },
  // ---- teaching
  { order: "When I say 'button up', I mean raise shields and go to red alert", expect: [{ type: 'learn', phrase: 'button up' }], forbid: [RAISE, { type: 'setAlert' }] },
  // ---- must ask, not guess
  { order: 'Raise shields and lower shields', ask: true },
  { order: 'Target it', ask: true },
  { order: 'Hail them', ask: true },
  { order: 'Do the thing we talked about', ask: true },
];
