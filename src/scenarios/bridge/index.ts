/**
 * v0.5 (M3.1) the idle bridge — the player's home.
 *
 * The ISV Halcyon holds station in ISA survey space. No emergency, no clock pressure:
 * the crew can be talked to, the science officer can survey the neighbourhood, and a
 * simulation starts only when the captain asks for one. Reuses the Kestrel world shape
 * (the other two hulls exist but are offstage: undetected, far away, inert).
 */
import type { ScenarioModule } from '../../engine/scenario';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { SurveySystem, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import { createRng, normaliseSeed } from '../../engine/rng';
import { IDLE_BRIDGE_ID, crewChat } from '../../engine/bridge';
import { explainRefusal } from '../../engine/roe';
import { ROLE_HOLDERS, createScenario } from '../kestrel/setup';
import { templates as kestrelTemplates } from '../kestrel/templates';
import { BRIDGE_SCENARIO_TEMPLATES } from './templates';
import { CONTACT_TEMPLATES, contactDialogue } from './contact';

export const BRIDGE_TITLE = 'Bridge — ISV Halcyon';

const OFFSTAGE = { x: 9_000_000, y: 9_000_000 };

const STARS = ['K2 orange dwarf', 'G5 yellow dwarf', 'M1 red dwarf', 'F8 white star', 'binary K/M pair', 'G2 yellow dwarf'];
const NAMES = ['Ostrava', 'Kepler Vale', 'Tamsin Reach', 'Ilyria', 'Merrow', 'Castellan', 'Veyra', 'Sable Drift', 'Hadrian', 'Orelle', 'Quillon', 'Teshra'];

/** The neighbourhood within exploration range, seeded (Active Duty supplies its canonical survey instead). */
export function defaultSurvey(seed: number | string): SurveySystem[] {
  const rng = createRng(normaliseSeed(seed) ^ 0x5eed);
  const pool = [...NAMES];
  const out: SurveySystem[] = [];
  for (let i = 0; i < 5; i++) {
    const name = pool.splice(rng.int(0, pool.length - 1), 1)[0];
    out.push({ id: `sys-${name.toLowerCase().replace(/\s+/g, '-')}`, name, star: rng.pick(STARS), distanceLy: rng.int(3, 19) + rng.int(0, 9) / 10, signal: 'none', note: 'No artificial signals detected.', contacted: false, investigated: false });
  }
  return out.sort((a, b) => a.distanceLy - b.distanceLy);
}

export function createBridge(seed: number | string = 1, opts: { survey?: SurveySystem[] } = {}): WorldState {
  const base = createScenario(seed);
  const hide = (id: 'kestrel' | 'cruiser') => ({ ...base.ships[id], detected: false, position: OFFSTAGE, velocity: { x: 0, y: 0 }, nav: null, scanLevel: 0, disposition: 'unknown' as const });
  return {
    ...base,
    scenarioId: IDLE_BRIDGE_ID,
    alert: 'green',
    ships: { ...base.ships, halcyon: { ...base.ships.halcyon, heading: 0 }, kestrel: hide('kestrel'), cruiser: hide('cruiser') },
    objectives: [],
    survey: { systems: opts.survey ?? defaultSurvey(seed), course: null },
  };
}

const AMBIENT: [Parameters<typeof say>[0], string][] = [
  ['engineering', 'ambientEng'],
  ['sensors', 'ambientSci'],
  ['helm', 'ambientHelm'],
  ['tactical', 'ambientTac'],
  ['comms', 'ambientComms'],
  ['xo', 'ambientXo'],
  ['medical', 'ambientMed'],
];

/** One routine bridge line, deterministic from the seed and how many have been heard. */
export function ambientLine(s: WorldState): Applied {
  const n = s.counters.ambient ?? 0;
  const rng = createRng(normaliseSeed(s.seed) * 31 + n * 7919);
  const [role, key] = AMBIENT[(n * 3 + rng.int(0, AMBIENT.length - 1)) % AMBIENT.length];
  return { state: { ...s, counters: { ...s.counters, ambient: n + 1 } }, reports: [say(role, key, { v: rng.int(0, 2) })] };
}

function survey(s: WorldState): Applied {
  const systems = s.survey?.systems ?? [];
  if (!systems.length) return { state: s, reports: [say('sensors', 'surveyEmpty')] };
  const list = systems.map((x) => `${x.name} (${x.star}, ${x.distanceLy} ly)${x.signal !== 'none' ? ` — ${x.note}` : ''}`).join('; ');
  return { state: s, reports: [say('sensors', 'surveyReport', { n: systems.length, list })] };
}

/** "Science, show me the civilizations we've detected but haven't contacted." */
function civs(s: WorldState): Applied {
  if (!s.survey?.live) return { state: s, reports: [say('sensors', 'civsTraining')] };
  const list = (s.survey.systems ?? []).filter((x) => x.signal !== 'none' && !x.contacted);
  if (!list.length) return { state: s, reports: [say('sensors', 'civsNone')] };
  const text = list.map((x) => `${x.name}, ${x.distanceLy} light years${x.investigated ? ' (investigated)' : ''}: ${x.note.replace(/[.\s]+$/, '')}`).join('; ');
  return { state: s, reports: [say('sensors', 'civsList', { n: list.length, list: text })] };
}

function query(s: WorldState, topic: Parameters<ScenarioHooks['query']>[1]): Applied {
  const h = s.ships.halcyon;
  switch (topic) {
    case 'status':
      if (s.duty?.live)
        return { state: s, reports: [say('xo', 'dutyStatusReport', { hull: Math.round(h.hull), shields: h.shields.raised ? 'up' : 'down', weapons: h.weapons.state, alert: s.alert, location: s.duty.location, waiting: s.duty.incoming ? s.duty.incoming.title : '', contact: s.duty.contact ? s.duty.contact.station : '' })] };
      return { state: s, reports: [say('xo', 'bridgeStatus', { hull: Math.round(h.hull), shields: h.shields.raised ? 'up' : 'down', weapons: h.weapons.state, alert: s.alert })] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'systemsReport')] };
    case 'contacts':
      if (s.duty?.contact) return { state: s, reports: [say('sensors', 'contactOnSensors', { station: s.duty.contact.station, people: s.duty.contact.people, system: s.duty.contact.system })] };
      return { state: s, reports: [say('sensors', 'bridgeNoContacts')] };
    case 'objectives':
      if (s.duty?.incoming) return { state: s, reports: [say('xo', 'dutyWaiting', { title: s.duty.incoming.title })] };
      return { state: s, reports: [say('xo', s.duty?.live ? 'dutyNoMission' : 'bridgeNoMission')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestions(s).join('; ') })] };
    case 'help':
      return { state: s, reports: [sys('bridgeHelp')] };
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
  }
}

const hooks: ScenarioHooks = {
  scan: (s, target) => (target === 'area' ? survey(s) : target === 'halcyon' ? { state: s, reports: [say('engineering', 'systemsReport')] } : { state: s, reports: [say('sensors', 'bridgeNoContacts')] }),
  communicate: (s) => ({ state: s, reports: s.duty?.contact ? [] : [say('comms', 'bridgeNobodyToHail')] }),
  dialogue: contactDialogue,
  improvise: (s) => ({ state: s, reports: [say('xo', 'bridgeNothingToDo')] }),
  query,
  bridge: (s, action, rng: Rng) => {
    if (action.op === 'survey') return survey(s);
    if (action.op === 'civs') return civs(s);
    return { state: s, reports: crewChat(s, action, rng) };
  },
};

function suggestions(s: WorldState): string[] {
  const d = s.duty;
  if (d?.contact && d.contact.stage !== 'concluded') return ['Hail them', 'We come in peace. We are explorers from the ISA.', 'Who are your people?', 'Science, what do we know about them?'];
  if (d?.incoming) {
    if (d.incoming.classification === 'directive') return ['Acknowledged, we are on our way', 'Request clarification from Fleet Command', 'We refuse the directive — the ship is not fit for duty', 'First Officer, give me a status report'];
    if (d.incoming.classification === 'distress') return ['Respond to the distress call', 'Log it and continue', 'Tell me more', 'First Officer, give me a status report'];
    return ['Accept the assignment', 'Decline', 'Tell me more', 'First Officer, give me a status report'];
  }
  if (d?.live) return ['Continue the patrol', "Science, show me the civilizations we've detected but haven't contacted", 'Helm, set a course for the nearest of them', 'Computer, begin the Kestrel Incident simulation'];
  return ['Computer, begin the Kestrel Incident simulation', 'Computer, open the simulation archive', 'First Officer, give me a status report', 'Science, what systems are within exploration range?'];
}

/** Routine activity: on roughly a third of minutes someone reports something mundane. */
function simulate(s: WorldState, rng: Rng): Applied {
  if (!rng.chance(0.35)) return { state: s, reports: [] };
  return ambientLine(s);
}

export const bridgeScenario: ScenarioModule = {
  id: IDLE_BRIDGE_ID,
  title: BRIDGE_TITLE,
  create: (seed) => createBridge(seed),
  intro: [
    (s) => ({ state: s, reports: [narrate('bridgeIntro0')] }),
    (s) => ({ state: s, reports: [say('xo', s.duty?.live ? 'bridgeIntroDuty' : 'bridgeIntro1')] }),
  ],
  hooks,
  simulate,
  objectives: () => [],
  detectOutcome: () => null,
  templates: { ...kestrelTemplates, ...BRIDGE_SCENARIO_TEMPLATES, ...CONTACT_TEMPLATES },
  roleHolders: ROLE_HOLDERS,
  suggestions,
  contactDetails: () => [],
  // v0.6.1: first-contact peoples speak through the contact slot ('arden'): a slow, low, unhurried voice.
  voices: () => ({ arden: { label: 'First-contact speakers', gender: 'neutral', locales: ['en-IN', 'en-ZA', 'en-GB'], pitch: 0.8, rate: 0.9 } }),
};
