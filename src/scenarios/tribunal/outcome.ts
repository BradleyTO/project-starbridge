/** Objectives and endings for Tribunal at Kesh Varo. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { ASKEL_SHORT, SITE, WORLD, tribunal } from './setup';
import { medicalReady, settled } from './agents';

export const TRIBUNAL_ENDINGS = {
  success: ['acquitted', 'commuted', 'exchange'],
  partial: ['principled'],
  failure: ['extracted', 'sentenced', 'relieved', 'handed', 'time-up'],
} as const;

export function endingId(s: WorldState): string | null {
  const f = s.flags;
  if (f.endFired) return 'extracted';
  if (f.endExtracted) return 'extracted';
  if (f.endAcquitted) return 'acquitted';
  if (f.endCommuted) return 'commuted';
  if (f.endExchange) return 'exchange';
  if (f.endHanded) return 'handed';
  if (f.endPrincipled) return 'principled';
  if (f.endRelieved) return 'relieved';
  if (f.endSentenced) return 'sentenced';
  if (f.jumped && !settled(s)) return 'sentenced';
  return null;
}

const SUCCESS = new Set<string>(TRIBUNAL_ENDINGS.success);

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const saved = !!id && SUCCESS.has(id);
  add(
    'crewman',
    `Keep ${ASKEL_SHORT} from a capital sentence at ${SITE}`,
    id === 'acquitted' || id === 'commuted' || id === 'exchange' || id === 'extracted'
      ? 'complete'
      : id === 'sentenced' || id === 'handed'
        ? 'failed'
        : fin
          ? 'missed'
          : 'active',
  );
  add('treaty', `Do not break ${WORLD}'s trade treaty by force`, id === 'extracted' ? 'failed' : fin ? 'complete' : 'active');
  if (s.intro < 4 && !done) return out;
  add(
    'medical',
    `Exercise objective: have the chief medical officer establish whether a medical emergency supports ${ASKEL_SHORT}'s account before accepting a capital finding`,
    medicalReady(s) ? 'complete' : id === 'handed' || id === 'sentenced' || id === 'extracted' ? 'failed' : fin ? 'missed' : 'active',
  );
  add(
    'lawful',
    'Respect local law by argument and evidence, and refuse unlawful force or an unlawful handover',
    id === 'extracted' || (id === 'handed' && !!s.flags.graveHandover) ? 'failed' : fin ? (saved || id === 'principled' ? 'complete' : 'missed') : 'active',
  );
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = tribunal(s);
  const id = endingId(s);
  switch (id) {
    case 'acquitted':
      return mk(id, 'Acquitted on the Evidence', `Dr. Osei's medical brief, and the account of what happened at ${SITE}, convinced ${WORLD}'s tribunal. ${ASKEL_SHORT} walks free. The treaty holds.`, true);
    case 'commuted':
      return mk(id, 'Commuted by Custom', `Under the Quiet Stone's own custom, the capital sentence was set aside for a lesser penalty. ${ASKEL_SHORT} lives. Both laws were heard.`, true);
    case 'exchange':
      return mk(id, 'Honour Bound by Both Laws', `A diplomatic exchange was struck that ${WORLD} and the ISA could both honour: limited local penalty, jurisdiction acknowledged, ${ASKEL_SHORT} returned alive. The treaty holds.`, true);
    case 'principled':
      return mk(id, 'The Code Held', `${ASKEL_SHORT} was condemned, but the Halcyon refused both an armed extraction and an unlawful handover. The treaty holds. ${sim ? 'Fleet Training Command records it as a partial result.' : ''}`.trim(), false);
    case 'extracted':
      return mk(id, 'Broken by Force', `${ASKEL_SHORT} was taken from ${WORLD} by force. He lives; the trade treaty does not. ${sim ? 'Fleet Training Command ended the exercise there.' : ''}`.trim(), false);
    case 'sentenced':
      return mk(id, 'The Quiet Stone Claims Him', `${ASKEL_SHORT} was sentenced under ${WORLD}'s capital law for entering ${SITE}. ${v.truth === 'rescue' ? 'The emergency he claimed was never established in time.' : 'The tribunal found against him.'}`, false);
    case 'relieved':
      return mk(id, 'Fleet Takes the Matter', `Fleet Command relieved the captain of the matter. ${ASKEL_SHORT}'s fate is no longer the Halcyon's to decide.`, false);
    case 'handed':
      return mk(id, 'Surrendered to the Bench', `The captain handed ${ASKEL_SHORT} to ${WORLD}'s justice without contest${s.flags.graveHandover ? ', under a capital risk the Code does not permit' : ''}.`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('time-up', 'The Gavel Falls', `Time ran out at ${WORLD} with nothing decided. The tribunal closed on its own terms.`, false);
  return null;
}
