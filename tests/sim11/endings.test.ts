/** Training Simulation 011 — scripted playthroughs reaching every ending, plus a seed sweep. */
import { describe, expect, it } from 'vitest';
import { COLDWATER_ENDINGS } from '../../src/scenarios/coldwater/outcome';
import { coldwater } from '../../src/scenarios/coldwater/setup';
import { knows } from '../../src/engine/state';
import { ACK_LINE, COLDWATER_SIM, DOWN, INSPECT, LEAK, RECORD, careful, falsName, innoName, logText, playC, seedWhere, startC, until, untilEnd, waits } from './helpers';

const end = (s: ReturnType<typeof startC>) => s.outcome?.id;
const REVIEW = ['hail the inspector', 'We need an independent review of a death aboard. The log may have been falsified.', 'close the channel'];
const TERMS = 'Nobody goes back into that plant until your own watch has inspected it first. No charges for the stand-down.';

describe('success endings', () => {
  it('truth-told: the record pulled, the officer heard and relieved, and the watch told', () => {
    for (const seed of [1, 2, 3, seedWhere((v) => v.method === 'deleted' && v.falsifier === 'penhale')]) {
      const s = careful(seed);
      expect(end(s), logText(s).slice(-1500)).toBe('truth-told');
      expect(s.outcome?.success).toBe(true);
      expect(s.flags.restartUninspected).toBeFalsy();
    }
  });

  it('truth-told needs the Chief\'s signature told, when it is there', () => {
    const seed = seedWhere((v) => v.chiefSigned && v.temper !== 'grieving');
    const v = coldwater(COLDWATER_SIM.create(seed));
    let s = until(playC(startC(seed), [RECORD]), (x) => knows(x, 'record'));
    s = playC(s, [`question ${falsName(v)}`, `relieve ${falsName(v)} pending review`, DOWN, `${falsName(v)} falsified the log. The record proves it.`]);
    expect(s.flags.strikersBack).toBeFalsy();
    s = playC(s, ["The Chief's countersignature is on the entry too. She signed it in good faith without checking."]);
    expect(s.flags.route_truth).toBe(true);
  });

  it('open-inquiry: an honest referral to the Inspectorate, offered to the watch', () => {
    const seed = seedWhere((v) => v.temper !== 'hothead');
    let s = playC(startC(seed), REVIEW);
    expect(s.flags.reviewOpened).toBe(true);
    s = untilEnd(playC(s, [DOWN, ACK_LINE, 'There will be an independent inquiry by the Inspectorate, and you can speak to the inspector directly.']));
    expect(end(s), logText(s).slice(-1500)).toBe('open-inquiry');
  });

  it('the Inspector asks before she opens a review, and an honest answer opens it', () => {
    let s = playC(startC(5), ['hail the inspector', 'I want an independent review of the death.']);
    expect(s.flags.hadleyAsked).toBe(true);
    expect(s.flags.reviewOpened).toBeFalsy();
    s = playC(s, ['There is a rumour his report was buried. I want the full record looked at.']);
    expect(s.flags.reviewOpened).toBe(true);
  });

  it('terms-kept: inspection first and no charges, on the record, and kept', () => {
    const seed = seedWhere((v) => v.temper === 'hothead');
    const s = untilEnd(playC(startC(seed), [DOWN, ACK_LINE, TERMS]));
    expect(end(s), logText(s).slice(-1500)).toBe('terms-kept');
  });

  it("captains-watch (unconventional): once the plant is proved safe, the captain stands the restart watch", () => {
    const seed = seedWhere((v) => v.temper === 'grieving' && v.sister === 'sound');
    let s = until(playC(startC(seed), [INSPECT]), (x) => knows(x, 'sister'));
    s = untilEnd(playC(s, [DOWN, ACK_LINE, 'I will stand the restart watch with you myself.']));
    expect(end(s), logText(s).slice(-1500)).toBe('captains-watch');
  });

  it('the captain may not stand a watch in an uninspected plant (Okafor refuses)', () => {
    const seed = seedWhere((v) => v.temper === 'grieving');
    const s = playC(startC(seed), [DOWN, ACK_LINE, 'I will stand the restart watch with you myself.']);
    expect(s.flags.ownWatchUninspected).toBe(true);
    expect(s.flags.strikersBack).toBeFalsy();
    expect(s.refusals?.at(-1)?.officer).toBe('engineering');
  });
});

describe('partial and failure endings', () => {
  it('divided: the Chief restarts with A watch, after the inspection', () => {
    const seed = seedWhere((v) => v.sister === 'sound' && v.temper !== 'hothead');
    let s = until(playC(startC(seed), [INSPECT]), (x) => knows(x, 'sister'));
    s = playC(s, ['Chief, restart the reactor with A watch']);
    if (coldwater(s).lean === 'people') {
      expect(s.flags.chiefPressed).toBe(true);
      s = playC(s, ['Chief, restart the reactor with A watch']);
    }
    s = untilEnd(s);
    expect(end(s), logText(s).slice(-1500)).toBe('divided');
    expect(s.outcome?.success).toBe(false);
  });

  it('stalemate: the station evacuated and nothing else settled', () => {
    const s = untilEnd(playC(startC(4), ["Adeyemi, bring the station's people up by shuttle"]));
    expect(s.flags.evacuated).toBe(true);
    expect(end(s), logText(s).slice(-800)).toBe('stalemate');
  });

  it('put-down: security removes the watch (Rask warns first)', () => {
    const seed = seedWhere((v) => v.sister === 'sound');
    let s = playC(startC(seed), ['Rask, have security remove the strikers from engineering']);
    expect(s.counters.forceWarned).toBe(1);
    expect(s.flags.forced).toBeFalsy();
    s = playC(s, ['Rask, have security remove the strikers from engineering']);
    expect(s.flags.forced).toBe(true);
    s = until(playC(s, [INSPECT]), (x) => knows(x, 'sister'));
    s = untilEnd(playC(s, ['Chief, restart the reactor']));
    expect(end(s), logText(s).slice(-1500)).toBe('put-down');
  });

  it('second-death: the plant lit over the Chief\'s warning, with a cracked sister valve', () => {
    const seed = seedWhere((v) => v.sister === 'cracked' && v.temper !== 'hothead');
    let s = playC(startC(seed), ['Chief, restart the reactor with A watch']);
    if (s.flags.chiefPressed && !s.counters.restartWarned) s = playC(s, ['Chief, restart the reactor with A watch']);
    expect(s.counters.restartWarned).toBe(1);
    s = untilEnd(playC(s, ['Chief, restart the reactor now. Skip the inspection.']));
    expect(s.flags.restartUninspected).toBe(true);
    expect(end(s), logText(s).slice(-1500)).toBe('second-death');
  });

  it('a sound sister valve forgives an uninspected restart: divided, not a second death', () => {
    const seed = seedWhere((v) => v.sister === 'sound' && v.lean === 'chain' && v.temper !== 'hothead');
    const s = untilEnd(playC(startC(seed), ['Chief, restart the reactor with A watch', 'Chief, restart the reactor with A watch']));
    expect(end(s)).toBe('divided');
    expect(s.flags.restartUninspected).toBe(true);
  });

  it('whitewash: the matter closed on the log as written', () => {
    const s = untilEnd(playC(startC(6), ['Log it as an accident and close the matter.']));
    expect(end(s)).toBe('whitewash');
  });

  it('scapegoat: the wrong name given to the watch, and the wrong officer relieved', () => {
    const seed = seedWhere((v) => v.temper !== 'grieving');
    const v = coldwater(COLDWATER_SIM.create(seed));
    let s = until(playC(startC(seed), [RECORD]), (x) => knows(x, 'record'));
    s = untilEnd(playC(s, [`relieve ${innoName(v)} pending review`, DOWN, `${innoName(v)} falsified the log.`]));
    expect(end(s), logText(s).slice(-1500)).toBe('scapegoat');
    expect(s.flags.relievedWrong).toBe(true);
  });

  it('station-dark: nobody does anything', () => {
    const s = untilEnd(startC(7));
    expect(end(s)).toBe('station-dark');
  });

  it('left-orbit: the Halcyon leaves', () => {
    const s = untilEnd(playC(startC(8), ['engage the jump drive', ...waits(4), 'engage the jump drive']));
    expect(end(s), logText(s).slice(-600)).toBe('left-orbit');
  });

  it('a hothead watch seals the plant if the bridge never speaks to it', () => {
    const seed = seedWhere((v) => v.temper === 'hothead');
    const s = until(startC(seed), (x) => !!x.flags.lockedOut);
    expect(s.flags.lockedOut).toBe(true);
    expect(s.flags.lockedUnheard).toBe(true);
  });

  it('breaking the terms sends the watch out again', () => {
    const seed = seedWhere((v) => v.temper === 'hothead');
    const s = playC(startC(seed), [DOWN, ACK_LINE, TERMS, 'Chief, restart the reactor now']);
    expect(s.flags.termsBroken).toBe(true);
    expect(s.flags.strikersBack).toBeFalsy();
  });
});

describe('seed sweep', () => {
  it('the careful captain reaches a success on every seed, with no leaked names', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const s = careful(seed);
      expect(COLDWATER_ENDINGS.success as readonly string[], `seed ${seed}: ${logText(s).slice(-1200)}`).toContain(end(s));
      expect(logText(s)).not.toMatch(LEAK);
      seen.add(JSON.stringify(coldwater(s)));
    }
    expect(seen.size).toBeGreaterThan(40);
  });
});
