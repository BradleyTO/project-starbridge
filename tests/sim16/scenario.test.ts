/** Training Simulation 016 — setup, science model, characters, unconventional routes, refusals, fuzz. */
import { describe, expect, it } from 'vitest';
import { GL_SIM, LEAK, careful, glass, logText, modelReady, modelThem, playG, plungeBlind, seedWhere, startG, until, untilEnd, waits } from './helpers';
import { trueLocus } from '../../src/scenarios/glass/setup';
import { createRng } from '../../src/engine/rng';

describe('setup', () => {
  it('same seed gives an identical world', () => {
    expect(GL_SIM.create(42)).toEqual(GL_SIM.create(42));
    expect(GL_SIM.create('glass-7')).toEqual(GL_SIM.create('glass-7'));
  });

  it('cast, slots, hidden facts and title are right', () => {
    const s = GL_SIM.create(3);
    expect(GL_SIM.title).toBe('Training Simulation 016: The Glass Nebula');
    expect(s.scenarioId).toBe('glass-nebula');
    expect(s.slots?.kestrelLead).toBe('vale');
    expect(s.slots?.cruiserLead).toBe('prism');
    expect(s.characters.vale.name).toMatch(/Vale/);
    expect(s.ships.kestrel.name).toBe('Citrine');
    expect(s.ships.cruiser.name).toBe('Prism');
    expect(s.facts.messages.known).toBe(false);
    expect(s.facts.model.known).toBe(false);
  });

  it('seed varies echo, physics and crew, and changes the true locus', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 80; i++) {
      const v = glass(GL_SIM.create(i));
      seen.add(`${v.echo}|${v.physics}|${v.crew}|${trueLocus(v)}`);
    }
    expect(seen.size).toBeGreaterThanOrEqual(8);
  });

  it('intro plays to yellow alert with objectives and no leaks', () => {
    const s = startG(5);
    expect(s.alert).toBe('yellow');
    expect(s.objectives.length).toBeGreaterThanOrEqual(2);
    expect(logText(s)).toMatch(/Glass Nebula|Citrine|Varga/);
    expect(logText(s)).not.toMatch(LEAK);
  });
});

describe('the science officer', () => {
  it('Varga\'s model is required for a clean success on a stay-false shear seed', () => {
    const seed = seedWhere((v) => v.echo === 'stay-false' && v.physics === 'shear' && v.crew === 'alive');
    const withModel = careful(seed);
    expect(withModel.outcome?.success).toBe(true);
    expect(withModel.outcome?.id).toBe('through-shear');
    expect(withModel.flags.studiedFirst).toBe(true);
    const blind = plungeBlind(seed);
    expect(blind.outcome?.success ?? false).toBe(false);
  });

  it('revelations come a stage at a time', () => {
    let s = playG(startG(seedWhere((v) => v.pace === 2)), ['Varga, model the nebula']);
    expect(modelReady(s)).toBe(false);
    s = until(s, (x) => !!x.facts.order.known, 8);
    expect(s.facts.order.known).toBe(true);
    expect(s.facts.model.known).toBe(false);
    s = until(s, (x) => modelReady(x), 12);
    expect(modelReady(s)).toBe(true);
    expect(s.facts.locus.known).toBe(true);
    expect(s.facts.crew.known).toBe(true);
  });

  it('Ens. Adeyemi warns once before the Fold without a model', () => {
    const seed = seedWhere((v) => v.physics === 'shear');
    const s = playG(startG(seed), ['take us through the Fold']);
    expect(logText(s)).toMatch(/Fold/);
    expect(s.flags.adeyemiWarned).toBe(true);
    expect(s.counters.moveAt ?? 0).toBe(0);
  });
});

describe('unconventional routes and refusals', () => {
  it('probe relay recovers the crew without plunging', () => {
    const seed = seedWhere((v) => v.echo === 'stay-false' && v.crew === 'alive');
    const s = untilEnd(playG(modelThem(startG(seed)), ['launch a probe relay']));
    expect(s.outcome?.id).toBe('probe-chain');
    expect(s.flags.probeOnEvidence).toBe(true);
    expect(s.flags.committedBlind ?? false).toBe(false);
  });

  it('turning back when help is an echo recovers at the Rim', () => {
    const seed = seedWhere((v) => v.echo === 'help-false' && v.crew === 'alive');
    const s = untilEnd(playG(modelThem(startG(seed)), ['turn back']));
    expect(s.outcome?.id).toBe('turned-back');
    expect(s.flags.turnedOnEvidence).toBe(true);
  });

  it('a crew refusal: weapons stay cold on a survey shuttle with souls aboard', () => {
    const s = playG(startG(seedWhere((v) => v.crew === 'alive')), ['fire beams on the Citrine']);
    expect(logText(s)).toMatch(/refus|cannot|won't|will not|civilian|people aboard|souls/i);
  });
});

describe('fuzz and invariants', () => {
  const POOL = [
    'wait', 'status', 'options', 'Varga, model the nebula', 'hail the shuttle', 'hail the buoy',
    'hold at the Rim', 'take us into the Looking Glass', 'use the Fold', 'launch a probe relay',
    'recover the shuttle crew', 'go deep after them', 'turn back', 'get us out', 'raise shields',
    'scan the area', 'which message is real?', 'blargle fizz', 'Number One, what do you recommend?',
  ];

  it('about 40 random games stay invariant and leak-free', () => {
    for (let g = 1; g <= 40; g++) {
      const rng = createRng(1000 + g);
      let s = startG(g);
      for (let i = 0; i < 12 && !s.outcome; i++) s = playG(s, [rng.pick(POOL)]);
      expect(logText(s)).not.toMatch(LEAK);
    }
  });

  it('seed sweep: the careful plan on 60 seeds gives at least 3 distinct endings including a success', () => {
    const ends = new Set<string>();
    let success = false;
    for (let i = 1; i <= 60; i++) {
      const s = careful(i);
      if (s.outcome) {
        ends.add(s.outcome.id);
        if (s.outcome.success) success = true;
      }
    }
    expect(ends.size).toBeGreaterThanOrEqual(3);
    expect(success).toBe(true);
  });

  it('doing nothing gives more than one failure ending across seeds', () => {
    const ends = new Set<string>();
    for (let i = 1; i <= 30; i++) {
      const s = untilEnd(playG(startG(i), waits(30)));
      if (s.outcome && !s.outcome.success) ends.add(s.outcome.id);
    }
    expect(ends.size).toBeGreaterThanOrEqual(2);
  });
});
