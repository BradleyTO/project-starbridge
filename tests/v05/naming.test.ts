/** v0.5.1: the Concord / Concord Exploration Service (CSV) are now the Agency / Intergalactic Space Agency (ISV; Star → Space in v0.7.0). */
import { describe, expect, it } from 'vitest';
import { K, start } from '../helpers';
import { renameLegacyNames, renameLegacyText } from '../../src/engine/naming';
import { SAVE_KEY, loadGame, saveGame } from '../../src/engine/persistence';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { KEYS, localRepository, memoryStorage } from '../../src/universe/repository';

const NOW = new Date(2026, 9, 19, 10, 0);
const make = (storage = memoryStorage()) => new Universe({ repo: localRepository(storage, () => defaultLedger(NOW)), appVersion: 'test', scenarios: { [K.id]: K }, now: () => NOW });

describe('legacy display names are rewritten', () => {
  it.each([
    ['CSV Halcyon', 'ISV Halcyon'],
    ['Survey cruiser · Concord Exploration Service', 'Survey cruiser · Intergalactic Space Agency'],
    ['Admiral Odessa Kaine, Concord Fleet Command', 'Admiral Odessa Kaine, ISA Fleet Command'],
    ['registry CES-7140', 'registry ISA-7140'],
    ['We have crossed into Concord space.', 'We have crossed into ISA space.'],
    ['they asked to open talks on joining the Concord', 'they asked to open talks on joining the ISA'],
    ['bluff that a Concord battle group is on the way', 'bluff that an ISA battle group is on the way'],
    ['CONCORD BORDER', 'ISA BORDER'],
  ])('%s', (from, to) => expect(renameLegacyText(from)).toBe(to));
  it('leaves the Tessarine Directorate, ids and keys alone', () => {
    const v = { faction: 'concord', concord: { standing: 50 }, text: 'the Tessarine Directorate', trustConcordDirectorate: 30 };
    expect(renameLegacyNames(v)).toEqual(v);
  });
});

describe('saves from v0.5.0 and earlier still load, with the new names', () => {
  it('a simulation save that says CSV Halcyon / Concord loads as ISV Halcyon / Agency; ids unchanged', () => {
    const storage = memoryStorage();
    const s = start(7);
    saveGame(s, storage, '0.5.0');
    const raw = storage.getItem(SAVE_KEY)!.replaceAll('ISV Halcyon', 'CSV Halcyon').replaceAll('Agency', 'Concord');
    expect(raw).toMatch(/CSV Halcyon/);
    storage.setItem(SAVE_KEY, raw);
    const r = loadGame(storage);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.ships.halcyon.name).toBe('ISV Halcyon');
    expect(r.state.ships.halcyon.faction).toBe('concord');
    expect(JSON.stringify(r.state)).not.toMatch(/\bConcord\b|\bCSV\b/);
    expect(r.state.turn).toBe(s.turn);
  });
  it('a v0.5.0 canonical career (commission, career, events) loads with the new names and is otherwise identical', () => {
    const storage = memoryStorage();
    const u0 = make(storage);
    u0.setActiveDuty(true);
    u0.acceptCommission();
    const fresh = storage.getItem(KEYS.canon)!;
    const legacy = fresh.replaceAll('ISV Halcyon', 'CSV Halcyon').replaceAll('ISA Fleet Command', 'Concord Fleet Command');
    expect(legacy).toMatch(/Concord Fleet Command/);
    storage.setItem(KEYS.canon, legacy);
    const c = make(storage).canon()!;
    expect(c.commission?.ship).toBe('ISV Halcyon');
    expect(c.commission?.by).toBe('Admiral Odessa Kaine, ISA Fleet Command');
    expect(JSON.stringify(c)).toBe(fresh);
  });
});

describe('the interpreter knows the new names and still accepts the old ones', () => {
  const ctx = contextFrom(start(42));
  it.each(['Run for Agency space', 'run for agency space', 'Make for ISA space at full impulse', 'Run for Concord space', 'make for Concord space'])('%s → flee', (t) => {
    const r = interpretSync(t, ctx);
    expect(r.kind, JSON.stringify(r)).toBe('actions');
    if (r.kind !== 'actions') return;
    expect(r.actions[0]).toMatchObject({ type: 'maneuver', intent: 'flee' });
  });
});
