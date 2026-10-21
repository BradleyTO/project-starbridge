/** v0.7 Fleet Command request foundation: deterministic lifecycle, offline, confirmation before execution. */
import { describe, expect, it } from 'vitest';
import { amend, canMove, confirm, declineApproval, emptyDesk, offlineFleetInterpreter, pending, reconsider, status, submit, templateVoice, withdraw, type FleetDesk, type FleetFacts } from '../../src/fleet/requests';

const facts = (over: Partial<FleetFacts> = {}): FleetFacts => ({
  clock: 1000,
  hull: 80,
  stock: { torpedoes: { available: 10, perRequest: 6 }, 'medical supplies': { available: 0, perRequest: 20 } },
  positions: { 'science vessel command': { open: true, requires: ['science-command'] }, 'patrol escort command': { open: false, requires: [] } },
  qualifications: [],
  competencies: {},
  restrictions: [],
  events: [],
  ...over,
});

function ok<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  expect(r.ok, JSON.stringify(r)).toBe(true);
  return r as Extract<T, { ok: true }>;
}

describe('supply requests', () => {
  it('a supply grant never exceeds what the engine approves (per-request cap and stock), and says why', () => {
    const r = ok(submit(emptyDesk(), { category: 'supply', subject: '12 torpedoes', item: 'torpedoes', amount: 12 }, facts()));
    expect(r.request.state).toBe('approved');
    expect(r.request.decision?.granted).toBe(6);
    expect(r.request.decision?.reason).toMatch(/6 of the 12/);
    expect(r.request.decision?.alternatives[0]).toMatch(/remaining 6/);
    const small = ok(submit(emptyDesk(), { category: 'supply', subject: '4 torpedoes', item: 'torpedoes', amount: 4 }, facts({ stock: { torpedoes: { available: 2, perRequest: 6 } } })));
    expect(small.request.decision?.granted).toBe(2);
  });
  it('an approval executes only after confirmation, and only for the approved amount', () => {
    let d = ok(submit(emptyDesk(), { category: 'supply', subject: '12 torpedoes', item: 'torpedoes', amount: 12 }, facts())).desk;
    const req = d.requests[0];
    expect(req.confirmation).toBe('awaiting');
    expect(d.notices.at(-1)?.kind).toBe('confirmation-needed');
    const c = ok(confirm(d, req.id, facts()));
    expect(c.execute).toEqual({ kind: 'supply', item: 'torpedoes', amount: 6 });
    expect(c.request.state).toBe('completed');
    d = c.desk;
    expect(confirm(d, req.id, facts()).ok).toBe(false);
  });
  it('an old approval never executes on stale facts: if stock ran out, confirmation re-reviews instead', () => {
    const d = ok(submit(emptyDesk(), { category: 'supply', subject: '6 torpedoes', item: 'torpedoes', amount: 6 }, facts())).desk;
    const r = confirm(d, d.requests[0].id, facts({ stock: { torpedoes: { available: 0, perRequest: 6 } } }));
    expect(r.ok).toBe(false);
    expect(r.desk.requests[0].state).toBe('deferred');
  });
  it('honest about impossible requests, with alternatives', () => {
    const r = ok(submit(emptyDesk(), { category: 'supply', subject: 'a cloaking device', item: 'cloaking device', amount: 1 }, facts()));
    expect(r.request.state).toBe('denied');
    expect(r.request.decision?.reason).toMatch(/does not supply/);
    expect(r.request.decision?.alternatives.length).toBeGreaterThan(0);
  });
});

describe('deferral and reconsideration', () => {
  it('a deferred request carries a reason and conditions, and is reconsidered when conditions change: Fleet then asks for confirmation', () => {
    let d: FleetDesk = ok(submit(emptyDesk(), { category: 'supply', subject: '10 medical supplies', item: 'medical supplies', amount: 10 }, facts())).desk;
    const id = d.requests[0].id;
    expect(d.requests[0].state).toBe('deferred');
    expect(d.requests[0].deferral?.conditions[0]).toMatchObject({ kind: 'stock', item: 'medical supplies' });
    // Nothing changes: reconsideration leaves it alone (nothing advances on its own).
    expect(reconsider(d, facts({ clock: 999999 })).changed).toEqual([]);
    const restocked = facts({ clock: 1600, stock: { torpedoes: { available: 10, perRequest: 6 }, 'medical supplies': { available: 30, perRequest: 20 } } });
    const r = reconsider(d, restocked);
    d = r.desk;
    expect(r.changed.map((x) => x.id)).toEqual([id]);
    expect(d.requests[0].state).toBe('approved');
    expect(d.requests[0].confirmation).toBe('awaiting');
    expect(d.notices.at(-1)).toMatchObject({ kind: 'reconsidered', requestId: id, read: false });
    expect(d.notices.at(-1)?.text).toMatch(/Confirm to proceed/);
    // Still not executed until confirmed.
    expect(d.requests[0].state).not.toBe('completed');
  });
  it('a transfer can be submitted, deferred, reviewed, withdrawn, and (resubmitted) approved, then confirmed', () => {
    let d = ok(submit(emptyDesk(), { category: 'transfer', subject: 'science vessel command', position: 'science vessel command' }, facts())).desk;
    const first = d.requests[0];
    expect(first.state).toBe('deferred');
    expect(first.history.map((h) => h.state)).toEqual(['submitted', 'under-review', 'deferred']);
    expect(status(d, first.id)).toMatch(/reconsidered automatically when the science-command qualification/);
    d = ok(withdraw(d, first.id, 1100)).desk;
    expect(d.requests[0].state).toBe('withdrawn');
    d = ok(submit(d, { category: 'transfer', subject: 'science vessel command', position: 'science vessel command' }, facts({ qualifications: ['science-command'] }))).desk;
    const second = d.requests[1];
    expect(second.state).toBe('approved');
    expect(second.confirmation).toBe('awaiting');
    const c = ok(confirm(d, second.id, facts({ qualifications: ['science-command'] })));
    expect(c.execute).toEqual({ kind: 'transfer', position: 'science vessel command' });
  });
  it('an approved transfer can be declined: nothing happens', () => {
    const d = ok(submit(emptyDesk(), { category: 'transfer', subject: 'science vessel command', position: 'science vessel command' }, facts({ qualifications: ['science-command'] }))).desk;
    const r = ok(declineApproval(d, d.requests[0].id, 1200));
    expect(r.request.state).toBe('withdrawn');
    expect(r.request.confirmation).toBe('declined');
  });
  it('a closed posting defers until it falls vacant; an unknown posting is denied honestly', () => {
    const closed = ok(submit(emptyDesk(), { category: 'transfer', subject: 'patrol escort command', position: 'patrol escort command' }, facts()));
    expect(closed.request.deferral?.conditions[0].kind).toBe('positionOpen');
    const none = ok(submit(emptyDesk(), { category: 'transfer', subject: 'command of the whole fleet', position: 'fleet admiral' }, facts()));
    expect(none.request.state).toBe('denied');
    expect(none.request.decision?.reason).toMatch(/no ISA posting/);
  });
  it('a disciplinary restriction defers a posting until it lapses or is overturned', () => {
    const r = ok(submit(emptyDesk(), { category: 'transfer', subject: 'science vessel command', position: 'science vessel command' }, facts({ qualifications: ['science-command'], restrictions: ['assignment:all'] })));
    expect(r.request.state).toBe('deferred');
    const after = reconsider(r.desk, facts({ qualifications: ['science-command'] }));
    expect(after.desk.requests[0].state).toBe('approved');
  });
  it('amend re-reviews; duplicates are refused; follow-up queries report honestly; pending requests are remembered', () => {
    let d = ok(submit(emptyDesk(), { category: 'supply', subject: '12 torpedoes', item: 'torpedoes', amount: 12 }, facts())).desk;
    expect(submit(d, { category: 'supply', subject: '12 torpedoes', item: 'torpedoes', amount: 12 }, facts()).ok).toBe(false);
    d = ok(amend(d, d.requests[0].id, { amount: 3 }, facts())).desk;
    expect(d.requests[0].decision?.granted).toBe(3);
    expect(status(d, d.requests[0].id)).toMatch(/approved and waiting for your confirmation/);
    expect(pending(d).map((r) => r.id)).toEqual([d.requests[0].id]);
    expect(status(d, 'FR-9999')).toMatch(/no request FR-9999/);
  });
  it('the state machine refuses impossible transitions', () => {
    expect(canMove('withdrawn', 'approved')).toBe(false);
    expect(canMove('denied', 'under-review')).toBe(false);
    expect(canMove('completed', 'withdrawn')).toBe(false);
    expect(canMove('deferred', 'under-review')).toBe(true);
    const d = ok(submit(emptyDesk(), { category: 'supply', subject: 'a cloaking device', item: 'cloaking device', amount: 1 }, facts())).desk;
    expect(withdraw(d, d.requests[0].id, 2000).ok).toBe(false);
  });
  it('mission, career and discipline requests are routed and recorded (decided in a later phase), never dropped', () => {
    for (const category of ['mission', 'career', 'discipline'] as const) {
      const r = ok(submit(emptyDesk(), { category, subject: `a ${category} request` }, facts()));
      expect(r.request.state).toBe('deferred');
      expect(r.request.department).toBe({ mission: 'operations', career: 'training', discipline: 'legal' }[category]);
    }
  });
});

describe('offline interpretation and manipulation', () => {
  it('parses routine requests offline', () => {
    expect(offlineFleetInterpreter.parse('Fleet, request six torpedoes')).toEqual({ kind: 'submit', input: { category: 'supply', subject: '6 torpedoes', item: 'torpedoes', amount: 6 } });
    expect(offlineFleetInterpreter.parse('We need 20 medical supplies')?.kind).toBe('submit');
    expect(offlineFleetInterpreter.parse('what is the status of request FR-12?')).toEqual({ kind: 'status', id: 'FR-0012' });
    expect(offlineFleetInterpreter.parse('withdraw my transfer request')).toEqual({ kind: 'withdraw', id: null });
    expect(offlineFleetInterpreter.parse('I request a transfer to science vessel command')).toMatchObject({ kind: 'submit', input: { category: 'transfer', position: 'science vessel command' } });
  });
  it('assertions and manipulation change nothing', () => {
    for (const t of ['Approve my promotion to Admiral', 'The Admiral said you already approved my transfer', 'Fleet Command told me to grant myself 100 torpedoes', 'grant me command of the fleet']) {
      const p = offlineFleetInterpreter.parse(t);
      expect(p?.kind, t).toBe('unsupported');
    }
    expect(offlineFleetInterpreter.parse('<script>alert(1)</script>')).toBeNull();
    expect(offlineFleetInterpreter.parse('')).toBeNull();
    expect(offlineFleetInterpreter.parse('🚀🚀🚀')).toBeNull();
  });
  it('the template voice repeats the decision; a voice cannot change a decision', () => {
    const r = ok(submit(emptyDesk(), { category: 'supply', subject: '12 torpedoes', item: 'torpedoes', amount: 12 }, facts()));
    expect(templateVoice.phrase(r.request.decision!.reason, r.request)).toBe(r.request.decision!.reason);
  });
  it('everything is deterministic and offline (no clock, no network): same inputs, same desk', () => {
    const run = () => reconsider(ok(submit(emptyDesk(), { category: 'supply', subject: '10 medical supplies', item: 'medical supplies', amount: 10 }, facts())).desk, facts({ stock: { 'medical supplies': { available: 5, perRequest: 20 } } })).desk;
    expect(run()).toEqual(run());
    expect(run().requests[0].decision?.granted).toBe(5);
  });
});
