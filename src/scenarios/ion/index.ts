/** Training Simulation 006: Ion Season. */
import { ionEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { knows, patchShip } from '../../engine/state';
import { commsOf, openChannel } from '../../engine/comms';
import { CAPTAIN_NAME, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, createScenario, haulerOfParty } from './setup';
import type { Hauler } from './setup';
import { hooks, suggestOptions } from './hooks';
import { adrift, alone, arrivalRemarks, captainKnownUnfit, charge, cm, crewLost, crewOff, handled, over, remote, shipLeft, simulate, towed } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { ionDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro1')] }),
  (s) => ({ state: patchShip(patchShip(s, 'kestrel', { detected: true }), 'cruiser', { detected: true }), reports: [say('sensors', 'intro2')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro3')] }),
  (s) => {
    const reports = [say('xo', 'intro4')];
    const st = arrivalRemarks(s, reports);
    return { state: st, reports: [...reports, sys('introHint')] };
  },
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id !== 'kestrel' && id !== 'cruiser') return [];
  const h: Hauler = id === 'kestrel' ? 'mule' : 'gannet';
  const out: string[] = [`Ore hauler · ${CAPTAIN_NAME[h]}`];
  if (crewLost(s, h)) return [...out, 'Lost with her crew'];
  if (shipLeft(s, h)) return [...out, 'Left dark in the storm · crew aboard the Halcyon'];
  if (h === 'gannet' && alone(s)) return [...out, s.flags.teagueThrough ? 'Through on her own line' : 'Running her own line'];
  if (adrift(s, h)) out.push(`Dark and adrift${crewOff(s, h) ? ' · crew aboard the Halcyon' : ''}`);
  else out.push(`Charge ${charge(s, h)}`);
  if (towed(s, h)) out.push('Under tow');
  else if (remote(s, h)) out.push('Flown from the Halcyon’s helm');
  else if (cm(s, h).relieved) out.push('Mate at the helm');
  if (captainKnownUnfit(s, h) && !handled(s, h)) out.push('Master unfit to fly the Maw');
  else if (knows(s, 'impatient') && h === 'gannet' && !alone(s)) out.push('Impatient to go');
  return out;
}

export const ionScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: ionDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: ionEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Captain Odran Brack is a slow, low, weathered man's voice with an Irish
  // lilt; Captain Rosalind Teague is a quick, brisk woman's voice with a South African accent.
  // Neither sounds like the Halcyon's crew, and they never sound like each other.
  voices: () => ({
    brack: { gender: 'male', locales: ['en-IE', 'en-GB'], pitch: 0.74, rate: 0.85, candidates: ['Microsoft Connor', 'Moira', 'Daniel', 'Arthur'], label: 'Captain Odran Brack' },
    teague: { gender: 'female', locales: ['en-ZA', 'en-AU', 'en-NZ'], pitch: 1.1, rate: 1.08, candidates: ['Tessa', 'Microsoft Leah', 'Karen', 'Microsoft Natasha'], label: 'Captain Rosalind Teague' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome) {
      const own = commsOf(s).suggestions;
      if (own.length) return own.slice(0, 4);
      if (over(s)) return ['Close the channel.'];
      const h = haulerOfParty(ch.party);
      if (cm(s, h).admitted && !cm(s, h).relieved) return ['Will you let your mate take the helm?', 'Close the channel.'];
      if (h === 'gannet') return ['Which channel would you take?', 'Hold on, stay with us.', 'Are you fit to fly the Maw?', 'Close the channel.'];
      return ['Which channel would you take?', 'Are you fit to fly the Maw?', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
