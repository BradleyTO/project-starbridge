/**
 * Standing orders and prohibitions (v0.4).
 *
 *   standing  — "If the Kestrel arms its weapons, raise our shields": actions held
 *               until a trigger is met, then validated and applied like any order.
 *   restrict  — "Do not power up weapons" / "but not until then": a prohibition that
 *               automatic behaviour (red alert, standing orders) must respect. A later
 *               explicit order from the captain lifts it, with a report.
 *
 * Also the whole-plan safety check: a command whose parts contradict each other
 * is not executed at all; the crew asks instead.
 */
import type { BaseAction, ProposedAction, RestrictSubject, Trigger } from './schema';
import type { Report } from './report';
import { say } from './report';
import type { Rng } from './rng';
import type { Restriction, StandingOrder, WorldState } from './types';
import { applyAction, type ScenarioHooks } from './reduce';
import { validate } from './validate';
import { addOrder, getOrder, updateOrder } from './orders';
import { km, range } from './rules';

const SHIP_NAME = (s: WorldState, id: 'kestrel' | 'cruiser') => s.ships[id]?.name ?? id;

export function describeTrigger(s: WorldState, t: Trigger): string {
  switch (t.kind) {
    case 'weapons':
      return t.state === 'armed' ? `${SHIP_NAME(s, t.ship)} arms weapons` : t.state === 'locked' ? `${SHIP_NAME(s, t.ship)} locks weapons` : `${SHIP_NAME(s, t.ship)} opens fire`;
    case 'range':
      return `${SHIP_NAME(s, t.ship)} is ${t.op} ${km(t.km)}`;
    case 'helmDone':
      return 'the helm order is complete';
  }
}

export const SUBJECT_LABEL: Record<RestrictSubject, string> = {
  armWeapons: 'weapons stay powered down',
  fireWeapons: 'no firing',
  raiseShields: 'shields stay down',
  lowerShields: 'shields stay up',
};

/** Which restriction (if any) an action would break. */
export function conflictsWith(a: ProposedAction | BaseAction, subject: RestrictSubject): boolean {
  switch (subject) {
    case 'armWeapons':
      return a.type === 'weapons' && (a.mode === 'arm' || a.mode === 'lock' || a.mode === 'fire');
    case 'fireWeapons':
      return a.type === 'weapons' && a.mode === 'fire';
    case 'raiseShields':
      return a.type === 'shields' && a.raise;
    case 'lowerShields':
      return (a.type === 'shields' && !a.raise) || (a.type === 'setAlert' && a.level === 'green');
  }
}

export function activeRestriction(s: WorldState, subject: RestrictSubject): Restriction | undefined {
  return s.restrictions.find((r) => r.subject === subject);
}

export type TriggerState = 'met' | 'waiting' | 'void';

export function triggerState(s: WorldState, t: Trigger, issuedTurn: number, waitsOn: number | null): TriggerState {
  switch (t.kind) {
    case 'weapons': {
      const sh = s.ships[t.ship];
      if (!sh || sh.destroyed) return 'void';
      if (t.state === 'fired') return (s.counters[`firedTurn_${t.ship}`] ?? -1) > issuedTurn ? 'met' : 'waiting';
      if (t.state === 'locked') return sh.weapons.state === 'locked' ? 'met' : 'waiting';
      return sh.weapons.state === 'armed' || sh.weapons.state === 'locked' ? 'met' : 'waiting';
    }
    case 'range': {
      const sh = s.ships[t.ship];
      if (!sh || sh.destroyed) return 'void';
      const r = range(s, 'halcyon', t.ship);
      return (t.op === 'within' ? r <= t.km : r >= t.km) ? 'met' : 'waiting';
    }
    case 'helmDone': {
      if (waitsOn === null) return 'met';
      const o = getOrder(s, waitsOn);
      if (!o) return 'void';
      if (o.status === 'completed') return 'met';
      if (o.status === 'failed' || o.status === 'superseded' || o.status === 'impossible' || o.status === 'cancelled') return 'void';
      return 'waiting';
    }
  }
}

/** Whole-plan safety: contradictory parts mean nothing is executed. Returns a question, or null. */
export function planConflict(actions: ProposedAction[]): string | null {
  const has = (p: (a: ProposedAction) => boolean) => actions.some(p);
  if (has((a) => a.type === 'shields' && a.raise) && has((a) => a.type === 'shields' && !a.raise)) return 'Raise or lower the shields, Captain? That order asks for both.';
  if (has((a) => a.type === 'weapons' && a.mode === 'safe') && has((a) => a.type === 'weapons' && a.mode !== 'safe')) return 'Weapons safe, or armed, Captain? That order asks for both.';
  for (const r of actions) {
    if (r.type !== 'restrict' || r.until) continue;
    const clash = actions.find((a) => a !== r && conflictsWith(a, r.subject));
    if (clash) return `You've ordered ${SUBJECT_LABEL[r.subject]} and also ${clash.type === 'shields' ? (clash.raise ? 'shields up' : 'shields down') : clash.type === 'weapons' ? `${clash.mode} weapons` : 'a conflicting order'}. Which do you want, Captain?`;
  }
  return null;
}

/** Restrictions first (they constrain the whole plan), then everything else in the captain's order. */
export function planOrder(actions: ProposedAction[]): ProposedAction[] {
  return [...actions.filter((a) => a.type === 'posture'), ...actions.filter((a) => a.type === 'restrict'), ...actions.filter((a) => a.type !== 'posture' && a.type !== 'restrict')];
}

/** Lift restrictions an explicit captain's order overrides (they are the captain's own to lift). */
export function liftFor(s: WorldState, a: ProposedAction): { state: WorldState; reports: Report[] } {
  const lifted = s.restrictions.filter((r) => conflictsWith(a, r.subject));
  if (!lifted.length) return { state: s, reports: [] };
  for (const r of lifted) s = updateOrder(s, r.orderId, { status: 'cancelled', detail: 'lifted by a later order' });
  return { state: { ...s, restrictions: s.restrictions.filter((r) => !lifted.includes(r)) }, reports: lifted.map((r) => say('xo', 'restrictionLifted', { what: SUBJECT_LABEL[r.subject] })) };
}

/** Check triggers: lift conditional restrictions, then fire standing orders whose trigger is met. */
export function checkStanding(s: WorldState, rng: Rng, hooks: ScenarioHooks): { state: WorldState; reports: Report[] } {
  const reports: Report[] = [];
  if (s.outcome || (!s.standing.length && !s.restrictions.length)) return { state: s, reports };

  for (const r of s.restrictions) {
    if (!r.until) continue;
    const st = triggerState(s, r.until, r.issuedTurn, null);
    if (st === 'waiting') continue;
    s = { ...s, restrictions: s.restrictions.filter((x) => x.id !== r.id) };
    s = updateOrder(s, r.orderId, { status: st === 'met' ? 'completed' : 'cancelled', detail: st === 'met' ? 'condition met' : 'condition can no longer occur' });
  }

  for (const so of s.standing) {
    if (so.status !== 'armed') continue;
    const st = triggerState(s, so.trigger, so.issuedTurn, so.waitsOn);
    if (st === 'waiting') continue;
    s = { ...s, standing: s.standing.map((x) => (x.id === so.id ? { ...x, status: st === 'met' ? ('fired' as const) : ('cancelled' as const) } : x)) };
    if (st === 'void') {
      s = updateOrder(s, so.orderId, { status: 'cancelled', detail: 'condition can no longer occur' });
      reports.push(say('xo', 'standingCancelled', { when: describeTrigger(s, so.trigger) }));
      continue;
    }
    reports.push(say('xo', 'standingFired', { when: describeTrigger(s, so.trigger) }));
    for (const a of so.actions) {
      const blocking = s.restrictions.find((r) => conflictsWith(a, r.subject));
      if (blocking) {
        reports.push(say('xo', 'restrictionHolds', { what: SUBJECT_LABEL[blocking.subject] }));
        continue;
      }
      const v = validate(s, a as ProposedAction);
      reports.push(...v.reasons);
      if (v.status === 'rejected' || v.noop) continue;
      const applied = applyAction(s, v.action, rng, hooks);
      s = applied.state;
      reports.push(...applied.reports);
    }
    s = updateOrder(s, so.orderId, { status: 'completed', detail: 'executed' });
  }
  // Keep the record small: drop finished standing orders after a while.
  s = { ...s, standing: s.standing.filter((x) => x.status === 'armed' || s.turn - x.issuedTurn < 30) };
  return { state: s, reports };
}

/** Apply a standing / restrict action (validated already). */
export function addStanding(s: WorldState, a: Extract<ProposedAction, { type: 'standing' }>, label: string): { state: WorldState; reports: Report[] } {
  const waitsOn = a.trigger.kind === 'helmDone' ? (s.ships.halcyon.nav?.orderId ?? null) : null;
  const o = addOrder(s, 'xo', label, 'standing', describeTrigger(s, a.trigger));
  s = o.state;
  const id = (s.standing.reduce((m, x) => Math.max(m, x.id), 0) ?? 0) + 1;
  const so: StandingOrder = { id, orderId: o.id, trigger: a.trigger, actions: a.actions, issuedTurn: s.turn, status: 'armed', waitsOn };
  return { state: { ...s, standing: [...s.standing, so] }, reports: [say('xo', 'standingAck', { when: describeTrigger(s, a.trigger), what: label.replace(/^When [^:]+: /, '') })] };
}

export function addRestriction(s: WorldState, a: Extract<ProposedAction, { type: 'restrict' }>, label: string): { state: WorldState; reports: Report[] } {
  const reports: Report[] = [];
  const o = addOrder(s, 'tactical', label, 'standing', a.until ? `until ${describeTrigger(s, a.until)}` : 'until you say otherwise');
  s = o.state;
  const id = (s.restrictions.reduce((m, x) => Math.max(m, x.id), 0) ?? 0) + 1;
  const prior = s.restrictions.filter((r) => r.subject === a.subject);
  for (const p of prior) s = updateOrder(s, p.orderId, { status: 'superseded' });
  s = { ...s, restrictions: [...s.restrictions.filter((r) => r.subject !== a.subject), { id, orderId: o.id, subject: a.subject, until: a.until ?? null, issuedTurn: s.turn }] };
  // "Do not power up weapons": if they are hot, make them safe now.
  const h = s.ships.halcyon;
  if (a.subject === 'armWeapons' && h.weapons.state !== 'safe') {
    s = { ...s, ships: { ...s.ships, halcyon: { ...h, weapons: { state: 'safe', target: null } } } };
    reports.push(say('tactical', 'weaponsSafe'));
  }
  reports.push(say('tactical', 'restrictAck', { what: SUBJECT_LABEL[a.subject], until: a.until ? describeTrigger(s, a.until) : '' }));
  return { state: s, reports };
}
