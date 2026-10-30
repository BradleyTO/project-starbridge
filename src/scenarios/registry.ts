/** v0.6: scenario modules by id (the idle bridge and every training simulation in the catalogue). */
import type { ScenarioModule } from '../engine/scenario';
import { kestrelScenario } from './kestrel';
import { tallisScenario } from './tallis';
import { quietScenario } from './quiet';
import { reactorScenario } from './reactor';
import { saltglassScenario } from './saltglass';
import { ionScenario } from './ion';
import { ledgerScenario } from './ledger';
import { lanternScenario } from './lantern';
import { picketScenario } from './picket';
import { gardenerScenario } from './gardener';
import { coldwaterScenario } from './coldwater';
import { bridgeScenario } from './bridge';
import { SIMULATIONS } from './catalogue';

/** Training simulations by scenario id (one module per catalogue entry that has been built). */
export const TRAINING_SCENARIOS: Record<string, ScenarioModule> = { [kestrelScenario.id]: kestrelScenario, [tallisScenario.id]: tallisScenario, [quietScenario.id]: quietScenario, [reactorScenario.id]: reactorScenario, [saltglassScenario.id]: saltglassScenario, [ionScenario.id]: ionScenario, [ledgerScenario.id]: ledgerScenario, [lanternScenario.id]: lanternScenario, [picketScenario.id]: picketScenario, [gardenerScenario.id]: gardenerScenario, [coldwaterScenario.id]: coldwaterScenario };

export const SCENARIOS: Record<string, ScenarioModule> = { ...TRAINING_SCENARIOS, [bridgeScenario.id]: bridgeScenario };

/** Every catalogue entry must have a module (checked by tests); unknown ids fall back to simulation #1 for old saves. */
export const scenarioFor = (id: string): ScenarioModule => SCENARIOS[id] ?? TRAINING_SCENARIOS[SIMULATIONS[0].scenarioId];
