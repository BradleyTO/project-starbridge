/** Derives narration Reports from the difference between two world states. */
import type { Report } from './report';
import { say, sys } from './report';
import type { WorldState } from './types';
import { SHIP_IDS, SYSTEM_IDS } from './types';
import { systemLabel } from './rules';

export function diffReports(before: WorldState, after: WorldState): Report[] {
  const out: Report[] = [];
  for (const id of SHIP_IDS) {
    const b = before.ships[id];
    const a = after.ships[id];
    if (!b.detected && a.detected && id !== 'halcyon') out.push(say('sensors', 'contactDetected', { ship: a.scanLevel > 0 ? a.name : a.classification }));
    if (b.detected && !a.detected && !a.destroyed && id === 'cruiser') out.push(say('sensors', 'contactLost', { ship: a.name }));
    if (b.disposition !== a.disposition && a.disposition === 'hostile' && id === 'cruiser') out.push(say('tactical', 'contactHostile', { ship: a.scanLevel > 0 ? a.name : 'The warship' }));
  }
  const bh = before.ships.halcyon;
  const ah = after.ships.halcyon;
  if (ah.hull < bh.hull && !ah.destroyed) out.push(say('engineering', 'hullDamage', { hull: ah.hull, loss: bh.hull - ah.hull }));
  for (const sid of SYSTEM_IDS) {
    const bs = bh.systems[sid].status;
    const as = ah.systems[sid].status;
    if (bs !== as && (as === 'damaged' || as === 'destroyed') && !ah.destroyed) out.push(say('engineering', as === 'destroyed' ? 'systemDestroyed' : 'systemDamaged', { system: systemLabel(sid) }));
  }
  const bc = before.ships.cruiser;
  const ac = after.ships.cruiser;
  if (ac.hull < bc.hull && !ac.destroyed) out.push(say('tactical', 'enemyDamaged', { hull: ac.hull }));
  for (const o of after.objectives) {
    const prev = before.objectives.find((x) => x.id === o.id);
    if (!prev) out.push(o.status === 'active' ? sys('objectiveNew', { text: o.text }) : sys('objectiveUpdate', { text: o.text, status: o.status }));
    else if (prev.status !== o.status) out.push(sys('objectiveUpdate', { text: o.text, status: o.status }));
  }
  return out;
}
