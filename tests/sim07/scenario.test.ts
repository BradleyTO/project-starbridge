/**
 * Training Simulation 007 — Ghost Ledger: setup, seed variation, hidden information, NPC goals,
 * officer expertise, unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import type { WorldState } from '../../src/engine/types';
import { GUESTS, ledger } from '../../src/scenarios/ledger/setup';
import { LEDGER_ENDINGS } from '../../src/scenarios/ledger/outcome';
import { proven, suspects } from '../../src/scenarios/ledger/agents';
import { LEAK, LEDGER, investigate, logText, nameFor, otherThan, playL, seedWhere, startL, untilEnd } from './helpers';

const ALL = [...LEDGER_ENDINGS.success, ...LEDGER_ENDINGS.partial, ...LEDGER_ENDINGS.failure] as string[];
const SUCCESS = LEDGER_ENDINGS.success as readonly string[];

/** Watch the traffic first, then investigate, then close the case three different ways by seed. */
function careful(seed: number): WorldState {
  let s = playL(startL(seed), ['Szabo, watch all outbound traffic']);
  for (const c of ['Varga, when were the keys copied?', 'Rask, pull the door logs', 'Varga, what device took the copy?']) s = playL(s, [c]);
  for (let guard = 0; guard < 6 && !s.outcome && !proven(s); guard++) {
    const g = suspects(s).find((x) => !s.characters[x].memory.checked);
    if (!g) break;
    s = playL(s, [`interview ${nameFor(g)}`, 'your badge says you left the reception', 'check that story']);
  }
  if (s.outcome) return s;
  const c = ledger(s).culprit;
  const end = seed % 3;
  if (end === 0) return playL(s, [`detain ${nameFor(c)}`]);
  if (end === 1) return untilEnd(playL(s, ['Rask, feed them false keys']));
  return untilEnd(playL(s, ['hail Courier-Captain Thorne', 'We know your agent copied our keys.', 'Return the copy quietly. It goes on the record.']));
}

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = LEDGER.create(42);
    expect(a).toEqual(LEDGER.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('ghost-ledger');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.kestrel.name).toBe('Marrick Lark');
    expect(a.ships.cruiser.name).toBe('Amber Script');
    expect(a.ships.cruiser.faction).toBe('directorate');
    for (const g of GUESTS) expect(a.characters[g]).toBeTruthy();
    expect(a.characters.moll.name).toBe('Capt. Hesketh Moll');
    expect(a.characters.thorne.name).toBe('Courier-Captain Sabine Thorne');
  });

  it('the intro plays and leaves the scenario waiting for orders, with four objectives', () => {
    const s = startL(1);
    expect(s.outcome).toBeNull();
    expect(s.objectives.map((o) => o.id).sort()).toEqual(['evidence', 'guests', 'keys', 'thief']);
    expect(logText(s)).toMatch(/navigation keys/);
    expect(logText(s)).not.toMatch(/the Agency/);
  });

  it('every seeded choice varies across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => ledger(LEDGER.create(i + 1)));
    expect(new Set(vs.map((v) => v.culprit)).size).toBe(4);
    expect(new Set(vs.map((v) => v.decoy)).size).toBe(4);
    expect(new Set(vs.map((v) => v.exfil)).size).toBe(2);
    expect(new Set(vs.map((v) => v.copyMin)).size).toBeGreaterThan(2);
    expect(new Set(vs.map((v) => v.departTurn)).size).toBeGreaterThan(2);
    expect(new Set(vs.map((v) => v.hunchRight)).size).toBe(2);
    for (const v of vs) expect(v.culprit).not.toBe(v.decoy);
  });

  it('the culprit and the decoy were both out of the room when the copy was made', () => {
    for (let i = 1; i <= 200; i++) {
      const v = ledger(LEDGER.create(i));
      for (const g of [v.culprit, v.decoy]) expect(v.out[g] <= v.copyMin && v.copyMin <= v.back[g], `seed ${i} ${g}`).toBe(true);
    }
  });

  it('is deterministic: same seed and orders, same log', () => {
    const cmds = ['Rask, pull the door logs', 'interview Ms Sallow', 'your badge says you left', 'check her story', 'wait'];
    expect(logText(playL(startL(9), cmds))).toBe(logText(playL(startL(9), cmds)));
  });
});

describe('seed sweep: the same orders lead to different endings', () => {
  it('a fixed plan, played on 60 seeds, reaches several distinct endings', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 60; i++) {
      const s = untilEnd(playL(startL(i), ['Rask, pull the door logs', 'detain Mr Vesk', 'detain Mr Vesk']));
      seen.add(s.outcome!.id);
    }
    expect(seen.has('wrong-guest')).toBe(true);
    expect(seen.has('hunch-without-proof')).toBe(true);
  });

  it('a careful captain succeeds on every one of 120 seeds, by at least three different roads', () => {
    const roads = new Set<string>();
    for (let i = 1; i <= 120; i++) {
      const s = careful(i);
      expect(SUCCESS, `seed ${i}: ${logText(s).slice(-800)}`).toContain(s.outcome?.id);
      roads.add(s.outcome!.id);
    }
    expect(roads.size).toBeGreaterThanOrEqual(3);
  });

  it('doing nothing, played on 60 seeds, never succeeds', () => {
    for (let i = 1; i <= 60; i++) expect(untilEnd(startL(i)).outcome?.id).toBe('keys-gone');
  });
});

describe('hidden information and officer expertise', () => {
  it('nobody knows who did it at the start, and the logs alone never prove it', () => {
    for (let i = 1; i <= 60; i++) {
      const s = playL(startL(i), ['Varga, when were the keys copied?', 'Rask, pull the door logs']);
      expect(proven(s), `seed ${i}`).toBe(false);
      expect(suspects(s).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('an innocent guest’s confession and the thief’s cover story sound alike; only the ship’s record tells them apart', () => {
    const seed = seedWhere((v) => v.culprit === 'vesk' && v.decoy === 'sallow');
    const seed2 = seedWhere((v) => v.decoy === 'vesk' && v.culprit === 'sallow');
    const say = (n: number) => logText(playL(startL(n), ['Rask, pull the door logs', 'interview Mr Vesk', 'your badge says you left the reception'])).split('\n').filter((l) => l.startsWith('Dorran Vesk')).pop();
    expect(say(seed)).toBe(say(seed2));
    const thief = playL(startL(seed), ['Rask, pull the door logs', 'interview Mr Vesk', 'your badge says you left the reception', 'check his story']);
    const honest = playL(startL(seed2), ['Rask, pull the door logs', 'interview Mr Vesk', 'your badge says you left the reception', 'check his story']);
    expect(logText(thief)).toMatch(/doesn't bear that out/);
    expect(logText(honest)).toMatch(/bears it out/);
  });

  it('each story is checked by the officer who keeps that record', () => {
    const who = { krenn: 'Lt. Mirela Szabo', vesk: 'Chief Dana Okafor', sallow: 'Lt. Oona Varga', fosse: 'Lt. Cmdr. Teodor Rask' } as const;
    for (const g of GUESTS) {
      const seed = seedWhere((v) => v.culprit !== g && v.decoy !== g);
      const s = playL(startL(seed), ['Rask, pull the door logs', `interview ${nameFor(g)}`, 'your badge says you left', 'check that story']);
      const line = logText(s).split('\n').find((l) => /bears it out/.test(l));
      expect(line, g).toBeTruthy();
      expect(line!.startsWith(who[g])).toBe(true);
    }
  });

  it('confronting a guest before the logs are pulled gets nowhere', () => {
    const s = playL(startL(4), ['interview Ms Sallow', 'your badge says you left the reception']);
    expect(logText(s)).toMatch(/Let me pull the badge logs first/);
    expect(s.characters.sallow.memory.admitted).toBe(0);
  });

  it('Rask’s hunch is sometimes right and sometimes wrong', () => {
    const right = seedWhere((v) => v.hunchRight);
    const wrong = seedWhere((v) => !v.hunchRight);
    const ask = (n: number) => logText(playL(startL(n), ['Rask, what does your gut say?']));
    expect(ask(right)).toContain(nameFor(ledger(startL(right)).culprit));
    expect(ask(wrong)).toContain(nameFor(ledger(startL(wrong)).decoy));
  });

  it('Rask’s case board tells the captain how far the evidence goes', () => {
    const s = investigate(5);
    expect(logText(playL(s, ['Rask, what do we have?']))).toMatch(/only/);
  });
});

describe('NPC goals', () => {
  it('a thief who sends rather than carries does so on their own schedule', () => {
    const seed = seedWhere((v) => v.exfil === 'burst');
    const s = untilEnd(startL(seed));
    expect(s.outcome?.id).toBe('keys-gone');
    expect(s.turn).toBeLessThanOrEqual(ledger(s).burstTurn + 1);
  });

  it('Attaché Krenn protests a blackout and a delay, for the Directorate', () => {
    const t = logText(playL(startL(3), ['impose a comms blackout', 'delay the departure']));
    expect(t).toMatch(/cut off her guests/);
    expect(t).toMatch(/has a schedule/);
  });

  it('Courier-Captain Thorne denies everything until shown evidence, then offers terms', () => {
    const a = playL(startL(3), ['hail Courier-Captain Thorne', 'We know your agent copied our keys.']);
    expect(logText(a)).toMatch(/I hear no evidence/);
    expect(a.flags.accusedCourier).toBe(true);
    const b = playL(investigate(3), ['hail Courier-Captain Thorne', 'We know your agent copied our keys.']);
    expect(logText(b)).toMatch(/What would you propose/);
  });

  it('a guest may refuse a search, and refusing is not proof', () => {
    const seed = seedWhere((v) => v.culprit === 'sallow');
    const s = playL(startL(seed), ['search Ms Sallow, with her consent']);
    expect(logText(s)).toMatch(/Refusing isn't proof/);
    expect(s.outcome).toBeNull();
  });
});

describe('unconventional solutions', () => {
  it('Captain Moll can vouch for Mr Vesk’s brandy over the radio', () => {
    const seed = seedWhere((v) => v.culprit !== 'vesk');
    const s = playL(startL(seed), ['hail Captain Moll', 'Did any cargo come across from Mr Vesk tonight?']);
    expect(logText(s)).toMatch(/Orrin brandy/);
    expect(s.characters.vesk.memory.checked).toBe(1);
  });

  it('a blackout stops a burst, so the thief must carry it', () => {
    const seed = seedWhere((v) => v.exfil === 'burst');
    const s = playL(startL(seed), ['impose a comms blackout', ...Array(ledger(startL(seed)).burstTurn).fill('wait')]);
    expect(s.flags.burstBlocked).toBe(true);
    expect(logText(s)).toMatch(/blackout held it/);
  });

  it('a delay buys six more minutes, once', () => {
    const s = playL(startL(3), ['delay the departure', 'delay the departure']);
    expect(s.counters.delay).toBe(6);
    expect(logText(s)).toMatch(/can't stretch the clamps again/);
  });

  it('false keys need proof of whose slate to swap', () => {
    const s = playL(startL(3), ['feed them false keys']);
    expect(logText(s)).toMatch(/whose slate to swap/);
    expect(s.counters.feedAt ?? 0).toBe(0);
  });

  it('a consented search of a proven thief finds the copy', () => {
    const s = investigate(5);
    const c = ledger(s).culprit;
    expect(logText(playL(s, [`search ${nameFor(c)}`]))).toMatch(/with our keys on it/);
  });
});

describe('crew refusals and force', () => {
  it('Rask cautions before holding a guest, and refuses force until ordered twice', () => {
    const g = otherThan(ledger(startL(2)).culprit)[0];
    let s = playL(startL(2), [`detain ${nameFor(g)}`]);
    expect(s.outcome).toBeNull();
    s = playL(startL(2), ['interview Mr Vesk', 'make him talk']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/I won't lay hands on anyone/);
  });

  it('Tactical will not fire on the civilian packet ship', () => {
    const s = playL(startL(2), ['lock weapons on the Marrick Lark', 'fire on the Marrick Lark']);
    expect(logText(s)).toMatch(/I won't fire on her/);
  });
});

describe('fuzz', () => {
  const POOL = [
    'wait', 'status', 'options', 'objectives', 'help', 'scan the area', 'scan the Marrick Lark', 'scan the Amber Script', 'Varga, when were the keys copied?', 'Rask, pull the door logs', 'Varga, what device took the copy?',
    'interview Attaché Krenn', 'interview Mr Vesk', 'interview Ms Sallow', 'interview Commander Fosse', 'where were you at the time of the copy?', 'your badge says you left the reception', 'check that story', 'check his story', 'check her story',
    'search him, with his consent', 'search Ms Sallow', 'detain Mr Vesk', 'detain Attaché Krenn', 'arrest Commander Fosse', 'Ms Sallow, you copied the keys', 'make him talk', 'restrain her',
    'Szabo, watch all outbound traffic', 'impose a comms blackout', 'Chief, rekey the navigation keys', 'feed them false keys', 'delay the departure', 'Rask, what do we have?', 'Rask, what does your gut say?',
    'hail Captain Moll', 'Did any cargo come across from Mr Vesk?', 'hail Courier-Captain Thorne', 'We know your agent copied our keys.', 'Return the copy quietly, off the record.', 'Return the copy quietly.', 'close the channel',
    'tractor beam on the Amber Script', 'tractor beam on the Marrick Lark', 'fire on the Amber Script', 'red alert', 'get us out of here', 'why?', 'gibberish flarp', 'Marrow, what do you think?', 'check the sensor gallery hatch log',
  ];
  it("random orders on random seeds keep every invariant and never leak another scenario's names", () => {
    const rng = createRng(2027);
    const endings = new Set<string>();
    for (let game = 0; game < Number(process.env.FUZZ_GAMES ?? 80); game++) {
      let s = startL(rng.int(1, 100000));
      for (let i = 0; i < 60 && !s.outcome; i++) {
        const c = POOL[rng.int(0, POOL.length - 1)];
        s = submit(LEDGER, s, c);
        expect(checkInvariants(s), `game ${game} "${c}"`).toEqual([]);
        // Invariant: the case is never proven against an innocent guest.
        if (proven(s)) expect(suspects(s)).toEqual([ledger(s).culprit]);
      }
      expect(logText(s)).not.toMatch(LEAK);
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      if (s.outcome) {
        endings.add(s.outcome.id);
        expect(ALL).toContain(s.outcome.id);
      }
    }
    expect(endings.size).toBeGreaterThanOrEqual(5);
  }, 300_000);
});
