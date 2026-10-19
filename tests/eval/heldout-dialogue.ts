/**
 * v0.5 HELD-OUT DIALOGUE SET — written and committed BEFORE any v0.5 comms / dialogue work.
 *
 * Each item is a captain's line typed with a given channel context (setup orders run first on
 * seed 42 after the intro). The interpreter must decide whether the line is SPEECH to the other
 * vessel (a `speak` action), a CHANNEL operation (`channel`), a CREW COMMAND (ship actions), or a
 * mix, and must never turn a dialogue line into a ship action (or a crew command into speech).
 *
 * API fixed here, before implementation:
 *   { type: 'speak', to: 'kestrel' | 'cruiser' | 'passenger', text, intents: DialogueIntent[] , ... }
 *   { type: 'channel', op: 'open' | 'close' | 'hold' | 'resume' | 'mute' | 'unmute', party?, private? }
 *   DialogueIntent ∈ declarePeaceful, requestAssist, ask, demand, offerCooperation, warn, negotiate,
 *                    agree, refuse, challenge, end, greet, promise, trade, humanitarian, legal,
 *                    bluff, appeal, offerAsylum, unknown
 */
export type DialogueEvalKind = 'dialogue' | 'command' | 'channel' | 'mixed' | 'noChannel';
export interface DialogueItem {
  setup: string[];
  line: string;
  kind: DialogueEvalKind;
  /** dialogue / mixed: one of these intents must be present on the speak action. */
  intents?: string[];
  /** dialogue / mixed: the speech must go to this party. */
  to?: 'kestrel' | 'cruiser';
  /** command / channel / mixed: each entry (or one of its alternatives) must appear. */
  expect?: (Record<string, unknown> | Record<string, unknown>[])[];
  /** A clarifying question is an acceptable answer. */
  allowClarify?: boolean;
}

const VANE = ['hail the cruiser'];
const ARDEN = ['hail the kestrel'];

export const HELD_OUT_DIALOGUE: DialogueItem[] = [
  // ---- Vane on the channel
  { setup: VANE, line: "We're responding to a civilian distress call. We have no hostile intentions.", kind: 'dialogue', to: 'cruiser', intents: ['declarePeaceful', 'humanitarian'] },
  { setup: VANE, line: 'Agreed, but we will not abandon the freighter.', kind: 'dialogue', to: 'cruiser', intents: ['agree'] },
  { setup: VANE, line: 'Prefect, we have no intention of withdrawing.', kind: 'dialogue', to: 'cruiser', intents: ['refuse', 'declarePeaceful', 'promise'] },
  { setup: VANE, line: "Tell him we're only here to help.", kind: 'dialogue', to: 'cruiser', intents: ['declarePeaceful', 'humanitarian', 'offerCooperation'] },
  { setup: VANE, line: 'We need ten minutes to evacuate the crew.', kind: 'dialogue', to: 'cruiser', intents: ['negotiate', 'requestAssist'] },
  { setup: VANE, line: 'Tell them to lower their weapons.', kind: 'dialogue', to: 'cruiser', intents: ['demand'] },
  { setup: VANE, line: 'Why are you locking weapons on a civilian ship?', kind: 'dialogue', to: 'cruiser', intents: ['ask', 'challenge'] },
  { setup: VANE, line: "That freighter is in neutral space, not yours, Prefect.", kind: 'dialogue', to: 'cruiser', intents: ['challenge', 'legal'] },
  { setup: VANE, line: 'If you fire on the Kestrel, we will defend her.', kind: 'dialogue', to: 'cruiser', intents: ['warn'] },
  { setup: VANE, line: 'Lower your shields and stand down, Prefect.', kind: 'dialogue', to: 'cruiser', intents: ['demand'] },
  { setup: VANE, line: 'What do you want with that freighter?', kind: 'dialogue', to: 'cruiser', intents: ['ask'] },
  { setup: VANE, line: 'We can offer you our sensor logs in exchange for safe passage.', kind: 'dialogue', to: 'cruiser', intents: ['trade', 'negotiate', 'offerCooperation'] },
  { setup: VANE, line: 'You have my word that our weapons will stay cold.', kind: 'dialogue', to: 'cruiser', intents: ['promise', 'declarePeaceful'] },
  { setup: VANE, line: 'Absolutely not.', kind: 'dialogue', to: 'cruiser', intents: ['refuse'] },
  { setup: VANE, line: 'Hmm, the weather in the nebula has been strange lately.', kind: 'dialogue', to: 'cruiser', intents: ['unknown'], allowClarify: true },
  { setup: VANE, line: 'Communications, close the channel.', kind: 'channel', expect: [{ type: 'channel', op: 'close' }] },
  { setup: VANE, line: 'Put the Prefect on hold.', kind: 'channel', expect: [{ type: 'channel', op: 'hold' }] },
  { setup: VANE, line: 'Raise shields.', kind: 'command', expect: [{ type: 'shields', raise: true }] },
  { setup: VANE, line: 'Helm, take us to 10,000 km from the Kestrel.', kind: 'command', expect: [{ type: 'maneuver', target: 'kestrel', rangeKm: 10000 }] },
  { setup: VANE, line: 'Tell him we mean no harm and raise shields', kind: 'mixed', to: 'cruiser', intents: ['declarePeaceful'], expect: [{ type: 'shields', raise: true }], allowClarify: true },
  { setup: VANE, line: 'Arm weapons and tell him we will not be intimidated.', kind: 'mixed', to: 'cruiser', intents: ['refuse', 'warn', 'challenge'], expect: [{ type: 'weapons', mode: 'arm' }], allowClarify: true },
  { setup: VANE, line: 'Open a private channel to the Kestrel.', kind: 'channel', expect: [[{ type: 'channel', op: 'open', party: 'kestrel', private: true }, { type: 'communicate', target: 'kestrel' }]] },
  { setup: VANE, line: 'Goodbye, Prefect. Halcyon out.', kind: 'channel', expect: [[{ type: 'channel', op: 'close' }, { type: 'speak', intents: ['end'] }]] },
  // ---- Arden on the channel
  { setup: ARDEN, line: 'Ask the captain how many people are aboard.', kind: 'dialogue', to: 'kestrel', intents: ['ask'] },
  { setup: ARDEN, line: "Captain Arden, what's really in your shielded compartment?", kind: 'dialogue', to: 'kestrel', intents: ['ask'] },
  { setup: ARDEN, line: 'How long until your reactor goes?', kind: 'dialogue', to: 'kestrel', intents: ['ask'] },
  { setup: ARDEN, line: "Get your people to the cargo bay, we're beaming them over.", kind: 'dialogue', to: 'kestrel', intents: ['requestAssist', 'demand', 'promise', 'offerCooperation'] },
  { setup: ARDEN, line: "We'll keep that cruiser off your back.", kind: 'dialogue', to: 'kestrel', intents: ['promise', 'offerCooperation'] },
  { setup: ARDEN, line: "You're lying to me, Captain.", kind: 'dialogue', to: 'kestrel', intents: ['challenge'] },
  { setup: ARDEN, line: 'Scan the Kestrel.', kind: 'command', expect: [{ type: 'scan', target: 'kestrel' }] },
  { setup: ARDEN, line: 'Tell Arden to stand by for evacuation, then close the channel.', kind: 'mixed', to: 'kestrel', intents: ['requestAssist', 'demand', 'promise'], expect: [{ type: 'channel', op: 'close' }] },
  // ---- no channel open: speech has nobody to go to
  { setup: [], line: 'Prefect, explain yourself.', kind: 'noChannel', expect: [[{ type: 'communicate', target: 'cruiser' }, { type: 'channel', op: 'open', party: 'cruiser' }]], allowClarify: true },
];
