/** Training Simulation 013 — scripted playthroughs reaching every ending, plus a seed sweep. */
import { describe, expect, it } from 'vitest';
import { SEVENTH_BELL_ENDINGS, computeObjectives } from '../../src/scenarios/seventhbell/outcome';
import {
  BARE_REFUSE, BELL_SIM, COMPLY_LINE, FINDING_LINE, HEAR_LINE, LEAK, MISTAKE, REFER_LINE, REFUSE_LINE, REGRET_LINE, SELF_DEFENCE, SHARE_LINE, UNLAWFUL, VORY_ACCOUNT,
  bell, careful, evidenceComplete, investigate, knows, logText, playB, seedWhere, startB, toStavely, toVory, until, untilEnd, waits,
} from './helpers';

const SUCCESS = new Set<string>(SEVENTH_BELL_ENDINGS.success);
const ALL = [...SEVENTH_BELL_ENDINGS.success, ...SEVENTH_BELL_ENDINGS.partial, ...SEVENTH_BELL_ENDINGS.failure];
const end = (s: ReturnType<typeof startB>) => s.outcome?.id;
const tail = (s: ReturnType<typeof startB>) => logText(s).slice(-1800);
const reached = new Set<string>();
const note = (s: ReturnType<typeof startB>) => {
  if (s.outcome) reached.add(s.outcome.id);
  expect(logText(s)).not.toMatch(LEAK);
  return s;
};

describe('success endings', () => {
  it('independent-review: a directive to pre-judge the finding is refused formally and referred, and the true finding goes out', () => {
    const seed = seedWhere((v) => v.pressure === 'directive' && v.truth !== 'lawful');
    const s = note(careful(seed, { fleet: 'refer' }));
    expect(end(s), tail(s)).toBe('independent-review');
    expect(s.flags.refusedFormally).toBe(true);
    expect(s.flags.referred).toBe(true);
    expect(s.flags.honestFinding).toBe(true);
  });

  it('own-words: a steady Stavely, shown the evidence, owns it to the examiner himself', () => {
    const seed = seedWhere((v) => v.temper === 'steady' && v.truth !== 'lawful' && v.pressure !== 'directive');
    const s = note(careful(seed, { showStavely: true }));
    expect(end(s), tail(s)).toBe('own-words');
    expect(s.flags.stavelyOwns).toBe(true);
  });

  it("own-words through Rask: a proud Stavely won't hear it from the inquiry, but he will from an old friend", () => {
    const seed = seedWhere((v) => v.temper === 'proud' && v.bond === 'friend' && v.truth !== 'lawful' && v.pressure !== 'directive');
    let s = careful(seed, { showStavely: true, finding: 'wait' });
    expect(s.flags.stavelyPressed, tail(s)).toBe(true);
    expect(s.flags.stavelyOwns).toBeFalsy();
    s = playB(s, ['Rask, talk to Stavely.']);
    expect(s.flags.raskTalked, tail(s)).toBe(true);
    s = note(playB(s, toVory(FINDING_LINE[bell(s).truth])));
    expect(end(s), tail(s)).toBe('own-words');
  });

  it("a rival won't do it: Rask declines to talk to a Stavely he never got on with", () => {
    const seed = seedWhere((v) => v.bond === 'rival' && v.truth !== 'lawful');
    let s = careful(seed, { finding: 'wait', fleet: 'refer' });
    s = playB(s, ['Rask, talk to Stavely.']);
    expect(s.flags.raskTalked).toBeFalsy();
    expect(logText(s)).toMatch(/Rask/);
  });

  it('joint-finding: the evidence is examined openly with the Directorate', () => {
    const seed = seedWhere((v) => v.truth !== 'lawful' && v.pressure !== 'directive');
    const s = note(careful(seed, { share: true }));
    expect(end(s), tail(s)).toBe('joint-finding');
    expect(s.flags.shared).toBe(true);
  });

  it('cleared: the record and the independent evidence clear the cutter, and the examiner accepts it', () => {
    const seed = seedWhere((v) => v.truth === 'lawful' && v.agenda === 'fair');
    const s = note(careful(seed));
    expect(end(s), tail(s)).toBe('cleared');
    expect(s.flags.honestFinding).toBeFalsy();
  });

  it('honest-finding: the ISA says plainly that the fault was its own', () => {
    const seed = seedWhere((v) => v.truth === 'misread' && v.pressure === 'report');
    const s = note(careful(seed));
    expect(end(s), tail(s)).toBe('honest-finding');
    expect(s.flags.honestFinding).toBe(true);
  });

  it('a hardline examiner accepts the truth when the Bell (recovered if need be) is read', () => {
    const seed = seedWhere((v) => v.agenda === 'hardline' && v.bell === 'damaged' && v.truth === 'second');
    const s = note(careful(seed));
    expect(s.flags.bellRecovered).toBe(true);
    expect(SUCCESS.has(end(s) ?? ''), tail(s)).toBe(true);
  });
});

describe('partial endings', () => {
  it('premature: the right finding, made before the evidence was in', () => {
    const seed = seedWhere((v) => v.truth === 'second' && v.pressure !== 'directive');
    let s = startB(seed);
    s = playB(s, toStavely(HEAR_LINE));
    s = note(playB(s, toVory(VORY_ACCOUNT, UNLAWFUL)));
    expect(end(s), tail(s)).toBe('premature');
    expect(s.flags.findingPremature).toBe(true);
  });

  it('unaccepted: a true finding to an examiner who heard no regret for her dead', () => {
    const seed = seedWhere((v) => v.agenda === 'face' && v.truth !== 'lawful' && v.pressure !== 'directive');
    const s = note(careful(seed, { regret: false }));
    expect(end(s), tail(s)).toBe('unaccepted');
  });

  it('unaccepted: a hardline examiner shown nothing she can check', () => {
    const seed = seedWhere((v) => v.agenda === 'hardline' && v.truth !== 'lawful' && v.pressure !== 'directive');
    const s = note(careful(seed, { bell: false }));
    expect(end(s), tail(s)).toBe('unaccepted');
  });

  it('adjourned: the frigate arrives with no finding made', () => {
    const seed = seedWhere((v) => v.agenda !== 'hardline' && v.pressure !== 'directive');
    const s = note(untilEnd(investigate(startB(seed))));
    expect(end(s), tail(s)).toBe('adjourned');
  });
});

describe('failure endings', () => {
  it('whitewash: self-defence is found, falsely, and the Bell that would have said otherwise is lost', () => {
    const seed = seedWhere((v) => v.truth !== 'lawful' && v.bell === 'damaged' && v.pressure !== 'directive');
    const s = note(careful(seed, { bell: false, finding: SELF_DEFENCE }));
    expect(end(s), tail(s)).toBe('whitewash');
    expect(s.flags.falseFinding).toBe(true);
  });

  it('exposed: the same false finding, with the Bell on record', () => {
    const seed = seedWhere((v) => v.truth !== 'lawful' && v.bell === 'intact' && v.pressure !== 'directive');
    const s = note(careful(seed, { finding: SELF_DEFENCE }));
    expect(end(s), tail(s)).toBe('exposed');
  });

  it('scapegoat: a cutter that fired lawfully is found against', () => {
    const seed = seedWhere((v) => v.truth === 'lawful' && v.pressure !== 'directive');
    const s = note(careful(seed, { finding: UNLAWFUL }));
    expect(end(s), tail(s)).toBe('scapegoat');
  });

  it('wrong-finding: an honest mistake is found to be unlawful fire', () => {
    const seed = seedWhere((v) => v.truth === 'misread' && v.pressure !== 'directive');
    const s = note(careful(seed, { finding: UNLAWFUL }));
    expect(end(s), tail(s)).toBe('wrong-finding');
  });

  it('fleet-finding: the directive deadline passes with no objection on the record', () => {
    const seed = seedWhere((v) => v.pressure === 'directive' && v.agenda !== 'hardline');
    const s = note(untilEnd(investigate(startB(seed))));
    expect(end(s), tail(s)).toBe('fleet-finding');
  });

  it('war-footing: threatening the examiner twice ends the inquiry', () => {
    const s = note(playB(startB(4), toVory('You are a liar and a spy.', 'Go to hell, Examiner.')));
    expect(end(s), tail(s)).toBe('war-footing');
    expect(s.flags.voryWalked).toBe(true);
  });

  it('war-footing: locking weapons on a disabled courier', () => {
    const s = note(untilEnd(playB(startB(5), ['lock weapons on the courier']), false));
    expect(end(s), tail(s)).toBe('war-footing');
    expect(s.flags.lockWalk).toBe(true);
  });

  it('war-footing: a hardline examiner meets her frigate with no answer', () => {
    const seed = seedWhere((v) => v.agenda === 'hardline' && v.pressure !== 'directive');
    const s = note(untilEnd(startB(seed)));
    expect(end(s), tail(s)).toBe('war-footing');
  });

  it('abandoned: the Halcyon leaves the Bell', () => {
    const s = note(untilEnd(playB(startB(8), ['engage the jump drive', ...waits(4), 'engage the jump drive'])));
    expect(end(s), tail(s)).toBe('abandoned');
  });

  it('shots-fired: the Halcyon fires on the courier', () => {
    const s = note(untilEnd(playB(startB(9), ['fire on the courier']), false));
    expect(end(s), tail(s)).toBe('shots-fired');
  });

  it('every ending was reached', () => {
    expect([...reached].sort()).toEqual([...ALL].sort());
  });
});

describe('the evidence and the people', () => {
  it("Rask's first read of a friend's record is hedged; asked to set it aside, he reads it straight", () => {
    const seed = seedWhere((v) => v.bond === 'friend' && v.truth === 'second');
    let s = playB(startB(seed), ["Rask, read the Tamber's fire-control record"]);
    s = until(s, (x) => knows(x, 'firing'));
    expect(s.flags.raskHedged).toBe(true);
    expect(evidenceComplete(s)).toBe(false);
    s = playB(s, ['Rask, do you know Captain Stavely?']);
    expect(s.flags.raskCold).toBe(true);
    expect(logText(s).slice(-900)).toMatch(/fires again|turns away/i);
  });

  it('a Rask who served under Stavely says so up front, and his read is complete', () => {
    const seed = seedWhere((v) => v.bond === 'served');
    let s = playB(startB(seed), ["Rask, read the Tamber's fire-control record", "Varga, scan the courier's damage"]);
    s = until(s, (x) => knows(x, 'firing') && knows(x, 'debris'));
    expect(evidenceComplete(s)).toBe(true);
    expect(s.flags.raskHedged).toBeFalsy();
  });

  it("Osei will not examine the courier's dead without the examiner's leave (crew refusal), and will with it", () => {
    let s = playB(startB(11), ['Doctor, examine the dead.']);
    expect(logText(s).slice(-600)).toMatch(/leave/i);
    expect(s.counters.deadAt ?? 0).toBe(0);
    s = playB(s, toVory(REGRET_LINE, 'With your leave, may our doctor examine your dead?'));
    expect(s.flags.leaveGranted).toBe(true);
    s = playB(s, ['Doctor, examine the dead.']);
    s = until(s, (x) => knows(x, 'dead'));
    expect(knows(s, 'dead')).toBe(true);
  });

  it('a damaged Bell must be recovered before its record can be read', () => {
    const seed = seedWhere((v) => v.bell === 'damaged');
    let s = playB(startB(seed), ["Szabo, pull the Bell's record"]);
    expect(s.flags.bellDamagedKnown).toBe(true);
    s = playB(s, ["Chief, recover the Bell's recorder"]);
    s = until(s, (x) => knows(x, 'bell'));
    expect(s.flags.bellRecovered).toBe(true);
  });

  it('accusing Stavely before hearing him silences him, and fails the hearing objective', () => {
    let s = playB(startB(12), toStavely('You fired unlawfully, Captain. It was your fault.'));
    expect(s.flags.accusedUnheard).toBe(true);
    s = playB(s, toStavely(HEAR_LINE));
    expect(s.flags.heardStavely).toBeFalsy();
  });

  it('a bare refusal is sent back for reasons; a second bare refusal goes on the record', () => {
    const seed = seedWhere((v) => v.pressure === 'directive');
    let s = until(startB(seed), (x) => !!x.flags.fleetSignal);
    s = playB(s, [BARE_REFUSE]);
    expect(s.counters.refuseWarned).toBe(1);
    expect(s.flags.refusedBare).toBeFalsy();
    s = playB(s, [BARE_REFUSE]);
    expect(s.flags.refusedBare).toBe(true);
    expect(s.flags.refusedFormally).toBeFalsy();
  });

  it('complying with the directive fails the record objective even if the true finding follows', () => {
    const seed = seedWhere((v) => v.pressure === 'directive' && v.truth === 'lawful' && v.agenda === 'fair');
    const s = careful(seed, { fleet: 'comply' });
    expect(s.flags.complied).toBe(true);
    expect(computeObjectives(s, true).find((o) => o.id === 'record')?.status).toBe('failed');
  });

  it('referring before any signal is noted but changes nothing; a formal refusal with a reason holds off the deadline', () => {
    const seed = seedWhere((v) => v.pressure === 'directive' && v.agenda === 'fair');
    let s = playB(startB(seed), [REFER_LINE]);
    expect(s.flags.referredEarly).toBe(true);
    s = until(s, (x) => !!x.flags.fleetSignal);
    s = playB(s, [REFUSE_LINE]);
    s = playB(s, waits(12));
    expect(s.flags.endFleet).toBeFalsy();
  });

  it("the honest mistake: Varga and the Bell both show a navigation sweep, not a lock", () => {
    const seed = seedWhere((v) => v.truth === 'misread' && v.bell === 'intact');
    let s = investigate(startB(seed));
    s = until(s, (x) => knows(x, 'bell') && knows(x, 'debris'));
    expect(logText(s)).toMatch(/lidar|navigation/i);
    s = playB(s, toStavely(HEAR_LINE));
    s = note(playB(s, toVory(REGRET_LINE, MISTAKE)));
    expect(SUCCESS.has(end(s) ?? ''), tail(s)).toBe(true);
  });

  it('sharing before there is any evidence is promised for later, not counted', () => {
    const s = playB(startB(13), toVory(SHARE_LINE));
    expect(s.flags.jointInvited).toBe(true);
    expect(s.flags.shared).toBeFalsy();
  });

  it('complying is recorded only on a directive', () => {
    const seed = seedWhere((v) => v.pressure === 'report');
    let s = until(startB(seed), (x) => !!x.flags.fleetSignal);
    s = playB(s, [COMPLY_LINE]);
    expect(s.flags.complied).toBeFalsy();
  });
});

describe('seed sweep', () => {
  it('the careful captain succeeds on every one of 150 seeds, with no leaked names', () => {
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 150; seed++) {
      const s = careful(seed, { fleet: 'formal' });
      expect(SUCCESS.has(end(s) ?? ''), `seed ${seed}: ${end(s)}\n${tail(s)}`).toBe(true);
      expect(logText(s)).not.toMatch(LEAK);
      tally[end(s)!] = (tally[end(s)!] ?? 0) + 1;
    }
    expect(Object.keys(tally).length).toBeGreaterThanOrEqual(2);
  });

  it('one fixed plan (hear both sides, read the record and the damage, skip the Bell, find self-defence) on 60 seeds gives at least three endings, including a success', () => {
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      const s = careful(seed, { fleet: 'formal', bell: false, finding: SELF_DEFENCE });
      if (s.outcome) tally[s.outcome.id] = (tally[s.outcome.id] ?? 0) + 1;
    }
    expect(Object.keys(tally).length, JSON.stringify(tally)).toBeGreaterThanOrEqual(3);
    expect(Object.keys(tally).some((id) => SUCCESS.has(id)), JSON.stringify(tally)).toBe(true);
  });

  it('doing nothing on 60 seeds ends in more than one failure or partial ending, never a success', () => {
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      const s = untilEnd(startB(seed), false);
      expect(s.outcome, `seed ${seed}`).toBeTruthy();
      expect(SUCCESS.has(s.outcome!.id), `seed ${seed}`).toBe(false);
      tally[s.outcome!.id] = (tally[s.outcome!.id] ?? 0) + 1;
    }
    expect(Object.keys(tally).length, JSON.stringify(tally)).toBeGreaterThanOrEqual(2);
  });

  it('seeds vary every hidden dimension', () => {
    const seen: Record<string, Set<string>> = {};
    for (let seed = 1; seed <= 200; seed++) {
      const v = bell(BELL_SIM.create(seed));
      for (const [k, x] of Object.entries(v)) (seen[k] ??= new Set()).add(String(x));
    }
    for (const k of ['truth', 'bond', 'temper', 'agenda', 'pressure', 'bell', 'fleetAt', 'deadlineAt', 'arriveAt']) expect(seen[k].size, k).toBeGreaterThanOrEqual(2);
    expect(seen.truth.size).toBe(3);
    expect(seen.agenda.size).toBe(3);
    expect(seen.pressure.size).toBe(3);
  });
});
