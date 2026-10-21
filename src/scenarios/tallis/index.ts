/** Training Simulation 002: Quarantine at Tallis Gate. */
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { knows, patchShip } from '../../engine/state';
import { commsOf, openChannel } from '../../engine/comms';
import { km, range } from '../../engine/rules';
import { ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, createScenario, tallis } from './setup';
import { hooks, suggestOptions } from './hooks';
import { lifted, simulate } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { tallisDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: patchShip(s, 'kestrel', { detected: true }), reports: [say('sensors', 'intro1')] }),
  (s) => ({ state: s, reports: [{ channel: 'comms' as const, speaker: { label: 'Mercy of Ilun, open broadcast' }, key: 'intro2' }] }),
  (s: WorldState) => ({ state: { ...patchShip(s, 'cruiser', { detected: true }), alert: 'yellow' as const }, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  const sh = s.ships[id];
  if (sh.destroyed) return ['Debris field — no life signs'];
  const out: string[] = [];
  if (id === 'kestrel') {
    if (sh.souls === 0) out.push('No life signs — everyone aboard the Halcyon');
    else if (knows(s, 'liner_status')) out.push(`${sh.souls} aboard · ${s.counters.sick ?? 0} sick${s.counters.kestrelDead ? ` · ${s.counters.kestrelDead} dead` : ''}`);
    if (knows(s, 'cause_known')) out.push(`Cause: ${{ fever: 'Ilun fever (contagious)', toxin: 'poisoned water (not contagious)', panic: 'incense allergy (not contagious)' }[tallis(s).cause]}`);
    if (s.flags.cured) out.push('Antiviral delivered');
    if (s.flags.recyclerFixed) out.push('Water recycler repaired');
    if (s.characters.sabeth.memory.running === 1) out.push('RUNNING THE QUARANTINE LINE');
    else if (s.characters.sabeth.memory.running === 2) out.push('Cleared to dock');
  }
  if (id === 'cruiser') {
    out.push(lifted(s) ? 'Quarantine lifted' : `Quarantine line: ${km(40000)} · liner at ${km(range(s, 'kestrel', 'cruiser'))}`);
    if (sh.weapons.state === 'locked' && sh.weapons.target) out.push(`Weapons LOCKED on ${s.ships[sh.weapons.target].name}`);
    else if (sh.weapons.state !== 'safe') out.push('Weapons armed');
    if (sh.scanLevel >= 2) out.push(`Hull ${Math.round(sh.hull)}% · shields ${sh.shields.raised ? `${Math.round(sh.shields.strength)}%` : 'down'}`);
  }
  return out;
}

export const tallisScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: tallisDialogue },
  simulate,
  objectives: computeObjectives,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // v0.6.1 voice hints (optional): a weary liner captain and a stern colony warden.
  voices: () => ({
    sabeth: { gender: 'female', locales: ['en-AU', 'en-NZ', 'en-ZA'], pitch: 1.04, rate: 1.06, candidates: ['Karen', 'Catherine', 'Microsoft Natasha'] },
    marr: { gender: 'female', locales: ['en-GB', 'en-IE'], pitch: 0.86, rate: 0.93, candidates: ['Martha', 'Serena', 'Kate', 'Microsoft Hazel'] },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome) {
      const own = commsOf(s).suggestions;
      if (own.length) return own.slice(0, 4);
      return ch.party === 'cruiser'
        ? ['Why is the gate closed?', 'Our scans show it is not contagious.', 'Hold your fire while we help them.', 'Close the channel.']
        : ['How did the sickness start?', 'Who is aboard?', 'Hold your position — help is coming.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
