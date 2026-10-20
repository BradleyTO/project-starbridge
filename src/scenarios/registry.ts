/** v0.6: scenario modules by id (the idle bridge and every training simulation in the catalogue). */
import type { ScenarioModule } from '../engine/scenario';
import { kestrelScenario } from './kestrel';
import { tallisScenario } from './tallis';
import { bridgeScenario } from './bridge';
import { SIMULATIONS } from './catalogue';

/** Training simulations by scenario id (one module per catalogue entry that has been built). */
export const TRAINING_SCENARIOS: Record<string, ScenarioModule> = { [kestrelScenario.id]: kestrelScenario, [tallisScenario.id]: tallisScenario };

export const SCENARIOS: Record<string, ScenarioModule> = { ...TRAINING_SCENARIOS, [bridgeScenario.id]: bridgeScenario };

/** Every catalogue entry must have a module (checked by tests); unknown ids fall back to simulation #1 for old saves. */
export const scenarioFor = (id: string): ScenarioModule => SCENARIOS[id] ?? TRAINING_SCENARIOS[SIMULATIONS[0].scenarioId];
