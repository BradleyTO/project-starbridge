/**
 * v0.5 crew autonomy — rules of engagement.
 *
 * Officers refuse orders from the world state, not from ship names: firing on a
 * non-combatant (civilian or friendly hull, or one that has surrendered) with life
 * signs aboard that has not fired on anyone is refused. A warning shot is not
 * refused. Each refusal is recorded with its reasons so "why?" can be answered.
 */
import type { Report, SpeakerRole } from './report';
import { leadOf } from './state';
import { say } from './report';
import type { ShipId, WorldState } from './types';

const CIVILIAN_CLASS = /\b(freighter|civilian|transport|liner|hauler|tender|shuttle|yacht|merchant|colony ship|courier)\b/i;

export interface RoeVerdict {
  refuse: boolean;
  /** Short reason codes (for tests) and the officer's own words for each. */
  codes: string[];
  reasons: string[];
  souls: number;
}

export function lifeSignsAboard(s: WorldState, id: ShipId): number {
  // (The idle bridge reuses the Kestrel world shape but has no hidden passenger.)
  const p = s.scenarioId !== 'bridge' ? leadOf(s, 'passenger') : undefined;
  const extra = p && p.ship === id && p.status !== 'dead' ? 1 : 0;
  return Math.max(0, s.ships[id].souls) + extra;
}

/** Assess an order to lock on or fire at a ship. */
export function assessFire(s: WorldState, target: ShipId, opts: { warning?: boolean } = {}): RoeVerdict {
  const sh = s.ships[target];
  const codes: string[] = [];
  const reasons: string[] = [];
  const souls = lifeSignsAboard(s, target);
  const civilian = sh.faction === 'independent' && CIVILIAN_CLASS.test(sh.classification);
  const friendly = sh.faction === s.ships.halcyon.faction && target !== 'halcyon';
  const surrendered = !!s.flags[`${target}Surrendered`];
  const hasFired = !!s.flags[`${target}Fired`];
  const nonCombatant = civilian || friendly || surrendered;
  if (!nonCombatant || souls <= 0 || hasFired || opts.warning) return { refuse: false, codes, reasons, souls };
  if (civilian) {
    codes.push('civilian');
    reasons.push(`the ${sh.name} is a civilian ${sh.classification.toLowerCase()}, not a warship`);
  }
  if (friendly) {
    codes.push('friendly');
    reasons.push(`the ${sh.name} is one of ours`);
  }
  if (surrendered) {
    codes.push('surrendered');
    reasons.push(`the ${sh.name} has surrendered`);
  }
  codes.push('lifeSigns');
  reasons.push(`sensors show ${souls} ${souls === 1 ? 'life sign' : 'life signs'} aboard`);
  codes.push('noThreat');
  reasons.push(`she hasn't fired on anyone${sh.weapons.state === 'safe' ? ' and her weapons are cold' : ''}`);
  codes.push('roe');
  reasons.push('our rules of engagement forbid firing on non-combatants who pose no threat');
  return { refuse: true, codes, reasons, souls };
}

export function recordRefusal(s: WorldState, officer: SpeakerRole, order: string, reasons: string[]): WorldState {
  const list = [...(s.refusals ?? []), { officer, turn: s.turn, order, reasons }].slice(-10);
  return { ...s, refusals: list };
}

const OFFICER_WORDS: [RegExp, SpeakerRole][] = [
  [/\b(rask|tactical|weapons)\b/, 'tactical'],
  [/\b(marrow|xo|number one|first officer|commander)\b/, 'xo'],
  [/\b(okafor|engineering|chief)\b/, 'engineering'],
  [/\b(varga|science|sensors)\b/, 'sensors'],
  [/\b(szabo|comms|communications)\b/, 'comms'],
  [/\b(adeyemi|helm|navigation)\b/, 'helm'],
  [/\b(osei|doctor|medical)\b/, 'medical'],
];

export function officerFrom(text: string | undefined): SpeakerRole | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();
  return OFFICER_WORDS.find(([re]) => re.test(t))?.[1];
}

/** "Why?" — the most recent refusal (by that officer, if named), explained from its recorded reasons. */
export function explainRefusal(s: WorldState, officer: string | undefined): Report[] {
  const role = officerFrom(officer);
  const all = s.refusals ?? [];
  const r = [...all].reverse().find((x) => !role || x.officer === role);
  if (!r) return [say(role ?? 'xo', 'whyNothing')];
  const list = r.reasons.length > 1 ? `${r.reasons.slice(0, -1).join('; ')}; and ${r.reasons[r.reasons.length - 1]}` : (r.reasons[0] ?? 'it was the right call');
  return [say(r.officer as SpeakerRole, 'whyRefused', { order: r.order, reasons: list, ago: s.turn - r.turn })];
}
