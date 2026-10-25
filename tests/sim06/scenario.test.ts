/**
 * Training Simulation 006 — setup, seed variation, determinism, hidden information, NPC autonomy,
 * officer expertise, unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import { knows } from '../../src/engine/state';
import { ion } from '../../src/scenarios/ion/setup';
import { ION_ENDINGS } from '../../src/scenarios/ion/outcome';
import { alone, charge, modelLine } from '../../src/scenarios/ion/agents';
import { contactsView } from '../../src/ui/view';
import { ION, LEAK, calmOf, careful, logText, playI, roughOf, seedWhere, startI, untilEnd, waits } from './helpers';

const ALL = [...ION_ENDINGS.success, ...ION_ENDINGS.partial, ...ION_ENDINGS.failure, ...ION_ENDINGS.backstop] as string[];
const SUCCESS = ION_ENDINGS.success as readonly string[];
const through = (ch: string) => `take us through the ${ch} channel`;

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = ION.create(42);
    expect(a).toEqual(ION.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('ion-season');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.halcyon.faction).toBe('concord');
    expect(a.ships.kestrel.name).toBe('Saffron Mule');
    expect(a.ships.cruiser.name).toBe("Gannet's Luck");
    expect(a.ships.kestrel.systems.weapons.health).toBe(0);
    expect(a.ships.cruiser.systems.weapons.health).toBe(0);
    expect(a.characters.brack.name).toBe('Capt. Odran Brack');
    expect(a.characters.teague.name).toBe('Capt. Rosalind Teague');
    expect(a.characters.marrow.name).toBe('Cmdr. Ilse Marrow');
    for (const id of ['unfit', 'drift', 'season', 'impatient']) expect(a.facts[id].known, id).toBe(false);
  });

  it('the intro plays and leaves the scenario waiting for orders, with both haulers identified', () => {
    const s = startI(42);
    expect(s.intro).toBe(ION.intro.length);
    expect(s.ships.kestrel.detected && s.ships.cruiser.detected).toBe(true);
    expect(s.objectives.map((o) => o.id)).toEqual(expect.arrayContaining(['convoy', 'crews', 'halcyon']));
    expect(s.objectives.map((o) => o.id)).not.toContain('fitness');
    expect(logText(s)).not.toMatch(LEAK);
    expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
    expect(contactsView(s, ION).map((c) => c.name).sort()).toEqual(["Gannet's Luck", 'Saffron Mule']);
  });

  it('every seeded choice varies across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => ion(ION.create(i + 1)));
    expect(new Set(vs.map((v) => v.calm.join('/'))).size).toBe(8);
    expect(new Set(vs.map((v) => v.season)).size).toBe(3);
    expect(new Set(vs.map((v) => v.unfit)).size).toBe(3);
    expect(new Set(vs.map((v) => v.patience)).size).toBe(3);
    expect(new Set(vs.map((v) => v.lullAt)).size).toBe(3);
    expect(new Set(vs.map((v) => v.blind)).size).toBe(3);
    expect(new Set(vs.map((v) => v.confident)).size).toBe(2);
    expect(new Set(vs.map((v) => v.firm.join('/'))).size).toBeGreaterThanOrEqual(6);
    // The model is wrong somewhere on most seeds, and never where its buoys are still reporting.
    expect(vs.filter((v) => v.wrong.some((w, b) => w && !v.firm[b])).length).toBeGreaterThan(100);
    expect(vs.every((v) => v.firm.every((f, b) => !f || !v.wrong[b]))).toBe(true);
  });

  it('is deterministic: same seed and orders, same log', () => {
    const cmds = ['hail Captain Brack', 'Which channel would you take?', 'close the channel', 'Adeyemi, what does your gut say?', 'send a probe down the high channel', ...waits(2), through('high'), ...waits(2), through('low')];
    expect(logText(playI(startI(77), cmds))).toBe(logText(playI(startI(77), cmds)));
  });
});

describe('seed sweep: the same orders lead to different endings', () => {
  const GUT = ['Adeyemi, what does your gut say?', 'go with your gut'];
  const PLAN = [...GUT, ...GUT, ...GUT, ...waits(6)];
  it('a fixed plan, played on 60 seeds, reaches several distinct endings (success and failure)', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      const s = untilEnd(playI(startI(seed), PLAN, false), false);
      expect(checkInvariants(s), `seed ${seed}`).toEqual([]);
      expect(s.outcome, `seed ${seed}`).toBeTruthy();
      counts[s.outcome!.id] = (counts[s.outcome!.id] ?? 0) + 1;
    }
    const ids = Object.keys(counts);
    expect(ids.length, JSON.stringify(counts)).toBeGreaterThanOrEqual(3);
    expect(ids.some((id) => SUCCESS.includes(id)), JSON.stringify(counts)).toBe(true);
    expect(ids.some((id) => !SUCCESS.includes(id)), JSON.stringify(counts)).toBe(true);
  });

  it('a careful captain succeeds on every one of 120 seeds, by at least three different roads', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 120; seed++) {
      const s = careful(seed);
      expect(s.outcome?.success, `seed ${seed} ${JSON.stringify(ion(s))} ${s.outcome?.id}\n${logText(s).slice(-1500)}`).toBe(true);
      counts[s.outcome!.id] = (counts[s.outcome!.id] ?? 0) + 1;
    }
    expect(Object.keys(counts).length, JSON.stringify(counts)).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('doing nothing, played on 60 seeds, never succeeds', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const s = untilEnd(startI(seed), false);
      expect(s.outcome?.success, `seed ${seed}`).toBe(false);
      seen.add(s.outcome!.id);
    }
    expect(seen.has('hauler-lost')).toBe(true);
  });
});

describe('hidden information and officer expertise', () => {
  const WRONG = seedWhere((v) => !v.confident && v.blind !== 0 && v.wrong[0] && !v.firm[0] && v.season !== 'spate' && v.unfit === 'none');

  it('a diffident helmsman gives the model’s line unless asked for his own; the XO notices', () => {
    const v = ion(startI(WRONG));
    const a = playI(startI(WRONG), ['Adeyemi, which channel?']);
    expect(logText(a)).toMatch(new RegExp(`The model has the ${roughOf(v, 0)} channel, sir`));
    expect(logText(a)).toMatch(/Ask him what he feels/);
    const b = playI(startI(WRONG), ['Adeyemi, what does your gut say?']);
    expect(logText(b)).toMatch(new RegExp(`${calmOf(v, 0)}\\. The ${calmOf(v, 0)} channel\\. I can feel it`));
  });

  it('following the soft model where it is wrong costs charge; following the helm does not', () => {
    const v = ion(startI(WRONG));
    expect(modelLine(startI(WRONG)).ch).toBe(roughOf(v, 0));
    const m = playI(startI(WRONG), ['Varga, what does the model say?', 'go with the model']);
    const g = playI(startI(WRONG), ['Adeyemi, what does your gut say?', 'go with your gut']);
    expect(m.flags.roughTaken).toBe(true);
    expect(g.flags.roughTaken).toBeFalsy();
    expect(charge(m, 'mule')).toBeGreaterThan(charge(g, 'mule') + 20);
  });

  it('a probe tells the truth about the channel it was sent down', () => {
    const v = ion(startI(WRONG));
    const s = playI(startI(WRONG), [`send a probe down the ${roughOf(v, 0)} channel`, 'wait', 'wait']);
    expect(logText(s)).toMatch(new RegExp(`The ${roughOf(v, 0)} channel through the Fringe is rough`));
    const t = playI(s, ['take the channel the probe says']);
    expect(t.flags.roughTaken).toBeFalsy();
  });

  it('nobody knows a master is unfit at the start; the doctor needs to hear them, then she can tell', () => {
    const seed = seedWhere((v) => v.unfit === 'mule');
    let s = playI(startI(seed), ['Doctor, how does Captain Brack sound?']);
    expect(knows(s, 'unfit')).toBe(false);
    expect(logText(s)).toMatch(/I'd need to hear/);
    s = playI(s, ['hail Captain Brack', 'close the channel', 'Doctor, how does Captain Brack sound?']);
    expect(knows(s, 'unfit')).toBe(true);
    expect(s.objectives.map((o) => o.id)).toContain('fitness');
  });

  it('a proud master deflects the question until there is evidence, then owns it and hands over', () => {
    const seed = seedWhere((v) => v.unfit === 'mule');
    let s = playI(startI(seed), ['hail Captain Brack', 'Captain, are you fit to fly the Maw?', 'Will you hand the helm to your mate?']);
    expect(s.characters.brack.memory.relieved ?? 0).toBe(0);
    s = playI(s, ['close the channel', 'Doctor, how does Brack sound?', 'hail Captain Brack', 'Captain, are you fit to fly the Maw?', 'Will you hand the helm to your mate?']);
    expect(s.characters.brack.memory.admitted).toBe(1);
    expect(s.characters.brack.memory.relieved).toBe(1);
  });

  it('a fit master asked to stand down takes it as the insult it is', () => {
    const seed = seedWhere((v) => v.unfit === 'gannet');
    const s = playI(startI(seed), ['hail Captain Brack', 'Will you hand the helm to your mate?']);
    expect(s.characters.brack.memory.relieved ?? 0).toBe(0);
    expect(s.characters.brack.trust).toBeLessThan(45);
  });

  it('a spate in the Maw: the model sees nothing; a backed helm calls the lull', () => {
    const seed = seedWhere((v) => v.season === 'spate' && v.unfit === 'none' && v.patience > v.lullAt + 1);
    const v = ion(startI(seed));
    let s = playI(startI(seed), [through(calmOf(v, 0)), through(calmOf(v, 1)), 'Varga, what does the model say?']);
    expect(logText(s)).toMatch(/both of the Maw's channels rough/);
    s = playI(s, ['Adeyemi, what does your gut say?']);
    expect(logText(s)).toMatch(/it'll go slack, I think/);
  });
});

describe('NPC autonomy', () => {
  it('an impatient master goes on her own line if kept waiting, and may not come through', () => {
    const seed = seedWhere((v) => v.patience === 3);
    const s = playI(startI(seed), waits(3));
    expect(alone(s)).toBe(true);
    expect(knows(s, 'impatient')).toBe(true);
  });

  it('a word on the net keeps her with the convoy', () => {
    const seed = seedWhere((v) => v.patience === 3);
    const s = playI(startI(seed), ['wait', 'wait', 'hail Captain Teague', 'Stay with us, Captain. Not yet.', 'close the channel', 'wait']);
    expect(alone(s)).toBe(false);
    expect(s.flags.steadiedTeague).toBe(true);
  });

  it('a master’s own lore can be wrong when they are not fit', () => {
    const seed = seedWhere((v) => v.unfit === 'mule');
    const v = ion(startI(seed));
    const s = playI(startI(seed), ['hail Captain Brack', 'Which channel would you take through the Fringe?']);
    expect(logText(s)).toMatch(new RegExp(`In a year like this one, ${roughOf(v, 0)}`));
  });
});

describe('unconventional solutions', () => {
  const UNFIT = seedWhere((v) => v.unfit === 'mule' && v.season === 'settled' && v.patience === 5);

  it('a tow takes an unfit master through the Maw without asking him to give up his helm', () => {
    const v = ion(startI(UNFIT));
    const s = playI(startI(UNFIT), ['hail Captain Brack', 'close the channel', 'Doctor, how does Brack sound?', through(calmOf(v, 0)), through(calmOf(v, 1)), 'tractor beam on the Saffron Mule', through(calmOf(v, 2))]);
    expect(s.flags.steadyAtMaw).toBe(true);
    expect(s.outcome?.id).toBe('steady-hand');
  });

  it('with his consent, the Halcyon flies his hauler from her own helm', () => {
    const s = playI(startI(UNFIT), ['hail Captain Brack', 'close the channel', 'Doctor, how does Brack sound?', 'hail Captain Brack', 'Captain, are you fit to fly the Maw?', 'close the channel', 'fly the Saffron Mule from our helm']);
    expect(s.characters.brack.memory.remote).toBe(1);
  });

  it('shields over the haulers halve what they take on and load it onto the Halcyon', () => {
    const v = ion(startI(UNFIT));
    const plain = playI(startI(UNFIT), [through(roughOf(v, 0))]);
    const shielded = playI(startI(UNFIT), ['spread our shields over the haulers', through(roughOf(v, 0))]);
    expect(charge(shielded, 'gannet')).toBeLessThan(charge(plain, 'gannet'));
    expect(shielded.counters.chargeH).toBeGreaterThan(plain.counters.chargeH);
  });

  it('close formation in our wake softens rough water; bleeding the charge lowers it', () => {
    const v = ion(startI(UNFIT));
    const plain = playI(startI(UNFIT), [through(roughOf(v, 0))]);
    const wake = playI(startI(UNFIT), ['have the haulers close up in our wake', through(roughOf(v, 0))]);
    expect(charge(wake, 'gannet')).toBeLessThan(charge(plain, 'gannet'));
    const bled = playI(plain, ['Chief, bleed the charge off the haulers']);
    expect(charge(bled, 'gannet')).toBeLessThan(charge(plain, 'gannet'));
    expect(bled.flags.discharged).toBe(true);
  });
});

describe('crew refusals and force', () => {
  it('Tactical will not fire on a civilian hauler', () => {
    const s = playI(startI(3), ['lock weapons on the Saffron Mule', 'fire on the Saffron Mule']);
    expect(s.ships.kestrel.destroyed).toBe(false);
    expect(s.ships.kestrel.hull).toBe(100);
    expect(logText(s)).toMatch(/Rask: Captain, those are unarmed haulers we're here to escort\. I won't fire on them\./);
  });
});

describe('fuzz', () => {
  const POOL = [
    'wait', 'status', 'options', 'objectives', 'scan the area', 'scan the Saffron Mule', "scan Gannet's Luck", 'scan our ship', 'Varga, what does the model say?', 'Adeyemi, what does your gut say?',
    'Adeyemi, which channel?', 'I trust your gut.', 'go with your gut', 'go with the model', 'your call', 'take the channel the probe says', 'send a probe down the high channel', 'send a probe down the low channel',
    'fire a torpedo down the low channel', 'take us through the high channel', 'take us through the low channel', 'go', 'cross now', 'hail Captain Brack', 'hail Captain Teague', 'close the channel',
    'Which channel would you take?', 'Captain, are you fit to fly the Maw?', 'Will you hand the helm to your mate?', 'Stay with us, Captain. Not yet.', 'Doctor, how do the masters sound?', 'Doctor, how does Brack sound?',
    'fly the Saffron Mule from our helm', "fly Gannet's Luck from our helm", 'tractor beam on the Saffron Mule', "tractor beam on Gannet's Luck", 'release the tractor beam', 'spread our shields over the haulers', 'lower shields',
    'have the haulers close up in our wake', 'Chief, bleed the charge off the haulers', 'Chief, how much charge are we carrying?', 'take the crew off', 'Turn the convoy back.', 'get us out of here', 'red alert',
    'lock weapons on the Saffron Mule', 'fire on the Saffron Mule', 'why?', 'gibberish flarp', 'full stop', 'Marrow, what do you think?', 'Szabo, how do they sound?',
  ];
  it("random orders on random seeds keep every invariant and never leak another scenario's names", () => {
    const rng = createRng(2026);
    const endings = new Set<string>();
    for (let game = 0; game < Number(process.env.FUZZ_GAMES ?? 60); game++) {
      let s = startI(rng.int(1, 100000));
      for (let i = 0; i < 60 && !s.outcome; i++) {
        const c = POOL[rng.int(0, POOL.length - 1)];
        s = submit(ION, s, c);
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
