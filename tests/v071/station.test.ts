/**
 * v0.7.1: the bridge always knows its setting. On station (the idle bridge) no scenario's ships,
 * names, characters or aliases exist; Fleet Command and the captain's training questions work in
 * every setting; scenario comms stay isolated to their own scenario.
 */
import { describe, expect, it } from 'vitest';
import { submit } from '../../src/engine/game';
import { completeIntro } from '../../src/engine/turn';
import type { WorldState } from '../../src/engine/types';
import { checkInvariants } from '../../src/engine/invariants';
import { bridgeScenario, createBridge } from '../../src/scenarios/bridge';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import { settingOf } from '../../src/engine/setting';
import { withCaptain, withCareer } from '../../src/engine/captain';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { localRepository, memoryStorage } from '../../src/universe/repository';
import { K, start, play, lastId } from '../helpers';
import { TS, startT, playT, seedWhere } from '../sim02/helpers';
import { KESTREL, TALLIS } from '../v07/fixtures';

const B = bridgeScenario;
const NOW = new Date(2026, 9, 21, 13, 0);
const make = () => new Universe({ repo: localRepository(memoryStorage(), () => defaultLedger(NOW)), appVersion: 'test', scenarios: { [K.id]: K, [TS.id]: TS }, now: () => NOW });
const station = (s?: WorldState) => completeIntro(s ?? createBridge(7), B);
/** Lines spoken since a log id, excluding the captain's own words. */
const said = (s: WorldState, from: number) => s.log.filter((l) => l.id > from && l.speaker !== 'Captain').map((l) => `${l.speaker}: ${l.text}`).join('\n');
const ask = (s: WorldState, c: string) => {
  const from = lastId(s);
  const next = submit(B, s, c);
  expect(checkInvariants(next), c).toEqual([]);
  return { s: next, text: said(next, from) };
};
/** Every name or alias that belongs to Training Simulation 001 or 002. */
const SCENARIO_NAMES = /\b(Kestrel|Arden|Hollis|Vane|Sorel|Prefect|Ashen|Covenant|Directorate|Tessarine|Calloway|passenger|fugitive|Mercy of Ilun|Ilun|Sabeth|Marr|Isolde|Thornwake|Tallis|Corran|liner|picket|pilgrims?|warship|freighter|cruiser)\b/i;

const BATTERY = [
  // hails
  'hail the ISA', 'hail them', 'open a channel', 'hail the freighter', 'hail the cruiser', 'hail the kestrel', 'hail Prefect Vane', 'hail the Dauntless', 'hail the liner', 'open a channel to the Mercy of Ilun', 'tell them we come in peace', 'ask the prefect to stand down',
  // scan / sensors
  'scan the area', 'scan for vessels', 'scan the cruiser', 'scan the kestrel', 'what do we know about the warship?', 'status report',
  // helm / tactical / transporter
  'helm, intercept the cruiser', 'take us to 4,000 km of the kestrel', 'helm, full stop', 'lock on the cruiser', 'fire torpedoes', 'raise shields', 'red alert', 'evacuate the crew', 'beam the passenger aboard', 'lock a tractor beam on the liner',
  // career
  'what training do i need?', 'how am I doing?', 'what are my strengths?', 'recommend a simulation', "what's my training record?",
];

describe('the station setting', () => {
  it('knows where it is: station / simulation <id> / Active Duty mission', () => {
    expect(settingOf(station())).toEqual({ kind: 'station', scenarioId: 'bridge', duty: false });
    expect(settingOf(start(5))).toMatchObject({ kind: 'simulation', scenarioId: K.id });
    expect(settingOf(startT(5))).toMatchObject({ kind: 'simulation', scenarioId: TS.id });
    const mission = { ...start(5), provenance: { ...start(5).provenance, timeline: 'canonical' as const } };
    expect(settingOf(mission)).toMatchObject({ kind: 'mission', scenarioId: K.id, duty: true });
  });

  it('the station world holds no scenario ships, people or facts', () => {
    const s = station();
    expect(Object.values(s.ships).filter((x) => x.id !== 'halcyon').map((x) => x.name).join(' ')).not.toMatch(SCENARIO_NAMES);
    expect(Object.values(s.characters).filter((c) => c.ship !== 'halcyon').map((c) => c.id)).toEqual(['arden']);
    expect(s.characters.arden.name).toBe('Unknown speaker');
    expect(Object.keys(s.facts)).toEqual([]);
    const ctx = contextFrom(s);
    expect(ctx.visible).toEqual([]);
    expect(ctx.names).toEqual({ kestrel: [], cruiser: [] });
  });

  it.each(BATTERY)('idle bridge: "%s" never names another scenario’s ships or people', (c) => {
    const { text } = ask(station(), c);
    expect(text.length, c).toBeGreaterThan(0);
    expect(text, c).not.toMatch(SCENARIO_NAMES);
    expect(text, c).not.toMatch(/didn't follow that order/);
  });

  it('hailing with nothing on sensors says so (and offers Fleet Command), never "which vessel"', () => {
    for (const c of ['hail them', 'hail the freighter', 'hail the Dauntless', 'open a channel']) {
      const { text } = ask(station(), c);
      expect(text).toMatch(/No vessels on sensors/);
      expect(text).not.toMatch(/which (vessel|contact)/);
    }
    expect(ask(station(), 'fire torpedoes').text).toMatch(/No contacts/);
  });
});

describe('ISA Fleet Command is a comms party, never a ship', () => {
  const named = (s: WorldState) => withCaptain(s, { name: 'Alex Morgan', formal: 'Captain Morgan', rank: 'Captain' });
  it.each(['hail the ISA', 'hail Fleet Command', 'contact Fleet', 'call HQ', 'open a secure channel to Fleet Command', 'Szabo, get me ISA Fleet Command', 'hail Training Command'])('station: "%s"', (c) => {
    const { text } = ask(named(station()), c);
    expect(text).toMatch(/Channel open to ISA (Fleet|Training) Command/);
    expect(text).toMatch(/Go ahead, Captain Morgan/);
    expect(text).toMatch(/later update/);
    expect(text).not.toMatch(SCENARIO_NAMES);
  });

  it('Active Duty station: Fleet answers and mentions a call still awaiting the captain', () => {
    const s0 = station();
    const s = { ...s0, duty: { live: true, location: 'ISA survey space', incoming: { offerId: 'o1', title: 'Survey the Veyra anomaly', classification: 'request', from: 'Fleet Command', briefing: 'x' } as never, contact: null } };
    const r = submit(B, named(s), 'hail Fleet Command');
    const t = said(r, lastId(s));
    expect(t).toMatch(/Commander Ines Valcourt/);
    expect(t).toMatch(/Survey the Veyra anomaly/);
  });

  it('in a simulation: exercise control answers; the scenario’s people are untouched', () => {
    for (const s0 of [start(5), startT(5)]) {
      const sc = s0.scenarioId === K.id ? K : TS;
      const s = submit(sc, named(s0), 'hail Fleet Command');
      const t = said(s, lastId(s0));
      expect(t).toMatch(/exercise control/i);
      expect(t).toMatch(/Captain Morgan/);
      expect(s.characters).toEqual(s0.characters);
      expect(s.comms?.channels ?? []).toEqual(s0.comms?.channels ?? []);
    }
  });

  it('in an Active Duty mission: the duty officer answers; the decision stays with the captain', () => {
    const base = start(5);
    const s0 = named({ ...base, provenance: { ...base.provenance, timeline: 'canonical' } });
    const s = submit(K, s0, 'contact the ISA');
    expect(said(s, lastId(s0))).toMatch(/We have your mission log; the decision on scene is yours/);
    expect(s.characters).toEqual(s0.characters);
  });

  it('Fleet’s channel can answer a training question in the same breath', () => {
    const s0 = withCareer(named(station()), make().careerBrief());
    const t = said(submit(B, s0, 'hail Training Command and ask what training I need'), lastId(s0));
    expect(t).toMatch(/ISA Training Command/);
    expect(t).toMatch(/no exercise has been assessed/);
  });
});

describe('training questions are answered from the Training Record', () => {
  it('with no evidence: says so and suggests simulations from the catalogue by what they assess', () => {
    const u = make();
    const s0 = withCareer(station(), u.careerBrief());
    for (const c of ['what training do i need?', 'how am I doing?', 'recommend a simulation']) {
      const t = ask(s0, c).text;
      expect(t, c).toMatch(/no exercise has been assessed/);
      expect(t, c).toMatch(/The Kestrel Incident|Quarantine at Tallis Gate/);
      expect(t, c).toMatch(/assesses/);
      expect(t, c).not.toMatch(/\d\s*%|score/i);
    }
  });

  it('with evidence: concerns, strengths and a recommendation follow the record', () => {
    const u = make();
    // Reckless force in the Kestrel; a principled, evidence-led win at Tallis Gate.
    u.finishSimulation(u.startTraining('TRN-kestrel', 4), KESTREL.pyrrhic());
    u.finishSimulation(u.startTraining('TRN-tallis', 5), TALLIS.lifted());
    const b = u.careerBrief();
    expect(b.assessed).toBe(2);
    expect(b.concerns.length).toBeGreaterThan(0);
    expect(b.strengths.length).toBeGreaterThan(0);
    const s0 = withCareer(station(), b);
    const needs = ask(s0, 'what training do I need?').text;
    expect(needs).toMatch(/concern in/);
    for (const c of b.concerns.slice(0, 1)) expect(needs.toLowerCase()).toContain(c.toLowerCase());
    const strong = ask(s0, 'what are my strengths?').text;
    expect(strong).toMatch(/strength in/);
    expect(ask(s0, 'how am I doing?').text).toMatch(/Two exercises assessed/);
    expect(ask(s0, 'recommend a simulation').text).toMatch(/I would recommend/);
    for (const c of ['what training do I need?', 'what are my strengths?', 'how am I doing?', 'recommend a simulation', "what's my training record?"]) expect(ask(s0, c).text).not.toMatch(/\d\s*%/);
  });

  it('works in a simulation too (the XO answers; nothing in the exercise changes)', () => {
    const s0 = withCareer(start(5), make().careerBrief());
    const s = submit(K, s0, 'what training do I need?');
    expect(said(s, lastId(s0))).toMatch(/no exercise has been assessed/);
    expect(s.ships).toEqual(s0.ships);
  });
});

describe('scenario comms isolation', () => {
  const target = (s: WorldState, c: string) => {
    const r = interpretSync(c, contextFrom(s));
    return r.kind === 'actions' ? r.actions.map((a) => (a as { target?: string; party?: string }).target ?? (a as { party?: string }).party).filter(Boolean) : [];
  };
  it('Kestrel names do not resolve in Tallis Gate', () => {
    const s = playT(startT(seedWhere(() => true)), ['scan the liner', 'scan the picket'], false);
    for (const c of ['hail Prefect Vane', 'hail the Ashen Covenant', 'open a channel to Captain Arden', 'hail the Directorate ship']) expect(target(s, c), c).not.toContain('cruiser');
    for (const c of ['hail the kestrel', 'hail Arden']) expect(target(s, c), c).not.toContain('kestrel');
  });
  it('Tallis names do not resolve in the Kestrel Incident', () => {
    const s = play(start(5), ['scan the kestrel', 'scan the cruiser'], false);
    for (const c of ['hail the Mercy of Ilun', 'hail Captain Sabeth', 'hail the liner']) expect(target(s, c), c).not.toContain('kestrel');
    for (const c of ['hail the Thornwake', 'hail Warden Marr', 'hail the picket']) expect(target(s, c), c).not.toContain('cruiser');
  });
  it('no scenario names resolve on station', () => {
    const s = station();
    for (const c of ['hail the Ashen Covenant', 'hail Prefect Vane', 'hail the Thornwake', 'hail the Mercy of Ilun']) {
      const r = interpretSync(c, contextFrom(s));
      expect(r.kind, c).not.toBe('clarify');
    }
  });
  it('each scenario’s own comms still work while it is active', () => {
    const k = play(start(5), ['hail the cruiser'], false);
    expect(said(k, 0)).toMatch(/Prefect Sorel Vane, commanding the Ashen Covenant/);
    const k2 = play(start(5), ['hail the kestrel'], false);
    expect(said(k2, 0)).toMatch(/Arden/);
    const t = playT(startT(seedWhere(() => true)), ['hail the picket'], false);
    expect(said(t, 0)).toMatch(/Warden-Commander Isolde Marr/);
    const t2 = playT(startT(seedWhere(() => true)), ['hail the liner'], false);
    expect(said(t2, 0)).toMatch(/Sabeth/);
  });
});
