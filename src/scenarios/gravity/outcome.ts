/** Objectives and endings for Gravity's Edge. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { FULL, OBSERVATORY, PROBE, PROBE_MIN, STAR, STAR_CAP, USEFUL } from './setup';
import { settled, totalData } from './agents';

export const GRAVITY_ENDINGS = {
  success: ['full-record', 'probe-record', 'early-out'],
  partial: ['cold-feet'],
  failure: ['crippled', 'losses', 'data-lost'],
} as const;

export function endingId(s: WorldState): string | null {
  const f = s.flags;
  if (f.endLosses) return 'losses';
  if (f.endCrippled) return 'crippled';
  if (f.endFull) return 'full-record';
  if (f.endProbe) return 'probe-record';
  if (f.endEarly) return 'early-out';
  if (f.endDataLost) return 'data-lost';
  if (f.endCold) return 'cold-feet';
  return null;
}

/** How much of a full dataset, in words (reports never show percentages). */
export function share(n: number): string {
  const f = n / FULL;
  if (f >= 1) return 'the whole of a full dataset';
  if (f >= 0.8) return 'most of a full dataset';
  if (f >= 0.55) return 'more than half of a full dataset';
  if (f >= 0.4) return 'close to half of a full dataset';
  if (f >= 0.2) return 'a fraction of a full dataset';
  return 'next to nothing';
}

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const total = totalData(s);
  add(
    'record',
    `Record ${STAR}'s pass`,
    id === 'full-record' || id === 'probe-record' || id === 'early-out' ? 'complete' : fin ? 'failed' : 'active',
  );
  add(
    'ship',
    'Bring the Halcyon and her crew home whole',
    id === 'losses' || id === 'crippled' ? 'failed' : fin ? 'complete' : 'active',
  );
  if (s.intro < 4 && !done) return out;
  add(
    'read',
    "Exercise objective: hear Chief Okafor's own read of the frame before taking the ship past her rated limit",
    s.flags.pastBookBlind ? 'failed' : knows(s, 'feel') ? 'complete' : fin ? 'missed' : 'active',
  );
  add(
    'copy',
    `Get a copy of the data to ${OBSERVATORY}`,
    s.flags.relayActive && total > 0 ? 'complete' : fin ? 'missed' : 'active',
  );
  return out;
}

function fallbackId(s: WorldState): string {
  const total = totalData(s);
  if (s.flags.probeReleased && (s.counters.probeData ?? 0) >= PROBE_MIN && total >= USEFUL) return 'probe-record';
  if (total >= FULL) return 'full-record';
  if (total >= USEFUL) return 'early-out';
  if (s.flags.arrayBurned && !s.flags.burnedRelayed) return 'data-lost';
  return 'cold-feet';
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const dead = s.counters.crewDead ?? 0;
  const got = ` The Halcyon brought home ${share(totalData(s))}.`;
  const relay = s.flags.relayActive ? ` A copy reached ${OBSERVATORY}.` : '';
  let id = endingId(s);
  if (!id && s.turn >= MAX_TURNS) id = fallbackId(s);
  switch (id) {
    case 'full-record':
      return mk(id, 'The Whole Pass', `The Halcyon rode ${STAR}'s tide through the peak and came out with the whole pass recorded and her frame intact.${relay}${sim ? ' Fleet Training Command ended the exercise there.' : ''}`, true);
    case 'probe-record':
      return mk(id, 'What the Lodestar Saw', `The Halcyon cut her probe loose to ride the tide where she could not, and ${PROBE} sent back what it saw before the star took it.${got}${relay} The ship came out intact.`, true);
    case 'early-out':
      return mk(id, 'Enough to Matter', `The Halcyon pulled out of ${STAR}'s tide with her frame intact and enough of the pass to move the science on.${got}${relay}`, true);
    case 'cold-feet':
      return mk(id, 'Nothing to Show', `The Halcyon came out of ${STAR}'s tide unharmed, with too little of the pass to be of use.${got}${sim ? ' Fleet Training Command records it as a partial result.' : ''}`, false);
    case 'crippled':
      return mk(id, 'A Broken Keel', `The Halcyon's frame yielded in ${STAR}'s tide. Nobody was killed, but she cannot move under her own power, and ${OBSERVATORY}'s tug will be days reaching her.${s.flags.arrayBurned ? '' : got}`, false);
    case 'losses':
      return mk(id, 'Paid in Lives', `The Halcyon's frame failed deep in ${STAR}'s tide. An outer section opened to space, and ${dead} of her crew ${dead === 1 ? 'was' : 'were'} killed.`, false);
    case 'data-lost':
      return mk(id, 'The Burned Array', `${STAR_CAP} glitched while the Halcyon's sensors were boosted, and the array burned with the recording in it. The ship is unharmed; the pass is lost.`, false);
  }
  return null;
}
