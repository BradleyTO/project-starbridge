/**
 * v0.5 Phase D held-out set: Active Duty bridge phrasings (answering calls, patrol, science, courses).
 * Written before its first run, after the Phase D parser rules; not used to tune them before the first run.
 * expect: the bridge op (and for respond, the response), or 'not-bridge' (must NOT be taken as a duty op).
 */
export interface DutyItem {
  text: string;
  ctx: 'directive' | 'distress' | 'voluntary' | 'idle' | 'channel';
  expect: string;
  /** Unsafe if misread this way (e.g. accepting when the captain declined). */
  unsafe?: string[];
}

export const DUTY_ITEMS: DutyItem[] = [
  { text: "Tell Fleet we're on it.", ctx: 'directive', expect: 'respond:accept' },
  { text: 'Message received. Plot an intercept to the Kestrel.', ctx: 'directive', expect: 'respond:accept' },
  { text: "Ask the admiral why it has to be us.", ctx: 'directive', expect: 'respond:question', unsafe: ['respond:accept', 'respond:refuse'] },
  { text: 'Inform Fleet Command we will not be going, the Accords forbid it.', ctx: 'directive', expect: 'respond:refuse', unsafe: ['respond:accept'] },
  { text: "Pretend we didn't hear it.", ctx: 'directive', expect: 'respond:ignore', unsafe: ['respond:accept'] },
  { text: 'Answer the mayday, best speed.', ctx: 'distress', expect: 'respond:accept' },
  { text: "We can't spare the time. Log it.", ctx: 'distress', expect: 'respond:decline', unsafe: ['respond:accept'] },
  { text: "Let's go get them.", ctx: 'distress', expect: 'respond:accept' },
  { text: 'Thank the colony office but say no.', ctx: 'voluntary', expect: 'respond:decline', unsafe: ['respond:accept'] },
  { text: 'Sure, we can escort them.', ctx: 'voluntary', expect: 'respond:accept' },
  { text: 'Resume our patrol route.', ctx: 'idle', expect: 'patrol' },
  { text: 'Let a few hours go by.', ctx: 'idle', expect: 'patrol' },
  { text: 'Varga, are there any alien civilizations out there we have not met?', ctx: 'idle', expect: 'civs' },
  { text: 'Which inhabited worlds have we found?', ctx: 'idle', expect: 'civs' },
  { text: 'Plot a course to Merrow.', ctx: 'idle', expect: 'course' },
  { text: 'Take us to the Teshra system, ensign.', ctx: 'idle', expect: 'course' },
  { text: 'Head back to the patrol station.', ctx: 'idle', expect: 'course' },
  { text: 'We come in peace and we would like to learn about you.', ctx: 'channel', expect: 'not-bridge', unsafe: ['respond:accept', 'course', 'patrol'] },
  { text: 'Yes, we would like to trade with you.', ctx: 'channel', expect: 'not-bridge', unsafe: ['respond:accept'] },
  { text: 'Raise shields.', ctx: 'directive', expect: 'not-bridge', unsafe: ['respond:accept', 'respond:refuse'] },
];

/** Set 2: written after set 1 was tuned, before its own first run (measures generalisation). */
export const DUTY_ITEMS_2: DutyItem[] = [
  { text: 'Acknowledge the directive.', ctx: 'directive', expect: 'respond:accept' },
  { text: 'Signal Fleet Command that the Halcyon is responding.', ctx: 'directive', expect: 'respond:accept' },
  { text: 'I want to know why Fleet thinks this is our job.', ctx: 'directive', expect: 'respond:question', unsafe: ['respond:accept', 'respond:refuse'] },
  { text: 'No. We stay here.', ctx: 'directive', expect: 'respond:refuse', unsafe: ['respond:accept'] },
  { text: 'Change course, we are going to help that hauler.', ctx: 'distress', expect: 'respond:accept' },
  { text: 'Leave it. Someone closer will answer.', ctx: 'distress', expect: 'respond:ignore', unsafe: ['respond:accept'] },
  { text: "Tell them we're sorry, we can't make it.", ctx: 'voluntary', expect: 'respond:decline', unsafe: ['respond:accept'] },
  { text: 'Happy to help. Tell them we accept.', ctx: 'voluntary', expect: 'respond:accept' },
  { text: 'Keep patrolling.', ctx: 'idle', expect: 'patrol' },
  { text: 'Science, any signs of intelligent life in range?', ctx: 'idle', expect: 'civs' },
  { text: 'Lay in a course for Ostrava, warp speed.', ctx: 'idle', expect: 'course' },
  { text: 'Tell me about your world.', ctx: 'channel', expect: 'not-bridge', unsafe: ['respond:accept', 'course', 'patrol', 'civs'] },
];
