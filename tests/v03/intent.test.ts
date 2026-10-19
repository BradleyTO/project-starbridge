/**
 * v0.3 intent interpretation: compound multi-department orders, rationale →
 * posture, spelling tolerance, plural references, spatial intents,
 * clarification and partial understanding.
 */
import { describe, expect, it } from 'vitest';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import type { InterpreterContext } from '../../src/interpreter/types';
import { play, start } from '../helpers';
import { USER_ORDER } from './fixtures';

const ctx: InterpreterContext = contextFrom(start(42));
const parse = (t: string, c: InterpreterContext = ctx) => interpretSync(t, c);


const INTERPOSE_PAIR = (a: Record<string, unknown>) =>
  a.type === 'maneuver' && a.intent === 'interpose' && ((a.target === 'kestrel' && a.second === 'cruiser') || (a.target === 'cruiser' && a.second === 'kestrel'));

describe("the captain's exact order", () => {
  it('parses into interpose + weapons safe + shields down + non-hostile posture + hail both on screen, with nothing unrecognised', () => {
    const r = parse(USER_ORDER);
    expect(r.kind).toBe('actions');
    if (r.kind !== 'actions') return;
    expect(r.unparsed).toEqual([]);
    const a = r.actions as Record<string, unknown>[];
    expect(a.some(INTERPOSE_PAIR)).toBe(true);
    expect(a).toContainEqual(expect.objectContaining({ type: 'weapons', mode: 'safe' }));
    expect(a).toContainEqual(expect.objectContaining({ type: 'shields', raise: false }));
    expect(a).toContainEqual(expect.objectContaining({ type: 'posture', stance: 'nonHostile' }));
    expect(a).toContainEqual(expect.objectContaining({ type: 'communicate', target: 'all', intent: 'open', onScreen: true }));
    expect(a).toHaveLength(5);
  });

  it('is not a hard-coded sentence: case, punctuation and spacing changes give the same actions', () => {
    const base = parse(USER_ORDER);
    for (const v of [USER_ORDER.toLowerCase(), USER_ORDER.replace(/\. /g, '; '), USER_ORDER.replace(/\s+/g, '  ').toUpperCase()]) {
      const r = parse(v);
      expect(r.kind).toBe('actions');
      if (r.kind === 'actions' && base.kind === 'actions') expect(r.actions).toEqual(base.actions);
    }
  });
});

// [phrase, required action predicates]
type Want = Record<string, unknown> | ((a: Record<string, unknown>) => boolean);
const PARAPHRASES: [string, Want[]][] = [
  ['put us between the freighter and the cruiser', [INTERPOSE_PAIR]],
  ['move us in-between them', [INTERPOSE_PAIR]],
  ['position the ship between both vessels, shields down, weapons offline, and open a channel', [INTERPOSE_PAIR, { type: 'shields', raise: false }, { type: 'weapons', mode: 'safe' }, { type: 'communicate', target: 'all' }]],
  ['helm, interpose us between the Kestrel and that warship', [INTERPOSE_PAIR]],
  ['get between those 2 ships', [INTERPOSE_PAIR]],
  ['get us inbetwen the two ships and keep sheilds down', [INTERPOSE_PAIR, { type: 'shields', raise: false }]],
  ['get us between the kestral and the crusier', [INTERPOSE_PAIR]],
  ['interpose between the kestrel and the tessarine ship', [INTERPOSE_PAIR]],
  ['Place the Halcyon between the cruiser and the freighter. Lower shields. Weapons safe. Hail both ships.', [INTERPOSE_PAIR, { type: 'shields', raise: false }, { type: 'weapons', mode: 'safe' }, { type: 'communicate', target: 'all' }]],
  ['Helm, put us between them. Tactical, weapons cold and shields down. Comms, open a channel to both ships, on screen.', [INTERPOSE_PAIR, { type: 'weapons', mode: 'safe' }, { type: 'shields', raise: false }, { type: 'communicate', target: 'all', onScreen: true }]],
  ['Slide us in between the two ships, nice and slow', [(a) => INTERPOSE_PAIR(a) && a.speed === 'slow']],
  ['Keep us between the Kestrel and the cruiser', [INTERPOSE_PAIR]],
  ["Get between the 2 ships. Keep weapons and shields down — we're not looking for a fight. Hail them on screen.", [INTERPOSE_PAIR, { type: 'weapons', mode: 'safe' }, { type: 'shields', raise: false }, { type: 'posture', stance: 'nonHostile' }, { type: 'communicate', target: 'all', onScreen: true }]],
  ['move into position between both ships with our shields lowered, and put them both on screen', [INTERPOSE_PAIR, { type: 'shields', raise: false }, { type: 'communicate', target: 'all', onScreen: true }]],
  ["We need to get between those ships. Don't arm anything. We aren't here to fight. Open hailing frequencies to both of them.", [INTERPOSE_PAIR, { type: 'weapons', mode: 'safe' }, { type: 'posture', stance: 'nonHostile' }, { type: 'communicate', target: 'all' }]],
  ['bring us in between the freighter and the warship and drop our shields', [INTERPOSE_PAIR, { type: 'shields', raise: false }]],
  ['Get us inbetween the two ships. Keep the weapons down and shields down. We dont want to appear hostile. And hail them on screen.', [INTERPOSE_PAIR, { type: 'weapons', mode: 'safe' }, { type: 'shields', raise: false }, { type: 'posture', stance: 'nonHostile' }, { type: 'communicate', target: 'all', onScreen: true }]],
  ['helm put us inbetween them', [INTERPOSE_PAIR]],
  ['Mr. Adeyemi, interpose us between the two vessels. Ms. Szabo, hail them both.', [INTERPOSE_PAIR, { type: 'communicate', target: 'all' }]],
  ['Get us in-between the 2 ships, weapons down, shields down, we don\'t want to look hostile, hail them on screen', [INTERPOSE_PAIR, { type: 'weapons', mode: 'safe' }, { type: 'shields', raise: false }, { type: 'posture', stance: 'nonHostile' }, { type: 'communicate', target: 'all', onScreen: true }]],
];

describe('interpose paraphrases (≥ 15), all fully understood', () => {
  it.each(PARAPHRASES)('%s', (phrase, wants) => {
    const r = parse(phrase);
    expect(r.kind, JSON.stringify(r)).toBe('actions');
    if (r.kind !== 'actions') return;
    expect(r.unparsed, 'unparsed fragments').toEqual([]);
    const acts = r.actions as Record<string, unknown>[];
    for (const w of wants) {
      const ok = typeof w === 'function' ? acts.some(w) : acts.some((a) => Object.entries(w).every(([k, v]) => a[k] === v));
      expect(ok, `${typeof w === 'function' ? 'interpose pair' : JSON.stringify(w)} in ${JSON.stringify(acts)}`).toBe(true);
    }
  });
  it('has at least 15 paraphrases', () => expect(PARAPHRASES.length).toBeGreaterThanOrEqual(15));
});

const SPATIAL: [string, Record<string, unknown>][] = [
  ['intercept the cruiser', { intent: 'intercept', target: 'cruiser' }],
  ['escort the freighter', { intent: 'escort', target: 'kestrel' }],
  ['shadow the warship at 20,000 km', { intent: 'follow', target: 'cruiser', rangeKm: 20000 }],
  ['follow the tessarine ship', { intent: 'follow', target: 'cruiser' }],
  ["put us in the cruiser's path", { intent: 'block', target: 'cruiser' }],
  ['block the cruiser', { intent: 'block', target: 'cruiser' }],
  ['stay out of their weapons range', { intent: 'standoff', target: 'cruiser', rangeKm: 45000 }],
  ['keep 30,000 km between us and the cruiser', { intent: 'standoff', target: 'cruiser', rangeKm: 30000 }],
  ['close to transporter range of the kestrel', { intent: 'approach', target: 'kestrel', rangeKm: 4000 }],
  ['retreat from the cruiser', { intent: 'retreat', target: 'cruiser' }],
  ['fall back', { intent: 'retreat', target: 'cruiser' }],
  ['orbit the kestrel at 3,000 km', { intent: 'orbit', target: 'kestrel', rangeKm: 3000 }],
  ['hold station on the freighter', { intent: 'holdStation', target: 'kestrel' }],
  ['hold position', { intent: 'holdStation' }],
  ['all stop', { intent: 'allStop' }],
  ['come about to face the cruiser', { intent: 'face', target: 'cruiser' }],
  ['run for the border', { intent: 'flee' }],
  ['make for Concord space at full impulse', { intent: 'flee' }],
  ['evasive manoeuvres', { intent: 'evasive' }],
  ['approach the cruiser slowly', { intent: 'approach', target: 'cruiser', speed: 'slow' }],
];

describe('each spatial intent maps to a validated ManeuverOrder', () => {
  it.each(SPATIAL)('%s', (phrase, want) => {
    const r = parse(phrase);
    expect(r.kind, JSON.stringify(r)).toBe('actions');
    if (r.kind !== 'actions') return;
    expect(r.actions[0]).toMatchObject({ type: 'maneuver', ...want });
  });
});

describe('references', () => {
  it('"the Tessarine", "that warship", "the freighter" resolve to ships', () => {
    expect(parse('approach the tessarine')).toMatchObject({ actions: [{ target: 'cruiser' }] });
    expect(parse('approach that warship')).toMatchObject({ actions: [{ target: 'cruiser' }] });
    expect(parse('approach the freighter')).toMatchObject({ actions: [{ target: 'kestrel' }] });
  });
  it('"her" refers to the last-mentioned ship', () => {
    const r = parse('scan the freighter and escort her');
    expect(r).toMatchObject({ kind: 'actions', actions: [{ type: 'scan', target: 'kestrel' }, { type: 'maneuver', intent: 'escort', target: 'kestrel' }] });
  });
  it('"them" after a single ship stays singular; after "the two ships" it means both', () => {
    expect(parse('approach the cruiser and hail them')).toMatchObject({ actions: [{ target: 'cruiser' }, { type: 'communicate', target: 'cruiser' }] });
    expect(parse('get between the two ships and hail them')).toMatchObject({ actions: [{ intent: 'interpose' }, { type: 'communicate', target: 'all' }] });
  });
  it('the border is a landmark reference', () => {
    expect(parse('interpose between the cruiser and the border')).toMatchObject({ actions: [{ intent: 'interpose', target: 'cruiser', second: 'border' }] });
  });
  it('a pronoun with a numeric range: "take us to 12,000 km of her"', () => {
    expect(parse('scan the cruiser, then take us to 12,000 km of her')).toMatchObject({ actions: [{ type: 'scan' }, { intent: 'approach', target: 'cruiser', rangeKm: 12000 }] });
  });
  it('uses the previous turn\'s target for a bare pronoun', () => {
    const s = play(start(42), ['scan the cruiser']);
    expect(parse('intercept her', contextFrom(s))).toMatchObject({ actions: [{ intent: 'intercept', target: 'cruiser' }] });
  });
});

describe('rationale and posture', () => {
  it.each([
    ["we don't want to appear hostile", 'nonHostile'],
    ["we're not looking for a fight", 'nonHostile'],
    ['nothing provocative', 'nonHostile'],
    ['keep things calm', 'nonHostile'],
    ['show them we mean business', 'assertive'],
  ])('"%s" → posture %s, not unrecognised', (phrase, stance) => {
    const r = parse(phrase);
    expect(r.kind).toBe('actions');
    if (r.kind === 'actions') {
      expect(r.actions).toContainEqual({ type: 'posture', stance });
      expect(r.unparsed).toEqual([]);
    }
  });
  it('a purpose clause attaches posture to the order it explains', () => {
    expect(parse('lower shields so we look friendly')).toMatchObject({ actions: [{ type: 'shields', raise: false }, { type: 'posture', stance: 'nonHostile' }] });
  });
  it('rationale that needs no action is kept as a note, not reported as misunderstood', () => {
    const r = parse('approach the kestrel. the crew comes first');
    expect(r.kind).toBe('actions');
    if (r.kind === 'actions') {
      expect(r.unparsed).toEqual([]);
      expect(r.notes).toEqual(['the crew comes first']);
    }
  });
  it('speech content is still speech: "tell them we are not a threat" is a message, not a posture', () => {
    expect(parse('tell the cruiser we are not a threat')).toMatchObject({ actions: [{ type: 'communicate', target: 'cruiser', intent: 'reassure' }] });
  });
});

describe('departments', () => {
  it('"Tactical, stand down" safes weapons rather than cancelling the alert', () => {
    expect(parse('Tactical, stand down.')).toMatchObject({ actions: [{ type: 'weapons', mode: 'safe' }] });
    expect(parse('stand down')).toMatchObject({ actions: [{ type: 'setAlert', level: 'green' }] });
  });
  it('addresses to several officers in one order', () => {
    const r = parse('Helm, all stop. Tactical, shields up. Science, scan the cruiser. Comms, hail the kestrel.');
    expect(r).toMatchObject({ kind: 'actions', actions: [{ intent: 'allStop' }, { type: 'shields', raise: true }, { type: 'scan', target: 'cruiser' }, { type: 'communicate', target: 'kestrel' }] });
  });
});

describe('ambiguity: specific questions, partial execution', () => {
  it('interposing with one reference asks which pair', () => {
    const r = parse('interpose in front of the cruiser');
    expect(r.kind).toBe('clarify');
    if (r.kind !== 'clarify') return;
    expect(r.clarification.question).toMatch(/between the cruiser and the Kestrel, or between the cruiser and the border/);
    expect(r.clarification.options).toEqual(['the cruiser and the Kestrel', 'the cruiser and the border']);
  });
  it('answering with a chip completes the order', () => {
    let s = play(start(42), ['interpose in front of the cruiser']);
    expect(s.clarification).not.toBeNull();
    const r = parse('the cruiser and the border', contextFrom(s));
    expect(r).toMatchObject({ kind: 'actions', actions: [{ intent: 'interpose', target: 'cruiser', second: 'border' }] });
    s = play(s, ['the cruiser and the Kestrel']);
    expect(s.ships.halcyon.nav).toMatchObject({ intent: 'interpose' });
  });
  it('executes understood parts and asks about the rest', () => {
    const r = parse('raise shields and approach');
    expect(r.kind).toBe('clarify');
    if (r.kind !== 'clarify') return;
    expect(r.actions).toEqual([{ type: 'shields', raise: true }]);
    expect(r.clarification.question).toMatch(/Approach which contact/);
  });
  it('anything not understood is returned as unparsed fragments (AI fallback hook)', () => {
    const r = parse('raise shields and juggle the plasma flamingos');
    expect(r.kind).toBe('actions');
    if (r.kind === 'actions') expect(r.unparsed).toEqual(['juggle the plasma flamingos']);
  });
});

describe('spelling tolerance', () => {
  it.each([
    ['sheilds up', { type: 'shields', raise: true }],
    ['scan the frieghter', { type: 'scan', target: 'kestrel' }],
    ['hial the crusier', { type: 'communicate', target: 'cruiser' }],
    ['intercpet the cruiser', { type: 'maneuver', intent: 'intercept' }],
    ['escrot the kestrel', { type: 'maneuver', intent: 'escort' }],
  ])('%s', (phrase, want) => {
    expect(parse(phrase)).toMatchObject({ kind: 'actions', actions: [want] });
  });
  it('does not "correct" names or ordinary words', () => {
    expect(parse('ask arden what he wants')).toMatchObject({ actions: [{ type: 'communicate', target: 'kestrel' }] });
  });
});
