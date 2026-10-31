/** Objectives (derived from state every turn) and endings for Ember Tide. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { LIFTER, MOON, OUTPOST, STROME_SHORT, TIDE, bankable, ember } from './setup';
import { anyoneExposed, settled } from './agents';

const Tide = TIDE.replace(/^the/, 'The');

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const EMBER_ENDINGS = {
  success: ['banked-clear', 'on-the-tell', 'under-the-rock', 'cut-losses'],
  partial: ['too-early', 'gamble'],
  failure: ['tide-caught', 'lifter-lost', 'shallows', 'halcyon-caught', 'abandoned', 'shots-fired'],
} as const;

export function endingId(s: WorldState): string | null {
  const v = ember(s);
  const f = s.flags;
  if (f.endFired) return 'shots-fired';
  if (f.endLeft) return 'abandoned';
  // A jump drive engaged by hand ends the exercise at once (the engine stops the clock), so it is
  // judged here on who was left behind, without waiting for a flare the Halcyon will never see.
  if (f.jumped && !f.endFlare) {
    if (anyoneExposed(s)) return 'abandoned';
    if ((s.counters.underground ?? 0) > 0) return v.galleries === 'deep' ? 'under-the-rock' : 'shallows';
    if (f.banked) return 'banked-clear';
    return bankable(v) && !f.noGamble ? 'too-early' : 'cut-losses';
  }
  if (!f.endFlare) return null;
  if (f.halcyonCaught) return 'halcyon-caught';
  if (f.shelterHit) return 'shallows';
  if ((s.counters.deadCiv ?? 0) + (s.counters.deadCrew ?? 0) > 0) return 'tide-caught';
  if (f.lifterLost) return 'lifter-lost';
  if ((s.counters.underground ?? 0) > 0) return 'under-the-rock';
  if (f.gamble) return 'gamble';
  if (f.banked) return f.liftOnTell ? 'on-the-tell' : 'banked-clear';
  // Judged on the forecast at the time: a furnace given up at the last safe minute because the
  // forecast could not promise it is a sound call, even if the star would have allowed it.
  return bankable(v) && !f.noGamble ? 'too-early' : 'cut-losses';
}

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const f = s.flags;
  const v = ember(s);
  const lost = (s.counters.deadCiv ?? 0) > 0 || !!f.shelterHit || !!f.endLeft;
  add('people', `Get everyone at ${OUTPOST} clear of ${TIDE}`, lost ? 'failed' : fin && !f.endFired ? 'complete' : fin ? 'missed' : 'active');
  add('ship', 'Keep the Halcyon and her crew out of the flare', f.halcyonCaught || (s.counters.deadCrew ?? 0) > 0 ? 'failed' : fin && !f.endFired ? 'complete' : fin ? 'missed' : 'active');
  if (s.intro < 4 && !done) return out;
  const furnace: ObjectiveStatus = f.banked ? 'complete' : f.furnaceLost ? (bankable(v) && !f.noGamble ? 'failed' : 'complete') : fin ? 'missed' : 'active';
  add('furnace', `Save the outpost's furnace, if it can be banked without risking lives`, furnace);
  // Exercise objective: ISA-COM-001 has no rule requiring a ship to warn other vessels of a hazard in
  // their path (the duty-to-warn proposal from Training Simulation 003 is still awaiting approval).
  // It is a mission instruction, not a regulation.
  add('warn', `Exercise objective: warn every vessel in the flare's path, the ${LIFTER} included`, f.lifterLost ? 'failed' : f.warnedLifter ? 'complete' : fin ? 'missed' : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = ember(s);
  const id = endingId(s);
  const dead = (s.counters.deadCiv ?? 0) + (s.counters.deadCrew ?? 0);
  switch (id) {
    case 'banked-clear':
      return mk(id, 'Banked and Clear', `${Tide} swept the near face of ${MOON} and found nobody there. The furnace was banked, and the last lift left ${OUTPOST} as late as the forecast allowed and no later. The colony keeps its furnace and every one of its people.`, true);
    case 'on-the-tell':
      return mk(id, 'On the Tell', `Lt. Varga caught the flare's precursor in the star's light and gave the minute. The banking crew finished, the last lift went on her word, and ${Tide} came exactly when she said it would, to an empty outpost and a banked furnace.`, true);
    case 'under-the-rock':
      return mk(id, 'Under the Rock', `${OUTPOST} rode out ${Tide} below ground, under ${v.galleries === 'deep' ? 'ninety metres' : 'enough'} of rock, while the Halcyon waited in the moon's shadow. ${s.flags.banked ? 'The furnace was banked first.' : 'The furnace went cold, but nobody was on the surface when the flare came.'}`, true);
    case 'cut-losses':
      return mk(id, 'Cold Furnace, Every Soul', `The forecast never gave the banking crew the time they needed, and the Halcyon did not pretend it had. The furnace went cold, and ${STROME_SHORT}'s colony will struggle to afford a new one, but every soul at ${OUTPOST} lived through ${TIDE}.`, true);
    case 'too-early':
      return mk(id, 'Too Soon from the Furnace', `Everyone lived, but the banking crew came off the furnace with time still in hand, and it cracked as it cooled. ${sim ? 'Fleet Training Command records it as a partial result: the furnace could have been saved.' : 'It could have been saved.'}${s.flags.stromePanicked ? ' The Overseer pulled them herself at a false dawn nobody had answered.' : ''}`, false);
    case 'gamble':
      return mk(id, "A Gambler's Margin", `Everyone lived, and the furnace was banked, but the last lift left later than the forecast could justify. The star happened to flare late enough. ${sim ? 'Fleet Training Command records it as a partial result: the margin was luck, not judgment.' : 'Nobody on the bridge knew it would.'}`, false);
    case 'tide-caught':
      return mk(id, 'Caught by the Tide', `${Tide} reached ${dead === 1 ? 'one person' : `${dead} people`} who were still on the near face of ${MOON} or still climbing away from it. ${sim ? 'Fleet Training Command ended the exercise there.' : ''}`.trim(), false);
    case 'lifter-lost':
      return mk(id, `The ${LIFTER} in the Open`, `Everyone at ${OUTPOST} lived, but the ore lifter ${LIFTER} was still flying in the open when ${TIDE} came, and nobody had made her master understand what was coming.`, false);
    case 'shallows':
      return mk(id, 'Not Deep Enough', `${OUTPOST} went underground to ride out ${TIDE}, into galleries with far less rock over them than anyone thought. ${sim ? 'Dr. Osei is treating radiation sickness in every one of them; Fleet Training Command ended the exercise there.' : 'Many of them will be ill for a long time.'}`, false);
    case 'halcyon-caught':
      return mk(id, 'The Halcyon in the Light', `The Halcyon was still on the near side of ${MOON} when ${TIDE} came. ${sim ? 'Her hull and half her systems took the flare; Fleet Training Command ended the exercise there.' : 'She will be in dock a long time.'}`, false);
    case 'abandoned':
      return mk(id, 'Left to the Tide', `The Halcyon left ${MOON} with people still on the near face and ${TIDE} on its way.`, false);
    case 'shots-fired':
      return mk(id, `Shots at ${OUTPOST}`, `The Halcyon fired with civilians all around her. ${sim ? 'Fleet Training Command ended the exercise there.' : 'Nobody will forget it.'}`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('tide-caught', 'Caught by the Tide', `Time ran out at ${OUTPOST}.`, false);
  return null;
}
