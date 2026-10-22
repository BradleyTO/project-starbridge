/**
 * Training Simulation 003 — scripted playthroughs that reach EVERY listed ending
 * through the offline interpreter (plain-English orders), with invariants checked after each order.
 */
import { describe, expect, it } from 'vitest';
import { QUIET_ENDINGS } from '../../src/scenarios/quiet/outcome';
import { destroyShip } from '../../src/engine/combat';
import { MAX_TURNS } from '../../src/engine/rules';
import type { WorldState } from '../../src/engine/types';
import { ANSWERS } from '../../src/scenarios/quiet/setup';
import { DECODE, LEAK, answerBoth, logText, playQ, QS, seedWhere, startQ, waits } from './helpers';
import { quiet } from '../../src/scenarios/quiet/setup';
import { bm } from '../../src/scenarios/quiet/agents';

const reached = new Set<string>();
function ending(s: WorldState, id: string) {
  expect(s.outcome?.id, logText(s).slice(-2000)).toBe(id);
  expect(logText(s)).not.toMatch(LEAK);
  reached.add(id);
  return s;
}

describe('The Quiet Signal: success endings', () => {
  it('contact-established: decode, answer both questions, then greet the senders in their own terms', () => {
    const seed = seedWhere((v) => v.intent === 'greeting' && v.director === 'scholar');
    let s = playQ(startQ(seed), [...DECODE, 'hail the directorate ship', 'will you hold your transmission?']);
    expect(s.facts.grammar_known.known).toBe(true);
    s = answerBoth(s);
    s = playQ(s, ['wait']);
    expect(s.facts.senders_intent.known).toBe(true);
    s = playQ(s, ['hail the senders', 'Greetings. We are the ISV Halcyon, and we come in peace.']);
    ending(s, 'contact-established');
    expect(s.outcome!.success).toBe(true);
  });

  it('shared-vocabulary: decode the signal jointly with a scholarly Director, then greet the senders', () => {
    const seed = seedWhere((v) => v.intent === 'greeting' && v.director === 'scholar');
    let s = playQ(startQ(seed), ['Szabo, work on the code', 'scan the pulsar', 'wait', 'hail the directorate ship', 'we should work on the decode together', 'wait', 'wait']);
    expect(bm(s).joint).toBe(1);
    s = playQ(s, waits(3));
    s = answerBoth(s);
    s = playQ(s, ['wait', 'hail the senders', 'Greetings from the ISV Halcyon. Hello.']);
    ending(s, 'shared-vocabulary');
  });

  it('polite-farewell: the senders only came to say goodbye; answer, then say goodbye in turn', () => {
    const seed = seedWhere((v) => v.intent === 'farewell' && v.director === 'scholar');
    let s = playQ(startQ(seed), [...DECODE, 'hail the directorate ship', 'will you hold your transmission?']);
    s = answerBoth(s);
    s = playQ(s, ['wait', 'hail the senders', 'Thank you, and farewell. Safe travels.']);
    ending(s, 'polite-farewell');
  });

  it('warning-heeded: the senders warn of a glitch; warn the Cantor too and open the range', () => {
    const seed = seedWhere((v) => v.intent === 'warning' && v.director === 'scholar');
    let s = playQ(startQ(seed), [...DECODE, 'hail the directorate ship', 'will you hold your transmission?']);
    s = answerBoth(s);
    s = playQ(s, ['wait']);
    expect(s.facts.senders_intent.known).toBe(true);
    s = playQ(s, ['warn them about the glitch', 'open the range to 80000 km from the pulsar', ...waits(12)]);
    ending(s, 'warning-heeded');
    expect(s.flags.ledgerWarnedClear).toBe(true);
  });

  it('warning-heeded (hardliner): a doubting Director believes the warning once the data is in the line', () => {
    const seed = seedWhere((v) => v.intent === 'warning' && v.director === 'hardliner');
    let s = playQ(startQ(seed), DECODE);
    s = answerBoth(s);
    s = playQ(s, ['wait', 'hail the directorate ship', 'warn her about the glitch']);
    s = playQ(s, ['we are sending you our pulsar timing data: the glitch is real', 'open the range to 80000 km from the pulsar', ...waits(12)]);
    ending(s, 'warning-heeded');
  });
});

describe('The Quiet Signal: failure and partial endings', () => {
  it('directorate-first: handing a raw decode to a hardliner, who answers first', () => {
    const seed = seedWhere((v) => v.director === 'hardliner');
    let s = playQ(startQ(seed), ['Szabo, work on the code', 'scan the pulsar', 'wait', 'hail the directorate ship', 'we should work on the decode together']);
    expect(bm(s).took).toBe(1);
    s = playQ(s, waits(6));
    ending(s, 'directorate-first');
    expect(s.outcome!.success).toBe(false);
  });

  it('warning-unshared: the Halcyon gets clear but never warns the Cantor', () => {
    const seed = seedWhere((v) => v.intent === 'warning' && v.director === 'scholar');
    let s = playQ(startQ(seed), [...DECODE, 'hail the directorate ship', 'will you hold your transmission?', 'close the channel']);
    s = answerBoth(s);
    s = playQ(s, ['wait', 'open the range to 80000 km from the pulsar', ...waits(12)]);
    ending(s, 'warning-unshared');
    expect(s.flags.ledgerCaught).toBe(true);
  });

  it('misread-threat: two wrong answers fired off blind read as hostility', () => {
    const s = playQ(startQ(5), ['Szabo, send them 1', 'wait', 'Szabo, send them 1', 'wait']);
    ending(s, 'misread-threat');
  });

  it('fallen-silent: never answering; the senders give up', () => {
    const seed = seedWhere((v) => v.director === 'scholar' && !v.directorRight);
    const s = playQ(startQ(seed), ['hail the directorate ship', 'will you hold your transmission?', ...waits(20)]);
    ending(s, 'fallen-silent');
  });

  it('fallen-silent: answering a farewell with the wrong words, twice', () => {
    const seed = seedWhere((v) => v.intent === 'farewell' && v.director === 'scholar');
    let s = playQ(startQ(seed), [...DECODE, 'hail the directorate ship', 'will you hold your transmission?']);
    s = answerBoth(s);
    s = playQ(s, ['wait', 'hail the senders', 'Greetings, we are pleased to meet you.', 'Hello, we come in peace.', 'wait']);
    ending(s, 'fallen-silent');
  });

  it('caught-in-glitch: understanding the warning but staying in the beam', () => {
    const seed = seedWhere((v) => v.intent === 'warning' && v.director === 'scholar');
    let s = playQ(startQ(seed), [...DECODE, 'hail the directorate ship', 'will you hold your transmission?']);
    s = answerBoth(s);
    s = playQ(s, ['wait', 'warn them about the glitch', ...waits(12)]);
    ending(s, 'caught-in-glitch');
  });

  it('signal-incident: opening fire on the Directorate ship', () => {
    const s = playQ(startQ(7), ['lock weapons on the cantor', 'fire on the cantor', 'wait']);
    ending(s, 'signal-incident');
  });

  it('withdrew: jumping away from the contact', () => {
    const s = playQ(startQ(8), ['charge the jump drive', 'wait', 'wait', 'engage the jump drive']);
    ending(s, 'withdrew');
  });

  it('halcyon-lost: the shared loss rule (state forced: the Halcyon is destroyed)', () => {
    const s = destroyShip(startQ(3), 'halcyon', []);
    expect(QS.detectOutcome(s)?.id).toBe('halcyon-lost');
    reached.add('halcyon-lost');
  });

  it('stalemate: the thirty-minute backstop (state forced: the clock has run out)', () => {
    const s = { ...startQ(3), turn: MAX_TURNS };
    expect(QS.detectOutcome(s)?.id).toBe('stalemate');
    reached.add('stalemate');
  });

  it('every listed ending was reached (≥3 successes, ≥3 failures)', () => {
    expect(QUIET_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(QUIET_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
    for (const id of [...QUIET_ENDINGS.success, ...QUIET_ENDINGS.failure, ...QUIET_ENDINGS.backstop]) expect(reached.has(id), id).toBe(true);
  });
});

void ANSWERS;
void quiet;
