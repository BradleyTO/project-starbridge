/**
 * v0.7 after-action evaluation. A pure function of the final WorldState and the scenario's
 * optional descriptor. It sits beside detectOutcome and never changes endings or state.
 * It judges outcomes and judgment, not command sequences, and produces words, not a score.
 */
import type { ScenarioModule } from '../engine/scenario';
import type { WorldState } from '../engine/types';
import { competencyLabel } from './competencies';
import { regulation } from './regulations';
import type { CompetencyEvidence, CompetencyId, Conduct, Evaluation, Finding, Judgment, Marker, Tier } from './types';

export interface EvaluateOptions {
  id: string;
  source: 'simulation' | 'canonical';
  refId: string;
  atIso: string;
  /** Other simulations and the competencies they exercise (for recommendations). */
  catalogue?: { title: string; scenarioId: string; competencies: CompetencyId[] }[];
}

/** The turn on which a flag was first set (from the trace), or null. */
export function flagTurn(s: WorldState, flag: string): number | null {
  const o = s.trace?.orders.find((x) => x.flags.includes(flag));
  return o ? o.turn : s.flags[flag] ? Number.POSITIVE_INFINITY : null;
}

/** The turn a fact became known, or null. */
export function factTurn(s: WorldState, id: string): number | null {
  const f = s.facts[id];
  return f?.known ? (f.discoveredTurn ?? 0) : null;
}

/** Did any other ship threaten (arm, lock, fire) during the run? */
function hostilePresent(s: WorldState): boolean {
  const playerFlags = new Set(['shotsFired', 'lockedOnCruiser']);
  const flagged = Object.keys(s.flags).some((f) => s.flags[f] && !playerFlags.has(f) && /(Fired|Locked[A-Z]\w*)$/.test(f));
  const armed = Object.values(s.ships).some((x) => x.id !== 'halcyon' && !x.destroyed && x.weapons.state !== 'safe');
  return flagged || armed;
}

interface Signal {
  id: string;
  judgment: Judgment;
  competencies: CompetencyId[];
  text: string;
  regulation?: string;
  safety?: 'crew' | 'civilian';
  flag?: string;
}

/** Judgment signals every scenario shares (the engine's own rules: ROE, promises, safety). */
function sharedSignals(s: WorldState): Signal[] {
  const out: Signal[] = [];
  const t = s.trace;
  const fired = !!s.flags.shotsFired;
  if (fired && (t?.firstShot === 'halcyon' || t?.firstShot === 'both' || (!t && !hostilePresent(s)))) {
    out.push({ id: 'fired-first', judgment: 'reckless', competencies: ['tactical', 'ethics'], text: 'The Halcyon opened fire first, while other means remained.', regulation: 'roe-2', flag: 'shotsFired' });
  } else if (fired && t?.firstShot === 'other') {
    out.push({ id: 'returned-fire', judgment: 'responsible', competencies: ['tactical'], text: 'The Halcyon fired only after being fired upon.', regulation: 'roe-2', flag: 'shotsFired' });
  } else if (!fired && hostilePresent(s)) {
    out.push({ id: 'held-fire', judgment: 'responsible', competencies: ['tactical', 'ethics'], text: 'Held fire under threat; no shot was fired by the Halcyon.', regulation: 'roe-2' });
  }
  if (s.flags.lockedOnCruiser && t?.firstShot !== 'other') out.push({ id: 'weapons-lock', judgment: 'reckless', competencies: ['tactical', 'diplomacy'], text: 'Locked weapons on the other ship as a threat, escalating the dispute.', regulation: 'roe-2', flag: 'lockedOnCruiser' });
  const ncRefusals = (s.refusals ?? []).filter((r) => r.reasons.some((x) => /non-combatant/i.test(x)));
  if (ncRefusals.length) out.push({ id: 'ordered-fire-noncombatant', judgment: 'reckless', competencies: ['ethics', 'crew'], text: `Ordered fire on non-combatants; ${ncRefusals[0].officer === 'tactical' ? 'Tactical' : 'the officer'} refused under the Rules of Engagement.`, regulation: 'roe-1' });
  if (t && t.exposed.length) out.push({ id: 'shields-down-under-lock', judgment: 'reckless', competencies: ['tactical', 'crew'], text: 'The Halcyon’s shields were down while a hostile weapon was locked on her.', regulation: 'roe-3', safety: 'crew' });
  const promises = s.comms?.promises ?? [];
  const broken = promises.filter((p) => p.status === 'broken');
  const kept = promises.filter((p) => p.status === 'kept');
  if (broken.length) out.push({ id: 'broke-promise', judgment: 'reckless', competencies: ['communications', 'ethics'], text: `Broke ${broken.length === 1 ? 'a commitment' : 'commitments'} made on the record.`, regulation: 'honesty-1' });
  else if (kept.length) out.push({ id: 'kept-promise', judgment: 'responsible', competencies: ['communications', 'ethics'], text: 'Kept every commitment made on the record.', regulation: 'honesty-1' });
  return out;
}

function safetyFindings(s: WorldState): { crew: Finding[]; civilian: Finding[]; crewConcern: boolean; civilianConcern: boolean } {
  const crew: Finding[] = [];
  const civilian: Finding[] = [];
  const h = s.ships.halcyon;
  const ours = Object.values(s.characters).filter((c) => c.ship === 'halcyon' && c.role && !c.id.startsWith('passenger') && c.id !== 'passenger');
  const dead = ours.filter((c) => c.status === 'dead');
  const hurt = ours.filter((c) => c.status === 'injured');
  if (h.destroyed) crew.push({ text: 'The Halcyon was lost with her crew.' });
  else {
    if (dead.length) crew.push({ text: `Lost: ${dead.map((c) => c.name).join(', ')}.` });
    if (hurt.length) crew.push({ text: `Injured: ${hurt.map((c) => c.name).join(', ')}.` });
    const low = s.trace?.minHull ?? h.hull;
    if (low < 50) crew.push({ text: low < 25 ? 'The Halcyon came close to destruction.' : 'The Halcyon was badly damaged.' });
  }
  const crewConcern = crew.length > 0;
  if (!crewConcern) crew.push({ text: 'No Halcyon crew were hurt and the ship came through intact.' });
  const lost = s.counters.kestrelDead ?? 0;
  const other = s.ships.kestrel;
  if (lost > 0) civilian.push({ text: `${lost === 1 ? 'One person' : `${lost} people`} aboard the ${other.name.replace(/^the /i, '')} died.` });
  if (other.destroyed) civilian.push({ text: lost > 0 || other.souls > 0 ? `The ${other.name.replace(/^the /i, '')} was destroyed.` : `The ${other.name.replace(/^the /i, '')} was lost, with no one left aboard.` });
  for (const x of Object.values(s.ships)) {
    if (x.id === 'halcyon' || x.id === 'kestrel' || !x.destroyed) continue;
    civilian.push({ text: `The ${x.name.replace(/^the /i, '')} was destroyed with the people aboard.` });
  }
  const civilianConcern = civilian.length > 0;
  if (!civilianConcern) civilian.push({ text: 'No civilian or third-party lives were lost.' });
  return { crew, civilian, crewConcern, civilianConcern };
}

function safeWhen(m: Marker, s: WorldState): boolean {
  try {
    return !!m.when(s);
  } catch {
    return false;
  }
}

const RECOMMEND: Record<CompetencyId, string> = {
  diplomacy: 'negotiation under pressure: finding what the other side needs',
  tactical: 'rules of engagement and proportionate force',
  scientific: 'establishing the facts before acting',
  engineering: 'improvised technical solutions with the chief engineer',
  emergency: 'command decisions against the clock',
  ethics: 'duty of care and lawful orders',
  crew: 'protecting the crew: containing hazards before sending a team',
  exploration: 'survey and first-contact procedure',
  resources: 'using the ship’s resources creatively',
  communications: 'keeping commitments made on the record',
  analysis: 'reading a situation before committing the ship',
};

export function evaluate(s: WorldState, scenario: ScenarioModule, opts: EvaluateOptions): Evaluation {
  if (!s.outcome) throw new Error('Cannot evaluate a run that has not ended.');
  const d = scenario.evaluation;
  const o = s.outcome;
  const ending = d?.endings[o.id] ?? { tier: (o.success ? 'success' : 'failure') as Tier, note: '' };
  const objectives = s.objectives.map((x) => ({
    id: x.id,
    text: x.text,
    priority: d?.objectives[x.id] ?? 'primary',
    result: x.status === 'complete' ? ('achieved' as const) : x.status === 'failed' ? ('failed' as const) : ('missed' as const),
  }));
  const markers: Signal[] = (d?.markers ?? []).filter((m) => safeWhen(m, s)).map((m) => ({ id: m.id, judgment: m.judgment, competencies: m.competencies, text: m.text, regulation: m.regulation, safety: m.safety, flag: m.flag }));
  // Scenario markers override a shared signal with the same id.
  const signals = [...markers, ...sharedSignals(s).filter((x) => !markers.some((m) => m.id === x.id))];
  const reckless = signals.filter((x) => x.judgment === 'reckless');
  const good = signals.filter((x) => x.judgment !== 'reckless');
  const safety = safetyFindings(s);
  for (const x of signals) {
    const list = x.safety === 'crew' ? safety.crew : x.safety === 'civilian' ? safety.civilian : null;
    if (!list) continue;
    if (x.judgment === 'reckless') list.unshift({ text: x.text });
    else list.push({ text: x.text });
  }
  // Principled: a failure (or partial) reached without recklessness, where the captain upheld the rules.
  const principledMarker = signals.find((x) => x.judgment === 'principled');
  const principled = ending.tier !== 'success' && reckless.length === 0 && principledMarker ? `${principledMarker.text} The outcome is recorded as ${ending.tier === 'failure' ? 'a failure' : 'partial'}; the judgment is recorded as principled.` : undefined;

  const conduct: Conduct = principled
    ? 'principled'
    : reckless.length >= 2 || (reckless.length === 1 && good.length === 0)
      ? 'reckless'
      : reckless.length === 1
        ? 'mixed'
        : ending.tier === 'success' && good.length >= 2
          ? 'exemplary'
          : ending.tier === 'failure' && !markers.some((m) => m.judgment !== 'reckless')
            ? 'insufficient'
            : 'sound';

  // Regulations: the descriptor's frame plus any a signal touched, marked upheld or breached.
  const regIds = [...new Set([...(d?.regulations ?? []), ...signals.map((x) => x.regulation).filter((x): x is string => !!x)])];
  const regulations = regIds.flatMap((id) => {
    const r = regulation(id);
    if (!r) return [];
    const breached = reckless.find((x) => x.regulation === id);
    const upheld = good.find((x) => x.regulation === id);
    return [{ id, title: r.title, applied: breached ? `Breached: ${breached.text}` : upheld ? `Upheld: ${upheld.text}` : `Relevant: ${r.text}` }];
  });

  const strengths: Finding[] = good.map((x) => ({ text: x.text }));
  const achievedPrimary = objectives.filter((x) => x.priority === 'primary' && x.result === 'achieved');
  if (achievedPrimary.length && ending.tier !== 'failure') strengths.push({ text: `Achieved ${achievedPrimary.length === objectives.filter((x) => x.priority === 'primary').length ? 'every primary objective' : 'part of the primary objectives'}.` });
  const improve: Finding[] = reckless.map((x) => ({ text: x.text }));
  const missedPrimary = objectives.filter((x) => x.priority === 'primary' && x.result !== 'achieved');
  for (const m of missedPrimary) improve.push({ text: `Primary objective not achieved: ${m.text}.` });

  // Competency evidence (internal weights, never shown).
  const ev: CompetencyEvidence[] = [];
  const add = (id: CompetencyId, sign: 'strength' | 'concern', weight: 1 | 2 | 3, why: string) => {
    const prev = ev.find((e) => e.id === id && e.sign === sign);
    if (prev) {
      if (weight > prev.weight) Object.assign(prev, { weight, why });
      return;
    }
    ev.push({ id, sign, weight, why });
  };
  for (const x of signals) for (const c of x.competencies) add(c, x.judgment === 'reckless' ? 'concern' : 'strength', x.judgment === 'decisive' || x.judgment === 'principled' ? 3 : 2, x.text);
  const focus = d?.competencies ?? [];
  if (ending.tier === 'success') for (const c of focus.slice(0, 2)) add(c, 'strength', 1, `${o.title}: the exercise was resolved.`);
  if (ending.tier === 'failure' && !principled && focus[0]) add(focus[0], 'concern', 1, `${o.title}: the exercise was not resolved.`);

  const concerns = [...new Set(ev.filter((e) => e.sign === 'concern').map((e) => e.id))];
  const recommended = concerns.slice(0, 3).map((c) => {
    const other = (opts.catalogue ?? []).find((x) => x.scenarioId !== s.scenarioId && x.competencies.includes(c));
    const custom = d?.recommend?.[c];
    return `${competencyLabel(c)}: ${custom ?? RECOMMEND[c]}${other ? ` (for example, ${other.title})` : ''}.`;
  });

  // Key decisions: orders that changed something, with the judgment of any marker tied to them.
  const decisions = (s.trace?.orders ?? [])
    .map((x) => {
      const sig = signals.find((g) => g.flag && x.flags.includes(g.flag));
      const objs = x.objectives.filter((v) => !v.endsWith(':missed')).map((v) => {
        const [id, st] = v.split(':');
        const ob = s.objectives.find((q) => q.id === id);
        return ob ? `${st === 'complete' ? 'objective achieved' : st === 'failed' ? 'objective failed' : 'objective missed'}: ${ob.text}` : '';
      }).filter(Boolean);
      const facts = x.facts.map((f) => s.facts[f]?.text).filter(Boolean) as string[];
      const passive = /^(wait|stand by|hold position|continue)\b/i.test(x.order.trim());
      const flagText = sig ? [sig.text] : [];
      const effect = passive && !sig ? '' : [...flagText, ...objs, ...facts.map((f) => `established: ${f}`)].slice(0, 2).join('; ');
      return { turn: x.turn, order: x.order, effect, ...(sig ? { judgment: sig.judgment } : {}) };
    })
    .filter((x) => x.effect)
    .slice(-10);

  return {
    id: opts.id,
    source: opts.source,
    refId: opts.refId,
    scenarioId: s.scenarioId,
    title: scenario.title,
    seed: s.seed,
    atIso: opts.atIso,
    turns: s.turn,
    outcome: { id: o.id, title: o.title, summary: o.summary, tier: ending.tier, note: ending.note },
    conduct,
    objectives,
    decisions,
    crewSafety: safety.crew,
    civilianSafety: safety.civilian,
    regulations,
    strengths: strengths.length ? strengths : [{ text: 'No particular strengths were shown in this run.' }],
    improve: improve.length ? improve : [{ text: 'No significant concerns in this run.' }],
    recommended,
    competencies: ev,
    ...(principled ? { principled } : {}),
    basis: d ? d.version : 'none',
  };
}

export const CONDUCT_LABEL: Record<Conduct, string> = {
  exemplary: 'Exemplary',
  sound: 'Sound',
  insufficient: 'Insufficient: the situation was not taken in hand',
  mixed: 'Mixed: sound in parts, with a serious lapse',
  reckless: 'Reckless',
  principled: 'Principled',
};

export const TIER_LABEL: Record<Tier, string> = { success: 'Success', partial: 'Partial success', failure: 'Failure' };
