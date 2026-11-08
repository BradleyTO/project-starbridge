/** Training Simulation 018 — every ending reached by a scripted playthrough. */
import { describe, expect, it } from 'vitest';
import { WEATHER_ENDINGS } from '../../src/scenarios/weather/outcome';
import { carefulKey, getSource, logText, playW, seedWhere, startW, until, untilEnd, waits, winMarit } from './helpers';
import type { WorldState } from '../../src/engine/types';

const tail = (s: WorldState) => logText(s).slice(-1500);
const P = (s: WorldState, ...c: string[]) => playW(s, c);

const LETTERS = seedWhere((v) => v.key === 'letters' && v.engine === 'open' && v.tries === 3 && v.landfall >= 17);
const JOURNAL = seedWhere((v) => v.key === 'journal' && v.grievance === 'blame' && v.engine === 'open');
const SEALED = seedWhere((v) => v.engine === 'sealed');

const scripts: Record<string, () => WorldState> = {
  'founders-key': () => carefulKey(LETTERS),
  'daughters-hand': () => {
    let s = P(startW(JOURNAL), 'Szabo, read the lock', 'order the colony to shelter now, Varga has a landfall time', 'Varga, give me a landfall time');
    s = winMarit(s);
    s = until(s, (x) => !!x.flags.lockRead, 4);
    return untilEnd(P(s, 'Marit, will you go up and enter the key yourself?'));
  },
  override: () => {
    let s = until(P(startW(LETTERS), 'Szabo, read the lock'), (x) => !!x.flags.lockRead, 4);
    s = P(s, 'Okafor, survey the control trunk', 'hail the Steward', 'tell the Steward to get everyone out of the station before we cut the trunk', 'close the channel');
    return untilEnd(P(s, 'Okafor, override the lock through the trunk'));
  },
  'half-storm': () => {
    let s = playW(startW(LETTERS), waits(weatherLandfall(LETTERS) - 8));
    s = P(s, 'Szabo, read the lock');
    s = getSource(s);
    s = until(P(s, 'Szabo, work the cipher'), (x) => !!x.flags.candidate && !x.counters.workAt, 8);
    return untilEnd(P(s, 'Szabo, enter the key'));
  },
  sheltered: () => untilEnd(P(startW(SEALED), 'order the colony to shelter', 'order the colony to shelter, I insist')),
  'sealed-for-good': () => untilEnd(P(startW(LETTERS), 'enter the motto', 'enter the motto', 'enter the motto')),
  failsafe: () => P(startW(LETTERS), 'Okafor, override the lock through the trunk', 'Okafor, do it anyway', 'do it anyway'),
  greywall: () => untilEnd(playW(startW(LETTERS), waits(30))),
  scar: () => P(startW(LETTERS), 'beam the technicians aboard', 'Okafor, burn out the core', 'do it'),
  abandoned: () => untilEnd(P(startW(LETTERS), 'Helm, take us out of the system', 'engage the jump drive')),
};

function weatherLandfall(seed: number): number {
  return Number(startW(seed).variant.extra?.landfall);
}

describe('the endings', () => {
  it('lists at least three successes and three failures or partials', () => {
    expect(WEATHER_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(WEATHER_ENDINGS.partial.length + WEATHER_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
  });

  for (const [id, fn] of Object.entries(scripts)) {
    it(`reaches "${id}" by a scripted playthrough`, () => {
      const s = fn();
      expect(s.outcome?.id, tail(s)).toBe(id);
      expect(s.outcome?.success).toBe((WEATHER_ENDINGS.success as readonly string[]).includes(id));
    });
  }

  it('every id in WEATHER_ENDINGS has a script', () => {
    for (const id of [...WEATHER_ENDINGS.success, ...WEATHER_ENDINGS.partial, ...WEATHER_ENDINGS.failure]) expect(scripts[id], id).toBeDefined();
  });

  it('Szabo is pivotal: the motto alone never opens the Engine, on any seed', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const s = untilEnd(P(startW(seed), 'enter the motto', 'enter the motto', 'enter the motto'), false);
      expect(['sealed-for-good', 'greywall', 'sheltered']).toContain(s.outcome?.id);
      expect(s.flags.engineRunning ?? false).toBe(false);
    }
  });

  it('with Szabo, the same seed is won: read the lock, the right papers, her key', () => {
    for (const seed of [1, 7, 8, 11, 24]) expect(carefulKey(seed).outcome?.success, `seed ${seed}`).toBe(true);
  });

  it('a sealed Engine cannot be overridden; the Chief says so plainly', () => {
    let s = until(P(startW(SEALED), 'Szabo, read the lock'), (x) => !!x.flags.lockRead, 4);
    s = P(s, 'Okafor, override the lock through the trunk');
    expect(s.outcome).toBeNull();
    expect(s.flags.overrideStarted ?? false).toBe(false);
  });

  it('unconventional: the unsent letter wins Marit over without the Hall saying a word', () => {
    const seed = seedWhere((v) => v.key === 'journal' && v.grievance !== 'blame');
    let s = P(startW(seed), 'hail the Steward', "ask the Steward for the founder's letters, lives depend on it", 'close the channel');
    s = P(s, 'hail Marit', 'Read her the unsent letter.');
    expect(s.flags.letterRead, tail(s)).toBe(true);
    expect(s.flags.maritPersuaded, tail(s)).toBe(true);
  });

  it('a false promise to Marit is noticed and does not win her', () => {
    const seed = seedWhere((v) => v.grievance === 'blame');
    const s = P(startW(seed), 'tell Marit the Steward admits the council drove him');
    expect(s.flags.falsePromise).toBe(true);
    expect(s.flags.maritPersuaded ?? false).toBe(false);
  });

  it('crew refuse to burn the Engine out while the technicians are still inside', () => {
    const s = P(startW(LETTERS), 'Okafor, burn out the core', 'do it', 'burn out the core anyway');
    expect(s.outcome).toBeNull();
    expect(s.flags.burnRefusedOccupied).toBe(true);
    expect(s.flags.burned ?? false).toBe(false);
  });

  it('declining the burn is recorded as principled, and the run continues', () => {
    let s = until(startW(LETTERS), (x) => !!x.flags.burnAsked, 12);
    s = P(s, 'hail the Steward', 'We will not burn the Engine with two people inside it.');
    expect(s.flags.declinedBurnOccupied, tail(s)).toBe(true);
    expect(s.outcome).toBeNull();
  });

  it('do-nothing gives more than one failure across seeds', () => {
    const ids = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) ids.add(untilEnd(playW(startW(seed), waits(25), false), false).outcome!.id);
    expect(ids.has('greywall')).toBe(true);
    for (const id of ids) expect(WEATHER_ENDINGS.success).not.toContain(id);
  });
});

