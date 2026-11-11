/** Training Simulation 021 — scenario shape, seed sweep, fuzz and state invariants. */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { LEAK, NL_SIM, evidence, gapRun, keystoneRun, logText, makersRun, nine, playN, startN, tranHurt, untilEnd, waits } from './helpers';
import { SCENARIO_TITLE } from '../../src/scenarios/ninefold/setup';
import { candidates, settled } from '../../src/scenarios/ninefold/agents';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';

describe('scenario shape', () => {
  it('title matches catalogue form and create is deterministic', () => {
    expect(NL_SIM.title).toBe(SCENARIO_TITLE);
    expect(NL_SIM.title).toMatch(/^Training Simulation 021: /);
    const a = NL_SIM.create(42);
    const b = NL_SIM.create(42);
    expect(a).toEqual(b);
    expect(a.scenarioId).toBe('ninefold-lock');
    expect(a.provenance.timeline).toBe('simulation');
  });

  it('setup: four of ours sealed in the depot, the cutter not yet in sight, and the lock hidden', () => {
    const s = NL_SIM.create(9);
    expect(s.ships.kestrel.souls).toBe(4);
    expect(s.ships.kestrel.classification).toMatch(/Directorate supply depot/);
    expect(s.ships.cruiser.detected).toBe(false);
    expect(s.ships.halcyon.souls).toBe(212);
    for (const f of ['watch', 'cycle', 'question', 'boardRead', 'hallRead', 'bays', 'log', 'run']) expect(s.facts[f].known, f).toBe(false);
    expect(s.facts.trapped.known).toBe(true);
    expect(s.counters.cand).toBe(7);
    expect(s.slots?.passenger).toBeNull();
  });

  it('the intro plays to yellow alert with objectives, and the exercise objective is labelled', () => {
    const s = startN(3);
    expect(s.alert).toBe('yellow');
    expect(s.objectives.map((o) => o.id)).toEqual(['team', 'watch', 'force']);
    expect(s.objectives.find((o) => o.id === 'watch')!.text).toMatch(/^Exercise objective/);
    expect(logText(s)).not.toMatch(LEAK);
    expect(logText(s)).toMatch(/the ISA|ISA space/);
    expect(logText(s)).not.toMatch(/Agency/);
  });

  it('seed sweep: the trigger, the evidence, the question, the screen, the air and the quartermaster all vary', () => {
    const sets: Record<string, Set<string | number | boolean>> = {};
    const add = (k: string, x: string | number | boolean) => (sets[k] ??= new Set()).add(x);
    for (let i = 1; i <= 80; i++) {
      const v = nine(NL_SIM.create(i));
      add('trigger', v.trigger);
      add('log', v.logIncident);
      add('lean', v.lean === v.trigger);
      add('question', v.question);
      add('live', v.live);
      add('stores', v.stores);
      add('hall', v.hall);
      add('period', v.period);
      add('air', v.airEnd);
      add('temper', v.temper);
      add('arrive', v.arrive);
      add('hurt', tranHurt(v));
    }
    expect(sets.trigger.size).toBe(3);
    expect(sets.log.size).toBe(2);
    expect(sets.lean.size).toBe(2);
    expect(sets.question.size).toBe(3);
    expect(sets.stores.size).toBe(3);
    expect(sets.hall.size).toBe(2);
    expect(sets.period.size).toBe(3);
    expect(sets.temper.size).toBe(3);
    expect(sets.hurt.size).toBe(2);
    expect(sets.live.size).toBeGreaterThanOrEqual(4);
    expect(sets.air.size).toBeGreaterThanOrEqual(4);
    expect(sets.arrive.size).toBeGreaterThanOrEqual(4);
  });

  it('seed sweep: the same plan (ask the Directorate) ends differently across seeds, including a success', () => {
    const ids = new Set<string>();
    for (let i = 1; i <= 40; i++) ids.add(untilEnd(playN(startN(i), [...waits(nine(startN(i)).arrive - 1), 'hail the Ordinal', 'Will you stand the lock down? We will take nothing.', 'close the channel'], false), false).outcome!.id);
    expect(ids.has('makers')).toBe(true);
    expect(ids.has('lost')).toBe(true);
    expect(ids.has('detained')).toBe(true);
  });

  it('the evidence always settles what the Watch answers to, and Rask says so', () => {
    for (let i = 1; i <= 40; i++) {
      const s = evidence(i);
      expect(candidates(s), `seed ${i}`).toEqual([nine(s).trigger]);
      expect(s.facts.watch.known, `seed ${i}`).toBe(true);
    }
  });

  it('the by-the-book routes work on every seed tried', () => {
    const gaps = new Set<string>();
    for (let i = 1; i <= 25; i++) {
      const id = gapRun(i).outcome!.id;
      gaps.add(id);
      // A hard quartermaster does not wait for a slow screen: she takes the team herself.
      expect(id, `gap seed ${i}`).toMatch(nine(startN(i)).temper === 'hard' ? /^(gap|cost|detained)$/ : /^(gap|cost)$/);
      expect(keystoneRun(i).outcome?.id, `keystone seed ${i}`).toBe('keystone');
    }
    expect(gaps.has('gap')).toBe(true);
    for (let i = 1; i <= 25; i++) expect(makersRun(i).outcome?.id, `makers seed ${i}`).toBe('makers');
  });

  it('orders and questions reach the right people', () => {
    let s = startN(3);
    let ctx = contextFrom(s);
    const imp = { kind: 'actions', actions: [{ type: 'improvise' }] };
    const chat = { kind: 'actions', actions: [{ type: 'bridge' }] };
    for (const o of ['take us in slowly', 'drift in cold', 'back us out', "Szabo, pull the Pipit's log", 'launch a probe slowly', 'Varga, watch the screen', 'beam them out at the next gap', 'answer the keystone: three', 'Chief, send a cutting team to cut them out', 'Doctor, talk them through treating Tran', 'fire on the depot', 'take out the gun emplacements'])
      expect(interpretSync(o, ctx), o).toMatchObject(imp);
    for (const q of ['Rask, what is this thing?', 'Rask, what sets off the Watch?', 'Rask, what does the keystone want?', 'Rask, read the board', 'how much air do they have?'])
      expect(interpretSync(q, ctx), q).toMatchObject(chat);
    s = playN(s, ['hail Lieutenant Kaminski']);
    ctx = contextFrom(s);
    expect(interpretSync('We are coming for you.', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'speak', to: 'kestrel' }] });
  });

  it('every suggestion is an order the interpreter understands', () => {
    let s = startN(5);
    for (let i = 0; i < 12 && !s.outcome; i++) {
      for (const o of NL_SIM.suggestions!(s)) {
        const r = interpretSync(o, contextFrom(s));
        expect(r.kind, o).not.toBe('none');
        expect(r.kind, o).not.toBe('clarify');
      }
      s = playN(s, [i === 2 ? 'hail Lieutenant Kaminski' : i === 3 ? 'close the channel' : 'wait']);
    }
  });

  it("fuzzed playthroughs never leak other simulations' names or missing keys", () => {
    const seeds = [1, 5, 7, 10, 19, 31, 44, 55, 66, 77];
    const cmds = [
      ['take us in', 'do it', 'beam them out', 'beam them out', 'status', 'back us out'],
      ['scan the depot', 'Varga, scan the screen', 'launch a probe', 'launch a probe slowly with sensors sweeping', 'take us in cold', 'beam them out at the next gap'],
      ['hail Lieutenant Kaminski', 'what happened?', 'what does the board show?', 'what is in the bays?', 'describe the hall', 'how much air?', 'hold on, we are coming', 'close the channel'],
      ['fire on the depot', 'take out the gun emplacements', 'do it', 'fire on the Ordinal', 'raise shields', 'red alert'],
      ['answer the keystone: four', 'do it', 'answer the keystone: seven', 'do it', 'Rask, what does the keystone want?', 'options', 'objectives', 'help'],
      ['xyzzy plugh', 'go ahead', 'Chief, send a cutting team down', 'do it', 'Doctor, help Tran', 'beam the team aboard', 'tractor the depot'],
      ['hail the Ordinal', 'We never touched your depot.', 'Our team was surveying it and the doors sealed.', 'We will take nothing and make no scans. Stand the lock down.', 'close the channel', 'back us out'],
      ['take us in', 'helm, take us out of the system', 'engage the jump drive'],
      waits(30),
    ];
    for (const seed of seeds) {
      for (const c of cmds) {
        const s = untilEnd(playN(startN(seed), c, false), false);
        const text = logText(s);
        expect(text, `seed ${seed}`).not.toMatch(LEAK);
        expect(text).not.toMatch(/\[missing|the the\b|a the\b/i);
        expect(text).not.toMatch(/\bAgency\b/);
        expect(checkInvariants(s)).toEqual([]);
        expect(s.outcome, `seed ${seed} ${c[0]}`).not.toBeNull();
        expect(settled(s) || s.turn >= 30).toBeTruthy();
        for (const k of Object.keys(s.counters)) expect(Number.isInteger(s.counters[k]), k).toBe(true);
        expect(Number.isInteger(s.ships.kestrel.souls)).toBe(true);
        expect(s.objectives.filter((o) => o.status === 'active')).toEqual([]);
      }
    }
  });

  it('when the air runs out the whole team is dead and nobody in the hall speaks again', () => {
    const s = untilEnd(startN(seedWhereLost()));
    expect(s.outcome?.id).toBe('lost');
    for (const id of ['kaminski', 'tran', 'whitlock', 'ibarra']) expect(s.characters[id].status, id).toBe('dead');
    expect(s.ships.kestrel.souls).toBe(0);
    expect(s.counters.deaths).toBe(4);
  });
});

function seedWhereLost(): number {
  for (let i = 1; i < 200; i++) if (nine(NL_SIM.create(i)).temper !== 'hard') return i;
  return 1;
}
