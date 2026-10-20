/**
 * Deterministic event models: how a situation unfolds over canonical time,
 * with or without the Halcyon. Outcomes come from seeded parameters and world
 * conditions (distance, traffic, border tension), never from whether the
 * player "should" have helped.
 */
import { createScenario } from '../scenarios/kestrel/setup';
import { hashSeed } from './hash';

const H = 60;

// ------------------------------------------------------------ hauler mayday --

export interface HaulerParams {
  t0: number;
  crew: number;
  /** Minutes until life support fails. */
  lifeSupport: number;
  /** Minutes until the crew's own repair attempt finishes, and whether it works. */
  repairAt: number;
  repairWorks: boolean;
  /** Minutes until another ship reaches the hauler, and which. */
  otherShipAt: number;
  otherShip: string;
  /** Halcyon transit time when responding. */
  transit: number;
  /** Crew who reach escape pods if the hull fails. */
  podSurvivors: number;
}

const OTHER_SHIPS = ['Tessarine freighter Ondine', 'Agency SAR cutter Wren', 'mining tug Halberd'];

export function haulerParams(seed: number, t0: number, tension: number): HaulerParams {
  const h = (k: string) => hashSeed(seed, k);
  const traffic = tension >= 50 ? 12 * H : 0; // a tense border keeps traffic away
  return {
    t0,
    crew: 9,
    lifeSupport: (14 + (h('ls') % 17)) * H,
    repairAt: (10 + (h('rep') % 30)) * H,
    repairWorks: h('repok') % 3 === 0,
    otherShipAt: (8 + (h('oth') % 22)) * H + traffic,
    otherShip: OTHER_SHIPS[h('who') % OTHER_SHIPS.length],
    transit: 3 * H,
    podSurvivors: 5 + (h('pods') % 5),
  };
}

export interface Stage {
  at: number;
  kind: 'worsening' | 'rescued-halcyon' | 'rescued-other' | 'self-repaired' | 'lost';
  text: string;
  final: boolean;
}

/** The full timeline of the mayday, given when (if ever) the Halcyon responded. */
export function haulerTimeline(p: HaulerParams, respondedAt: number | null): Stage[] {
  const loss = p.t0 + p.lifeSupport;
  const candidates: Stage[] = [{ at: loss, kind: 'lost', final: true, text: `The Tamsin Grey's life support failed and the hull let go. ${p.podSurvivors} of ${p.crew} crew reached escape pods; they were picked up later by the ${p.otherShip}.` }];
  candidates.push({ at: p.t0 + p.otherShipAt, kind: 'rescued-other', final: true, text: `The ${p.otherShip} reached the Tamsin Grey and took all ${p.crew} crew aboard; the hauler was left adrift.` });
  if (p.repairWorks) candidates.push({ at: p.t0 + p.repairAt, kind: 'self-repaired', final: true, text: `The Tamsin Grey's crew patched the breach and restarted one drive; she limped toward Hollin Colony under her own power.` });
  if (respondedAt !== null) candidates.push({ at: respondedAt + p.transit, kind: 'rescued-halcyon', final: true, text: `The Halcyon reached the Tamsin Grey, took all ${p.crew} crew aboard and left a beacon on the hulk.` });
  const final = candidates.sort((a, b) => a.at - b.at || (a.kind === 'rescued-halcyon' ? -1 : 1))[0];
  const stages: Stage[] = [];
  const midpoint = p.t0 + Math.floor(p.lifeSupport / 2);
  if (midpoint < final.at) stages.push({ at: midpoint, kind: 'worsening', final: false, text: 'Tamsin Grey update: the breach is widening; life support at half.' });
  stages.push(final);
  return stages;
}

// ------------------------------------------------------------ survey escort --

export interface EscortParams {
  t0: number;
  stormRisk: number; // 0–99
  duration: number;
}
export function escortParams(seed: number, t0: number): EscortParams {
  return { t0, stormRisk: hashSeed(seed, 'storm') % 100, duration: 8 * H };
}
export function escortOutcome(p: EscortParams, escorted: boolean): Stage {
  const at = p.t0 + p.duration;
  if (escorted) return { at, kind: 'rescued-halcyon', final: true, text: p.stormRisk >= 50 ? 'The Halcyon steered the Lantern around an ion squall; she reached the far side of the Drift intact.' : 'An uneventful escort: the Lantern crossed the Ashfall Drift on schedule.' };
  return p.stormRisk >= 50
    ? { at: at + 6 * H, kind: 'worsening', final: true, text: 'The Lantern went alone, was caught in an ion squall and arrived six hours late with sensor damage. No injuries.' }
    : { at, kind: 'self-repaired', final: true, text: 'The Lantern went alone and crossed the Ashfall Drift without incident.' };
}

// ------------------------------------------- the Kestrel, if nobody answers --

/** What happens to the Kestrel if the Halcyon never arrives (from the scenario's own seeded variant). */
export function kestrelUnattended(seed: number, t0: number): Stage {
  const v = createScenario(seed).variant;
  const at = t0 + 6 * H;
  if (v.temperament === 'hardliner')
    return { at, kind: 'lost', final: true, text: "With no Agency ship in the Reach, the Ashen Covenant forced the Kestrel's hold open. Her reactor breached during the boarding; the Directorate reports recovering a handful of survivors." };
  return { at, kind: 'rescued-other', final: true, text: `With no Agency ship in the Reach, the Ashen Covenant took the Kestrel's crew aboard before her reactor failed. They are held for questioning in Directorate space.` };
}

// ------------------------------------------------- archive replay (simulated) --

export interface EventChoice {
  id: string;
  label: string;
}

export const EVENT_CHOICES: Record<string, EventChoice[]> = {
  'hauler-distress': [
    { id: 'respond-now', label: 'Respond at once' },
    { id: 'respond-6h', label: 'Respond after 6 hours' },
    { id: 'respond-12h', label: 'Respond after 12 hours' },
    { id: 'ignore', label: 'Ignore the call' },
  ],
  'survey-escort': [
    { id: 'escort', label: 'Escort the Lantern' },
    { id: 'decline', label: 'Decline' },
  ],
};

/** Play an archived event's original parameters out under a different choice. Pure: touches no store. */
export function simulateEvent(model: string, params: Readonly<Record<string, number | string | boolean>>, choice: string): Stage {
  if (model === 'hauler-distress') {
    const p = { ...params } as unknown as HaulerParams;
    const delay = choice === 'respond-now' ? 0 : choice === 'respond-6h' ? 6 * H : choice === 'respond-12h' ? 12 * H : null;
    if (choice !== 'ignore' && delay === null) throw new Error(`Unknown choice ${choice}`);
    const tl = haulerTimeline(p, delay === null ? null : p.t0 + delay);
    return tl[tl.length - 1];
  }
  if (model === 'survey-escort') {
    if (choice !== 'escort' && choice !== 'decline') throw new Error(`Unknown choice ${choice}`);
    return escortOutcome({ ...params } as unknown as EscortParams, choice === 'escort');
  }
  throw new Error(`Unknown event model ${model}`);
}
