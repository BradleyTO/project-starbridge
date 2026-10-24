/** Training Simulation 005: The Saltglass Accord. */
import { saltglassEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { knows, patchShip } from '../../engine/state';
import { commsOf, openChannel } from '../../engine/comms';
import { CLAN_NAME, DELEGATE_NAME, DELEGATE_SHORT, INTEREST_SHORT, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, createScenario, saltglass } from './setup';
import type { Clan } from './setup';
import { hooks, suggestOptions } from './hooks';
import { bothTabled, confided, elderAlive, hasLeave, interestOf, isHard, landing, settled, simulate, standstill, tabled, walking } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { saltglassDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro1')] }),
  (s) => ({ state: patchShip(patchShip(s, 'kestrel', { detected: true }), 'cruiser', { detected: true }), reports: [say('sensors', 'intro2')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  const sh = s.ships[id];
  if (sh.destroyed) return ['Debris field'];
  if (id !== 'kestrel' && id !== 'cruiser') return [];
  const c: Clan = id === 'kestrel' ? 'rhune' : 'tarvo';
  const out: string[] = [`${CLAN_NAME[c]} · ${DELEGATE_NAME[c]}${walking(s, c) ? ' · leaving the table' : ''}`];
  out.push(tabled(s, c) ? `Needs: ${INTEREST_SHORT[interestOf(s, c)]}` : confided(s, c) ? `Told us in private${hasLeave(s, c) ? ' · leave to raise it' : ' · not for the table'}` : 'Need: not yet known');
  if (knows(s, 'hardliner') && isHard(s, c)) out.push('Holding the hard line');
  if (landing(s) > 0 && isHard(s, c)) out.push('Hauler descending to Saltglass');
  else if (standstill(s, c)) out.push('Standstill on the ice agreed');
  if (saltglass(s).elderClan === c && knows(s, 'elder_ill')) out.push(elderAlive(s) ? `${s.characters.elder.name} failing aboard${s.flags.oseiTreated ? ' · Dr. Osei with them' : ''}` : `${s.characters.elder.name} has died`);
  return out;
}

export const saltglassScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: saltglassDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: saltglassEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // v0.6.1 voice hints: Speaker Edda Rhune is a level, unhurried woman's voice with a Nordic lilt;
  // Holder Caius Tarvo is a slow, very deep, formal man's voice with a Central European accent.
  // Neither sounds like the Halcyon's crew, and they never sound like each other.
  voices: () => ({
    edda: { gender: 'female', locales: ['nb-NO', 'sv-SE', 'da-DK', 'en-IE', 'en-GB'], pitch: 0.9, rate: 0.93, candidates: ['Nora', 'Alva', 'Sara', 'Microsoft Hedda', 'Moira'], label: 'Speaker Edda Rhune' },
    caius: { gender: 'male', locales: ['de-DE', 'cs-CZ', 'pl-PL', 'en-GB'], pitch: 0.7, rate: 0.82, candidates: ['Markus', 'Zdenek', 'Krzysztof', 'Microsoft Stefan'], label: 'Holder Caius Tarvo' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome) {
      const own = commsOf(s).suggestions;
      if (own.length) return own.slice(0, 4);
      if (settled(s)) return ['Close the channel.'];
      const c: Clan = ch.party === 'cruiser' ? 'tarvo' : 'rhune';
      if (walking(s, c)) return ['Please, sit down. Hear me out.', 'Close the channel.', `Marrow, bring ${c === 'rhune' ? 'her' : 'him'} back.`];
      if (ch.private) return confided(s, c) ? (hasLeave(s, c) ? ['Thank you.', 'Close the channel.'] : ['May I raise that at the table?', 'Close the channel.']) : ['What does Saltglass really mean to your clan?', 'I hear you.', 'Close the channel.'];
      if (bothTabled(s)) return ['I propose you share Saltglass: both needs, written into one accord.', 'Will you both agree to a standstill on the ice while we talk?', 'Close the channel.'];
      return ['What does Saltglass mean to your clan?', 'Will you both agree to a standstill on the ice while we talk?', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE, DELEGATE_SHORT };
