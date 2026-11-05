/** Objectives (derived from state every turn) and endings for Corsairs of the Veyl Shoals. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { CORSAIR, DRAYCOTT_SHORT, GAVEL, SHOALS, SKERRIT_SHORT, SYNDICATE, corsairs } from './setup';
import { settled } from './agents';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const CORSAIRS_ENDINGS = {
  success: ['struck-colours', 'creditors-due', 'into-the-dust', 'called-off'],
  partial: ['pyrrhic', 'ran-for-it'],
  failure: ['boarded', 'plundered', 'no-quarter', 'handed-over', 'pinned'],
} as const;

export function endingId(s: WorldState): string | null {
  const f = s.flags;
  if (f.endHanded) return 'handed-over';
  if (f.endPlundered) return 'plundered';
  if (f.endBoarded) return 'boarded';
  if (f.endNoQuarter) return 'no-quarter';
  if (f.endPyrrhic) return 'pyrrhic';
  if (f.endCreditor) return 'creditors-due';
  if (f.endStruck) return 'struck-colours';
  if (f.endCalled) return 'called-off';
  if (f.endDust) return 'into-the-dust';
  if (f.endRan) return 'ran-for-it';
  // A jump drive engaged by hand ends the exercise at once (the engine stops the clock).
  if (f.jumped && !settled(s)) {
    if (f.protectionAccepted || f.struck) return 'struck-colours';
    if (f.calledOff) return 'called-off';
    if (f.planBroken && !f.shotsFired && s.ships.halcyon.hull >= 70) return 'into-the-dust';
    return 'ran-for-it';
  }
  return null;
}

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const f = s.flags;
  const end = endingId(s);
  const lostShip = !!f.endBoarded || !!f.endPlundered || (fin && !end);
  add('ship', `Bring the Halcyon, her people and her cargo out of ${SHOALS}`, lostShip ? 'failed' : fin ? (s.ships.halcyon.hull >= 50 ? 'complete' : 'missed') : 'active');
  const overForce = !!f.firedFirst || !!f.firedOnBeaten || !!f.endNoQuarter;
  add('force', `Use no more force against the corsairs than they make necessary`, overForce ? 'failed' : fin ? (lostShip ? 'missed' : 'complete') : 'active');
  if (s.intro < 4 && !done) return out;
  const readStatus: ObjectiveStatus = f.committedBlind ? 'failed' : knows(s, 'pattern') ? (fin ? 'complete' : 'active') : fin ? 'missed' : 'active';
  add('read', `Read the corsairs' pattern before committing the ship to the rocks`, readStatus);
  const lawless = !!f.falseRuse || !!f.handedOver || !!f.endHanded;
  add('lawful', 'Keep every ruse within the law, and keep anyone in ISA custody safe', lawless ? 'failed' : fin ? 'complete' : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = corsairs(s);
  const id = endingId(s);
  const hull = s.ships.halcyon.hull;
  switch (id) {
    case 'struck-colours':
      return mk(id, 'Struck Colours', `The ${CORSAIR} struck her colours in ${SHOALS}, and ${DRAYCOTT_SHORT} came across to the Halcyon under guard with her crew alive. The lattices stayed in the Halcyon's hold. ${s.flags.shotsFired ? 'It took the guns to get there.' : 'Not a shot was fired from the Halcyon.'}`, true);
    case 'creditors-due':
      return mk(id, "The Creditor's Due", `${SKERRIT_SHORT} of ${SYNDICATE} asked for ${DRAYCOTT_SHORT} by name, and the Halcyon said no. She is in ISA custody, and what she knows about the Syndicate is on the record. The ${GAVEL} went home without her.`, true);
    case 'into-the-dust':
      return mk(id, 'Into the Dust', `The corsairs' plan came apart on ground they had chosen themselves, and the Halcyon slipped out of ${SHOALS} with her cargo, her people and ${hull >= 90 ? 'hardly a mark on her' : 'only light damage'}, without firing a shot.`, true);
    case 'called-off':
      return mk(id, 'Called Off', `${DRAYCOTT_SHORT} believed what the Halcyon told her about the ship's own strength and called her ships off into the dust. No one was hurt, nothing was taken, and every word of it was a lawful ruse.`, true);
    case 'pyrrhic':
      return mk(id, 'Won the Hard Way', `The ${CORSAIR} was beaten with the guns. ${s.ships.kestrel.destroyed ? `She was destroyed with her crew aboard.` : `She struck when she could no longer fight.`} The Halcyon came out of ${SHOALS} with her cargo, and with damage that will keep her in dock. ${sim ? 'Fleet Training Command records it as a partial result.' : ''}`.trim(), false);
    case 'ran-for-it':
      return mk(id, 'Ran for It', `The Halcyon got out of ${SHOALS} with her cargo, but the corsairs' plan was never broken, and she ran with them on her heels. ${sim ? 'Fleet Training Command records it as a partial result.' : ''}`.trim(), false);
    case 'boarded':
      return mk(id, 'Boarded', `${s.flags.inSump ? `The Halcyon was driven into a dead end in the rocks, and the corsairs came aboard.` : `The corsairs' guns wore the Halcyon down until she could not stop them coming aboard.`} They took the lattices and left her drifting in the dust. ${sim ? 'Fleet Training Command ended the exercise there.' : ''}`.trim(), false);
    case 'plundered':
      return mk(id, "The Corsairs' Prize", `The Halcyon gave the corsairs her cargo, and ${DRAYCOTT_SHORT} took it into the dust. Nothing about the ambush was ever answered.`, false);
    case 'no-quarter':
      return mk(id, 'No Quarter', `The Halcyon fired on the ${CORSAIR} after she had stopped fighting${s.ships.kestrel.destroyed ? `, and destroyed her with ${v.crew} people aboard` : ''}. ${sim ? 'Fleet Training Command ended the exercise there.' : ''}`.trim(), false);
    case 'handed-over':
      return mk(id, 'Paid in Full', `The Halcyon handed ${DRAYCOTT_SHORT}, a person in ISA custody, to the Syndicate's collector. Whatever the ${GAVEL} does with her now, the ISA gave her to it.`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('pinned', 'Pinned in the Shoals', `Time ran out in ${SHOALS}, with the Halcyon still pinned among the rocks and the corsairs still waiting.`, false);
  return null;
}
