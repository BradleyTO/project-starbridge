/** Training Simulation 005 — The Saltglass Accord: a scripted playthrough to every ending. */
import { afterAll, describe, expect, it } from 'vitest';
import type { WorldState } from '../../src/engine/types';
import { SALTGLASS_ENDINGS } from '../../src/scenarios/saltglass/outcome';
import { saltglass } from '../../src/scenarios/saltglass/setup';
import { LEAK, careful, logText, playS, seedWhere, short, softOf, startS, untilEnd, waits } from './helpers';

const reached = new Set<string>();
function ending(s: WorldState, id: string) {
  expect(s.outcome?.id, logText(s).slice(-2500)).toBe(id);
  expect(logText(s)).not.toMatch(LEAK);
  expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
  reached.add(id);
  return s;
}

const PLAIN = seedWhere((v) => !v.elderClan && v.interest.rhune !== 'succession' && v.interest.tarvo !== 'succession');
const ELDER = seedWhere((v) => !!v.elderClan && v.elder !== 'failing');
const FAILING = seedWhere((v) => !!v.elderClan && v.elder === 'failing' && v.elderTurn < v.landTurn + 3);

describe('success endings', () => {
  it('shared-use: both needs on the table, one accord that answers both', () => {
    const s = careful(PLAIN);
    expect(s.flags.reciprocity).toBe(true);
    ending(playS(s, ['I propose you share Saltglass, both clans, under one accord: each keeps what it has told us it needs.']), 'shared-use');
    expect(s.outcome).toBeFalsy();
  });

  it('partition: with the ISA survey on the table, the springs and the barrows turn out to lie apart', () => {
    let s = careful(PLAIN);
    s = playS(s, ['close the channel', 'Varga, survey the moon', `open a channel to ${short(softOf(saltglass(s)))}`]);
    ending(playS(s, ['I propose you divide Saltglass: the southern flats and the springs to one clan, the northern ridge and the barrows to the other.']), 'partition');
  });

  it('timetable: the naming first, while the elder lives; everything else in a season', () => {
    const s = careful(ELDER);
    ending(playS(s, ["I propose the naming at the Founders' Seat goes first, and the rest of Saltglass is deferred for a season."]), 'timetable');
  });

  it('own-accord: once both trust the table, the captain leaves them the room', () => {
    let s = careful(PLAIN);
    const v = saltglass(s);
    s = playS(s, [`open a channel to ${short(v.hard)}`, 'I hear you. Thank you for saying it.', 'We will step out and leave you two to talk among yourselves.']);
    expect(s.flags.leftToThem).toBe(true);
    ending(untilEnd(s), 'own-accord');
  });
});

describe('failure and partial endings', () => {
  it('walk-out: pressing the hardliner to give up the claim empties the table', () => {
    const v = saltglass(startS(PLAIN));
    let s = playS(startS(PLAIN), [`open a channel to ${short(v.hard)}`, 'Give up your claim.', 'Give up your claim.', 'Give up your claim.', 'Give up your claim.', 'Give up your claim.']);
    s = playS(s, ['close the channel']);
    ending(untilEnd(s), 'walk-out');
  });

  it('walk-out: a tractor beam on a clan ship ends the talks at once', () => {
    ending(untilEnd(playS(startS(PLAIN), ['tractor the Long Thaw'])), 'walk-out');
  });

  it('imposed: a ruling handed down after the XO cautions against it', () => {
    let s = playS(startS(PLAIN), ['open a channel to Speaker Rhune', 'I rule that Saltglass is divided down the middle.']);
    expect(s.flags.imposeWarned).toBe(true);
    expect(s.outcome).toBeFalsy();
    s = playS(s, ['I have decided. You will both accept it.']);
    ending(s, 'imposed');
  });

  it('feud: left to itself, the hardliner lands a claim on the ice', () => {
    const s = untilEnd(startS(PLAIN));
    expect(s.flags.landingLaunched).toBe(true);
    ending(s, 'feud');
  });

  it("elder-dies: a failing elder does not outlive a table where nobody asked", () => {
    const s = untilEnd(startS(FAILING));
    ending(s, 'elder-dies');
  });

  it('adjourned (backstop): both needs said, a standstill held, and no terms ever proposed', () => {
    const s = careful(PLAIN);
    ending(untilEnd(playS(s, ['close the channel'])), 'adjourned');
  });
});

describe('what changes the outcome', () => {
  it('a confidence repeated without leave is a betrayal, and remembered', () => {
    const v = saltglass(startS(PLAIN));
    const soft = softOf(v);
    const word = { water: 'the water at the springs', burial: 'your dead in the barrows', succession: 'the naming' }[v.interest[soft]];
    let s = playS(startS(PLAIN), [`open a private channel to ${short(soft)}`, 'What do you really need?', 'close the channel', `open a channel to ${short(v.hard)}`]);
    const before = s.characters[soft === 'rhune' ? 'edda' : 'caius'].trust;
    s = playS(s, [`${short(soft)}, we all know this is about ${word}.`]);
    expect(s.flags.betrayedConfidence).toBe(true);
    expect(s.characters[soft === 'rhune' ? 'edda' : 'caius'].trust).toBeLessThan(before - 20);
  });

  it('the doctor, with the clan’s leave, buys a failing elder time', () => {
    const v = saltglass(startS(FAILING));
    const e = v.elderClan!;
    let s = playS(startS(FAILING), [`open a private channel to ${short(e)}`, 'What do you really need?', 'I hear you. Thank you.', 'Will you let our doctor see your elder?']);
    expect(s.flags.oseiTreated, logText(s).slice(-1500)).toBe(true);
    s = untilEnd(playS(s, ['close the channel', ...waits(v.elderTurn + 1)]));
    expect(s.outcome?.id).not.toBe('elder-dies');
  });

  it('Marrow brings a walking delegate back', () => {
    const v = saltglass(startS(PLAIN));
    let s = playS(startS(PLAIN), [`open a channel to ${short(v.hard)}`, 'Give up your claim.', 'Give up your claim.', 'Give up your claim.', 'Give up your claim.', 'Give up your claim.', 'close the channel']);
    expect(s.characters[v.hard === 'rhune' ? 'edda' : 'caius'].memory.walking).toBe(1);
    s = playS(s, [`Marrow, bring ${v.hard === 'rhune' ? 'her' : 'him'} back`, 'wait', 'wait']);
    expect(s.flags.broughtBack, logText(s).slice(-1500)).toBe(true);
    expect(s.outcome?.id).not.toBe('walk-out');
  });

  it('the ice trip shows what nobody would say at the table, once there is trust enough', () => {
    let s = playS(startS(PLAIN), ['open a channel to Speaker Rhune', 'I hear you.', 'open a channel to Holder Tarvo', 'I hear you.', 'Marrow, have a quiet word with both delegates', 'wait', 'wait', 'wait', 'take the delegates down to the ice', ...waits(3)]);
    expect(s.flags.walkedTheIce, logText(s).slice(-2000)).toBe(true);
    expect(s.flags.improvised).toBe(true);
  });
});

afterAll(() => {
  const all = [...SALTGLASS_ENDINGS.success, ...SALTGLASS_ENDINGS.failure, ...SALTGLASS_ENDINGS.backstop];
  for (const id of all) expect(reached.has(id), `ending ${id} reached by a scripted playthrough`).toBe(true);
});
