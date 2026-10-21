import { CONDUCT_LABEL, TIER_LABEL } from '../../evaluation/evaluate';
import { competencyLabel } from '../../evaluation/competencies';
import type { Evaluation, Finding } from '../../evaluation/types';
import { CitationLink } from './HandbookPanel';

const RESULT: Record<Evaluation['objectives'][number]['result'], string> = { achieved: 'Achieved', missed: 'Not achieved', failed: 'Failed' };
const JUDGMENT: Record<string, string> = { responsible: 'Responsible', reckless: 'Reckless', principled: 'Principled', decisive: 'Decisive' };

function List({ items, testid }: { items: Finding[]; testid: string }) {
  return (
    <ul className="aar-list" data-testid={testid}>
      {items.map((f, i) => (
        <li key={i}>{f.text}</li>
      ))}
    </ul>
  );
}

/**
 * v0.7: the formal after-action report. Judges outcomes and judgment, not command sequences.
 * No score and no percentages: findings in words, with the evidence from the run.
 */
export function AfterActionReport({ e, captain, onClose, onCite }: { e: Evaluation; captain: string; onClose?(): void; /** v0.8.0: open a cited regulation in the handbook. */ onCite?(id: string): void }) {
  const date = e.atIso.slice(0, 10);
  const strengths = e.competencies.filter((c) => c.sign === 'strength');
  const concerns = e.competencies.filter((c) => c.sign === 'concern');
  return (
    <article className="aar" data-testid="aar" data-outcome={e.outcome.id} data-conduct={e.conduct}>
      <header className="aar-head">
        <p className="ceremony-header">ISA TRAINING COMMAND · AFTER-ACTION REPORT{e.source === 'canonical' ? ' · ACTIVE DUTY' : ' · SIMULATION'}</p>
        <h3>{e.title}</h3>
        <p className="muted small">
          Commanding officer: <span data-testid="aar-captain">{captain}</span> · ISV Halcyon · {date} · {e.source === 'simulation' ? 'Training exercise: not canon' : 'Canonical service record'}
        </p>
        {onClose && <button className="btn ghost" onClick={onClose} data-testid="aar-close">Close report</button>}
      </header>
      <section>
        <h4>Outcome</h4>
        <p>
          <strong>{e.outcome.title}</strong> · {TIER_LABEL[e.outcome.tier]} · Conduct: <strong data-testid="aar-conduct">{CONDUCT_LABEL[e.conduct]}</strong>
        </p>
        <p className="small">{e.outcome.summary}</p>
        {e.outcome.note && <p className="muted small">{e.outcome.note}</p>}
        {e.principled && <p className="notice small" data-testid="aar-principled">{e.principled}</p>}
      </section>
      <section>
        <h4>Objectives</h4>
        <ul className="aar-list" data-testid="aar-objectives">
          {e.objectives.map((o) => (
            <li key={o.id} data-result={o.result}>
              <span className={`tag ${o.result === 'achieved' ? 'ev-resolved' : 'ev-failed'}`}>{RESULT[o.result]}</span> {o.text} <span className="muted small">({o.priority})</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h4>Key decisions</h4>
        {e.decisions.length === 0 ? (
          <p className="muted small">No decision changed the situation.</p>
        ) : (
          <ul className="aar-list" data-testid="aar-decisions">
            {e.decisions.map((d, i) => (
              <li key={i}>
                <span className="muted small">Minute {d.turn}</span> “{d.order}”: {d.effect}
                {d.judgment && <span className={`tag judg-${d.judgment}`}> {JUDGMENT[d.judgment]}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="aar-grid">
        <div>
          <h4>Crew safety</h4>
          <List items={e.crewSafety} testid="aar-crew" />
        </div>
        <div>
          <h4>Civilian safety</h4>
          <List items={e.civilianSafety} testid="aar-civilians" />
        </div>
      </section>
      <section>
        <h4>ISA regulations</h4>
        <ul className="aar-list" data-testid="aar-regulations">
          {e.regulations.map((r) => (
            <li key={r.id}>
              <CitationLink id={r.id} onOpen={onCite}><strong>{r.title}</strong></CitationLink>: {r.applied}
            </li>
          ))}
        </ul>
      </section>
      <section className="aar-grid">
        <div>
          <h4>Strengths</h4>
          <List items={e.strengths} testid="aar-strengths" />
        </div>
        <div>
          <h4>Areas to improve</h4>
          <List items={e.improve} testid="aar-improve" />
        </div>
      </section>
      <section>
        <h4>Recommended training</h4>
        {e.recommended.length ? (
          <ul className="aar-list" data-testid="aar-recommended">
            {e.recommended.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className="muted small" data-testid="aar-recommended">No further training recommended from this exercise.</p>
        )}
      </section>
      <section>
        <h4>Competency record</h4>
        <p className="small" data-testid="aar-competencies">
          {strengths.length ? `Evidence of strength: ${strengths.map((c) => competencyLabel(c.id)).join(', ')}.` : 'No evidence of strength recorded.'} {concerns.length ? `Evidence of concern: ${concerns.map((c) => competencyLabel(c.id)).join(', ')}.` : ''}
        </p>
      </section>
    </article>
  );
}
