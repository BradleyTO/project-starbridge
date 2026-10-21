/** Objectives (derived from state every turn) and endings for Quarantine at Tallis Gate. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { exposurePending, lifted } from './agents';
import { tallis } from './setup';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const TALLIS_ENDINGS = {
  success: ['cure-delivered', 'quarantine-lifted', 'agency-care'],
  failure: ['liner-destroyed', 'colony-outbreak', 'halcyon-quarantined', 'gate-incident', 'abandoned', 'long-road', 'gate-run', 'stalemate', 'halcyon-lost'],
} as const;

const dead = (s: WorldState) => s.counters.kestrelDead ?? 0;
const lost = (s: WorldState) => (dead(s) > 0 ? ` ${dead(s)} ${dead(s) === 1 ? 'pilgrim' : 'pilgrims'} died before help arrived.` : ' No one aboard the liner died.');

export function computeObjectives(s: WorldState, ended: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !ended) return out;
  add('diagnose', 'Find out what is making the pilgrims sick', knows(s, 'cause_known') ? 'complete' : ended ? 'missed' : 'active');
  const k = s.ships.kestrel;
  add('pilgrims', 'Get the pilgrims the help they need', k.destroyed ? 'failed' : ended ? (s.outcome?.success ? 'complete' : 'failed') : 'active');
  if (s.intro < 4 && !ended) return out;
  const bloodshed = !!s.flags.cruiserFired || !!s.flags.shotsFired;
  add('line', 'Resolve the standoff at the quarantine line without bloodshed', bloodshed ? 'failed' : ended ? (s.outcome?.success ? 'complete' : 'missed') : 'active');
  const contagion = !!s.flags.halcyonOutbreak || !!s.flags.colonyOutbreak || (ended && exposurePending(s));
  add('contain', 'Keep any contagion away from Tallis Gate and the Halcyon', contagion ? 'failed' : ended ? 'complete' : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const k = s.ships.kestrel;
  const c = s.ships.cruiser;
  const v = tallis(s);
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';

  if (s.ships.halcyon.destroyed) return mk('halcyon-lost', 'Halcyon Lost', 'The ISV Halcyon was destroyed with all hands.', false);
  if (s.flags.halcyonOutbreak) return mk('halcyon-quarantined', 'Fever Aboard', `Ilun fever broke out aboard the Halcyon. The ship and all ${s.ships.halcyon.souls} aboard spent forty days in quarantine at Corran's Rest.${lost(s)}`, false);

  if (s.flags.jumped || s.flags.leftReach) {
    const towed = !!s.flags.kestrelTowedOut;
    const everyoneAboard = k.souls === 0 && !k.destroyed && (s.counters.rescued ?? 0) > 0;
    if (!towed && !everyoneAboard) return mk('abandoned', 'Liner Abandoned', `The Halcyon left Tallis Gate with the Mercy of Ilun still stranded at the quarantine line.${lost(s)}`, false);
    if (exposurePending(s)) return mk('halcyon-quarantined', 'Fever Aboard', `You reached ISA space, but carried Ilun fever aboard: the Halcyon spent forty days in quarantine at Corran's Rest.${lost(s)}`, false);
    const how = towed ? 'towed the Mercy of Ilun' : 'carried every pilgrim';
    if (v.cause === 'fever' && !s.flags.cured && !s.flags.isolationWard) {
      const more = Math.max(3, Math.round((s.counters.sick ?? 0) / 6));
      return mk('long-road', 'The Long Road', `You ${how} to the ISA hospital at Corran's Rest, but Ilun fever went untreated for six hours: ${more} more pilgrims died on the way.${lost(s)}`, false);
    }
    return mk('agency-care', 'ISA Care', `You ${how} to the ISA hospital at Corran's Rest, six hours away, without crossing the quarantine line.${lost(s)}`, true);
  }

  if (k.destroyed) return mk('liner-destroyed', 'Fire at the Gate', `The Mercy of Ilun was destroyed at the quarantine line with everyone aboard. ${s.flags.cruiserFired ? 'The Thornwake fired; the Halcyon did not stop it.' : ''}`.trim(), false);
  if ((c.destroyed || s.flags.cruiserGone) && (s.flags.shotsFired || s.characters.marr.memory.firing === 2))
    return mk('gate-incident', 'Incident at Tallis Gate', `The Halcyon fired on the colony's own picket ship${c.destroyed ? ' and destroyed her' : ' and drove her off'}. Tallis Gate has filed charges against the ISA.${lost(s)}`, false);

  if (s.flags.linerDocked) {
    if (v.cause === 'fever' && !s.flags.cured) {
      return mk('colony-outbreak', 'Outbreak at Tallis Gate', `The Mercy of Ilun docked at Tallis Gate carrying untreated Ilun fever. The outbreak the colony feared has begun.${lost(s)}`, false);
    }
    if (!lifted(s)) return mk('gate-run', 'The Gate Run', `The Mercy of Ilun forced the quarantine line and docked without permission. No one was infected, but the colony will not forget it.${lost(s)}`, false);
  }

  if (s.flags.cured && !k.destroyed) {
    const how = s.flags.colonyDoses ? "with the colony's own antiviral stockpile, sent across by Warden-Commander Marr" : 'with an antiviral synthesised in the Halcyon\'s sickbay';
    return mk('cure-delivered', 'The Cure', `Ilun fever aboard the Mercy of Ilun was treated ${how}. The liner will be cleared to dock once the course is complete.${lost(s)}`, true);
  }
  if (lifted(s) && v.cause !== 'fever') {
    return mk('quarantine-lifted', 'Line Lifted', `Warden-Commander Marr lifted the quarantine: the sickness was ${v.cause === 'toxin' ? 'poisoned water, not a disease' : 'an allergy to incense, not a disease'}, and the Mercy of Ilun was cleared to dock at Tallis Gate.${lost(s)}`, true);
  }

  if (s.turn >= MAX_TURNS) return mk('stalemate', 'Stalemate', `${sim ? 'Thirty minutes passed without resolution; the exercise was ended by Fleet Training Command.' : 'Thirty minutes passed without resolution; ISA Fleet Command ordered the Halcyon to stand off.'}${lost(s)}`, false);
  return null;
}
