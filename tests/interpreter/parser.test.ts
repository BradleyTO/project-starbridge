import { describe, expect, it } from 'vitest';
import { interpretSync, normalise, splitClauses } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import type { InterpreterContext } from '../../src/interpreter/types';
import { wordsToDigits } from '../../src/interpreter/numbers';
import { start } from '../helpers';

const ctx: InterpreterContext = contextFrom(start(42));
const parse = (t: string, c: InterpreterContext = ctx) => interpretSync(t, c);
const actionsOf = (t: string, c?: InterpreterContext) => {
  const r = parse(t, c);
  return r.kind === 'unrecognised' ? [] : r.actions;
};

// [phrase, expected actions (partial match, in order)]
const TABLE: [string, Record<string, unknown>[]][] = [
  // scanning
  ['scan the kestrel', [{ type: 'scan', target: 'kestrel' }]],
  ['Run a detailed scan of the freighter', [{ type: 'scan', target: 'kestrel' }]],
  ['Varga, analyse that freighter please', [{ type: 'scan', target: 'kestrel' }]],
  ['what are you reading on the warship?', [{ type: 'scan', target: 'cruiser' }]],
  ['scan the cruiser', [{ type: 'scan', target: 'cruiser' }]],
  ['examine the Directorate ship', [{ type: 'scan', target: 'cruiser' }]],
  ["what's inside that shielded compartment", [{ type: 'scan', target: 'compartment' }]],
  ['scan the compartment', [{ type: 'scan', target: 'compartment' }]],
  ['sweep the area for other ships', [{ type: 'scan', target: 'area' }]],
  // shields / alerts
  ['raise shields', [{ type: 'shields', raise: true }]],
  ['shields up!', [{ type: 'shields', raise: true }]],
  ['drop the shields', [{ type: 'shields', raise: false }]],
  ['lower our shields', [{ type: 'shields', raise: false }]],
  ['red alert', [{ type: 'setAlert', level: 'red' }]],
  ['go to yellow alert', [{ type: 'setAlert', level: 'yellow' }]],
  ['stand down to green', [{ type: 'setAlert', level: 'green' }]],
  // helm
  ['approach the kestrel', [{ type: 'move', mode: 'approach', target: 'kestrel' }]],
  ['full speed to the kestrel', [{ type: 'move', mode: 'approach', target: 'kestrel' }]],
  ['Mr. Adeyemi, take us alongside the freighter', [{ type: 'move', mode: 'approach', target: 'kestrel' }]],
  ['set a course for the cruiser', [{ type: 'move', mode: 'approach', target: 'cruiser' }]],
  ['take us to 10,000 km from the kestrel', [{ type: 'move', mode: 'range', target: 'kestrel', rangeKm: 10000 }]],
  ['hold at 20k km from the cruiser', [{ type: 'move', mode: 'range', target: 'cruiser', rangeKm: 20000 }]],
  ['bring us within four thousand kilometres of the kestrel', [{ type: 'move', mode: 'range', target: 'kestrel', rangeKm: 4000 }]],
  ['put us between the cruiser and the kestrel', [{ type: 'move', mode: 'interpose' }]],
  ['get us out of here', [{ type: 'jump', mode: 'withdraw' }]],
  ['evasive manoeuvres', [{ type: 'move', mode: 'evasive' }]],
  ['all stop', [{ type: 'move', mode: 'hold' }]],
  ['back off from the cruiser', [{ type: 'move', mode: 'away', target: 'cruiser' }]],
  // jump
  ['charge the jump drive', [{ type: 'jump', mode: 'charge' }]],
  ['engage the jump drive', [{ type: 'jump', mode: 'engage' }]],
  ['jump', [{ type: 'jump', mode: 'engage' }]],
  ['withdraw', [{ type: 'jump', mode: 'withdraw' }]],
  // power
  ['divert power to shields', [{ type: 'power', to: 'shields' }]],
  ['divert 50% power from tractor to sensors', [{ type: 'power', to: 'sensors', from: 'tractor', amount: 50 }]],
  ['reroute auxiliary power to the engines', [{ type: 'power', to: 'engines' }]],
  ['boost the sensors', [{ type: 'power', to: 'sensors' }]],
  // weapons
  ['arm weapons', [{ type: 'weapons', mode: 'arm' }]],
  ['lock phasers on the cruiser', [{ type: 'weapons', mode: 'lock', target: 'cruiser' }]],
  ['target their engines', [{ type: 'weapons', mode: 'lock', target: 'cruiser' }]],
  ['fire torpedoes at the cruiser', [{ type: 'weapons', mode: 'fire', target: 'cruiser', weapon: 'torpedoes' }]],
  ['open fire', [{ type: 'weapons', mode: 'fire', target: 'cruiser' }]],
  ['keep firing', [{ type: 'weapons', mode: 'fire' }]],
  ['fire a warning shot across their bow', [{ type: 'weapons', mode: 'fire', warning: true }]],
  ['hold fire', [{ type: 'weapons', mode: 'safe' }]],
  ['stand down weapons', [{ type: 'weapons', mode: 'safe' }]],
  // tractor / transport / repair
  ['lock a tractor beam on the kestrel', [{ type: 'tractor', engage: true, target: 'kestrel' }]],
  ['release the tractor beam', [{ type: 'tractor', engage: false }]],
  ['evacuate the crew', [{ type: 'transport', payload: 'crew' }]],
  ['beam the Kestrel crew aboard', [{ type: 'transport', payload: 'crew' }]],
  ['get those people off that ship', [{ type: 'transport', payload: 'crew' }]],
  ['beam the passenger aboard', [{ type: 'transport', payload: 'passenger' }]],
  ['transport the stasis pod over', [{ type: 'transport', payload: 'passenger' }]],
  ['send over a medical team', [{ type: 'transport', payload: 'medicalTeam' }]],
  ['beam the cargo over', [{ type: 'transport', payload: 'cargo' }]],
  ['send an engineering team to stabilise the kestrel reactor', [{ type: 'repair', ship: 'kestrel' }]],
  ['stabilize her containment', [{ type: 'repair', ship: 'kestrel' }]],
  ['repair our shields', [{ type: 'repair', ship: 'halcyon', system: 'shields' }]],
  ['fix the engines', [{ type: 'repair', ship: 'halcyon', system: 'engines' }]],
  // communication
  ['hail the cruiser', [{ type: 'communicate', target: 'cruiser', intent: 'open' }]],
  ['open a channel to the kestrel', [{ type: 'communicate', target: 'kestrel' }]],
  ['contact the freighter captain', [{ type: 'communicate', target: 'kestrel' }]],
  ['tell the prefect this is a humanitarian rescue', [{ type: 'communicate', target: 'cruiser', intent: 'humanitarian' }]],
  ['tell the cruiser we have reinforcements on the way', [{ type: 'communicate', target: 'cruiser', intent: 'bluff' }]],
  ['warn them that we will defend the kestrel', [{ type: 'communicate', intent: 'warn' }]],
  ['remind the prefect the border accords forbid this', [{ type: 'communicate', target: 'cruiser', intent: 'legal' }]],
  ['offer them the cargo in exchange for safe passage', [{ type: 'communicate', intent: 'trade', offer: 'cargo' }]],
  ['offer the prefect the passenger in exchange for safe passage', [{ type: 'communicate', target: 'cruiser', intent: 'trade', offer: 'passenger' }]],
  ['ask captain arden what is in the compartment', [{ type: 'communicate', target: 'kestrel', intent: 'ask' }]],
  ['reassure the kestrel crew that help is coming', [{ type: 'communicate', target: 'kestrel', intent: 'reassure' }]],
  // unconventional
  ['use the tractor beam as a shield', [{ type: 'improvise', method: 'tractorShield' }]],
  ['vent plasma to cover us', [{ type: 'improvise', method: 'plasmaVent' }]],
  ['dump drive plasma to blind their sensors', [{ type: 'improvise', method: 'plasmaVent' }]],
  ['eject the kestrel core', [{ type: 'improvise', method: 'ejectCore' }]],
  ['extend our shields around the kestrel', [{ type: 'improvise', method: 'shieldExtend' }]],
  ['make a sensor ghost to look like a fleet', [{ type: 'improvise', method: 'sensorGhost' }]],
  ['ram them with the saucer', [{ type: 'improvise', method: 'other' }]],
  // queries & misc
  ['status report', [{ type: 'query', topic: 'status' }]],
  ['what are our options?', [{ type: 'query', topic: 'options' }]],
  ['help', [{ type: 'query', topic: 'help' }]],
  ['wait', [{ type: 'wait' }]],
  ['stand by', [{ type: 'wait' }]],
  ['continue', [{ type: 'wait' }]],
  // multi-order sentences
  ['raise shields and scan the cruiser', [{ type: 'shields', raise: true }, { type: 'scan', target: 'cruiser' }]],
  ['Lower shields, then beam the crew aboard', [{ type: 'shields', raise: false }, { type: 'transport', payload: 'crew' }]],
  ['red alert, arm weapons and lock on the cruiser', [{ type: 'setAlert', level: 'red' }, { type: 'weapons', mode: 'arm' }, { type: 'weapons', mode: 'lock', target: 'cruiser' }]],
  ['scan the kestrel and hail the cruiser', [{ type: 'scan', target: 'kestrel' }, { type: 'communicate', target: 'cruiser' }]],
  ['approach the kestrel, scan it and then evacuate the crew', [{ type: 'move', target: 'kestrel' }, { type: 'scan', target: 'kestrel' }, { type: 'transport' }]],
  ['tractor beam the kestrel and use it as a shield', [{ type: 'improvise', method: 'tractorShield' }]],
  ['hail the cruiser and tell them we are on a rescue mission', [{ type: 'communicate', target: 'cruiser' }]],
];

describe('offline interpreter phrasing table', () => {
  it.each(TABLE)('%s', (phrase, expected) => {
    const acts = actionsOf(phrase);
    expect(acts.length, JSON.stringify(parse(phrase))).toBeGreaterThanOrEqual(expected.length);
    expected.forEach((e, i) => expect(acts[i]).toMatchObject(e));
  });

  it('has at least 80 phrasings', () => expect(TABLE.length).toBeGreaterThanOrEqual(80));
});

describe('normalisation', () => {
  it('strips politeness, filler and addressees', () => {
    expect(normalise('Could you please, um, raise the shields right away?')).not.toMatch(/please|could you|um|right away/);
    expect(actionsOf('Lieutenant, would you kindly scan the kestrel for me')).toMatchObject([{ type: 'scan', target: 'kestrel' }]);
  });
  it('converts number words and shorthand', () => {
    expect(wordsToDigits('ten thousand')).toContain('10000');
    expect(wordsToDigits('10,000')).toContain('10000');
    expect(wordsToDigits('15k')).toContain('15000');
    expect(wordsToDigits('three hundred and fifty')).not.toBe('');
  });
  it('splits clauses but keeps reported speech with its verb', () => {
    expect(splitClauses('raise shields and scan the cruiser', ctx)).toHaveLength(2);
    expect(splitClauses('tell the prefect we are here to help and we mean no harm', ctx)).toHaveLength(1);
  });
});

describe('targets and context', () => {
  it('resolves pronouns to the last target', () => {
    const c = { ...ctx, lastTarget: 'cruiser' as const };
    expect(actionsOf('scan them', c)).toMatchObject([{ type: 'scan', target: 'cruiser' }]);
  });
  it('speech pronouns prefer the last party spoken to', () => {
    const c = { ...ctx, lastTarget: 'kestrel' as const, lastCommTarget: 'cruiser' as const };
    expect(actionsOf('tell them we mean no harm', c)).toMatchObject([{ type: 'communicate', target: 'cruiser' }]);
  });
  it('asks a clarifying question when the target is ambiguous', () => {
    const r = parse('approach');
    expect(r.kind).toBe('clarify');
    if (r.kind === 'clarify') {
      expect(r.clarification.options.length).toBeGreaterThanOrEqual(2);
      expect(r.clarification.question).toMatch(/\?/);
    }
  });
  it('answers a pending clarification with the chosen option', () => {
    const r = parse('scan');
    expect(r.kind).toBe('clarify');
    if (r.kind !== 'clarify') return;
    const c = { ...ctx, pending: r.clarification };
    expect(actionsOf('the cruiser', c)).toMatchObject([{ type: 'scan', target: 'cruiser' }]);
  });
  it('reports nonsense as unrecognised', () => {
    expect(parse('purple monkey dishwasher').kind).toBe('unrecognised');
    expect(parse('   ').kind).toBe('unrecognised');
  });
  it('keeps recognised orders and lists unparsed fragments', () => {
    const r = parse('raise shields and sing a song');
    expect(r.kind).toBe('actions');
    if (r.kind === 'actions') {
      expect(r.actions[0]).toMatchObject({ type: 'shields', raise: true });
    }
  });
  it('caps a sentence at six actions', () => {
    const r = parse('scan the kestrel, scan the cruiser, raise shields, arm weapons, red alert, hail the cruiser, charge the jump drive, wait');
    expect(r.kind).toBe('actions');
    if (r.kind === 'actions') expect(r.actions.length).toBeLessThanOrEqual(6);
  });
});
