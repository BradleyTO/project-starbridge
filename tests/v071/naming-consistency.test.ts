/**
 * v0.7.1 naming consistency (approved 2026-10-21): player-facing references to the organisation
 * are "the ISA"; "Intergalactic Space Agency" is spelled out only on formal screens; Fleet
 * Command (not "the Admiralty") reviews the captain; Prefect Vane commands the Ashen Covenant
 * (his ship) for the Tessarine Directorate (his side). Internal 'concord' ids are unchanged.
 */
import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { renameLegacyText } from '../../src/engine/naming';

const files = execSync('git ls-files src', { encoding: 'utf8' }).split('\n').filter((f) => /\.(ts|tsx)$/.test(f) && f !== 'src/engine/naming.ts');
const src = files.map((f) => [f, readFileSync(f, 'utf8')] as const);
const FORMAL = ['src/ui/components/CommissionCeremony.tsx', 'src/ui/components/ShipStatus.tsx', 'src/ui/components/CaptainNamePrompt.tsx'];
/**
 * v0.8.1: the Captain's Handbook (ISA-COM-001) is a formal document whose wording is locked
 * (tests/v080/fixtures/handbook-lock.json) and may change only by a new revision Brad approves.
 * Its title page names the issuer in full, and Draft 2 says "the Agency" in the places pinned
 * below. They are exempt here, pending Brad's ruling, and no other use may be added.
 */
const HANDBOOK_FORMAL = ['src/handbook/articles.ts', 'src/handbook/index.ts'];
const HANDBOOK_AGENCY_PINNED = 11;

describe('naming consistency', () => {
  it('no bare "Agency" in source (the ISA is "the ISA")', () => {
    const all = src.flatMap(([f, t]) => t.split('\n').map((l, i) => [f, i + 1, l] as const)).filter(([, , l]) => /(?<!Space )\bAgency\b|\bAGENCY\b/.test(l));
    const bad = all.filter(([f]) => f !== 'src/handbook/articles.ts');
    expect(bad.map(([f, n, l]) => `${f}:${n}: ${l.trim().slice(0, 80)}`)).toEqual([]);
    // The handbook's locked Draft 2 wording: exactly the pinned lines, never more.
    expect(all.length - bad.length).toBe(HANDBOOK_AGENCY_PINNED);
  });
  it('"Intergalactic Space Agency" appears only on formal screens', () => {
    const where = src.filter(([, t]) => /Intergalactic Space Agency/.test(t)).map(([f]) => f).sort();
    expect(where).toEqual([...FORMAL, ...HANDBOOK_FORMAL].sort());
  });
  it('no "Admiralty"; Vane commands the Ashen Covenant', () => {
    for (const [f, t] of src) {
      expect(t, f).not.toMatch(/Admiralty/);
      expect(t, f).not.toMatch(/Vane of the Ashen Covenant/);
    }
    const k = readFileSync('src/scenarios/kestrel/templates.ts', 'utf8') + readFileSync('src/scenarios/kestrel/dialogueTemplates.ts', 'utf8');
    expect(k).toMatch(/Prefect Sorel Vane, commanding the Ashen Covenant/);
    expect(k).toMatch(/Tessarine Directorate|Directorate/);
  });
  it('internal concord ids are untouched', () => {
    const types = readFileSync('src/engine/types.ts', 'utf8');
    expect(types).toMatch(/trustConcordDirectorate/);
    expect(types).toMatch(/'concord'/);
  });
  it('saved text migrates: "the Agency" → "the ISA", the formal name kept, Vane reworded', () => {
    expect(renameLegacyText('We are explorers from the Agency.')).toBe('We are explorers from the ISA.');
    expect(renameLegacyText('tell your Agency we are ready')).toBe('tell the ISA we are ready');
    expect(renameLegacyText('an Agency hospital')).toBe('an ISA hospital');
    expect(renameLegacyText('ISV Halcyon · Intergalactic Space Agency')).toBe('ISV Halcyon · Intergalactic Space Agency');
    expect(renameLegacyText('"Agency vessel, this is Prefect Sorel Vane of the Ashen Covenant. You are inside')).toBe('"ISA vessel, this is Prefect Sorel Vane, commanding the Ashen Covenant. You are inside');
    expect(renameLegacyText('Concord space')).toBe('ISA space');
  });
  it('old phrasing still parses (aliases kept)', async () => {
    const { interpretSync } = await import('../../src/interpreter/parser');
    const { contextFrom } = await import('../../src/interpreter/types');
    const { start } = await import('../helpers');
    const ctx = contextFrom(start(5));
    for (const c of ['run for Agency space', 'run for ISA space', 'run for Concord space']) {
      const r = interpretSync(c, ctx);
      expect(r.kind === 'actions' && r.actions.some((a) => a.type === 'maneuver' && a.intent === 'flee'), c).toBe(true);
    }
  });
});
