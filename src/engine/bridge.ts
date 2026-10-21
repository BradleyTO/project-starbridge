/**
 * v0.5 (M3.1) bridge-level commands: the ship is the player's home.
 *
 *   openArchive — "Computer, open the simulation archive"
 *   beginSim    — "Computer, begin the Kestrel Incident simulation" (only from the idle bridge)
 *   endSim      — "Computer, end the simulation" (only inside a simulation)
 *   listSims    — "Computer, list simulations" / "what simulations are available?" (catalogue)
 *   survey      — "Science, what systems are within exploration range?" (scenario hook)
 *   chat        — small talk with an officer ("Okafor, how are the engines?")
 *   civs        — "Science, show me the civilizations we've detected but haven't contacted"
 *   course      — "Helm, set a course for Veyra" (Active Duty: the app moves the Halcyon in canonical time)
 *   patrol      — "Continue the patrol" (Active Duty: canonical hours pass until something reaches the bridge)
 *   respond     — answering the hail / distress call / request waiting on the bridge
 *   rename      — v0.7: "rename the ship" / "call helm Bob" are declined politely (only the captain's name can change)
 *
 * The engine records a UI request on the WorldState; the app performs the transition (opening the
 * archive or loading a simulation). Nothing here touches the canonical universe.
 */
import type { ProposedAction } from './schema';
import type { Report, SpeakerRole } from './report';
import { say, sys } from './report';
import type { Rng } from './rng';
import type { WorldState } from './types';
import type { Applied, ScenarioHooks } from './reduce';
import { officerFrom } from './roe';
import { SIMULATIONS, simulationByName } from '../scenarios/catalogue';

export type BridgeAction = Extract<ProposedAction, { type: 'bridge' }>;
export const IDLE_BRIDGE_ID = 'bridge';
export const isIdleBridge = (s: WorldState) => s.scenarioId === IDLE_BRIDGE_ID;

export type UiRequest = NonNullable<WorldState['uiRequest']>;

export function request(s: WorldState, kind: UiRequest['kind'], id?: string, extra: { hours?: number; response?: string } = {}): WorldState {
  const seq = (s.uiRequest?.seq ?? 0) + 1;
  return { ...s, uiRequest: { kind, ...(id ? { id } : {}), ...extra, seq } };
}

/** Which simulation a spoken name refers to (the catalogue decides; nothing named → simulation 001). */
export function simulationFor(name: string | undefined): { id: string; title: string } | null {
  const sim = simulationByName(name);
  return sim ? { id: sim.trainingId, title: sim.title } : null;
}

/** "Training Simulation 001: The Kestrel Incident; Training Simulation 002: …" for the computer to read out. */
export function simulationList(): string {
  return SIMULATIONS.map((x) => `${String(x.number).padStart(3, '0')}, ${x.name}`).join('; ');
}

export function reduceBridge(s: WorldState, action: BridgeAction, hooks: ScenarioHooks, rng: Rng): Applied {
  const reports: Report[] = [];
  switch (action.op) {
    case 'openArchive':
      s = request(s, 'openArchive');
      reports.push(say('computer', 'bridgeArchiveOpen'));
      return { state: s, reports };
    case 'listSims':
      return { state: s, reports: [say('computer', 'bridgeSimList', { n: SIMULATIONS.length, list: simulationList(), example: SIMULATIONS[SIMULATIONS.length - 1].name })] };
    case 'beginSim': {
      const sim = simulationFor(action.scenario);
      if (!sim) return { state: s, reports: [say('computer', 'bridgeNoSuchSim', { name: action.scenario ?? '' })] };
      if (!isIdleBridge(s)) return { state: s, reports: [say('computer', s.provenance.timeline === 'canonical' ? 'bridgeSimOnDuty' : 'bridgeSimRunning')] };
      s = request(s, 'beginSim', sim.id);
      reports.push(say('computer', 'bridgeSimLoading', { title: sim.title }));
      return { state: s, reports };
    }
    case 'endSim':
      if (isIdleBridge(s)) return { state: s, reports: [say('computer', 'bridgeNoSim')] };
      if (s.provenance.timeline !== 'simulation') return { state: s, reports: [say('computer', 'bridgeNotASim')] };
      s = request(s, 'endSim');
      reports.push(say('computer', 'bridgeSimEnding'));
      return { state: s, reports };
    case 'acceptCommission':
      // The app knows whether Fleet Command is waiting for an answer; it replies in character.
      return { state: request(s, 'acceptCommission'), reports };
    case 'patrol':
      if (!s.duty?.live) return { state: s, reports: [say('xo', isIdleBridge(s) ? 'dutyPatrolTraining' : 'bridgeSimOnDuty')] };
      return { state: request(s, 'patrol', undefined, { hours: action.hours ?? 6 }), reports: [] };
    case 'respond':
      if (!s.duty?.incoming) return { state: s, reports: [say('xo', 'dutyNothingWaiting')] };
      return { state: request(s, 'respond', s.duty.incoming.offerId, { response: action.scenario ?? 'accept' }), reports: [] };
    case 'course':
      if (!isIdleBridge(s)) return { state: s, reports: [say('helm', 'bridgeSimOnDuty')] };
      if (!s.duty?.live) return { state: s, reports: [say('helm', 'dutyCourseTraining')] };
      return { state: request(s, 'course', undefined, { response: action.scenario ?? '' }), reports: [] };
    case 'civs':
    case 'survey':
      if (hooks.bridge) return hooks.bridge(s, action, rng);
      return { state: s, reports: [say('sensors', 'bridgeSurveyBusy')] };
    case 'rename':
      // v0.7: only the captain's own name can change (Service Record → Personnel). Nothing else is renamed.
      return { state: s, reports: [say('xo', action.scenario === 'self' ? 'renameSelf' : action.scenario === 'ship' ? 'renameShip' : 'renameOther')] };
    case 'chat':
      if (hooks.bridge) {
        const r = hooks.bridge(s, action, rng);
        if (r.reports.length) return r;
      }
      return { state: s, reports: crewChat(s, action, rng) };
  }
}

const TOPICS: [RegExp, string][] = [
  [/\b(how are you|how'?s it going|how are things|you (ok|okay|alright|all right)|how do you feel)\b/, 'self'],
  [/\b(crew|morale|everyone|people)\b/, 'crew'],
  [/\b(engines?|reactor|warp|drive|power|coolant)\b/, 'engines'],
  [/\b(sensors?|array|scan|readings?|anything out there)\b/, 'sensors'],
  [/\b(weapons?|torpedo(es)?|shields?|tactical)\b/, 'weapons'],
  [/\b(course|heading|navigation|where are we|position)\b/, 'helm'],
  [/\b(thank|thanks|good work|well done|nice job)\b/, 'thanks'],
  [/\b(good (morning|evening|afternoon|night)|hello|hi|hey)\b/, 'greet'],
];

/** Small talk with an officer: answered in character from the current ship state. Costs a few seconds. */
export function crewChat(s: WorldState, action: BridgeAction, rng: Rng): Report[] {
  const role: SpeakerRole = officerFrom(action.officer) ?? 'xo';
  const t = (action.text ?? '').toLowerCase();
  const topic = TOPICS.find(([re]) => re.test(t))?.[1] ?? 'other';
  const h = s.ships.halcyon;
  const vars = { hull: Math.round(h.hull), alert: s.alert, variant: rng.int(0, 2) };
  return [say(role, `chat_${topic}`, vars)];
}

export const BRIDGE_TEMPLATES: Record<string, (v: Record<string, string | number>) => string> = {
  bridgeArchiveOpen: () => 'Simulation archive open on your display, Captain.',
  renameShip: () => 'With respect, Captain, the Halcyon’s name is on her ISA registry, and it is not ours to change. She stays the Halcyon.',
  renameOther: () => 'I am afraid not, Captain. People keep the names they were given, and so do ships, worlds and the Agency’s departments. Your own name is the one the record lets you change.',
  renameSelf: () => 'Your name on the record is yours to set, Captain: open the Hub, Service Record, Personnel. Nothing else on the record changes.',
  bridgeSimLoading: (v) => `Loading ${v.title}. Holographic overlay engaging — this is a simulation; nothing in it changes the real universe.`,
  bridgeNoSuchSim: (v) => `There is no simulation called "${v.name}" in the archive. Say "list simulations" to hear what is available.`,
  bridgeSimList: (v) => `${v.n} training simulation${Number(v.n) === 1 ? '' : 's'} on file: ${v.list}. Say, for example, "begin the ${v.example} simulation".`,
  bridgeSimRunning: () => 'A simulation is already running. Say "end the simulation" first.',
  bridgeSimOnDuty: () => 'Not while we are on a live mission, Captain. Simulations can wait until we are back on station.',
  bridgeNoSim: () => 'No simulation is running, Captain. We are on the real bridge.',
  bridgeNotASim: () => 'This is not a simulation, Captain. It cannot be ended.',
  bridgeSimEnding: () => 'Ending simulation. Overlay disengaging.',
  bridgeSurveyBusy: () => 'Not now, Captain — the array is committed to this situation.',
  chat_self: (v) => ['Well enough, Captain. Quiet watches suit me.', 'Fine, thank you. Catching up on maintenance reports.', 'Rested and ready, Captain.'][Number(v.variant) % 3],
  chat_crew: (v) => ['Morale is good. The night watch has a card game going in the mess.', 'The crew are in good spirits, Captain. A few are studying for certification.', 'All hands accounted for. Nothing I need to bring to you.'][Number(v.variant) % 3],
  chat_engines: (v) => [`Purring, Captain. Hull at ${v.hull}%, reactor nominal.`, 'Running a routine coolant flush. She is in good shape.', 'Impulse and jump drive both green. I would not mind a proper shakedown run.'][Number(v.variant) % 3],
  chat_sensors: (v) => ['Long-range array is clear. Mostly background radiation and the odd comet.', 'Quiet out there. I am using the time to recalibrate the array.', 'Nothing on passive sensors, Captain. I will tell you the moment that changes.'][Number(v.variant) % 3],
  chat_weapons: (v) => [`Weapons safe, shields ready. ${v.alert === 'green' ? 'Green alert.' : `${String(v.alert)} alert.`}`, 'Torpedo magazine full, emitters tested this morning.', 'All quiet at tactical, Captain. I prefer it that way.'][Number(v.variant) % 3],
  chat_helm: (v) => ['Holding station, Captain. Give me a heading and we go.', 'Station-keeping. Course plotted to nowhere in particular.', 'Ready at the helm whenever you are.'][Number(v.variant) % 3],
  chat_thanks: () => 'Thank you, Captain.',
  chat_greet: (v) => ['Captain.', 'Good to see you on the bridge, Captain.', 'Captain on the bridge.'][Number(v.variant) % 3],
  chat_other: (v) => ['Captain?', 'I am not sure what you are asking, Captain — an order, or just conversation?', 'Noted, Captain.'][Number(v.variant) % 3],
};

/** Bridge actions never consume a turn; small talk and the survey take a few seconds. */
export function bridgeSeconds(a: BridgeAction): number {
  return a.op === 'chat' ? 5 : a.op === 'survey' || a.op === 'civs' ? 10 : 0;
}

export { sys };
