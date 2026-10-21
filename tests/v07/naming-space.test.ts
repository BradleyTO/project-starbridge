/** v0.7.0: the fleet service is the Intergalactic SPACE Agency (ISA). Saved "Star Agency" text is migrated on load. */
import { describe, expect, it } from 'vitest';
import { renameLegacyNames, renameLegacyText } from '../../src/engine/naming';
import { SAVE_KEY, loadGame, saveGame } from '../../src/engine/persistence';
import { start } from '../helpers';
import { execSync } from 'node:child_process';

describe('Intergalactic Star Agency → Intergalactic Space Agency', () => {
  it.each([
    ['Survey cruiser · Intergalactic Star Agency', 'Survey cruiser · Intergalactic Space Agency'],
    ['BY ORDER OF THE INTERGALACTIC STAR AGENCY', 'BY ORDER OF THE INTERGALACTIC SPACE AGENCY'],
    ['Survey cruiser · Concord Exploration Service', 'Survey cruiser · Intergalactic Space Agency'],
    ['ISA Fleet Command', 'ISA Fleet Command'],
    ['ISV Halcyon', 'ISV Halcyon'],
  ])('%s', (from, to) => expect(renameLegacyText(from)).toBe(to));

  it('leaves other names alone (ships, characters, the Directorate, the ISA)', () => {
    const v = { a: 'the Tessarine Directorate', b: 'Admiral Odessa Kaine', c: 'the ISA', d: 'ISV Halcyon', e: 'Ashen Covenant', f: 'a star chart of the ISA border' };
    expect(renameLegacyNames(v)).toEqual(v);
  });

  it('a v0.6.1 simulation save that says "Intergalactic Star Agency" loads with the new name, otherwise unchanged', () => {
    const storage = new Map<string, string>();
    const st = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => void storage.set(k, v), removeItem: (k: string) => void storage.delete(k) };
    const s = start(9);
    saveGame(s, st, '0.6.1');
    const raw = storage.get(SAVE_KEY)!.replaceAll('Intergalactic Space Agency', 'Intergalactic Star Agency');
    storage.set(SAVE_KEY, raw.includes('Star Agency') ? raw : raw.replace('"turn":', '"note":"Intergalactic Star Agency","turn":'));
    const r = loadGame(st);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(JSON.stringify(r.state)).not.toMatch(/Star Agency/);
    expect(r.state.turn).toBe(s.turn);
    expect(r.state.ships.halcyon.name).toBe('ISV Halcyon');
  });

  it('no "Star Agency" remains in source, scripts or current docs', () => {
    const out = execSync('git grep -n "Star Agency" -- src scripts README.md docs/SCENARIO_GUIDE.md docs/SCENARIO_ROADMAP.md || true', { encoding: 'utf8' });
    const lines = out.split('\n').filter((l) => l && !l.startsWith('src/engine/naming.ts') && !l.includes('said "Intergalactic Star Agency"'));
    expect(lines).toEqual([]);
  });
});
