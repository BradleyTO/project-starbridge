/**
 * Training Simulation 005 — setup, seed variation, determinism, hidden information, NPC autonomy,
 * officer expertise, unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import { knows } from '../../src/engine/state';
import { saltglass } from '../../src/scenarios/saltglass/setup';
import { SALTGLASS_ENDINGS } from '../../src/scenarios/saltglass/outcome';
import { landing, tabled } from '../../src/scenarios/saltglass/agents';
import { contactsView } from '../../src/ui/view';
import { LEAK, SG, careful, logText, playS, seedWhere, short, softOf, startS, untilEnd, waits } from './helpers';

const ALL = [...SALTGLASS_ENDINGS.success, ...SALTGLASS_ENDINGS.failure, ...SALTGLASS_ENDINGS.backstop] as string[];
const SUCCESS = SALTGLASS_ENDINGS.success as readonly string[];
const SHARE = 'I propose you share Saltglass: both needs, written into one accord.';

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = SG.create(42);
    expect(a).toEqual(SG.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('saltglass-accord');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.halcyon.faction).toBe('concord');
    expect(a.ships.kestrel.name).toBe('Long Thaw');
    expect(a.ships.cruiser.name).toBe('Cold Hearth');
    expect(a.ships.kestrel.systems.weapons.health).toBe(0);
    expect(a.ships.cruiser.systems.weapons.health).toBe(0);
    expect(a.characters.edda.name).toBe('Speaker Edda Rhune');
    expect(a.characters.caius.name).toBe('Holder Caius Tarvo');
    expect(a.characters.marrow.name).toBe('Cmdr. Ilse Marrow');
    for (const id of ['interest_rhune', 'interest_tarvo', 'hardliner', 'survey', 'elder_ill']) expect(a.facts[id].known, id).toBe(false);
  });

  it('the intro plays and leaves the scenario waiting for orders, with both clan ships identified', () => {
    const s = startS(42);
    expect(s.intro).toBe(SG.intro.length);
    expect(s.ships.kestrel.detected && s.ships.cruiser.detected).toBe(true);
    expect(s.objectives.map((o) => o.id)).toEqual(expect.arrayContaining(['accord', 'interests', 'no-force']));
    expect(logText(s)).not.toMatch(LEAK);
    expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
    expect(contactsView(s, SG).map((c) => c.name).sort()).toEqual(['Cold Hearth', 'Long Thaw']);
  });

  it('every seeded choice varies across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => saltglass(SG.create(i + 1)));
    expect(new Set(vs.map((v) => `${v.interest.rhune}/${v.interest.tarvo}`)).size).toBe(6);
    expect(new Set(vs.map((v) => v.hard)).size).toBe(2);
    expect(new Set(vs.map((v) => v.elderClan ?? 'none')).size).toBe(3);
    expect(new Set(vs.filter((v) => v.elderClan).map((v) => v.elder)).size).toBe(3);
    expect(new Set(vs.map((v) => v.landTurn)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(vs.map((v) => v.patienceHard)).size).toBe(2);
    expect(vs.every((v) => v.interest.rhune !== v.interest.tarvo)).toBe(true);
    expect(vs.every((v) => !v.elderClan || v.interest[v.elderClan] === 'succession')).toBe(true);
  });

  it('is deterministic: same seed and orders, same log', () => {
    const cmds = ['Szabo, how do they sound?', 'open a private channel to Holder Tarvo', 'What do you really need?', 'close the channel', 'Marrow, have a quiet word with Speaker Rhune', ...waits(3), 'take the delegates down to the ice', ...waits(4)];
    expect(logText(playS(startS(77), cmds))).toBe(logText(playS(startS(77), cmds)));
  });
});

describe('seed sweep: the same orders lead to different endings', () => {
  const PLAN = [
    'open a private channel to Holder Tarvo', 'What do you really need?', 'May I raise that at the table?', 'close the channel',
    'open a channel to Speaker Rhune', 'Thank you for coming. I hear you.', 'open a channel to Holder Tarvo', 'Would you tell them what you told me?', SHARE,
  ];
  it('a fixed plan, played on 60 seeds, reaches several distinct endings (success and failure)', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      const s = untilEnd(playS(startS(seed), PLAN, false), false);
      expect(checkInvariants(s), `seed ${seed}`).toEqual([]);
      expect(s.outcome, `seed ${seed}`).toBeTruthy();
      counts[s.outcome!.id] = (counts[s.outcome!.id] ?? 0) + 1;
    }
    const ids = Object.keys(counts);
    expect(ids.length, JSON.stringify(counts)).toBeGreaterThanOrEqual(3);
    expect(ids.some((id) => SUCCESS.includes(id)), JSON.stringify(counts)).toBe(true);
    expect(ids.some((id) => !SUCCESS.includes(id)), JSON.stringify(counts)).toBe(true);
  });

  it('the plan works only where the delegate it trusts first happens to be the moderate', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = untilEnd(playS(startS(seed), PLAN, false), false);
      if (saltglass(s).hard === 'tarvo') expect(SUCCESS.includes(s.outcome!.id), `seed ${seed}`).toBe(false);
    }
  });

  it('a careful mediator succeeds on every one of 120 seeds, and the right terms vary with what the clans need', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 120; seed++) {
      let s = careful(seed);
      const v = saltglass(s);
      const terms = v.elderClan ? "I propose the naming at the Founders' Seat goes first, and the rest of Saltglass is deferred for a season." : seed % 2 ? SHARE : null;
      if (terms) s = playS(s, [terms]);
      else s = playS(s, ['close the channel', 'Varga, survey the moon', `open a channel to ${short(softOf(v))}`, 'I propose you divide Saltglass: the southern flats to one clan, the northern ridge to the other.']);
      s = untilEnd(s);
      expect(s.outcome?.success, `seed ${seed} ${JSON.stringify(v)} ${s.outcome?.id}\n${logText(s).slice(-1500)}`).toBe(true);
      counts[s.outcome!.id] = (counts[s.outcome!.id] ?? 0) + 1;
    }
    expect(Object.keys(counts).length, JSON.stringify(counts)).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('doing nothing, played on 60 seeds, never succeeds: the hardliner lands a claim or the elder dies first', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const s = untilEnd(startS(seed), false);
      expect(s.outcome?.success, `seed ${seed}`).toBe(false);
      expect(['feud', 'elder-dies']).toContain(s.outcome!.id);
      seen.add(s.outcome!.id);
    }
    expect(seen.has('feud')).toBe(true);
  });
});

describe('hidden information and NPC autonomy', () => {
  it('neither need is known at the start; the table alone does not reveal them', () => {
    const s = playS(startS(9), ['open a channel to Speaker Rhune', 'What does Saltglass mean to your clan?', 'open a channel to Holder Tarvo', 'What does Saltglass mean to your clan?']);
    expect(knows(s, 'interest_rhune') || knows(s, 'interest_tarvo')).toBe(false);
  });

  it('only the moderate confides in the side room; the hardliner gives a hint at most', () => {
    const v = saltglass(startS(21));
    const soft = softOf(v);
    const a = playS(startS(21), [`open a private channel to ${short(soft)}`, 'What do you really need?']);
    expect(knows(a, `interest_${soft}`)).toBe(true);
    const b = playS(startS(21), [`open a private channel to ${short(v.hard)}`, 'What do you really need?']);
    expect(knows(b, `interest_${v.hard}`)).toBe(false);
  });

  it('Szabo reads which delegate is the hardliner', () => {
    const s = playS(startS(4), ['Szabo, how do they sound?']);
    expect(knows(s, 'hardliner')).toBe(true);
  });

  it('a confidence is not a fact at the table: the other delegate does not learn it from the side room', () => {
    const v = saltglass(startS(33));
    const s = playS(startS(33), [`open a private channel to ${short(softOf(v))}`, 'What do you really need?', 'close the channel']);
    expect(tabled(s, softOf(v))).toBe(false);
  });

  it('the hardliner acts on a clock of his own: a landing party goes down unless the ISA earns a standstill', () => {
    const v = saltglass(startS(seedWhere((x) => !x.elderClan)));
    const s = playS(startS(seedWhere((x) => !x.elderClan)), waits(v.landTurn + 1), false);
    expect(landing(s)).toBeGreaterThan(0);
  });

  it('the Varga survey shows the springs and the barrows lie apart', () => {
    const s = playS(startS(5), ['Varga, survey the moon']);
    expect(knows(s, 'survey')).toBe(true);
    expect(s.flags.surveyed).toBe(true);
  });
});

describe('crew refusals and force', () => {
  it('Tactical will not fire on an unarmed clan ship', () => {
    const s = playS(startS(3), ['lock weapons on the Long Thaw', 'fire on the Long Thaw']);
    expect(s.ships.kestrel.destroyed).toBe(false);
    expect(s.ships.kestrel.hull).toBe(100);
    expect(s.refusals?.length ?? 0).toBeGreaterThan(0);
  });

  it('raising shields or arming at the table is noted, and the talks still go on', () => {
    const s = playS(startS(3), ['raise shields', 'wait']);
    expect(s.outcome).toBeFalsy();
  });
});

describe('fuzz', () => {
  const POOL = [
    'wait', 'status', 'options', 'objectives', 'scan the area', 'scan the Long Thaw', 'scan the Cold Hearth', 'scan our ship', 'Varga, survey the moon', 'Szabo, how do they sound?',
    'open a channel to Speaker Rhune', 'open a channel to Holder Tarvo', 'open a private channel to Speaker Rhune', 'open a private channel to Holder Tarvo', 'close the channel',
    'What do you really need?', 'What does Saltglass mean to your clan?', 'May I raise that at the table?', 'Would you tell them what you told me?', 'I hear you.', 'Thank you for coming.',
    'Will you both agree to a standstill on the ice while we talk?', SHARE, 'I propose you divide Saltglass: north and south.', "I propose the naming at the Founders' Seat goes first, and the rest is deferred.",
    'I rule that Saltglass is divided.', 'Give up your claim.', 'Clan Rhune is right.', 'I guarantee the ISA will enforce it.', 'We will step out and leave you two to talk among yourselves.',
    'Marrow, have a quiet word with Speaker Rhune', 'Marrow, talk to both delegates', 'Marrow, bring her back', 'take the delegates down to the ice', 'Doctor, can you help the elder?',
    'Will you let our doctor see your elder?', 'tractor the Cold Hearth', 'lock weapons on the Long Thaw', 'fire on the Long Thaw', 'raise shields', 'red alert', 'why?', 'gibberish flarp', 'full stop',
    'your dead in the barrows', 'the water at the springs', 'the naming at the seat',
  ];
  it("random orders on random seeds keep every invariant and never leak another scenario's names", () => {
    const rng = createRng(2026);
    const endings = new Set<string>();
    for (let game = 0; game < Number(process.env.FUZZ_GAMES ?? 60); game++) {
      let s = startS(rng.int(1, 100000));
      for (let i = 0; i < 60 && !s.outcome; i++) {
        const c = POOL[rng.int(0, POOL.length - 1)];
        s = submit(SG, s, c);
        expect(checkInvariants(s), `game ${game} "${c}"`).toEqual([]);
      }
      expect(logText(s)).not.toMatch(LEAK);
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      if (s.outcome) {
        endings.add(s.outcome.id);
        expect(ALL).toContain(s.outcome.id);
      }
    }
    expect(endings.size).toBeGreaterThanOrEqual(4);
  }, 300_000);
});
