/** v0.5 (M3.1) Phase D: organic mission delivery and the science exploration system on Active Duty. */
import { describe, expect, it } from 'vitest';
import { submit } from '../../src/engine/game';
import { checkInvariants } from '../../src/engine/invariants';
import { completeIntro } from '../../src/engine/turn';
import type { WorldState } from '../../src/engine/types';
import { bridgeScenario, createBridge } from '../../src/scenarios/bridge';
import { K } from '../helpers';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { localRepository, memoryStorage } from '../../src/universe/repository';
import { QUIET_MIN, pickTraffic, trafficWeights } from '../../src/universe/delivery';
import { contactOutcome } from '../../src/engine/firstContact';
import { seedExploration, uncontacted } from '../../src/universe/exploration';
import { arriveOnBridge, handleDutyRequest, withDuty } from '../../src/dutyBridge';
import type { CanonicalState } from '../../src/universe/types';

const DUTY = new Set(['patrol', 'respond', 'course', 'firstContact']);
const at = (day: number) => new Date(2026, 9, day, 10, 0);

function setup(day = 19, opts: { duty?: boolean } = {}) {
  const NOW = at(day);
  const storage = memoryStorage();
  const u = new Universe({ repo: localRepository(storage, () => defaultLedger(NOW)), appVersion: 'test', scenarios: { [K.id]: K }, now: () => NOW });
  if (opts.duty !== false) {
    u.setActiveDuty(true);
    u.acceptCommission();
  }
  let s: WorldState = arriveOnBridge(u, completeIntro(withDuty(u, createBridge(7)), bridgeScenario));
  const entered: string[] = [];
  const talk = (...cmds: string[]) => {
    for (const c of cmds) {
      const before = s.uiRequest;
      s = submit(bridgeScenario, s, c);
      if (s.uiRequest && s.uiRequest !== before && DUTY.has(s.uiRequest.kind)) {
        const r = handleDutyRequest(u, s, s.uiRequest);
        s = r.state;
        if (r.enter) entered.push(r.enter.title);
      }
      expect(checkInvariants(s), c).toEqual([]);
    }
    return s;
  };
  const mark = () => s.log.length;
  const since = (n: number) => s.log.slice(n).map((e) => `${e.speaker}: ${e.text}`).join('\n');
  return { u, get s() { return s; }, talk, mark, since, entered, storage };
}

const civSystem = (u: Universe, disposition: string) => u.exploration()!.systems.find((x) => x.civ?.disposition === disposition && x.signal !== 'none');

describe('organic delivery: no mission menu', () => {
  it('a Fleet directive is hailed in on arrival; the captain answers by talking', () => {
    const t = setup();
    expect(t.s.duty?.live).toBe(true);
    expect(t.s.duty?.incoming?.classification).toBe('directive');
    expect(t.since(0)).toMatch(/Fleet Command is hailing/);
    expect(t.since(0)).toMatch(/mandatory directive/);
  });

  it('is deterministic for the same canon and differs between careers (not a fixed timer)', () => {
    const run = (day: number) => {
      const t = setup(day);
      t.talk('Request clarification from Fleet Command', 'We refuse the directive, the ship is not fit for duty');
      const seen: string[] = [];
      for (let i = 0; i < 8; i++) {
        t.talk('Continue the patrol');
        const tr = t.u.exploration()!.traffic.at(-1)!;
        seen.push(`${tr.at}:${tr.kind}`);
        if (t.s.duty?.incoming) t.talk('Log it and continue');
      }
      return seen.join(',');
    };
    expect(run(19)).toBe(run(19));
    expect(run(19)).not.toBe(run(20));
  });

  it('has quiet periods: nothing new within the quiet window, and some watches pass with nothing at all', () => {
    const t = setup();
    t.talk('We refuse the directive');
    let quiet = 0;
    for (let i = 0; i < 12; i++) {
      const n = t.mark();
      t.talk('Continue the patrol');
      if (/quiet watch/.test(t.since(n))) quiet++;
      if (t.s.duty?.incoming) t.talk('Log it and continue');
    }
    expect(quiet).toBeGreaterThan(0);
    const traffic = t.u.exploration()!.traffic;
    for (let i = 1; i < traffic.length; i++) if (traffic[i].kind !== 'hail') expect(traffic[i].at - traffic[i - 1].at).toBeGreaterThanOrEqual(QUIET_MIN);
  });

  it('depends on location, ship condition and standing, not only on time', () => {
    const t = setup();
    t.talk('We refuse the directive');
    const c = JSON.parse(JSON.stringify(t.u.canon())) as CanonicalState;
    const distress = (cc: CanonicalState) => trafficWeights(cc).find((w) => w.t?.kind === 'offer' && cc.offers.find((o) => o.id === (w.t as { offerId: string }).offerId)?.classification === 'distress');
    expect(distress(c)?.w).toBeGreaterThan(0);
    // Far from the patrol area, the hauler's mayday does not reach the Halcyon.
    const far = seedExploration(c.seed);
    far.location = far.systems.at(-1)!.id;
    expect(distress({ ...c, exploration: far })).toBeUndefined();
    // Fleet does not ask a damaged ship to volunteer.
    const later = { ...c, clock: c.clock + 12 * 60, ship: { hull: 20, updatedAt: c.clock + 12 * 60 } };
    const fleetAsks = (cc: CanonicalState) => trafficWeights(cc).some((w) => w.t?.kind === 'offer' && cc.offers.find((o) => o.id === (w.t as { offerId: string }).offerId)?.authority === 'fleet-command' && w.w > 0);
    expect(fleetAsks(later)).toBe(false);
    // Standing with the independents shapes colony requests.
    const colony = (cc: CanonicalState) => trafficWeights(cc).find((w) => w.why === 'colony request')?.w;
    expect(colony({ ...c, factions: { ...c.factions, independent: { standing: -50 } } })).toBeLessThan(colony(c)!);
  });

  it('a directive always gets through, quiet window or not', () => {
    const t = setup();
    const c = JSON.parse(JSON.stringify(t.u.canon())) as CanonicalState;
    c.exploration!.delivered = [];
    c.exploration!.lastDeliveryAt = c.clock;
    expect(pickTraffic(c)?.kind).toBe('offer');
  });
});

describe('answering calls on the bridge (credit rules unchanged)', () => {
  it('declining / ignoring is free; accepting spends one credit; questioning a directive gets Fleet’s reply', () => {
    const t = setup();
    const credits = t.u.creditsRemaining();
    let n = t.mark();
    t.talk('Request clarification from Fleet Command');
    expect(t.since(n)).toMatch(/Directive stands/);
    expect(t.u.creditsRemaining()).toBe(credits);
    n = t.mark();
    t.talk('Ignore it');
    expect(t.since(n)).toMatch(/failure to comply/); // a directive is never silently disobeyed
    expect(t.s.duty?.incoming?.classification).toBe('directive');
    t.talk('We refuse the directive, the ship is not fit for duty');
    expect(t.u.canon()!.discipline[0]?.reason).toBe('unfit');
    expect(t.u.creditsRemaining()).toBe(credits);
    const waiting = (): string | undefined => t.s.duty?.incoming?.classification;
    for (let i = 0; i < 6 && waiting() !== 'distress'; i++) {
      t.talk('Continue the patrol');
      if (waiting() && waiting() !== 'distress') t.talk('Decline');
    }
    expect(waiting()).toBe('distress');
    t.talk('Respond to the distress call');
    expect(t.u.creditsRemaining()).toBe(credits - 1);
    expect(t.s.duty?.incoming).toBeNull();
  });

  it('accepting a bridge mission enters the canonical mission', () => {
    const t = setup();
    t.talk('Acknowledged, we are on our way');
    expect(t.entered).toEqual(['The Kestrel Incident']);
  });

  it('a waiting call survives a reload (derived from the canon)', () => {
    const t = setup();
    const again = new Universe({ repo: localRepository(t.storage, () => defaultLedger(at(19))), appVersion: 'test', scenarios: { [K.id]: K }, now: () => at(19) });
    const s = withDuty(again, completeIntro(createBridge(3), bridgeScenario));
    expect(s.duty?.incoming?.offerId).toBe(t.s.duty?.incoming?.offerId);
  });
});

describe('science: civilizations detected but not contacted', () => {
  it('lists three systems on the first day, without revealing what they want', () => {
    const t = setup();
    expect(uncontacted(t.u.exploration() as never)).toHaveLength(3);
    const n = t.mark();
    t.talk("Science, show me the civilizations we've detected but haven't contacted");
    const said = t.since(n);
    expect(said).toMatch(/3 systems show signs of a civilization/);
    expect(said).not.toMatch(/open|cautious|isolationist|guarded|Ossari|Kethren|Lumae|Drassk/);
    expect(JSON.stringify(t.s.survey)).not.toMatch(/disposition/);
  });

  it('a routine science reading can add a fourth', () => {
    const t = setup();
    t.talk('We refuse the directive');
    for (let i = 0; i < 20 && !t.u.exploration()!.traffic.some((x) => x.kind === 'science'); i++) {
      t.talk('Continue the patrol');
      if (t.s.duty?.incoming) t.talk('Log it and continue');
    }
    expect(t.u.exploration()!.traffic.some((x) => x.kind === 'science')).toBe(true);
    expect(uncontacted(t.u.exploration() as never)).toHaveLength(4);
  });

  it('investigation end to end: course (one credit), arrival, hail, multi-turn first contact, canonical record', () => {
    const t = setup();
    t.talk('We refuse the directive');
    const open = civSystem(t.u, 'open')!;
    const credits = t.u.creditsRemaining();
    let n = t.mark();
    t.talk(`Helm, set a course for ${open.name}`);
    expect(t.since(n)).toMatch(/Course laid in/);
    expect(t.since(n)).toMatch(/Confirmed, Captain: the Ossari/);
    expect(t.u.creditsRemaining()).toBe(credits - 1);
    expect(t.s.ships.kestrel.detected).toBe(true);
    n = t.mark();
    t.talk('Hail them');
    expect(t.since(n)).toMatch(/Why\?/);
    expect(t.s.comms?.active).toBe('kestrel');
    n = t.mark();
    t.talk('Who are your people?');
    expect(t.since(n)).toMatch(/We are the Ossari/);
    expect(t.u.exploration()!.systems.find((x) => x.id === open.id)!.contacted).toBe(false);
    n = t.mark();
    t.talk('Blorp the snarfwidget');
    expect(t.since(n)).toMatch(/do not follow|translate|waiting for your purpose/);
    t.talk('We come in peace. We are explorers from the Concord.');
    const sys = t.u.exploration()!.systems.find((x) => x.id === open.id)!;
    expect(sys.contacted).toBe(true);
    expect(sys.outcome).toBe('membership-talks');
    expect(t.u.canon()!.captain.career.at(-1)!.text).toMatch(/First contact with the Ossari/);
    expect(t.u.canon()!.events.some((e) => e.classification === 'exploration' && /First contact/.test(e.title))).toBe(true);
    // Recorded once: talking again changes nothing.
    const rev = t.u.canon()!.revision;
    t.talk('We hope to see you again');
    expect(t.u.canon()!.revision).toBe(rev);
    expect(t.u.recordFirstContact(open.id, 'hostile').ok).toBe(false);
    // The same course again is not charged twice.
    expect(t.u.creditsRemaining()).toBe(credits - 1);
  });

  it('not every civilization wants to join the Concord', () => {
    const peaceful = (['open', 'cautious', 'isolationist', 'guarded'] as const).map((d) => contactOutcome(d, 'peaceful'));
    expect(peaceful.filter((o) => o === 'membership-talks')).toHaveLength(1);
    const t = setup();
    t.talk('We refuse the directive');
    const notOpen = t.u.exploration()!.systems.find((x) => x.civ && x.signal !== 'none' && x.civ.disposition !== 'open')!;
    t.talk(`Set a course for ${notOpen.name}`, 'Hail them', 'We come in peace. We are explorers from the Concord.');
    expect(t.u.exploration()!.systems.find((x) => x.id === notOpen.id)!.outcome).not.toBe('membership-talks');
  });

  it('a threatening approach is recorded as such; Rask will not fire on a civilian station', () => {
    const t = setup();
    t.talk('We refuse the directive');
    const open = civSystem(t.u, 'open')!;
    t.talk(`Take us to ${open.name}`, 'Hail them');
    const n = t.mark();
    t.talk('Tactical, fire on the station');
    expect(t.since(n)).toMatch(/won.t fire|will not fire|people aboard/i);
    expect(t.s.ships.kestrel.hull).toBe(100);
    t.talk('Submit to the Concord or we will destroy you');
    expect(t.u.exploration()!.systems.find((x) => x.id === open.id)!.outcome).toBe('warned-off');
  });

  it('no credits: an investigation waits; the survey keeps', () => {
    const t = setup();
    t.talk('We refuse the directive');
    t.u.configureCredits({ dailyLimit: 0 });
    const open = civSystem(t.u, 'open')!;
    const n = t.mark();
    t.talk(`Set a course for ${open.name}`);
    expect(t.since(n)).toMatch(/allowance is spent/);
    expect(t.u.exploration()!.location).toBe('station');
  });
});

describe('Simulation Mode and reserve bridges never touch the canon', () => {
  it('simulation mode: science, patrol and courses explain Active Duty; no canon is created', () => {
    const t = setup(19, { duty: false });
    expect(t.s.duty?.live).toBe(false);
    const n = t.mark();
    t.talk("Science, show me the civilizations we've detected but haven't contacted", 'Continue the patrol', 'Set a course for Ostrava');
    expect(t.since(n)).toMatch(/generic survey/);
    expect(t.since(n)).toMatch(/training status/);
    expect(t.u.canon()).toBeNull();
  });

  it('reserve status: the canonical timeline stays frozen', () => {
    const t = setup();
    t.talk('We refuse the directive');
    t.u.setActiveDuty(false);
    const rev = t.u.canon()!.revision;
    const s = withDuty(t.u, t.s);
    expect(s.duty?.live).toBe(false);
    expect(t.u.patrol(6).ok).toBe(false);
    expect(t.u.setCourse(t.u.exploration()!.systems[0].id).ok).toBe(false);
    expect(t.u.canon()!.revision).toBe(rev);
  });

  it('a training simulation leaves the survey untouched', () => {
    const t = setup();
    const before = JSON.stringify(t.u.exploration());
    const sim = t.u.startTraining('TRN-kestrel', 5);
    let s = sim.state;
    for (const c of ['hail the kestrel', 'scan the area', 'wait']) s = submit(K, s, c);
    expect(JSON.stringify(t.u.exploration())).toBe(before);
  });
});
