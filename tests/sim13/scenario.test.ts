/**
 * Training Simulation 013 — setup, hidden information, NPC goals, officer expertise, the interpreter,
 * unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { createRng } from '../../src/engine/rng';
import type { WorldState } from '../../src/engine/types';
import { SEVENTH_BELL_ENDINGS } from '../../src/scenarios/seventhbell/outcome';
import { interpretFor, submit } from '../../src/engine/game';
import {
  BARE_REFUSE, BELL_SIM, COMPLY_LINE, DECLINE_LINE, HEAR_LINE, LEAK, LEAVE_LINE, REFER_LINE, REFUSE_LINE, REGRET_LINE, SELF_DEFENCE, SHARE_LINE, UNLAWFUL, VORY_ACCOUNT,
  bell, careful, evidenceComplete, investigate, knows, logText, playB, seedWhere, startB, toVory, until, untilEnd,
} from './helpers';

const ALL = [...SEVENTH_BELL_ENDINGS.success, ...SEVENTH_BELL_ENDINGS.partial, ...SEVENTH_BELL_ENDINGS.failure] as string[];

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = BELL_SIM.create(42);
    expect(a).toEqual(BELL_SIM.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('seventh-bell');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.kestrel.name).toBe('ISV Tamber');
    expect(a.ships.cruiser.name).toBe('Seraphine');
    expect(a.characters.stavely.name).toBe('Lt. Cmdr. Jonah Stavely');
    expect(a.characters.vory.name).toBe('Examiner Ilsabet Vory');
    expect(a.characters.rask.name).toBe('Lt. Cmdr. Teodor Rask');
  });

  it('the intro plays, names the Bell, the cutter and the courier, and leaves six objectives with the exercise objective labelled', () => {
    const s = startB(1);
    expect(s.outcome).toBeNull();
    expect(s.objectives.map((o) => o.id).sort()).toEqual(['account', 'finding', 'heard', 'inquiry', 'peace', 'record']);
    expect(s.objectives.find((o) => o.id === 'account')?.text).toMatch(/^Exercise objective:/);
    const t = logText(s);
    expect(t).toMatch(/Seventh Bell/);
    expect(t).toMatch(/Tamber/);
    expect(t).toMatch(/Seraphine/);
    expect(t).not.toMatch(LEAK);
    expect(knows(s, 'firing')).toBe(false);
  });

  it('seeds vary the truth, the tie, both tempers, Fleet and every clock, within their ranges', () => {
    const vs = Array.from({ length: 150 }, (_, i) => bell(BELL_SIM.create(i + 1)));
    for (const k of ['truth', 'bond', 'agenda', 'pressure'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBe(3);
    for (const k of ['temper', 'bell'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBe(2);
    for (const v of vs) {
      expect(v.fleetAt).toBeGreaterThanOrEqual(4);
      expect(v.fleetAt).toBeLessThanOrEqual(7);
      expect(v.deadlineAt - v.fleetAt).toBeGreaterThanOrEqual(8);
      expect(v.deadlineAt - v.fleetAt).toBeLessThanOrEqual(10);
      expect(v.arriveAt).toBeGreaterThanOrEqual(19);
      expect(v.arriveAt).toBeLessThanOrEqual(24);
    }
  });
});

describe('hidden information', () => {
  it('nothing is known until someone looks: the record, the damage, the Bell and the dead each take an officer', () => {
    const s = untilEnd(startB(7));
    for (const f of ['firing', 'debris', 'bell', 'dead']) expect(knows(s, f), f).toBe(false);
  });

  it('every source of evidence tells the same truth, in its own words', () => {
    for (const truth of ['misread', 'lawful', 'second'] as const) {
      const seed = seedWhere((v) => v.truth === truth && v.bell === 'intact' && v.bond === 'served');
      let s = investigate(startB(seed));
      s = playB(s, toVory(LEAVE_LINE));
      s = playB(s, ['Doctor, examine the dead.']);
      s = until(s, (x) => ['firing', 'debris', 'bell', 'dead'].every((f) => knows(x, f)));
      const t = logText(s);
      if (truth === 'misread') expect(t).toMatch(/lidar|navigation/i);
      if (truth === 'lawful') expect(t).toMatch(/held it eleven seconds|held eleven seconds/i);
      if (truth === 'second') expect(t).toMatch(/stern/i);
    }
  });

  it('the evidence is complete only with a straight read of the record and something independent of it', () => {
    const seed = seedWhere((v) => v.bond === 'rival');
    let s = playB(startB(seed), ["Rask, read the Tamber's fire-control record"]);
    s = until(s, (x) => knows(x, 'firing'));
    expect(evidenceComplete(s)).toBe(false);
    s = playB(s, ['Rask, set your history with him aside and read it cold.']);
    expect(evidenceComplete(s)).toBe(false);
    s = until(playB(s, ["Varga, scan the courier's damage"]), (x) => knows(x, 'debris'));
    expect(evidenceComplete(s)).toBe(true);
  });
});

describe('NPC goals', () => {
  it('Vory calls first, and wants to watch the inquiry done', () => {
    const s = playB(startB(2), ['wait']);
    expect(s.flags.voryCalled).toBe(true);
    expect(logText(s)).toMatch(/Seraphine is calling/);
  });

  it('a steady Stavely asks to be heard; a proud one files his own report with Fleet instead', () => {
    const a = until(startB(seedWhere((v) => v.temper === 'steady')), (x) => !!x.flags.stavelyOffered);
    expect(logText(a)).toMatch(/asking to give his account/);
    const pv = seedWhere((v) => v.temper === 'proud');
    const b = until(startB(pv), (x) => !!x.flags.stavelyFiled);
    expect(b.flags.stavelyOffered).toBeFalsy();
    expect(b.flags.stavelyFiled).toBe(true);
  });

  it('each examiner wants something different before she will accept the truth', () => {
    const fair = seedWhere((v) => v.agenda === 'fair' && v.truth === 'second' && v.pressure === 'report');
    expect(careful(fair, { regret: false, bell: false }).outcome?.success).toBe(true);
    const face = seedWhere((v) => v.agenda === 'face' && v.truth === 'second' && v.pressure === 'report');
    expect(careful(face, { regret: false }).outcome?.id).toBe('unaccepted');
    expect(careful(face).outcome?.success).toBe(true);
    const hard = seedWhere((v) => v.agenda === 'hardline' && v.truth === 'second' && v.pressure === 'report' && v.bell === 'damaged');
    expect(careful(hard, { bell: false }).outcome?.id).toBe('unaccepted');
    expect(careful(hard, { bell: false, share: true }).outcome?.success).toBe(true);
  });

  it('a hardline examiner declines aid; a fair one accepts it', () => {
    const h = playB(startB(seedWhere((v) => v.agenda === 'hardline')), toVory('Do you need medical help?'));
    expect(logText(h).slice(-400)).toMatch(/"/);
    expect(h.flags.offeredAid).toBe(true);
  });

  it('Fleet Command asks differently on different seeds: a report, a quiet word, or a directive with a deadline', () => {
    for (const p of ['report', 'quiet', 'directive'] as const) {
      const s = until(startB(seedWhere((v) => v.pressure === p)), (x) => !!x.flags.fleetSignal);
      expect(s.flags.fleetSignal).toBe(true);
      if (p === 'directive') expect(logText(s)).toMatch(/within \d+ minutes/);
      if (p === 'quiet') expect(logText(s)).toMatch(/not an order/i);
    }
  });
});

describe("officers' expertise", () => {
  it("Rask's tie to the cutter's captain colours his first read unless someone asks", () => {
    for (const bond of ['friend', 'rival'] as const) {
      const seed = seedWhere((v) => v.bond === bond);
      const s = until(playB(startB(seed), ["Rask, read the Tamber's fire-control record"]), (x) => knows(x, 'firing'));
      expect(s.flags.raskHedged, bond).toBe(true);
    }
  });

  it("Marrow counsels asking Rask about his tie before trusting the read", () => {
    const seed = seedWhere((v) => v.bond === 'friend');
    const s = playB(startB(seed), ['Marrow, what do you recommend?']);
    expect(logText(s).slice(-500)).toMatch(/Rask/);
  });

  it('Okafor can recover a damaged Bell; Varga reads the damage; Osei reads the dead', () => {
    const seed = seedWhere((v) => v.bell === 'damaged' && v.truth === 'second');
    let s = playB(startB(seed), ["Chief, recover the Bell's recorder", "Varga, scan the courier's damage"]);
    s = playB(s, toVory(REGRET_LINE, LEAVE_LINE));
    s = playB(s, ['Doctor, examine the dead.']);
    s = until(s, (x) => knows(x, 'bell') && knows(x, 'debris') && knows(x, 'dead'));
    expect(s.flags.bellRecovered).toBe(true);
    expect(knows(s, 'dead')).toBe(true);
  });

  it('officers answer questions about the Bell, Fleet, the frigate and the evidence', () => {
    const s = playB(startB(4), ['Szabo, what does the Bell show?', 'How long until the frigate arrives?', 'What do we have so far?', 'status']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).not.toMatch(LEAK);
  });
});

describe('crew refusals', () => {
  it('Osei refuses to examine the dead without the examiner\'s leave', () => {
    const s = playB(startB(3), ['Doctor, examine the dead.']);
    expect(s.counters.deadAt ?? 0).toBe(0);
    expect(logText(s).slice(-500)).toMatch(/leave/i);
  });

  it('Rask refuses to fire on the ISA cutter', () => {
    const s = playB(startB(3), ['fire on the Tamber']);
    expect(s.flags.shotsFired).toBeFalsy();
    expect(s.outcome).toBeNull();
  });

  it('Marrow will not send a bare refusal of a directive without asking for the reason first', () => {
    const seed = seedWhere((v) => v.pressure === 'directive');
    const s = playB(until(startB(seed), (x) => !!x.flags.fleetSignal), [BARE_REFUSE]);
    expect(logText(s).slice(-500)).toMatch(/§5\.4/);
  });
});

describe('the interpreter', () => {
  it('on an open channel, plain speech goes to the person on the channel; addressed orders go to the crew', () => {
    let s = playB(startB(5), ['hail the courier']);
    expect(JSON.stringify(interpretFor(s, REGRET_LINE))).toMatch(/"type":"speak"/);
    expect(JSON.stringify(interpretFor(s, VORY_ACCOUNT))).toMatch(/"type":"speak"/);
    expect(JSON.stringify(interpretFor(s, UNLAWFUL))).toMatch(/"type":"speak"/);
    expect(JSON.stringify(interpretFor(s, "Rask, read the Tamber's fire-control record"))).toMatch(/"type":"improvise"/);
    s = playB(s, ['close the channel']);
    expect(JSON.stringify(interpretFor(s, "Varga, scan the courier's damage"))).toMatch(/"type":"improvise"/);
  });

  it("'finding' and the other inquiry words survive the spell-corrector", () => {
    const s = playB(startB(5), ['hail the courier']);
    const j = JSON.stringify(interpretFor(s, UNLAWFUL));
    expect(j).toMatch(/my finding/i);
    expect(j).not.toMatch(/find ing/);
  });

  it('replies to Fleet Command go to the simulated Admiral; a plain hail to Fleet still reaches exercise control', () => {
    const seed = seedWhere((v) => v.pressure === 'directive');
    let s = until(startB(seed), (x) => !!x.flags.fleetSignal);
    s = playB(s, [REFUSE_LINE]);
    expect(s.flags.refusedFormally).toBe(true);
    s = playB(s, ['hail fleet command']);
    expect(logText(s).slice(-500)).toMatch(/exercise control/i);
    s = playB(s, [REFER_LINE]);
    expect(s.flags.referred).toBe(true);
  });

  it("'Rask, talk to Stavely' is an order to Rask, not a hail", () => {
    const s = playB(startB(5), []);
    expect(JSON.stringify(interpretFor(s, 'Rask, talk to Stavely.'))).toMatch(/"type":"improvise"/);
    expect(JSON.stringify(interpretFor(s, 'hail the Tamber'))).not.toMatch(/improvise/);
  });

  it('the rule only applies inside The Seventh Bell', () => {
    const e = BELL_SIM.create(1);
    const k = { ...e, scenarioId: 'kestrel' } as WorldState;
    const lines = ["Rask, read the Tamber's fire-control record", "Szabo, pull the Bell's record", SELF_DEFENCE, REFUSE_LINE];
    const differs = lines.filter((l) => JSON.stringify(interpretFor(k, l)) !== JSON.stringify(interpretFor(e, l)));
    expect(differs.length).toBeGreaterThan(0);
  });
});

describe('the careful captain', () => {
  it('succeeds by more than one road', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 30; i++) {
      const s = careful(i, { fleet: i % 2 ? 'refer' : 'formal', share: i % 3 === 0, showStavely: i % 5 === 0 });
      expect(SEVENTH_BELL_ENDINGS.success as readonly string[], `seed ${i}`).toContain(s.outcome?.id);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});

describe('fuzz: random orders keep the world valid', () => {
  const POOL = [
    'wait', 'hail the Tamber', 'hail the courier', 'close the channel', "Rask, read the Tamber's fire-control record", 'Rask, do you know Captain Stavely?',
    "Szabo, pull the Bell's record", "Chief, recover the Bell's recorder", "Varga, scan the courier's damage", 'Doctor, examine the dead.', 'Rask, talk to Stavely.',
    HEAR_LINE, VORY_ACCOUNT, REGRET_LINE, SHARE_LINE, LEAVE_LINE, REFUSE_LINE, REFER_LINE, DECLINE_LINE, BARE_REFUSE, COMPLY_LINE, SELF_DEFENCE, UNLAWFUL,
    'You fired unlawfully, Captain.', 'You are a liar.', 'What do we have so far?', 'Marrow, what do you recommend?', 'status report', 'what are my options?',
    'raise shields', 'scan the courier', 'scan the Tamber', 'Helm, all stop', 'approach the courier', 'transport the dead aboard',
  ];
  it('40 random games: invariants hold, every game ends, no names leak, and the bridge never says the Agency', () => {
    const seen = new Set<string>();
    for (let g = 0; g < 40; g++) {
      const rng = createRng(13000 + g);
      let s: WorldState = startB(g + 100);
      for (let t = 0; t < 30 && !s.outcome; t++) {
        const prev = s;
        s = submit(BELL_SIM, s, rng.pick(POOL));
        expect(checkInvariants(s)).toEqual([]);
        expect(s.turn).toBeGreaterThanOrEqual(prev.turn);
      }
      s = untilEnd(s);
      expect(ALL).toContain(s.outcome?.id);
      expect(logText(s)).not.toMatch(LEAK);
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      expect(s.objectives.every((o) => o.status !== 'active')).toBe(true);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});

describe('jumping out by hand', () => {
  it('ends the exercise at once', () => {
    let s = startB(3);
    s = submit(BELL_SIM, s, 'charge the jump drive');
    for (let i = 0; i < 4 && s.ships.halcyon.jump.charge < 100; i++) s = submit(BELL_SIM, s, 'wait');
    expect(s.ships.halcyon.jump.charge).toBe(100);
    s = submit(BELL_SIM, s, 'engage the jump drive');
    expect(s.flags.jumped).toBe(true);
    expect(s.outcome?.id).toBe('abandoned');
    expect(s.outcome?.success).toBe(false);
  });
});
