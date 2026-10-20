import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { knows, patchShip } from '../../engine/state';
import { ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, createScenario } from './setup';
import { hooks, suggestOptions, turnsToBreach } from './hooks';
import { simulate } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { kestrelDialogue } from './dialogue';
import { commsOf, openChannel } from '../../engine/comms';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: patchShip(s, 'kestrel', { detected: true }), reports: [say('sensors', 'intro1')] }),
  (s) => ({ state: s, reports: [{ channel: 'comms' as const, speaker: { label: 'Kestrel distress beacon' }, key: 'intro2' }] }),
  (s: WorldState) => ({ state: { ...patchShip(s, 'cruiser', { detected: true }), alert: 'yellow' as const }, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  const sh = s.ships[id];
  if (sh.destroyed) return ['Debris field — no life signs'];
  const out: string[] = [];
  if (id === 'kestrel') {
    if (sh.souls === 0) out.push('No life signs — crew evacuated');
    else if (knows(s, 'kestrel_status')) out.push(`${sh.souls} aboard`);
    if (s.flags.kestrelStable) out.push('Reactor stabilised');
    else if (knows(s, 'kestrel_status')) out.push(`Containment ${Math.round(sh.containment)}% · ~${turnsToBreach(s)} min to breach`);
    if (sh.weapons.state !== 'safe') out.push('Point-defence ARMED');
    if (knows(s, 'compartment_exists')) out.push(knows(s, 'passenger_identity') ? `Aft compartment: ${s.characters.passenger.name}${s.flags.passengerAboard ? ' (now aboard Halcyon)' : ' in stasis'}` : 'Shielded aft compartment — contents unknown');
  }
  if (id === 'cruiser') {
    if (sh.scanLevel >= 2) out.push(`Hull ${Math.round(sh.hull)}% · shields ${sh.shields.raised ? `${Math.round(sh.shields.strength)}%` : 'down'}`);
    if (sh.weapons.state === 'locked' && sh.weapons.target) out.push(`Weapons LOCKED on ${s.ships[sh.weapons.target].name}`);
    else if (sh.weapons.state !== 'safe') out.push('Weapons charged');
    if (knows(s, 'cruiser_weakness')) out.push('Weakness: misaligned aft shield emitter');
  }
  return out;
}

export const kestrelScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: kestrelDialogue },
  simulate,
  objectives: computeObjectives,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  suggestions: (s) => {
    // v0.5: on an open channel, suggest things to say (the other party's own suggestions first).
    const ch = openChannel(s);
    if (ch && !s.outcome) {
      const own = commsOf(s).suggestions;
      if (own.length) return own.slice(0, 4);
      return ch.party === 'cruiser'
        ? ['We are here on a rescue mission.', 'We need ten minutes to evacuate the crew.', 'Release your weapons lock.', 'Close the channel.']
        : ch.party === 'kestrel'
          ? ['How many people are aboard?', 'Get your people ready to beam over.', 'What are you carrying?', 'Close the channel.']
          : ['We are offering you asylum.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
