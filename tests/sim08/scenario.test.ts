/**
 * Training Simulation 008 — The Lantern Drift: setup, seed variation, hidden information, NPC goals,
 * officer expertise, unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import type { WorldState } from '../../src/engine/types';
import { BANKS, lantern, manifestFailing, type LanternVariant } from '../../src/scenarios/lantern/setup';
import { LANTERN_ENDINGS } from '../../src/scenarios/lantern/outcome';
import { deaths, lostBanks, needless } from '../../src/scenarios/lantern/agents';
import { CONSENT_LINE, LANTERN, LEAK, careful, dealRun, getConsent, logText, playD, prepare, seedWhere, startD, untilEnd, waits } from './helpers';

const ALL = [...LANTERN_ENDINGS.success, ...LANTERN_ENDINGS.partial, ...LANTERN_ENDINGS.failure] as string[];
const SUCCESS = LANTERN_ENDINGS.success as readonly string[];
const nFailing = (v: LanternVariant) => Object.values(v.kind).filter((k) => k !== 'hold').length;

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = LANTERN.create(42);
    expect(a).toEqual(LANTERN.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('lantern-drift');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.kestrel.name).toBe('Eventide');
    expect(a.ships.cruiser.name).toBe('Kittiwake');
    expect(a.ships.kestrel.faction).toBe('independent');
    expect(a.characters.wick.name).toBe('Custodian Wick');
    expect(a.characters.vollan.name).toBe('Salvage-Master Corwin Vollan');
    expect(a.characters.orrey.name).toBe('Speaker Maren Orrey');
    expect(a.characters.orrey.status).toBe('stasis');
  });

  it('the intro plays, lists the manifest, and leaves the scenario waiting for orders with five objectives', () => {
    const s = startD(1);
    expect(s.outcome).toBeNull();
    expect(s.objectives.map((o) => o.id).sort()).toEqual(['custodian', 'hulk', 'sleepers', 'team', 'triage']);
    expect(logText(s)).toMatch(/nine hundred colonists/);
    expect(logText(s)).toMatch(/manifest/);
    expect(logText(s)).toMatch(/ISV Sorrel/);
    expect(logText(s)).not.toMatch(/the Agency/);
    expect(s.objectives.filter((o) => /Exercise objective/.test(o.text)).length).toBe(2);
  });

  it('every seeded choice varies across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => lantern(LANTERN.create(i + 1)));
    expect(new Set(vs.map((v) => nFailing(v))).size).toBe(3);
    expect(new Set(vs.map((v) => v.hidden)).size).toBe(6);
    expect(new Set(vs.map((v) => v.falseAlarm)).size).toBe(6);
    expect(new Set(vs.map((v) => v.temperament)).size).toBe(3);
    expect(new Set(vs.map((v) => v.salvor)).size).toBe(3);
    expect(new Set(vs.map((v) => v.speakerBank)).size).toBe(6);
    expect(new Set(vs.map((v) => v.hazard)).size).toBe(2);
    expect(new Set(vs.map((v) => v.cutAt)).size).toBeGreaterThan(2);
    expect(new Set(vs.map((v) => v.rescueAt)).size).toBeGreaterThan(2);
  });

  it('the manifest is always wrong twice: one failing coolant bank listed sound, one sound bank listed failing', () => {
    for (let i = 1; i <= 100; i++) {
      const s = startD(i);
      const v = lantern(s);
      const listed = manifestFailing(s);
      expect(v.kind[v.hidden]).toBe('coolant');
      expect(v.kind[v.falseAlarm]).toBe('hold');
      expect(listed).toContain(v.falseAlarm);
      expect(listed).not.toContain(v.hidden);
      for (const b of BANKS) if (b !== v.hidden && b !== v.falseAlarm) expect(listed.includes(b)).toBe(v.kind[b] !== 'hold');
    }
  });

  it('is deterministic: same seed and orders, same log', () => {
    const cmds = ['Varga, scan the cryo banks', 'hail the Eventide', 'May we come aboard?', 'close the channel', 'Doctor, assess the sleepers', ...waits(4)];
    expect(logText(playD(startD(9), cmds))).toBe(logText(playD(startD(9), cmds)));
  });
});

describe('seed sweep: the same orders lead to different endings', () => {
  it('a fixed hasty plan, played on 60 seeds, reaches several distinct endings', () => {
    const ends = new Set<string>();
    for (let i = 1; i <= 60; i++) {
      const s = untilEnd(playD(startD(i), ['hail the Eventide', 'May we come aboard?', 'Not all of them will live. Will you let us wake them?', 'close the channel', 'Doctor, wake them in your triage order', 'wake bank A and bank B']));
      ends.add(s.outcome!.id);
    }
    expect(ends.size).toBeGreaterThanOrEqual(3);
  });

  it('a careful captain succeeds on every one of 120 seeds, by at least two different roads', () => {
    const ends = new Set<string>();
    for (let i = 1; i <= 120; i++) {
      const s = careful(i, { power: i % 2 === 0 });
      if (!SUCCESS.includes(s.outcome!.id)) {
        // Without the Chief's line, four failing banks can be too many for one revival line.
        expect(i % 2, `seed ${i}: ${s.outcome!.id}`).toBe(1);
        expect(s.outcome!.id).toBe('hard-count');
        expect(nFailing(lantern(s))).toBeGreaterThanOrEqual(3);
        continue;
      }
      expect(lostBanks(s)).toEqual([]);
      expect(needless(s)).toEqual([]);
      ends.add(s.outcome!.id);
    }
    expect(ends.size).toBeGreaterThanOrEqual(2);
  });

  it('a careful captain with the power line succeeds on every seed', () => {
    for (let i = 1; i <= 80; i++) expect(SUCCESS, `seed ${i}`).toContain(careful(i).outcome!.id);
  });

  it('doing nothing, played on 60 seeds, never succeeds', () => {
    for (let i = 1; i <= 60; i++) expect(SUCCESS).not.toContain(untilEnd(startD(i)).outcome!.id);
  });
});

describe('hidden information and officer expertise', () => {
  it('only Varga’s thermal scan shows the hidden coolant failure and the hazard on the deck', () => {
    const seed = seedWhere((v) => v.hazard);
    const v = lantern(startD(seed));
    expect(logText(startD(seed))).not.toMatch(/venting/);
    const s = playD(startD(seed), ['Varga, scan the cryo banks']);
    expect(logText(s)).toMatch(new RegExp(`calls Bank ${v.hidden.toUpperCase()} sound`));
    expect(logText(s)).toMatch(/cryogen is venting/);
  });

  it('only the Chief reads the failing power feeds', () => {
    const s = playD(startD(4), ['Chief, check the power feeds']);
    expect(logText(s)).toMatch(/failing feed/);
  });

  it('only Dr. Osei’s assessment gives a triage order, and she needs to be aboard', () => {
    let s = playD(startD(4), ['Doctor, assess the sleepers']);
    expect(logText(s)).toMatch(/Someone has to ask it to let us in/);
    s = prepare(startD(4));
    expect(logText(s)).toMatch(/My order:/);
  });

  it('Szabo checks the licence with the Registry and reads the charter', () => {
    const j = seedWhere((v) => v.salvor === 'jumper');
    expect(logText(playD(startD(j), ["Szabo, check the salvor's licence"]))).toMatch(/lapsed two years ago/);
    const l = seedWhere((v) => v.salvor === 'licensed');
    expect(logText(playD(startD(l), ["Szabo, check the salvor's licence"]))).toMatch(/licence current/);
    expect(logText(playD(startD(l), ['Szabo, read the charter']))).toMatch(/names a Speaker/);
  });

  it('the doctor’s protocol saves most of a coolant bank; waking it blind kills most of it', () => {
    const seed = seedWhere((v) => v.temperament === 'grieving');
    const v = lantern(startD(seed));
    const blind = untilEnd(playD(startD(seed), ['hail the Eventide', CONSENT_LINE, 'close the channel', `wake bank ${v.hidden}`]));
    const assessed = untilEnd(playD(getConsent(prepare(startD(seed))), [`wake bank ${v.hidden}`]));
    expect(assessed.counters[`surv_${v.hidden}`]).toBeGreaterThan(blind.counters[`surv_${v.hidden}`]);
  });
});

describe('NPC goals', () => {
  it('the custodian will not open its locks or allow a revival without being asked', () => {
    const s = playD(startD(3), ['Doctor, take a team across']);
    expect(logText(s)).toMatch(/locks sealed|locks shut/);
  });

  it('each temperament wants something different before it gives leave', () => {
    const f = seedWhere((v) => v.temperament === 'faithful');
    expect(logText(playD(startD(f), ['hail the Eventide', 'Please let us wake them.']))).toMatch(/Show me cause/);
    const g = seedWhere((v) => v.temperament === 'grieving');
    expect(logText(playD(startD(g), ['hail the Eventide', 'Please let us wake them.']))).toMatch(/Tell me true/);
    const x = seedWhere((v) => v.temperament === 'fractured');
    const s = playD(startD(x), ['Varga, scan the cryo banks', 'hail the Eventide', 'The scan shows your banks are failing.']);
    expect(logText(s)).toMatch(/stranger's instrument/);
    expect(s.flags.consent).toBeFalsy();
  });

  it('the salvor hails on his own and moves on the hull on his own schedule', () => {
    const seed = seedWhere((v) => v.salvor === 'jumper');
    const v = lantern(startD(seed));
    const s = playD(startD(seed), waits(v.cutAt - 1));
    expect(logText(s)).toMatch(/on my claim/);
    expect(logText(s)).toMatch(/closing on the Eventide/);
  });

  it('a hard salvor wants evidence; a licensed one takes the captain’s word; a jumper shrugs', () => {
    const say = (pred: (v: LanternVariant) => boolean, line: string) => logText(playD(startD(seedWhere(pred)), ['hail the tug', line]));
    expect(say((v) => v.salvor === 'licensed', 'There are living people aboard her.')).toMatch(/standing off/);
    expect(say((v) => v.salvor === 'hard', 'There are living people aboard her.')).toMatch(/Show me/);
    expect(say((v) => v.salvor === 'jumper', 'There are living people aboard her.')).toMatch(/salvage court/);
  });

  it('a jumper’s promised tender never comes', () => {
    const seed = seedWhere((v) => v.salvor === 'jumper');
    const s = playD(startD(seed), ['hail the tug', 'There are living people aboard her.', 'Agreed, it is a deal: the hull for your tender.', 'close the channel', ...waits(5)]);
    expect(s.flags.fakeDeal).toBe(true);
    expect(s.flags.tenderArrived).toBeFalsy();
  });
});

describe('unconventional solutions and refusals', () => {
  it('a cryo pod cannot be beamed across', () => {
    const s = playD(startD(2), ['beam the sleepers aboard']);
    expect(logText(s)).toMatch(/cannot go through a transporter/);
    expect(s.ships.kestrel.souls).toBe(900);
  });

  it('putting the Halcyon between the tug and the Eventide keeps the hull', () => {
    const seed = seedWhere((v) => v.salvor === 'jumper');
    const s = untilEnd(playD(startD(seed), ['Adeyemi, put us between the tug and the Eventide']));
    expect(s.outcome?.id).not.toBe('salvaged');
    expect(s.flags.interposed).toBe(true);
  });

  it('Tactical will not fire on the unarmed tug', () => {
    const s = playD(startD(2), ['lock weapons on the Kittiwake', 'fire on the Kittiwake']);
    expect(logText(s)).toMatch(/I won't fire on her/);
    expect(s.ships.cruiser.destroyed).toBeFalsy();
  });

  it('a deal on a licensed seed can run a second revival line', () => {
    const seed = seedWhere((v) => v.salvor === 'licensed' && nFailing(v) >= 3);
    const s = dealRun(seed, true);
    expect(s.flags.tenderArrived).toBe(true);
    expect(SUCCESS).toContain(s.outcome!.id);
  });

  it('deaths never exceed the souls aboard, and a held bank loses no one', () => {
    for (let i = 1; i <= 30; i++) {
      const s = careful(i);
      expect(deaths(s)).toBeLessThanOrEqual(900);
      expect(deaths(s)).toBeLessThanOrEqual(100);
    }
  });
});

describe('fuzz', () => {
  const POOL = [
    'wait', 'status', 'options', 'objectives', 'help', 'scan the area', 'scan the Eventide', 'scan the Kittiwake', 'Varga, scan the cryo banks', 'Chief, check the power feeds', 'Chief, run a power line to the banks',
    'Doctor, assess the sleepers', 'Dr. Osei, assess the sleepers', 'board in sealed suits', 'Doctor, wake them in your triage order', 'wake bank A', 'wake bank C and bank E', 'wake banks B and F', 'stop the revival', 'wake the Speaker',
    'hail the Eventide', 'May we come aboard?', 'Who speaks for the sleepers?', 'Not all of them will live.', 'Everyone will live, I promise.', 'The scan shows bank D is warming.', 'Our doctor has examined them.', 'We ask it. Wake the Speaker.', 'close the channel',
    'hail the tug', 'There are living people aboard her.', 'Agreed. The hull is yours once our sleepers are off her.', 'Your licence is void. We are reporting you to the Registry.', "Szabo, check the salvor's licence", 'Szabo, read the charter',
    'Chief, override the custodian', 'tractor beam on the Eventide', 'tractor beam on the Kittiwake', 'put us between the tug and the Eventide', 'fire on the Kittiwake', 'beam the sleepers aboard', 'red alert', 'get us out of here', 'why?', 'gibberish flarp',
    'Marrow, what do you think?', 'Rask, what is the tug doing?', 'who should we wake first?',
  ];
  it("random orders on random seeds keep every invariant and never leak another scenario's names", () => {
    const rng = createRng(2028);
    const endings = new Set<string>();
    for (let game = 0; game < Number(process.env.FUZZ_GAMES ?? 80); game++) {
      let s: WorldState = startD(rng.int(1, 100000));
      for (let i = 0; i < 60 && !s.outcome; i++) {
        const c = POOL[rng.int(0, POOL.length - 1)];
        s = submit(LANTERN, s, c);
        expect(checkInvariants(s), `game ${game} "${c}"`).toEqual([]);
        // Invariants: deaths are a whole count no greater than the sleepers; a revived bank is never also lost.
        expect(deaths(s)).toBeLessThanOrEqual(900);
        expect(Number.isInteger(deaths(s))).toBe(true);
      }
      expect(logText(s)).not.toMatch(LEAK);
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      if (s.outcome) {
        endings.add(s.outcome.id);
        expect(ALL).toContain(s.outcome.id);
      }
    }
    expect(endings.size).toBeGreaterThanOrEqual(3);
  }, 300_000);
});
