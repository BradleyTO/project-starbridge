/** Objectives and endings for The Weather Engine. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { COLONY, ENGINE, ENGINE_CAP, STORM, STORM_CAP, weather } from './setup';
import { inOpen, lockRead, running, settled } from './agents';

export const WEATHER_ENDINGS = {
  success: ['founders-key', 'daughters-hand', 'override'],
  partial: ['half-storm', 'sheltered'],
  failure: ['sealed-for-good', 'failsafe', 'greywall', 'scar', 'abandoned'],
} as const;

export function endingId(s: WorldState): string | null {
  const f = s.flags;
  if (f.endAbandoned) return 'abandoned';
  if (f.endScar) return 'scar';
  if (f.endFailsafe) return 'failsafe';
  if (f.endDispersed) return f.runOverride ? 'override' : f.runMarit ? 'daughters-hand' : 'founders-key';
  if (f.endHalf) return 'half-storm';
  if (f.endSealed) return 'sealed-for-good';
  if (f.endSheltered) return 'sheltered';
  if (f.endGreywall) return 'greywall';
  return null;
}

const DISPERSED = new Set(['founders-key', 'daughters-hand', 'override']);

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const v = weather(s);
  const dispersed = !!id && DISPERSED.has(id);
  add(
    'storm',
    `Keep ${COLONY}'s people safe from ${STORM}`,
    dispersed || id === 'sheltered' || id === 'scar' || (id === 'half-storm' && inOpen(s) === 0)
      ? 'complete'
      : id === 'greywall' || id === 'abandoned' || ((id === 'sealed-for-good' || id === 'failsafe' || id === 'half-storm') && inOpen(s) > 0)
        ? 'failed'
        : fin
          ? 'missed'
          : 'active',
  );
  add(
    'engine',
    `Open ${ENGINE} without sealing it for good or destroying it`,
    running(s) ? 'complete' : s.flags.lockedOut || s.flags.failsafe || s.flags.burned ? 'failed' : fin ? 'missed' : 'active',
  );
  if (s.intro < 4 && !done) return out;
  add(
    'cipher',
    'Exercise objective: have Lt. Szabo read the lock and vouch for a key before anything is entered',
    s.flags.guessedKey ? 'failed' : s.flags.enteredVouched || ((s.flags.runMarit || s.flags.runOverride) && lockRead(s)) ? 'complete' : fin ? 'missed' : 'active',
  );
  add(
    'shelter',
    `Get the colony under cover before landfall (${v.population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} people)`,
    inOpen(s) === 0 || (dispersed && s.flags.shelterOrdered) ? 'complete' : fin ? (dispersed || id === 'scar' ? 'missed' : 'failed') : 'active',
  );
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const open = inOpen(s);
  const toll = open > 0 ? ` ${open.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} people were still in the open when it came.` : ' Everyone was under cover.';
  const id = endingId(s);
  switch (id) {
    case 'founders-key':
      return mk(id, "The Founder's Key", `Lt. Szabo rebuilt Elias Quarrie's key from his own papers. ${ENGINE_CAP} turned, and ${STORM} broke up over the hills before it reached ${COLONY}. Nobody was hurt.`, true);
    case 'daughters-hand':
      return mk(id, "His Daughter's Hand", `Marit Quarrie gave what only she knew of her father, and ${ENGINE} turned in time. ${STORM_CAP} broke up before landfall. Nobody was hurt.`, true);
    case 'override':
      return mk(id, 'Through the Trunk', `Chief Okafor cut into ${ENGINE}'s control trunk around the founder's failsafe, on Lt. Szabo's map of the lock. The Engine turned in time and ${STORM} broke up before landfall. Nobody was hurt.`, true);
    case 'half-storm':
      return mk(id, 'Half a Storm', `${ENGINE_CAP} turned too late to break ${STORM}, only to blunt it. ${COLONY} was battered.${toll}`, false);
    case 'sheltered':
      return mk(id, 'Under the Plain', `${ENGINE_CAP} never turned, but every soul in ${COLONY} was under cover when ${STORM} came through. The town and the harvest are gone; the people are not.${sim ? ' Fleet Training Command records it as a partial result.' : ''}`, false);
    case 'sealed-for-good':
      return mk(id, 'Sealed for Good', `Too many wrong answers: ${ENGINE} sealed itself for good, and ${COLONY} has lost its weather control for a generation. ${STORM_CAP} made landfall.${toll}`, false);
    case 'failsafe':
      return mk(id, 'The Failsafe', `The override cut through the founder's failsafe. ${ENGINE_CAP}'s core shut itself down for good, and nothing now stands between ${COLONY} and ${STORM}.${toll}`, false);
    case 'greywall':
      return mk(id, STORM.replace(/^the/, 'The'), `${ENGINE_CAP} never turned, and ${STORM} made landfall on ${COLONY}.${toll}`, false);
    case 'scar':
      return mk(id, 'A Scar on the Plain', `${ENGINE_CAP}'s core was burned out. The discharge broke ${STORM}, and it poisoned the valley: ${COLONY} cannot be lived in for years.`, false);
    case 'abandoned':
      return mk(id, 'Left to the Weather', `The Halcyon left ${COLONY} with ${STORM} still building.${sim ? ' Fleet Training Command ended the exercise there.' : ''}`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('greywall', 'The Greywall', `Time ran out with nothing turned.${toll}`, false);
  return null;
}
