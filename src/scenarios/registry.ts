/** v0.5: scenario modules by id (the idle bridge and the Kestrel Incident). */
import type { ScenarioModule } from '../engine/scenario';
import { kestrelScenario } from './kestrel';
import { bridgeScenario } from './bridge';

export const SCENARIOS: Record<string, ScenarioModule> = { [kestrelScenario.id]: kestrelScenario, [bridgeScenario.id]: bridgeScenario };
export const scenarioFor = (id: string): ScenarioModule => SCENARIOS[id] ?? kestrelScenario;
