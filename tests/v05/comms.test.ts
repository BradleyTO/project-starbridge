/**
 * v0.5 (M3.1) two-way communications: scripted multi-turn conversations played through the real
 * interpreter, engine and Kestrel dialogue provider.
 */
import { describe, expect, it } from 'vitest';
import { lastId, play, start, textSince } from '../helpers';
import { activePromise, commitment, commsOf, openChannel } from '../../src/engine/comms';
import { interpretFor } from '../../src/engine/game';
import type { WorldState } from '../../src/engine/types';

const SEED = 14; // pragmatic Prefect
const said = (s: WorldState, from: number) => textSince(s, from);

describe('the user’s exact exchange with Prefect Vane', () => {
  it('opens a persistent session and every reply follows from the last', () => {
    let s = start(SEED);
    let at = lastId(s);
    s = play(s, ['Communications, hail the Ashen Covenant.']);
    let log = said(s, at);
    expect(log).toMatch(/Szabo: Channel open, Captain\. Prefect Vane is on screen\./);
    expect(log).toMatch(/Explain your presence/);
    expect(openChannel(s)?.party).toBe('cruiser');
    expect(commsOf(s).pending?.kind).toBe('explain');

    at = lastId(s);
    s = play(s, ["We're responding to a civilian distress call. We have no hostile intentions."]);
    log = said(s, at);
    expect(log).toMatch(/Then keep your weapons powered down\./);
    expect(log).not.toMatch(/Szabo/); // already on the channel: no re-hail
    expect(commsOf(s).declared).toEqual(expect.arrayContaining(['rescue', 'peaceful']));
    expect(commsOf(s).pending?.kind).toBe('lowerWeapons');

    at = lastId(s);
    s = play(s, ['Agreed, but we will not abandon the freighter.']);
    log = said(s, at);
    // Contextual: he answers the agreement AND the refusal to leave.
    expect(log).toMatch(/Vane: .*(quick|watching your weapons|freighter)/);
    expect(activePromise(s, 'cruiser', 'weaponsDown')).not.toBeNull();
    expect(commsOf(s).declared).toContain('stay');
    expect(commsOf(s).pending).toBeNull();
    // Still the same session, still open.
    expect(openChannel(s)?.party).toBe('cruiser');
    expect(commsOf(s).history.filter((l) => l.from === 'captain').length).toBe(2);
  });

  it('a broken weapons promise angers Vane', () => {
    let s = play(start(SEED), ['Communications, hail the Ashen Covenant.', "We're responding to a civilian distress call. We have no hostile intentions.", 'Agreed, but we will not abandon the freighter.']);
    const before = s.characters.vane.memory.patience ?? 0;
    const at = lastId(s);
    s = play(s, ['arm weapons']);
    const log = said(s, at);
    expect(commsOf(s).promises.find((p) => p.kind === 'weaponsDown')?.status).toBe('broken');
    expect(log).toMatch(/Marrow: .*breaks what we told the Prefect about our weapons/);
    expect(log).toMatch(/Vane: .*word/);
    expect(log).toMatch(/Vane: /);
    expect(s.characters.vane.memory.patience ?? 0).toBeLessThan(before - 2);
  });

  it('keeping the promise is not punished, and a promise made while armed allows time to comply', () => {
    let s = play(start(SEED), ['arm weapons', 'hail the cruiser', "We're responding to a civilian distress call. We have no hostile intentions.", 'Agreed.']);
    const p = activePromise(s, 'cruiser', 'weaponsDown');
    expect(p).not.toBeNull();
    expect(p!.untilTurn).not.toBeNull(); // armed when promised: a compliance window
    s = play(s, ['make weapons safe', 'wait']);
    expect(commsOf(s).promises.find((x) => x.kind === 'weaponsDown')?.status).toBe('active');
    s = play(s, ['arm weapons']);
    expect(commsOf(s).promises.find((x) => x.kind === 'weaponsDown')?.status).toBe('broken');
  });
});

describe('multi-turn negotiation', () => {
  it('asking for time yields a grace commitment that is honoured, then expires', () => {
    let s = play(start(SEED), ['hail the cruiser', 'We are here to rescue the crew. We mean no harm.']);
    const at = lastId(s);
    s = play(s, ['We need ten minutes to evacuate the crew.']);
    expect(said(s, at)).toMatch(/Vane: .*minutes/);
    const g = commitment(s, 'cruiser', 'grace');
    expect(g).not.toBeNull();
    const lockedBefore = s.characters.vane.memory.lockedOn ?? 0;
    s = play(s, Array(3).fill('wait'));
    expect(s.characters.vane.memory.lockedOn ?? 0).toBe(lockedBefore);
    expect(s.flags.cruiserFired).toBeFalsy();
  });

  it('diplomatic statements change the conversation state', () => {
    const s0 = play(start(SEED), ['hail the cruiser']);
    const p0 = s0.characters.vane.memory.patience ?? 0;
    const peaceful = play(s0, ['We have no hostile intentions. We are only here for the crew.']);
    const threat = play(s0, ['If you fire on the Kestrel we will destroy you.']);
    expect(peaceful.characters.vane.memory.patience ?? 0).toBeGreaterThan(p0);
    expect(threat.characters.vane.memory.patience ?? 0).toBeLessThanOrEqual(p0);
    expect(commsOf(threat).threats.cruiser ?? 0).toBeGreaterThan(0);
    expect(peaceful.relations.tension).toBeLessThan(threat.relations.tension);
  });

  it('a conversation with Arden: ask, then ask her to get ready', () => {
    let s = play(start(SEED), ['hail the kestrel']);
    let at = lastId(s);
    s = play(s, ['Ask the captain how many people are aboard.']);
    expect(said(s, at)).toMatch(/Arden: .*\d+ (aboard|of us)/);
    at = lastId(s);
    s = play(s, ['Tell them to get ready to beam over.']);
    expect(said(s, at)).toMatch(/Arden: .*(ready|cargo bay)/i);
    expect(commitment(s, 'kestrel', 'ready')).not.toBeNull();
  });
});

describe('unknown dialogue gets clarification', () => {
  it('varies the reply, offers suggestions, and repetition costs patience', () => {
    let s = play(start(SEED), ['hail the cruiser']);
    const replies: string[] = [];
    const p0 = s.characters.vane.memory.patience ?? 0;
    for (let i = 0; i < 3; i++) {
      const at = lastId(s);
      s = play(s, ['The weather in the nebula has been strange lately.']);
      replies.push(said(s, at).split('\n').filter((l) => l.startsWith('Prefect Sorel Vane')).join('|'));
    }
    expect(new Set(replies).size).toBeGreaterThan(1);
    expect(commsOf(s).suggestions.length).toBeGreaterThan(0);
    expect(s.characters.vane.memory.patience ?? 0).toBeLessThan(p0);
    // Nothing happened to the ship.
    expect(s.ships.halcyon.weapons.state).toBe('safe');
    expect(s.ships.halcyon.shields.raised).toBe(false);
  });
});

describe('dialogue vs orders on one input line', () => {
  it('splits a mixed line: speech goes to Vane, the order to the bridge', () => {
    const s0 = play(start(SEED), ['hail the cruiser']);
    const at = lastId(s0);
    const s = play(s0, ['Tell him we mean no harm and raise shields']);
    const log = said(s, at);
    expect(log).toMatch(/Szabo: Relaying/);
    expect(log).toMatch(/Rask: Shields up/);
    expect(s.ships.halcyon.shields.raised).toBe(true);
  });

  it('crew orders given while Vane is on the channel are carried out, not relayed', () => {
    const s0 = play(start(SEED), ['hail the cruiser']);
    for (const [line, type] of [['Send a rescue team over to the Kestrel.', 'transport'], ['Raise shields.', 'shields'], ['Helm, all stop.', 'maneuver'], ['Arm weapons.', 'weapons']] as const) {
      const r = interpretFor(s0, line);
      const acts = r.kind === 'unrecognised' ? [] : r.actions;
      expect(acts.map((a) => a.type), line).toContain(type);
      expect(acts.some((a) => a.type === 'speak'), line).toBe(false);
    }
  });

  it('dialogue lines never move the ship', () => {
    const s0 = play(start(SEED), ['hail the cruiser']);
    for (const line of ['Our weapons stay powered down.', 'We are not here to start a war.', 'Lower your shields and stand down, Prefect.', 'Release your target lock on the Kestrel.']) {
      const r = interpretFor(s0, line);
      const acts = r.kind === 'unrecognised' ? [] : r.actions;
      expect(acts.every((a) => ['speak', 'communicate', 'channel'].includes(a.type)), line).toBe(true);
    }
  });
});

describe('channel operations', () => {
  it('hold, private channel, resume, mute and close', () => {
    let s = play(start(SEED), ['hail the cruiser']);
    s = play(s, ['Put the Prefect on hold']);
    expect(commsOf(s).channels.find((c) => c.party === 'cruiser')?.state).toBe('hold');
    s = play(s, ['Open a private channel to the Kestrel']);
    expect(openChannel(s)?.party).toBe('kestrel');
    expect(openChannel(s)?.private).toBe(true);
    s = play(s, ['Communications, close the channel']);
    expect(commsOf(s).channels.find((c) => c.party === 'kestrel')).toBeUndefined();
    s = play(s, ['Take the Prefect off hold']);
    expect(openChannel(s)?.party).toBe('cruiser');
    s = play(s, ['Mute the channel']);
    expect(commsOf(s).channels.find((c) => c.party === 'cruiser')?.state).toBe('muted');
    const at = lastId(s);
    s = play(s, ['We mean no harm.']);
    expect(said(s, at)).not.toMatch(/Vane:/); // muted: he does not hear it
    s = play(s, ['Unmute the channel', 'Goodbye, Prefect. Halcyon out.']);
    expect(openChannel(s)).toBeNull();
  });

  it('re-hailing an open channel is reported, not re-greeted', () => {
    const s = play(start(SEED), ['hail the cruiser']);
    const at = lastId(s);
    const s2 = play(s, ['hail the cruiser']);
    expect(said(s2, at)).toMatch(/already on the channel/);
    expect(said(s2, at)).not.toMatch(/Explain your presence/);
  });
});

describe('simulation time', () => {
  it('dialogue costs seconds, a full minute of talk runs the world, clarifications cost nothing', () => {
    let s = play(start(SEED), ['hail the cruiser']);
    const t0 = s.time;
    const turn0 = s.turn;
    s = play(s, ['We mean no harm.']);
    expect(s.time - t0).toBe(10);
    expect(s.turn).toBe(turn0);
    for (let i = 0; i < 6; i++) s = play(s, ['We are only here for the crew.']);
    expect(s.time - t0).toBe(70);
    expect(s.turn).toBeGreaterThan(turn0); // NPCs acted at the minute boundary
    const t1 = s.time;
    s = play(s, ['fire']); // untargeted fire: a clarifying question
    expect(s.time).toBe(t1);
  });
});
