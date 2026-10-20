/**
 * Training Simulation 002 — scripted playthroughs that reach EVERY listed ending
 * through the offline interpreter (plain-English orders), with invariants checked after each order.
 */
import { describe, expect, it } from 'vitest';
import { TALLIS_ENDINGS } from '../../src/scenarios/tallis/outcome';
import { destroyShip } from '../../src/engine/combat';
import { LEAK, logText, playT, seedWhere, startT, waits } from './helpers';
import { TS } from './helpers';

const APPROACH = ['take us to 3,000 km of the liner', 'wait', 'wait'];
const reached = new Set<string>();
function ending(s: ReturnType<typeof startT>, id: string) {
  expect(s.outcome?.id, logText(s).slice(-1500)).toBe(id);
  expect(logText(s)).not.toMatch(LEAK);
  reached.add(id);
  return s;
}

describe('Quarantine at Tallis Gate: success endings', () => {
  it('quarantine-lifted (incense allergy, humane Warden): diagnose by close scan, then tell the Warden', () => {
    const seed = seedWhere((v) => v.cause === 'panic' && v.warden === 'humane');
    const s = playT(startT(seed), [...APPROACH, 'scan the liner', 'hail the picket', 'tell her our scans show it is not contagious']);
    ending(s, 'quarantine-lifted');
    expect(s.outcome!.success).toBe(true);
    expect(s.facts.cause_known.known).toBe(true);
  });

  it('quarantine-lifted (poisoned water, strict Warden): a strict Warden needs data, and gets it', () => {
    const seed = seedWhere((v) => v.cause === 'toxin' && v.warden === 'strict');
    let s = playT(startT(seed), [...APPROACH, 'scan the liner', 'hail the picket', 'please lift the quarantine']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/Show me what they have/);
    s = playT(s, ['tell her our scan results show cadmium poisoning from their water recycler']);
    ending(s, 'quarantine-lifted');
  });

  it('quarantine-lifted (poisoned water, fearful Warden): she wants the water fixed first; an engineering team fixes it', () => {
    const seed = seedWhere((v) => v.cause === 'toxin' && v.warden === 'fearful');
    let s = playT(startT(seed), [...APPROACH, 'scan the liner', 'hail the picket', 'our scans show it is poison in their water, not a disease']);
    expect(s.outcome).toBeNull();
    expect(s.characters.marr.memory.holdFire).toBe(1);
    s = playT(s, ['close the channel', 'send an engineering team to fix their water recycler', 'send an engineering team to fix their water recycler', 'wait']);
    ending(s, 'quarantine-lifted');
    expect(s.flags.recyclerFixed).toBe(true);
  });

  it('cure-delivered (Ilun fever): isolation ward first, then a medical team; the antiviral is beamed across', () => {
    const seed = seedWhere((v) => v.cause === 'fever' && v.warden === 'strict');
    const s = playT(startT(seed), [...APPROACH, 'set up an isolation ward in the cargo bay', 'lower shields and send a medical team', ...waits(8)]);
    ending(s, 'cure-delivered');
    expect(s.flags.exposed).toBeFalsy();
    expect(s.flags.cureDelivered).toBe(true);
  });

  it("cure-delivered (unconventional): ask the Warden for the colony's own antiviral stockpile", () => {
    const seed = seedWhere((v) => v.cause === 'fever' && v.warden === 'fearful');
    const s = playT(startT(seed), [...APPROACH, 'scan the liner', 'hail the picket', 'will you send them your antiviral stockpile?', ...waits(4)]);
    ending(s, 'cure-delivered');
    expect(s.flags.colonyDoses).toBe(true);
    expect(s.outcome!.summary).toMatch(/stockpile/);
  });

  it('agency-care: offer Sabeth an Agency hospital, tow the liner and jump', () => {
    const seed = seedWhere((v) => v.cause === 'panic');
    const s = playT(startT(seed), [...APPROACH, 'hail the liner', 'we can tow you to an Agency hospital', 'close the channel', 'lock a tractor beam on the liner', 'charge the jump drive', 'wait', 'wait', 'engage the jump drive']);
    ending(s, 'agency-care');
    expect(s.flags.kestrelTowedOut).toBe(true);
  });
});

describe('Quarantine at Tallis Gate: failure and partial endings', () => {
  it('liner-destroyed: do nothing; Sabeth runs the line and a strict Warden fires', () => {
    const seed = seedWhere((v) => v.warden === 'strict');
    const s = playT(startT(seed), waits(29));
    ending(s, 'liner-destroyed');
    expect(s.flags.linerRan).toBe(true);
    expect(s.flags.cruiserFired).toBe(true);
  });

  it('halcyon-quarantined: a medical team sent across before anyone knows it is contagious', () => {
    const seed = seedWhere((v) => v.cause === 'fever');
    const s = playT(startT(seed), [...APPROACH, 'lower shields and send a medical team', ...waits(6)]);
    ending(s, 'halcyon-quarantined');
    expect(s.flags.exposed).toBe(true);
  });

  it('…and the same mistake is recoverable: an isolation ward in time contains the exposure', () => {
    const seed = seedWhere((v) => v.cause === 'fever');
    const s = playT(startT(seed), [...APPROACH, 'lower shields and send a medical team', 'set up an isolation ward', ...waits(8)]);
    expect(s.flags.exposureContained).toBe(true);
    expect(s.outcome?.id).toBe('cure-delivered');
  });

  it('colony-outbreak: a personal appeal opens the gate to an untreated fever ship', () => {
    const seed = seedWhere((v) => v.cause === 'fever' && v.warden === 'humane' && v.kin);
    const s = playT(startT(seed), ['hail the liner', 'who is aboard?', 'close the channel', 'hail the picket', 'your brother Teodric is aboard that liner', ...waits(12)]);
    ending(s, 'colony-outbreak');
    expect(s.flags.quarantineLifted).toBe(true);
  });

  it('gate-run: a frightened Warden holds fire, and the liner forces the gate', () => {
    const seed = seedWhere((v) => v.cause !== 'fever' && v.warden === 'fearful');
    const s = playT(startT(seed), ['hail the picket', 'back off or we will destroy your ship', 'close the channel', ...waits(26)]);
    ending(s, 'gate-run');
    expect(s.characters.marr.memory.holdFire).toBe(1);
  });

  it('gate-incident: firing on the colony picket', () => {
    const seed = seedWhere((v) => v.warden === 'humane');
    const s = playT(startT(seed), ['raise shields', 'lock torpedoes on the picket', ...Array.from({ length: 8 }, () => 'fire torpedoes at the picket')]);
    ending(s, 'gate-incident');
  });

  it('abandoned: jumping away alone', () => {
    const s = playT(startT(4), ['charge the jump drive', 'wait', 'wait', 'engage the jump drive']);
    ending(s, 'abandoned');
  });

  it('long-road: towing an untreated fever ship six hours to Agency space', () => {
    const seed = seedWhere((v) => v.cause === 'fever');
    const s = playT(startT(seed), [...APPROACH, 'hail the liner', 'we can tow you to an Agency hospital', 'close the channel', 'lock a tractor beam on the liner', 'charge the jump drive', 'wait', 'wait', 'engage the jump drive']);
    ending(s, 'long-road');
  });

  it('stalemate: holding the liner on a tractor beam for thirty minutes without solving anything', () => {
    const seed = seedWhere((v) => v.cause === 'toxin' && v.warden === 'strict');
    const s = playT(startT(seed), [...APPROACH, 'lock a tractor beam on the liner', ...waits(30)]);
    ending(s, 'stalemate');
  });

  it('halcyon-lost: the shared loss rule (state forced: the Halcyon is destroyed)', () => {
    const s0 = startT(3);
    const s = destroyShip(s0, 'halcyon', []);
    expect(TS.detectOutcome(s)?.id).toBe('halcyon-lost');
    reached.add('halcyon-lost');
  });

  it('every listed ending was reached (≥3 successes, ≥3 failures)', () => {
    expect(TALLIS_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(TALLIS_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
    for (const id of [...TALLIS_ENDINGS.success, ...TALLIS_ENDINGS.failure]) expect(reached.has(id), id).toBe(true);
  });
});
