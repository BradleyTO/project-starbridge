/** Training Simulation 020 — every ending reached by a scripted playthrough. */
import { describe, expect, it } from 'vitest';
import { GRAVITY_ENDINGS } from '../../src/scenarios/gravity/outcome';
import type { WorldState } from '../../src/engine/types';
import { byBook, careful, grav, knows, logText, playG, probeRun, seedWhere, startG, until, untilEnd, waits } from './helpers';

const tail = (s: WorldState) => logText(s).slice(-1500);
const P = (s: WorldState, ...c: string[]) => playG(s, c);

const STRONG_HIGH = seedWhere((v) => v.hull === 'strong' && v.gauges === 'high');
const TIRED = seedWhere((v) => v.hull === 'tired' && v.gauges !== 'high');
const ANY = seedWhere((v) => v.hull === 'sound');

const scripts: Record<string, () => WorldState> = {
  'full-record': () => careful(STRONG_HIGH),
  'probe-record': () => probeRun(ANY),
  'early-out': () => careful(TIRED),
  'cold-feet': () => untilEnd(P(startG(ANY), 'take us out')),
  crippled: () => untilEnd(P(startG(ANY), 'clear the outer sections', 'take us deeper', ...waits(30))),
  losses: () => untilEnd(P(startG(ANY), 'take us deeper', ...waits(30))),
  'data-lost': () => untilEnd(P(startG(ANY), 'boost sensors', ...waits(30))),
};

describe('the endings', () => {
  it('lists at least three successes and three failures or partials', () => {
    expect(GRAVITY_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(GRAVITY_ENDINGS.partial.length + GRAVITY_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
  });

  for (const [id, fn] of Object.entries(scripts)) {
    it(`reaches "${id}" by a scripted playthrough`, () => {
      const s = fn();
      expect(s.outcome?.id, tail(s)).toBe(id);
      expect(s.outcome?.success).toBe((GRAVITY_ENDINGS.success as readonly string[]).includes(id));
    });
  }

  it('every id in GRAVITY_ENDINGS has a script', () => {
    for (const id of [...GRAVITY_ENDINGS.success, ...GRAVITY_ENDINGS.partial, ...GRAVITY_ENDINGS.failure]) expect(scripts[id], id).toBeDefined();
  });

  it('the gut call wins: on a strong frame with gauges reading high, hearing the Chief gets the whole pass and going by the gauges does not', () => {
    const a = careful(STRONG_HIGH);
    const b = byBook(STRONG_HIGH);
    expect(a.outcome?.id, tail(a)).toBe('full-record');
    expect(knows(a, 'feel')).toBe(true);
    expect(b.outcome?.id, tail(b)).not.toBe('full-record');
    expect(knows(b, 'feel')).toBe(false);
  });

  it('the gut call is missed: on a tired frame, going by the gauges cripples the ship, and listening to her never does and nearly always brings data home', () => {
    let book = 0;
    let n = 0;
    let won = 0;
    for (let seed = 1; seed <= 80; seed++) {
      if (grav(startG(seed)).hull !== 'tired') continue;
      n++;
      if (['crippled', 'losses'].includes(byBook(seed, false).outcome!.id)) book++;
      const c = careful(seed);
      expect(['crippled', 'losses'], `seed ${seed}`).not.toContain(c.outcome!.id);
      if (c.outcome!.success) won++;
    }
    expect(n).toBeGreaterThan(5);
    expect(won).toBeGreaterThanOrEqual(Math.ceil(n * 0.8));
    expect(book).toBeGreaterThanOrEqual(Math.ceil(n / 2));
  });

  it('Chief Okafor is pivotal: her read comes only from asking her once the frame has spoken, and the warning before a glitch only if she is listening', () => {
    let s = P(startG(ANY), 'Chief, how does she feel?');
    expect(knows(s, 'feel')).toBe(false);
    expect(logText(s)).toMatch(/has not said anything yet/);
    s = until(P(s, 'take us deeper'), (x) => !!x.flags.soundGroan, 20);
    s = P(s, 'Chief, how does she feel?');
    expect(knows(s, 'feel'), tail(s)).toBe(true);
    const v = grav(startG(ANY));
    const deaf = until(P(startG(ANY), 'take us out'), (x) => x.turn >= v.glitchA - 1, 30);
    expect(knows(deaf, 'tell')).toBe(false);
    const ear = until(P(startG(ANY), 'Chief, listen to the frame'), (x) => x.turn >= v.glitchA - 1, 30);
    expect(knows(ear, 'tell'), tail(ear)).toBe(true);
  });

  it('a false stutter looks like a real one to science, and only the Chief can tell them apart', () => {
    const seed = seedWhere((v) => v.falseAt > 0 && v.falseAt < v.glitchA);
    const v = grav(startG(seed));
    const s = until(P(startG(seed), 'Chief, listen to the frame'), (x) => x.turn >= v.falseAt, 30);
    expect(logText(s)).toMatch(/pulse just stuttered/);
    expect(logText(s)).toMatch(/did not even notice that one/);
    expect(knows(s, 'tell')).toBe(false);
  });

  it('Director Aalto acts on his own clock: he presses for more before the peak', () => {
    const v = grav(startG(ANY));
    const s = until(startG(ANY), (x) => x.turn >= v.peakAt - 3, 30);
    expect(logText(s)).toMatch(/Can you take her any deeper/);
  });

  it('unconventional: a boosted array that burns in a glitch loses nothing already sent to the observatory', () => {
    const s = untilEnd(P(startG(ANY), 'Szabo, relay our data to the observatory', 'boost sensors', ...waits(30)));
    expect(s.flags.arrayBurned, tail(s)).toBe(true);
    expect(s.counters.relayed ?? 0).toBeGreaterThan(0);
    expect(s.outcome?.id).not.toBe('data-lost');
  });

  it('unconventional: turning end-on to the tide spares the frame', () => {
    const a = until(P(startG(ANY), 'take us deeper'), (x) => x.turn >= 6, 10);
    const b = until(P(startG(ANY), 'turn the ship end-on to the star', 'take us deeper'), (x) => x.turn >= 6, 10);
    expect(b.flags.endOn).toBe(true);
    expect(b.counters.stress).toBeLessThan(a.counters.stress);
  });

  it('the probe needs ears: released without the observatory, what it sees after the Halcyon leaves is lost', () => {
    let s = startG(ANY);
    const v = grav(s);
    s = until(s, (x) => x.turn >= v.peakAt - 2);
    s = untilEnd(P(s, 'release the probe', 'take us out'));
    expect(s.flags.probeUnheard, tail(s)).toBe(true);
    expect(s.outcome?.id).not.toBe('probe-record');
  });

  it('the Chief warns before deeper once the frame is talking, and an override is recorded', () => {
    let s = until(P(startG(ANY), 'take us deeper'), (x) => !!x.flags.soundCrack, 20);
    if (s.outcome) return;
    s = P(s, 'take us out');
    expect(s.flags.withdrewOnWarning).toBe(true);
    let t = until(P(startG(TIRED), 'take us deeper'), (x) => !!x.flags.soundGroan, 20);
    t = P(t, 'pull back', 'take us deeper');
    expect(t.counters.pendingWarn ?? 0, tail(t)).toBe(1);
    t = P(t, 'do it');
    expect(t.flags.overrodeChief).toBe(true);
  });

  it('do-nothing gives more than one failure or partial across seeds and never a success', () => {
    const ids = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) ids.add(untilEnd(playG(startG(seed), waits(30), false), false).outcome!.id);
    expect(ids.size).toBeGreaterThanOrEqual(2);
    for (const id of ids) expect(GRAVITY_ENDINGS.success).not.toContain(id);
  });
});
