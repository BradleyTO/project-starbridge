/** Objectives (derived from state every turn) and endings for The Quiet Signal. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { bm, inGlitch, ledgerPresent, question } from './agents';
import { quiet } from './setup';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const QUIET_ENDINGS = {
  success: ['contact-established', 'shared-vocabulary', 'polite-farewell', 'warning-heeded'],
  failure: ['directorate-first', 'warning-unshared', 'misread-threat', 'fallen-silent', 'caught-in-glitch', 'signal-incident', 'withdrew', 'halcyon-lost'],
  /** Time-limit backstop: the senders' patience normally resolves every run well before thirty minutes. */
  backstop: ['stalemate'],
} as const;

const ledgerSafe = (s: WorldState) => !ledgerPresent(s) || !!s.flags.ledgerWarnedClear || !inGlitch(s, 'cruiser');

export function computeObjectives(s: WorldState, ended: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !ended) return out;
  const v = quiet(s);
  const lost = !!s.flags.misread || !!s.flags.silent || !!s.flags.directorateFirst;
  add('understand', 'Understand what the signal is asking before answering it', knows(s, 'grammar_known') && !s.flags.answeredBlind ? 'complete' : s.flags.answeredBlind ? 'failed' : ended ? 'missed' : 'active');
  add('answer', 'Answer the senders correctly, and in time', question(s) >= 2 && !s.flags.directorateFirst ? 'complete' : lost ? 'failed' : ended ? 'missed' : 'active');
  const hostile = !!s.flags.lockedOnSenders || !!s.flags.shotsFired;
  add('peaceful', 'Keep the contact peaceful: no threats and no weapons', hostile ? 'failed' : ended ? 'complete' : 'active');
  if (s.intro < 4 && !ended) return out;
  add('rival', 'Keep the Directorate from turning first contact into a race', s.flags.directorateFirst ? 'failed' : bm(s).joint || bm(s).holding ? 'complete' : ended ? (s.outcome?.success ? 'complete' : 'missed') : 'active');
  if (v.intent === 'warning' && knows(s, 'senders_intent')) {
    // Exercise objective: no ISA-COM-001 regulation yet covers warning a rival ship of a hazard.
    add('warn-all', 'Exercise objective: warn every ship in danger, rival or not', s.flags.ledgerCaught ? 'failed' : ledgerSafe(s) && (ended || s.flags.cruiserGone) ? 'complete' : ended ? 'missed' : 'active');
  }
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const v = quiet(s);
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const joint = !!bm(s).joint;

  if (s.ships.halcyon.destroyed) return mk('halcyon-lost', 'Halcyon Lost', 'The ISV Halcyon was destroyed with all hands.', false);
  if (s.flags.glitchHit) return mk('caught-in-glitch', 'Caught in the Glitch', 'The Teyma pulsar glitched with the Halcyon still inside the danger zone. The senders had warned you; the ship was badly damaged and is limping home.', false);
  if (s.flags.shotsFired) return mk('signal-incident', 'Incident at Teyma', `The Halcyon opened fire${s.ships.cruiser.destroyed ? ' and destroyed the Cantor' : ' on the Cantor'} beside an unknown people who were only asking questions. The senders went silent, and the Directorate has protested to the ISA.`, false);
  if (s.flags.misread) return mk('misread-threat', 'Misread', 'The senders read the listeners as a threat: too many wrong answers, or weapons where there should have been none. They cut the pattern and left Teyma.', false);
  if (s.flags.jumped) {
    if (v.intent === 'warning' && knows(s, 'senders_intent')) {
      if (ledgerSafe(s)) return mk('warning-heeded', 'Warning Heeded', `You understood the senders' warning and took the Halcyon clear before the pulsar glitched${ledgerPresent(s) ? '' : ', and the Cantor got clear too'}.`, true);
      return mk('warning-unshared', 'Warning Unshared', "You understood the senders' warning and took the Halcyon clear, but left the Cantor inside the danger zone without a word.", false);
    }
    return mk('withdrew', 'Withdrawn', 'The Halcyon jumped away from Teyma before the conversation was finished. Whatever the senders wanted to say went unheard.', false);
  }
  if (s.flags.directorateFirst) return mk('directorate-first', 'The Directorate Answered', "The Cantor gave the senders' last answer, and their message went to the Tessarine Directorate. The ISA heard it second-hand.", false);
  if (s.flags.contact) {
    if (joint) return mk('shared-vocabulary', 'A Shared Vocabulary', 'The senders answered your greeting, and the ISA and the Directorate decoded it together. Three peoples now share the beginnings of a common vocabulary.', true);
    return mk('contact-established', 'Contact Established', 'The senders answered your greeting with one of their own. First contact at Teyma was made in mathematics, and it was peaceful.', true);
  }
  if (s.flags.farewell) return mk('polite-farewell', 'A Polite Farewell', `The senders were saying goodbye, and you said goodbye in return. They left Teyma in peace${joint ? ', and the Directorate heard it with you' : ''}.`, true);
  if (s.flags.glitched) {
    if (s.flags.ledgerCaught) return mk('warning-unshared', 'Warning Unshared', 'The Halcyon was clear when the pulsar glitched, but the Cantor was not: she was crippled inside the danger zone, and nobody had warned her.', false);
    return mk('warning-heeded', 'Warning Heeded', 'The senders warned you about the pulsar, you understood, and every ship was clear when it glitched.', true);
  }
  if (s.flags.silent) return mk('fallen-silent', 'Silence', 'The senders stopped waiting. The gaps in the pulsar closed, and whoever was asking is gone.', false);
  if (s.turn >= MAX_TURNS) return mk('stalemate', 'Stalemate', sim ? 'Thirty minutes passed without resolution; the exercise was ended by Fleet Training Command.' : 'Thirty minutes passed without resolution; ISA Fleet Command ordered the Halcyon to stand off.', false);
  return null;
}
