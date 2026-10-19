import type { ArchiveEntry } from '../../universe/archive';

export interface ArchiveActions {
  onTrain(id: string): void;
  onReplayOriginal(id: string): void;
  onVariation(id: string): void;
  onReplayEvent?(id: string): void;
  onResume?(id: string): void;
}

const CLASS_LABEL: Record<string, string> = { voluntary: 'Voluntary assignment', distress: 'Distress call', directive: 'Fleet directive (mandatory)' };

export function ArchivePanel({ entries, actions }: { entries: ArchiveEntry[]; actions: ArchiveActions }) {
  const canonical = entries.filter((e) => e.source === 'canonical');
  const training = entries.filter((e) => e.source === 'training');
  return (
    <div className="archive" data-testid="archive">
      <p className="muted small">Every canonical mission you begin is archived here. Replays always run as <strong>simulations</strong>: they never change the canonical record.</p>
      <h3>Canonical missions</h3>
      {canonical.length === 0 && <p className="muted">None yet. Start one from the Living Universe board.</p>}
      <ul className="archive-list">
        {canonical.map((e) => (
          <li key={e.id} className="archive-item canonical" data-testid={`archive-entry-${e.id}`}>
            <div className="archive-head">
              <span className="tag canon">CANONICAL</span>
              {e.classification && <span className="tag">{CLASS_LABEL[e.classification]}</span>}
              <strong>{e.title}</strong>
              <span className="muted small">{e.id}{e.seed !== null ? ` · seed ${e.seed}` : ''}{e.scenarioVersion ? ` · v${e.scenarioVersion}` : ''}</span>
            </div>
            {e.canonicalOutcome ? (
              <p className="canon-outcome" data-testid={`archive-outcome-${e.id}`}>
                Original canonical outcome: <strong>{e.canonicalOutcome.title}</strong>. {e.canonicalOutcome.summary}
              </p>
            ) : (
              <p className="muted">{e.status === 'active' ? 'In progress: no canonical outcome yet.' : e.blurb}</p>
            )}
            <div className="archive-actions">
              {e.status === 'active' && e.replay === 'bridge' && actions.onResume && (
                <button className="btn" onClick={() => actions.onResume?.(e.id)} data-testid={`archive-resume-${e.id}`}>Resume canonical</button>
              )}
              {e.replay === 'bridge' ? (
                <>
                  <button className="btn save" onClick={() => actions.onReplayOriginal(e.id)} data-testid={`archive-replay-${e.id}`}>Replay original conditions</button>
                  <button className="btn ghost" onClick={() => actions.onVariation(e.id)} data-testid={`archive-vary-${e.id}`}>New variation</button>
                </>
              ) : (
                actions.onReplayEvent && <button className="btn save" onClick={() => actions.onReplayEvent?.(e.id)} data-testid={`archive-replay-${e.id}`}>Replay in simulator</button>
              )}
            </div>
            <SimRuns entry={e} />
          </li>
        ))}
      </ul>
      <h3>Training missions</h3>
      <ul className="archive-list">
        {training.map((e) => (
          <li key={e.id} className="archive-item" data-testid={`archive-entry-${e.id}`}>
            <div className="archive-head">
              <span className="tag sim">TRAINING</span>
              <strong>{e.title}</strong>
            </div>
            <p className="muted">{e.blurb}</p>
            <div className="archive-actions">
              <button className="btn save" onClick={() => actions.onTrain(e.id)} data-testid={`archive-train-${e.id}`}>Run simulation</button>
            </div>
            <SimRuns entry={e} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimRuns({ entry }: { entry: ArchiveEntry }) {
  const done = entry.simRuns.filter((r) => r.outcome).slice(-5).reverse();
  if (!done.length) return null;
  return (
    <details className="sim-runs">
      <summary>{entry.simRuns.filter((r) => r.outcome).length} simulated outcome(s)</summary>
      <ul data-testid={`archive-sims-${entry.id}`}>
        {done.map((r) => (
          <li key={r.id}>
            <span className="tag sim">SIMULATED</span> {r.outcome!.title} <span className="muted small">({r.conditions === 'original' ? 'original conditions' : r.conditions === 'variation' ? `variation, seed ${r.seed}` : `seed ${r.seed}`})</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
