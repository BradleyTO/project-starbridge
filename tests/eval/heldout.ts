/**
 * HELD-OUT EVALUATION SET — written on 2026-10-19 BEFORE any v0.3 interpreter
 * tuning, and never used as a tuning target. Do not edit entries to make them
 * pass; add new phrasings to the training table (tests/interpreter/*) instead.
 *
 * Each item lists the actions that must appear (any order). An expected action
 * may be an array of acceptable alternatives. An item passes only if every
 * expected action is matched, the result is not "unrecognised"/"clarify", and
 * no fragment is left unparsed.
 */
export type Expect = Record<string, unknown> | Record<string, unknown>[];
export interface HeldOut {
  order: string;
  expect: Expect[];
}

export const HELD_OUT: HeldOut[] = [
  { order: 'Helm, bring us around to face the cruiser', expect: [{ type: 'maneuver', intent: 'face', target: 'cruiser' }] },
  { order: 'Shadow the warship at fifty thousand kilometres', expect: [{ type: 'maneuver', intent: 'follow', target: 'cruiser', rangeKm: 50000 }] },
  { order: "Put us in the cruiser's path", expect: [{ type: 'maneuver', intent: 'block', target: 'cruiser' }] },
  { order: 'Escort the Kestrel', expect: [{ type: 'maneuver', intent: 'escort', target: 'kestrel' }] },
  { order: 'Cut them off before they reach the freighter', expect: [[{ type: 'maneuver', intent: 'intercept', target: 'cruiser' }, { type: 'maneuver', intent: 'block', target: 'cruiser' }, { type: 'maneuver', intent: 'interpose' }]] },
  { order: 'Plot an intercept course for the Tessarine ship', expect: [{ type: 'maneuver', intent: 'intercept', target: 'cruiser' }] },
  { order: 'Make for the border, best speed', expect: [{ type: 'maneuver', intent: 'flee' }] },
  { order: 'Fall back to thirty thousand kilometres from the cruiser', expect: [[{ type: 'maneuver', intent: 'standoff', target: 'cruiser', rangeKm: 30000 }, { type: 'maneuver', intent: 'retreat', target: 'cruiser', rangeKm: 30000 }]] },
  { order: "Hold station off the Kestrel's bow", expect: [{ type: 'maneuver', intent: 'holdStation', target: 'kestrel' }] },
  { order: 'Circle the freighter', expect: [{ type: 'maneuver', intent: 'orbit', target: 'kestrel' }] },
  { order: 'Stay out of their weapons range', expect: [{ type: 'maneuver', intent: 'standoff', target: 'cruiser' }] },
  { order: 'Close to transporter range of the Kestrel', expect: [[{ type: 'maneuver', intent: 'approach', target: 'kestrel' }, { type: 'maneuver', intent: 'standoff', target: 'kestrel' }]] },
  { order: 'Keep us between the Kestrel and that ship', expect: [{ type: 'maneuver', intent: 'interpose' }] },
  { order: 'Full stop', expect: [{ type: 'maneuver', intent: 'allStop' }] },
  { order: 'Ahead slow toward the Kestrel', expect: [{ type: 'maneuver', intent: 'approach', target: 'kestrel' }] },
  { order: 'Mr. Rask, drop shields; Ms. Szabo, open hailing frequencies', expect: [{ type: 'shields', raise: false }, { type: 'communicate' }] },
  { order: 'Ops, transfer power from weapons to engines', expect: [{ type: 'power', from: 'weapons', to: 'engines' }] },
  { order: 'Science, what can you tell me about that cruiser?', expect: [{ type: 'scan', target: 'cruiser' }] },
  { order: "Tell the Kestrel's captain to hang on, we're coming", expect: [{ type: 'communicate', target: 'kestrel' }] },
  { order: "We're not looking for a fight.", expect: [{ type: 'posture', stance: 'nonHostile' }] },
  { order: 'Beam over everyone from the freighter', expect: [{ type: 'transport', payload: 'crew' }] },
  { order: 'Lock torpedos on the crusier', expect: [{ type: 'weapons', mode: 'lock', target: 'cruiser' }] },
  { order: 'Raise sheilds and red alert', expect: [{ type: 'shields', raise: true }, { type: 'setAlert', level: 'red' }] },
  { order: 'Get us closer to the frieghter', expect: [{ type: 'maneuver', intent: 'approach', target: 'kestrel' }] },
  { order: 'Back us away from that warship slowly', expect: [{ type: 'maneuver', intent: 'retreat', target: 'cruiser' }] },
  { order: 'Match course and speed with the cruiser', expect: [{ type: 'maneuver', intent: 'follow', target: 'cruiser' }] },
  { order: 'Run for Concord space', expect: [{ type: 'maneuver', intent: 'flee' }] },
  { order: "Position us to block the cruiser's approach to the Kestrel", expect: [[{ type: 'maneuver', intent: 'block', target: 'cruiser' }, { type: 'maneuver', intent: 'interpose' }]] },
  { order: 'Ask the prefect what he wants', expect: [{ type: 'communicate', target: 'cruiser', intent: 'ask' }] },
  { order: 'Prepare to jump out', expect: [{ type: 'jump', mode: 'charge' }] },
  { order: 'Divert everything to shields', expect: [{ type: 'power', to: 'shields' }] },
  { order: 'Can we tow her out of here?', expect: [{ type: 'tractor', engage: true }] },
  { order: 'Have engineering patch up our sensors', expect: [{ type: 'repair', ship: 'halcyon', system: 'sensors' }] },
  { order: 'Keep our distance from the Directorate ship, 40k', expect: [{ type: 'maneuver', intent: 'standoff', target: 'cruiser', rangeKm: 40000 }] },
  { order: 'Swing around so our bow faces the freighter', expect: [{ type: 'maneuver', intent: 'face', target: 'kestrel' }] },
  { order: 'Approach the cruiser but stay at 20,000 km', expect: [[{ type: 'maneuver', intent: 'standoff', target: 'cruiser', rangeKm: 20000 }, { type: 'maneuver', intent: 'approach', target: 'cruiser', rangeKm: 20000 }]] },
  { order: "Let's keep things calm — lower our shields", expect: [{ type: 'shields', raise: false }] },
  { order: 'Signal the freighter that help is on the way', expect: [{ type: 'communicate', target: 'kestrel' }] },
  { order: 'Pull alongside the Kestrel and lower shields', expect: [{ type: 'maneuver', intent: 'approach', target: 'kestrel' }, { type: 'shields', raise: false }] },
  { order: 'Evasive pattern delta, then return fire', expect: [{ type: 'maneuver', intent: 'evasive' }, { type: 'weapons', mode: 'fire' }] },
  { order: 'Move between the Kestrel and the Tessarine vessel and hold there', expect: [{ type: 'maneuver', intent: 'interpose' }] },
  { order: 'Slip in behind the cruiser', expect: [{ type: 'maneuver', intent: 'follow', target: 'cruiser' }] },
];
