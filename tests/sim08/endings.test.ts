/** Training Simulation 008 — The Lantern Drift: a scripted playthrough to every ending. */
import { afterAll, describe, expect, it } from 'vitest';
import type { WorldState } from '../../src/engine/types';
import { LANTERN_ENDINGS } from '../../src/scenarios/lantern/outcome';
import { BANK_NAME, lantern, manifestFailing, type LanternVariant } from '../../src/scenarios/lantern/setup';
import { deaths, heldBanks, lostBanks, needless } from '../../src/scenarios/lantern/agents';
import { CONSENT_LINE, LEAK, careful, dealRun, deterTug, getConsent, logText, playD, prepare, seedPlaying, seedWhere, startD, untilEnd, waits } from './helpers';

const reached = new Set<string>();
function ending(s: WorldState, id: string) {
  expect(s.outcome?.id, logText(s).slice(-2500)).toBe(id);
  expect(logText(s)).not.toMatch(LEAK);
  expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
  reached.add(id);
  return s;
}

const nFailing = (v: LanternVariant) => Object.values(v.kind).filter((k) => k !== 'hold').length;
const TWO = seedWhere((v) => nFailing(v) === 2);
/** A seed where the sickbay alone cannot reach every failing bank in time. */
const TIGHT = seedPlaying((s) => s.outcome?.id === 'hard-count', (i) => careful(i, { power: false }), (v) => nFailing(v) === 4);
const LICENSED_TIGHT = seedPlaying((s) => s.outcome?.id === 'hard-count', (i) => careful(i, { power: false }), (v) => nFailing(v) === 4 && v.salvor === 'licensed');
const GRIEVING = seedWhere((v) => v.temperament === 'grieving' && v.salvor === 'licensed');
const JUMPER = seedWhere((v) => v.salvor === 'jumper');
const LICENSED = seedWhere((v) => v.salvor === 'licensed');



describe('success endings', () => {
  it("keepers-rest: the doctor's triage, the custodian's honest leave, the sickbay alone", () => {
    const s = ending(careful(TWO, { power: false }), 'keepers-rest');
    expect(lostBanks(s)).toEqual([]);
    expect(needless(s)).toEqual([]);
    expect(s.flags.wickConsent).toBe(true);
  });

  it('borrowed-light: the Chief holds the failing-feed banks on the Halcyon’s power', () => {
    const s = ending(careful(TIGHT), 'borrowed-light');
    expect(heldBanks(s).length).toBeGreaterThan(0);
    expect(lostBanks(s)).toEqual([]);
  });

  it("speakers-choice: the charter's Speaker is woken and decides for her people", () => {
    let s = prepare(startD(TWO));
    s = playD(s, ['hail the Eventide', 'Who speaks for the sleepers?', 'We ask it. Wake the Speaker.', 'close the channel']);
    expect(s.counters.speakerAt).toBeGreaterThan(0);
    s = playD(s, waits(2));
    expect(s.flags.speakerAwake).toBe(true);
    s = playD(s, ['hail the Eventide', 'Your people are in danger. Our doctor has examined them, and not all of them will live. Will you decide for them?', 'close the channel']);
    expect(s.flags.speakerConsent).toBe(true);
    s = untilEnd(deterTug(playD(s, ['Doctor, wake them in your triage order'])));
    ending(s, 'speakers-choice');
  });

  it("salvage-deal: the salvor's tender is a second revival line, licence checked first", () => {
    const s = ending(dealRun(LICENSED_TIGHT, true), 'salvage-deal');
    expect(s.flags.tenderUsed).toBe(true);
    expect(s.flags.dealChecked).toBe(true);
  });
});

describe('partial endings', () => {
  it('hard-count: one line, four failing banks, and a bank the sickbay could not reach', () => {
    const s = ending(careful(TIGHT, { power: false }), 'hard-count');
    expect(lostBanks(s).length).toBe(1);
    expect(logText(s)).toMatch(/can't be started in time|won't be reached/);
  });
});

describe('failure endings', () => {
  it("wrong-banks: the manifest's banks woken blind; its false alarm woken, its hidden failure lost", () => {
    const v = lantern(startD(GRIEVING));
    let s = playD(startD(GRIEVING), ['hail the Eventide', 'May we come aboard?', 'Not all of them will live, I won’t lie to you. Will you let us wake them?', 'close the channel']);
    expect(s.flags.wickConsent).toBe(true);
    const listed = manifestFailing(s);
    expect(listed).toContain(v.falseAlarm);
    expect(listed).not.toContain(v.hidden);
    s = untilEnd(deterTug(playD(s, [`wake ${listed.map((b) => BANK_NAME(b)).join(' and ')}`])));
    ending(s, 'wrong-banks');
    expect(needless(s)).toContain(v.falseAlarm);
    expect(lostBanks(s)).toContain(v.hidden);
  });

  it("lockdown: the custodian overridden after Marrow's caution", () => {
    const s = playD(startD(LICENSED), ['Chief, override the custodian']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/Is there another way/);
    ending(playD(s, ['Chief, override the custodian']), 'lockdown');
  });

  it('salvaged: a salvor nobody stops tows the ship off with her sleepers aboard', () => {
    ending(untilEnd(startD(JUMPER)), 'salvaged');
  });

  it('dark-lantern: nobody wakes anyone, and the failing banks go dark', () => {
    const s = ending(untilEnd(startD(LICENSED)), 'dark-lantern');
    expect(deaths(s)).toBeGreaterThan(250);
  });

  it('left-adrift: the Halcyon leaves with the banks still failing', () => {
    const s = untilEnd(playD(startD(LICENSED), ['Helm, engage the jump drive', 'engage the jump drive', 'engage the jump drive']));
    ending(s, 'left-adrift');
  });
});

describe('unconventional routes', () => {
  it('a jumper reported to the Registry once his licence is shown void bolts', () => {
    const s = playD(startD(JUMPER), ["Szabo, check the salvor's licence", 'hail the tug', 'Your licence is void. We are reporting you to the Registry.', 'close the channel']);
    expect(s.flags.reported).toBe(true);
    expect(s.flags.stoodOff).toBe(true);
  });

  it('a tractor beam on the Eventide holds her against the tow', () => {
    let s = playD(startD(JUMPER), ['tractor beam on the Eventide']);
    s = untilEnd(s);
    expect(s.outcome?.id).not.toBe('salvaged');
    expect(s.flags.heldFast).toBe(true);
  });

  it('no assessment and no scan: waking blind kills most of a coolant bank', () => {
    const v = lantern(startD(GRIEVING));
    let s = playD(startD(GRIEVING), ['hail the Eventide', 'Not all of them will live, I won’t lie to you. Will you let us wake them?', 'close the channel', `wake ${BANK_NAME(v.hidden)}`]);
    s = playD(s, waits(4));
    expect(s.flags.wokeBlind).toBe(true);
    expect(logText(s)).toMatch(/Woken blind/);
  });

  it('the consent line works for every temperament once the doctor has seen them', () => {
    for (const t of ['faithful', 'grieving', 'fractured'] as const) {
      const seed = seedWhere((v) => v.temperament === t);
      const s = getConsent(prepare(startD(seed)));
      expect(s.flags.consent, t).toBe(true);
    }
    expect(CONSENT_LINE).toMatch(/Not all/);
  });
});

afterAll(() => {
  const all = [...LANTERN_ENDINGS.success, ...LANTERN_ENDINGS.partial, ...LANTERN_ENDINGS.failure];
  expect([...reached].sort()).toEqual([...all].sort());
});
