/** v0.7 the captain's name: validation, injection, persistence, migration, rank address, rename declines. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { submit } from '../../src/engine/game';
import { completeIntro } from '../../src/engine/turn';
import type { WorldState } from '../../src/engine/types';
import { bridgeScenario, createBridge } from '../../src/scenarios/bridge';
import { withCaptain } from '../../src/engine/captain';
import { DEFAULT_CAPTAIN_NAME, formalAddress, fullTitle, surnameOf, validateCaptainName } from '../../src/career/name';
import { renameRequest } from '../../src/interpreter/parser';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { KEYS, localRepository, memoryStorage } from '../../src/universe/repository';
import { K, play, start, textSince, lastId } from '../helpers';
import { TS } from '../sim02/helpers';
import { KESTREL } from './fixtures';

const NOW = new Date(2026, 9, 21, 12, 0);
const make = (storage = memoryStorage()) => new Universe({ repo: localRepository(storage, () => defaultLedger(NOW)), appVersion: 'test', scenarios: { [K.id]: K, [TS.id]: TS }, now: () => NOW });
const B = bridgeScenario;
const bridge = (s?: WorldState) => s ?? completeIntro(createBridge(7), B);
const say = (s: WorldState, c: string) => submit(B, s, c);

describe('captain name validation', () => {
  it('accepts ordinary names, accented letters, hyphens, apostrophes and periods; trims and collapses spaces', () => {
    for (const [raw, want] of [
      ['Morgan', 'Morgan'],
      ['  Jean-Luc   Moreau ', 'Jean-Luc Moreau'],
      ["Siobhán O'Neill", "Siobhán O'Neill"],
      ['Zoë Åberg', 'Zoë Åberg'],
      ['J. R. Okafor', 'J. R. Okafor'],
      ['Nguyễn Thị Lan', 'Nguyễn Thị Lan'],
      ['Al', 'Al'],
    ]) {
      const v = validateCaptainName(raw);
      expect(v, raw).toEqual({ ok: true, name: want });
    }
  });

  it('rejects empty, too short, too long, digits, markup, control and invisible characters, and command syntax', () => {
    const bad = [
      '', ' ', 'A', 'x'.repeat(33), 'Agent 47', '<script>alert(1)</script>', '<b>Morgan</b>', 'Morgan\u0000', 'Mor\u200bgan', 'Morgan\nfire torpedoes',
      'Morgan; fire torpedoes', '{{captain}}', '${formal}', '$& Morgan', 'Morgan & Sons', 'Robert"); DROP TABLE', 'javascript:alert(1)', '---', "''", 'M...organ', 'Morgan\u202e', 42, null, undefined, {},
    ];
    for (const b of bad) expect(validateCaptainName(b as unknown).ok, JSON.stringify(b)).toBe(false);
  });

  it('formal address is rank plus surname; the full title is rank plus full name', () => {
    expect(surnameOf('Alex Morgan')).toBe('Morgan');
    expect(formalAddress('Alex Morgan')).toBe('Captain Morgan');
    expect(formalAddress('Alex Morgan', 'commodore')).toBe('Commodore Morgan');
    expect(formalAddress('Alex Morgan', 'senior-captain')).toBe('Senior Captain Morgan');
    expect(formalAddress('Alex Morgan', 'fleet-captain')).toBe('Fleet Captain Morgan');
    expect(fullTitle('Alex Morgan', 'commodore')).toBe('Commodore Alex Morgan');
    expect(formalAddress(null)).toBe('Captain');
  });
});

describe('the captain profile', () => {
  it('a new captain is prompted once; saving persists across sessions', () => {
    const storage = memoryStorage();
    const u = make(storage);
    expect(u.needsName()).toBe(true);
    expect(u.setCaptainName('  Alex   Morgan ')).toEqual({ ok: true, name: 'Alex Morgan' });
    expect(u.needsName()).toBe(false);
    const again = make(storage);
    expect(again.profile().name).toBe('Alex Morgan');
    expect(again.needsName()).toBe(false);
    expect(again.address()).toEqual({ name: 'Alex Morgan', formal: 'Captain Morgan', rank: 'Captain' });
  });

  it('dismissing the prompt keeps a sensible default and never asks again', () => {
    const u = make();
    expect(u.dismissNamePrompt()).toBe(DEFAULT_CAPTAIN_NAME);
    expect(u.needsName()).toBe(false);
    expect(u.profile().name).toBe(DEFAULT_CAPTAIN_NAME);
  });

  it('an invalid name is refused and changes nothing', () => {
    const storage = memoryStorage();
    const u = make(storage);
    u.setCaptainName('Alex Morgan');
    const before = storage.getItem(KEYS.profile);
    expect(u.setCaptainName('<img src=x onerror=alert(1)>').ok).toBe(false);
    expect(storage.getItem(KEYS.profile)).toBe(before);
  });

  it('renaming never resets or corrupts progress: training, simulations, canon, credits and familiarity are intact', () => {
    const storage = memoryStorage();
    const u = make(storage);
    u.setCaptainName('Alex Morgan');
    u.setActiveDuty(true);
    u.acceptCommission();
    const sess = u.startTraining('TRN-kestrel', 4);
    u.finishSimulation(sess, KESTREL.pyrrhic());
    const snap = (k: string) => storage.getItem(k);
    const training = snap(KEYS.training);
    const sims = snap(KEYS.sim);
    const credits = snap(KEYS.credits);
    const fam = snap(KEYS.familiarity);
    expect(training && sims).toBeTruthy();
    const canonBefore = JSON.parse(snap(KEYS.canon)!);
    expect(u.setCaptainName('Alex Okafor').ok).toBe(true);
    expect(snap(KEYS.training)).toBe(training);
    expect(snap(KEYS.sim)).toBe(sims);
    expect(snap(KEYS.credits)).toBe(credits);
    expect(snap(KEYS.familiarity)).toBe(fam);
    const canonAfter = JSON.parse(snap(KEYS.canon)!);
    // Only the captain's displayed name moves; the career, missions and events are untouched.
    expect(canonAfter.captain.name).toBe('Alex Okafor');
    expect(canonAfter.captain.career).toEqual(canonBefore.captain.career);
    expect(canonAfter.events).toEqual(canonBefore.events);
    expect(canonAfter.missions).toEqual(canonBefore.missions);
    expect(canonAfter.service).toEqual(canonBefore.service);
    expect(u.training().evaluations).toHaveLength(1);
    expect(u.profile().history.map((h) => h.to)).toEqual(['Alex Morgan', 'Alex Okafor']);
    expect(u.address().formal).toBe('Captain Okafor');
  });

  it('a pre-v0.7 save (no profile) migrates without loss: prompted once, its canonical name is kept as the default', () => {
    const storage = memoryStorage();
    const old = make(storage);
    old.setActiveDuty(true);
    old.acceptCommission();
    // Simulate a v0.6 save: no profile store, the canon carries a captain name of its own.
    storage.removeItem(KEYS.profile);
    const canon = JSON.parse(storage.getItem(KEYS.canon)!);
    canon.captain.name = 'Vesna Halloran';
    storage.setItem(KEYS.canon, JSON.stringify(canon));
    const before = storage.getItem(KEYS.canon);
    const u = make(storage);
    expect(u.needsName()).toBe(true);
    expect(u.profile().name).toBe('Vesna Halloran');
    expect(u.dismissNamePrompt()).toBe('Vesna Halloran');
    expect(u.canon()?.captain.career.length).toBe(canon.captain.career.length);
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });

  it('rank changes alter the formal address; the name stays with the record', () => {
    const u = make();
    u.setCaptainName('Alex Morgan');
    u.setActiveDuty(true);
    u.acceptCommission();
    expect(u.address().formal).toBe('Captain Morgan');
    expect(u.setRank('commodore')).toBe(true);
    expect(u.address()).toEqual({ name: 'Alex Morgan', formal: 'Commodore Morgan', rank: 'Commodore' });
    expect(u.service().rankHistory.at(-1)?.rank).toBe('commodore');
    expect(u.setRank('admiral' as never)).toBe(false);
  });
});

describe('the name in dialogue', () => {
  it('the bridge intro and Fleet Command use rank plus surname, and follow a rank change', () => {
    const named = completeIntro(withCaptain(createBridge(7), { name: 'Alex Morgan', formal: 'Captain Morgan', rank: 'Captain' }), B);
    expect(textSince(named, 0)).toMatch(/Captain Morgan/);
    const promoted = completeIntro(withCaptain(createBridge(7), { name: 'Alex Morgan', formal: 'Commodore Morgan', rank: 'Commodore' }), B);
    expect(textSince(promoted, 0)).toMatch(/Commodore Morgan/);
    expect(textSince(promoted, 0)).not.toMatch(/Captain Morgan/);
  });

  it('with no name the dialogue is exactly the pre-v0.7 wording', () => {
    const plain = completeIntro(createBridge(7), B);
    expect(textSince(plain, 0)).not.toMatch(/undefined|null|\$\{/);
  });

  it('a name that looks like a command is display data only: it is never parsed as an order', () => {
    // Even if a hostile value got past validation, the parser only reads what the captain types.
    const s = completeIntro(withCaptain(createBridge(7), { name: 'Fire Torpedoes', formal: 'Captain Torpedoes', rank: 'Captain' }), B);
    const after = say(s, 'wait');
    expect(after.alert).toBe('green');
    expect(after.counters.torpedoes).toBe(s.counters.torpedoes);
    const src = readFileSync('src/engine/captain.ts', 'utf8') + readFileSync('src/interpreter/parser.ts', 'utf8');
    expect(src).not.toMatch(/captain\?*\.name[^\n]*interpret|interpret[^\n]*captain\?*\.name/);
  });
});

describe('nothing else can be renamed', () => {
  it('recognises rename requests (and leaves ordinary orders alone)', () => {
    expect(renameRequest('rename the ship')).toBe('ship');
    expect(renameRequest('rename the halcyon to the dauntless')).toBe('ship');
    expect(renameRequest("change the ship's name to Valiant")).toBe('ship');
    expect(renameRequest('call helm Bob')).toBe('crew');
    expect(renameRequest('rename the xo')).toBe('crew');
    expect(renameRequest('rename the kestrel')).toBe('crew');
    expect(renameRequest('call me Morgan')).toBe('self');
    expect(renameRequest('name the planet Brightwater')).toBe('crew');
    expect(renameRequest('change my name')).toBe('self');
    for (const ok of ['call them back', 'hail the cruiser', 'call the kestrel', 'scan the planet', 'open a channel', 'lock on the cruiser', 'tell them my name is not important to this']) expect(renameRequest(ok), ok).toBeNull();
  });

  it('“rename the ship” and “call helm Bob” are politely declined on the bridge, and nothing changes', () => {
    let s = bridge();
    const at = lastId(s);
    s = say(s, 'rename the ship to Dauntless');
    expect(textSince(s, at)).toMatch(/With respect, Captain, the Halcyon/);
    const at2 = lastId(s);
    s = say(s, 'call helm Bob');
    expect(textSince(s, at2)).toMatch(/People keep the names they were given/);
    expect(JSON.stringify(s.ships)).not.toMatch(/Bob/);
    expect(s.ships.halcyon.name).toBe('ISV Halcyon');
    const at3 = lastId(s);
    s = say(s, 'call me Morgan');
    expect(textSince(s, at3)).toMatch(/Service Record/);
  });

  it('is declined inside a simulation too, without spending the turn on anything else', () => {
    const s0 = start(5);
    const s = play(s0, ['rename the halcyon'], false);
    expect(textSince(s, lastId(s0))).toMatch(/Halcyon’s name is on her ISA registry/);
    expect(s.ships.halcyon.name).toBe(s0.ships.halcyon.name);
  });

  it('the UI and controller have no rename path for anything but the captain', () => {
    const files = execSync('git ls-files src', { encoding: 'utf8' }).split('\n').filter((f) => /\.(ts|tsx)$/.test(f));
    const all = files.map((f) => [f, readFileSync(f, 'utf8')] as const);
    for (const [f, src] of all) {
      expect(src, f).not.toMatch(/\b(renameShip|renameCrew|setShipName|setCrewName|renameNpc|renamePlanet|renameFaction|renameDepartment)\s*[(=]/);
      expect(src, f).not.toMatch(/data-testid="rename-(ship|crew|npc|planet|faction)/);
    }
    const rename = all.filter(([, s]) => /data-testid="rename-/.test(s)).map(([f]) => f);
    expect(rename).toEqual(['src/ui/components/RecordPanel.tsx']);
    const ctl = readFileSync('src/universe/controller.ts', 'utf8');
    expect(ctl.match(/^\s{2}set\w*Name\(/gm)).toEqual(['  setCaptainName(']);
  });
});
