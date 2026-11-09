/** Objectives and endings for Hollow Crown. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { COLONY, GUARD, GUARD_CAP, MALLORY, MALLORY_SHORT, RELAY, ROOK, hollow } from './setup';
import { neutralised, settled } from './agents';

export const HOLLOW_ENDINGS = {
  success: ['surrender', 'asylum', 'rescue'],
  partial: ['by-force', 'hollow-crown'],
  failure: ['strike', 'harmed', 'pyre', 'handed-over', 'stormed', 'abandoned'],
} as const;

export function endingId(s: WorldState): string | null {
  const f = s.flags;
  if (f.endAbandoned) return 'abandoned';
  if (f.endPyre) return 'pyre';
  if (f.endHanded) return 'handed-over';
  if (f.endAsylum) return 'asylum';
  if (f.endSurrender) return 'surrender';
  if (f.endRescue) return 'rescue';
  if (f.endByForce) return 'by-force';
  if (f.endStormed) return 'stormed';
  if (f.endSuicide) return 'hollow-crown';
  if (f.endHarmed) return 'harmed';
  if (f.endStrike) return 'strike';
  return null;
}

const dead = (s: WorldState) => s.counters.hostagesDead ?? 0;
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const v = hollow(s);
  const lost = dead(s) > 0;
  add(
    'hostages',
    `Bring ${RELAY}'s staff home alive (${v.hostages})`,
    lost || id === 'abandoned' ? 'failed' : id && id !== 'abandoned' ? 'complete' : fin ? 'missed' : 'active',
  );
  add(
    'governor',
    `Keep ${MALLORY} alive`,
    s.flags.malloryDead ? 'failed' : s.flags.malloryAboard ? 'complete' : fin ? (id === 'rescue' || id === 'abandoned' ? 'missed' : 'failed') : 'active',
  );
  if (s.intro < 4 && !done) return out;
  add(
    'assess',
    `Exercise objective: have Dr. Osei assess ${MALLORY_SHORT}'s condition before pressing him to surrender`,
    s.flags.pressedBeforeAssess ? 'failed' : knows(s, 'condition') ? 'complete' : fin ? 'missed' : 'active',
  );
  add(
    'impostor',
    'Find out which hostage is not who she claims to be',
    knows(s, 'witness') || knows(s, 'agent') || (knows(s, 'charge') && knows(s, 'impostor')) || (knows(s, 'impostor') && neutralised(s) && v.impostor !== 'witness') ? 'complete' : fin ? 'missed' : 'active',
  );
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const d = dead(s);
  const toll = d > 0 ? ` ${d} of the relay's staff ${plural(d, 'was', 'were')} killed.` : ' None of the relay\'s staff was hurt.';
  const id = endingId(s);
  switch (id) {
    case 'surrender':
      return mk(id, 'The Crown Laid Down', `${MALLORY} let the staff go and walked into ISA custody. His claim for protection goes to ISA Fleet Command; nobody was handed to ${GUARD}.${toll}`, true);
    case 'asylum':
      return mk(id, 'A Hearing, Not a Crown', `${MALLORY} laid it down under the ISA's protection, and the auditor hiding among his hostages gave the Halcyon proof that the vote which removed him was bought. Neither of them was handed to ${COLONY}'s new government; both claims go to ISA Fleet Command.${toll}`, true);
    case 'rescue':
      return mk(id, 'Out of the Hollow', `Every hostage was beamed out of ${RELAY} in the moment its shielding was down. ${MALLORY_SHORT} is alone in the relay with ${GUARD} outside the door.${sim ? ' Fleet Training Command ended the exercise there.' : ''}${toll}`, true);
    case 'by-force':
      return mk(id, 'Through the Door', `The Halcyon took ${MALLORY_SHORT} by force. He is alive and in custody, but talking was still working when the door went in${s.flags.oneWounded ? ', and one of the staff was wounded' : ''}.${sim ? ' Fleet Training Command records it as a partial result.' : ''}`, false);
    case 'hollow-crown':
      return mk(id, 'The Hollow Crown', `Pushed past what he could bear, ${MALLORY} took his own life in the relay's control room. The staff walked out unharmed.${sim ? ' Fleet Training Command records it as a partial result.' : ''}`, false);
    case 'strike':
      return mk(id, `${GUARD_CAP} Goes In`, `${GUARD_CAP} went through the bulkhead${s.flags.strikeDuringSurrender ? ' in the middle of the surrender, on a signal from inside' : ''}. ${MALLORY_SHORT} was killed.${toll}`, false);
    case 'harmed':
      return mk(id, 'A Wrong Word', `${MALLORY} broke and fired.${toll} The rest are still in the relay.`, false);
    case 'pyre':
      return mk(id, 'Fire in the Relay', `The woman speaking as ${ROOK} triggered a charge on the relay's core. ${MALLORY_SHORT} died in the fire.${toll}`, false);
    case 'handed-over':
      return mk(id, 'Given to the Successor', `${MALLORY} surrendered on the ISA's word of protection and was handed to ${GUARD}, as the Halcyon had promised ${COLONY}'s new government. The staff are safe; he is not.`, false);
    case 'stormed':
      return mk(id, 'Blood on the Ring', `The Halcyon's security team went in while he was still on edge. He fired first.${toll}`, false);
    case 'abandoned':
      return mk(id, 'Left to Aubrel', `The Halcyon left with the staff still in ${RELAY}.${sim ? ' Fleet Training Command ended the exercise there.' : ''}`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('strike', `${GUARD_CAP} Goes In`, `Time ran out.${toll}`, false);
  return null;
}
