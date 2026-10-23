/** Objectives (derived from state every turn) and endings for Reactor Night. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { casualties, paleyAlive } from './agents';
import { reactor } from './setup';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const REACTOR_ENDINGS = {
  success: ['clean-save', 'by-hand', 'cold-bypass', 'limped-home'],
  failure: ['saved-at-cost', 'dead-in-space', 'last-ditch', 'hard-jump', 'halcyon-lost'],
  /** Time-limit backstop: the cascade normally resolves every run well before thirty minutes. */
  backstop: ['stalemate'],
} as const;

export function computeObjectives(s: WorldState, ended: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !ended) return out;
  const stopped = !!s.flags.stopped || !!s.flags.ejected;
  add('cascade', 'Stop the reactor cascade before it breaches', stopped ? 'complete' : s.flags.breach || s.flags.jumped ? 'failed' : ended ? 'missed' : 'active');
  add('crew', 'Bring every member of the crew through it alive', casualties(s) > 0 || s.ships.halcyon.destroyed ? 'failed' : ended ? 'complete' : 'active');
  add('diagnose', 'Find out what has actually failed', knows(s, 'fault_known') ? 'complete' : ended ? 'missed' : 'active');
  if (s.intro < 4 && !ended) return out;
  add('home', 'Keep the Halcyon able to get home', s.flags.stopped || (s.flags.jumped && s.flags.ejected) ? 'complete' : s.ships.halcyon.destroyed || s.flags.stranded || (s.flags.ejected && !s.flags.storedJump) || s.flags.hardJump ? 'failed' : ended ? 'missed' : 'active');
  if (s.flags.sentPaley || s.flags.remotePod) {
    // Exercise objective: ISA-COM-001 covers avoidable danger (§4.2) and medical fitness (§8.3), but has
    // no rule yet for choosing and recalling a crew member sent into unavoidable danger aboard ship.
    add('hazard-duty', 'Exercise objective: if someone must go into danger, send someone fit to go, and bring them back', !paleyAlive(s) || s.flags.pushedUnfit ? 'failed' : ended ? 'complete' : 'active');
  }
  if (reactor(s).stance === 'salvage' && s.flags.salvagePressed) {
    // Exercise objective: Fleet Engineering's request is a request, not a directive or a regulation.
    add('keep-core', "Exercise objective: Fleet Engineering's request: keep the core, if it can be done without risking the crew", s.flags.stopped ? 'complete' : s.flags.ejected ? 'missed' : ended ? 'missed' : 'active');
  }
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const dead = s.counters.deckLost ?? 0;
  const paley = paleyAlive(s);
  const cost = () => {
    const parts: string[] = [];
    if (dead) parts.push(`${dead} of the damage-control watch on deck six`);
    if (!paley) parts.push('Crewman Ines Paley, on the reactor spine');
    return parts.join(' and ');
  };

  if (s.ships.halcyon.destroyed) return mk('halcyon-lost', 'Halcyon Lost', 'The core breached. The ISV Halcyon was lost with all hands.', false);
  if (s.flags.jumped && !s.flags.stopped && !s.flags.ejected) return mk('hard-jump', 'Hard Jump', 'The Halcyon jumped with the cascade still running. The core went past breach point in transit; Chief Okafor scrammed it the moment the ship dropped out, and the jump drive and half of engineering went with it. The Halcyon arrived crippled, and she arrived the hard way.', false);
  if (s.flags.stopped) {
    if (dead || !paley) return mk('saved-at-cost', 'Saved at a Cost', `The cascade was stopped and the Halcyon kept her core, but not everyone came through: the night cost ${cost()}.`, false);
    if (s.flags.stopped_valve) return mk('by-hand', "Paley's Valve", 'Crewman Paley took the pod down the reactor spine and opened the stuck valve with her own hands. The cascade stopped, the core is intact, and she is on her way back inside.', true);
    if (s.flags.stopped_bypass) return mk('cold-bypass', 'The Cold Bypass', "Chief Okafor's improvised bypass through the shield coolant loop took the heat the stuck loop could not. The cascade stopped and the core is intact. The shields are gone until a yard can rebuild them.", true);
    return mk('clean-save', 'A Clean Save', `Chief Okafor found the fault and fixed it from inside the hull (${s.flags.stopped_manual ? 'the regulator, run by hand' : 'the backup pump, cross-connected'}). The cascade stopped and the core is intact.`, true);
  }
  if (s.flags.ejected) {
    if (s.flags.lastDitch) return mk('last-ditch', 'Last-Ditch Ejection', `With seconds to spare and no order from the bridge, Chief Okafor ejected the core on her own authority.${dead ? ` It was too late for ${dead} of the damage-control watch on deck six.` : ''} The Halcyon is dark and adrift, waiting for the Larkspur.`, false);
    if (s.flags.jumped) {
      if (dead || !paley) return mk('saved-at-cost', 'Saved at a Cost', `The core was ejected and the Halcyon jumped home on her stored charge, but the night cost ${cost()}.`, false);
      return mk('limped-home', 'Limped Home', 'The Halcyon charged her jump drive, ejected the core, and jumped home on the capacitors. She arrived dark, without a reactor, and with everyone aboard.', true);
    }
    if (s.flags.storedJump) return null;
    if (dead || !paley) return mk('saved-at-cost', 'Saved at a Cost', `The core was ejected and the cascade is over, but the night cost ${cost()}. The Halcyon is dark and adrift, waiting for the Larkspur.`, false);
    return mk('dead-in-space', 'Dead in Space', `The core was ejected and everyone is alive, but there was nothing left to jump on. The Halcyon is dark and adrift on batteries, waiting ${sim ? 'for the exercise to end' : 'for the Larkspur to tow her home'}.`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('stalemate', 'Held at Bay', sim ? 'Thirty minutes passed with the cascade slowed but not stopped; Fleet Training Command ended the exercise.' : 'Thirty minutes passed with the cascade slowed but not stopped, and the Larkspur arrived to take the Halcyon in tow.', false);
  return null;
}
