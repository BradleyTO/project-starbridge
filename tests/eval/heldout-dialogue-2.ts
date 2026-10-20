/**
 * v0.5 HELD-OUT DIALOGUE SET 2 — written and committed AFTER the comms router was built (set 1
 * was visible during development, so its score is contaminated) and BEFORE this set was ever run.
 * Its first-run score is reported as the generalisation figure; same format and scoring as set 1.
 */
import type { DialogueItem } from './heldout-dialogue';

const VANE = ['hail the cruiser'];
const ARDEN = ['hail the kestrel'];

export const HELD_OUT_DIALOGUE_2: DialogueItem[] = [
  // ---- Vane on the channel: speech
  { setup: VANE, line: 'Prefect, our only concern is the crew of that freighter.', kind: 'dialogue', to: 'cruiser', intents: ['humanitarian', 'declarePeaceful'] },
  { setup: VANE, line: 'We are not here to start a war.', kind: 'dialogue', to: 'cruiser', intents: ['declarePeaceful'] },
  { setup: VANE, line: 'Give us fifteen minutes and we will be gone.', kind: 'dialogue', to: 'cruiser', intents: ['negotiate', 'requestAssist', 'promise'] },
  { setup: VANE, line: 'Who gave you the authority to stop a civilian ship?', kind: 'dialogue', to: 'cruiser', intents: ['ask', 'challenge'] },
  { setup: VANE, line: 'Fine. Our weapons stay powered down.', kind: 'dialogue', to: 'cruiser', intents: ['agree', 'promise'] },
  { setup: VANE, line: 'Release your target lock on the Kestrel.', kind: 'dialogue', to: 'cruiser', intents: ['demand'] },
  { setup: VANE, line: 'Inform the Prefect that the Agency will hear of this.', kind: 'dialogue', to: 'cruiser', intents: ['warn', 'challenge'] },
  { setup: VANE, line: "I'm afraid we can't do that.", kind: 'dialogue', to: 'cruiser', intents: ['refuse'] },
  { setup: VANE, line: 'Perhaps we can work together on this.', kind: 'dialogue', to: 'cruiser', intents: ['offerCooperation', 'negotiate'] },
  { setup: VANE, line: 'My cat prefers the blue cushion.', kind: 'dialogue', to: 'cruiser', intents: ['unknown'], allowClarify: true },
  // ---- Vane on the channel: crew orders and channel ops must not become speech
  { setup: VANE, line: 'Send a rescue team over to the Kestrel.', kind: 'command', expect: [{ type: 'transport', payload: 'rescueTeam' }] },
  { setup: VANE, line: 'Beam the crew aboard.', kind: 'command', expect: [{ type: 'transport', payload: 'crew' }] },
  { setup: VANE, line: 'Helm, all stop.', kind: 'command', expect: [{ type: 'maneuver', intent: 'allStop' }] },
  { setup: VANE, line: 'Lower our shields.', kind: 'command', expect: [{ type: 'shields', raise: false }] },
  { setup: VANE, line: 'Mute the channel.', kind: 'channel', expect: [{ type: 'channel', op: 'mute' }] },
  { setup: VANE, line: 'Cut the transmission.', kind: 'channel', expect: [{ type: 'channel', op: 'close' }] },
  { setup: VANE, line: 'Tell him we will comply, then lower shields.', kind: 'mixed', to: 'cruiser', intents: ['agree', 'promise'], expect: [{ type: 'shields', raise: false }], allowClarify: true },
  { setup: VANE, line: 'Scan the cruiser and ask him what he is hiding.', kind: 'mixed', to: 'cruiser', intents: ['ask', 'challenge'], expect: [{ type: 'scan', target: 'cruiser' }], allowClarify: true },
  // ---- Arden on the channel
  { setup: ARDEN, line: 'Is anyone injured over there?', kind: 'dialogue', to: 'kestrel', intents: ['ask'] },
  { setup: ARDEN, line: 'Hang on, Kestrel, help is coming.', kind: 'dialogue', to: 'kestrel', intents: ['declarePeaceful', 'promise', 'offerCooperation', 'humanitarian'] },
  { setup: ARDEN, line: 'Can you eject your reactor core?', kind: 'dialogue', to: 'kestrel', intents: ['ask', 'requestAssist'] },
  { setup: ARDEN, line: 'Tell them to prepare for transport.', kind: 'dialogue', to: 'kestrel', intents: ['requestAssist', 'demand'] },
  { setup: ARDEN, line: 'Put the Kestrel on hold and hail the cruiser.', kind: 'channel', expect: [{ type: 'channel', op: 'hold' }, [{ type: 'communicate', target: 'cruiser' }, { type: 'channel', op: 'open', party: 'cruiser' }]] },
  { setup: ARDEN, line: 'Get us within transporter range.', kind: 'command', expect: [{ type: 'maneuver', target: 'kestrel' }] },
  // ---- no channel
  { setup: [], line: 'Raise shields.', kind: 'command', expect: [{ type: 'shields', raise: true }] },
  { setup: [], line: 'Captain Arden, can you hear me?', kind: 'noChannel', expect: [[{ type: 'communicate', target: 'kestrel' }, { type: 'channel', op: 'open', party: 'kestrel' }]], allowClarify: true },
];
