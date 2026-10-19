/**
 * Random-order fuzzing: many seeds × random sequences of orders drawn from a
 * broad vocabulary. After every order the invariants must hold.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/engine/rng';
import { submit } from '../../src/engine/game';
import { checkInvariants } from '../../src/engine/invariants';
import { K, start } from '../helpers';

const VOCAB = [
  'scan the kestrel', 'scan the cruiser', 'scan the compartment', 'sweep the area', 'hail the cruiser', 'hail the kestrel',
  'tell them this is a humanitarian rescue', 'warn the prefect to back off', 'tell the cruiser our fleet is inbound', 'remind them of the border accords',
  'offer them the cargo', 'offer the prefect the passenger', 'ask arden about the compartment', 'talk to the passenger', 'offer the passenger asylum',
  'approach the kestrel', 'approach the cruiser', 'take us to 10,000 km from the kestrel', 'put us between the cruiser and the kestrel', 'evasive manoeuvres', 'all stop', 'back off',
  'raise shields', 'lower shields', 'red alert', 'yellow alert', 'stand down', 'arm weapons', 'lock on the cruiser', 'fire', 'fire torpedoes', 'fire torpedoes at their weak point', 'hold fire',
  'divert power to shields', 'divert 50% power from tractor to sensors', 'boost engines', 'evacuate the crew', 'beam the passenger aboard', 'send a rescue team', 'send a medical team', 'beam the cargo over',
  'stabilise the kestrel reactor', 'repair the shields', 'repair the engines', 'tractor the kestrel', 'release the tractor beam', 'use the tractor beam as a shield', 'vent plasma',
  'eject the kestrel core', 'extend our shields around the kestrel', 'make a sensor ghost', 'charge the jump drive', 'jump', 'withdraw', 'wait', 'status', 'options', 'scan', 'approach', 'purple elephant',
];

describe('fuzz: invariants hold for random order sequences', () => {
  it('120 random runs × up to 30 orders', () => {
    const endings = new Map<string, number>();
    for (let run = 0; run < 120; run++) {
      const rng = createRng(1000 + run);
      let s = start(run + 1);
      for (let i = 0; i < 30 && !s.outcome; i++) {
        const cmd = s.clarification ? rng.pick(s.clarification.options) : rng.pick(VOCAB);
        s = submit(K, s, cmd);
        const v = checkInvariants(s);
        if (v.length) throw new Error(`seed ${run + 1}, order ${i} "${cmd}": ${v.join('; ')}`);
      }
      endings.set(s.outcome?.id ?? 'ongoing', (endings.get(s.outcome?.id ?? 'ongoing') ?? 0) + 1);
    }
    // Random play reaches a variety of endings.
    expect(endings.size).toBeGreaterThanOrEqual(4);
  });
});
