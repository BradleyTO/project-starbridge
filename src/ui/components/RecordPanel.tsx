import { clockLabel } from '../../universe/archive';
import type { DeepReadonly } from '../../universe/freeze';
import type { CanonicalState, FamiliarityMemory, WorldEvent } from '../../universe/types';

const CLASS: Record<WorldEvent['classification'], string> = {
  assignment: 'Voluntary',
  distress: 'Distress',
  directive: 'Directive (mandatory)',
  mission: 'Mission',
  consequence: 'Consequence',
  bulletin: 'Bulletin',
  disciplinary: 'Disciplinary',
};

/** The captain's canonical record, with simulator familiarity kept visibly separate. */
export function RecordPanel({ canon, familiarity }: { canon: DeepReadonly<CanonicalState> | null; familiarity: FamiliarityMemory }) {
  return (
    <div className="record" data-testid="record">
      {!canon ? (
        <p className="muted">The captain's canonical record appears here once you have served in the Living Universe.</p>
      ) : (
        <>
          <h3>Career (canonical)</h3>
          {canon.captain.career.length === 0 && <p className="muted">No canonical service yet.</p>}
          <ul className="career" data-testid="career">
            {canon.captain.career.map((c) => (
              <li key={c.id}><span className="muted small">{clockLabel(c.at)}</span> {c.text}</li>
            ))}
          </ul>
          {canon.discipline.length > 0 && (
            <>
              <h3>Disciplinary reviews</h3>
              <ul className="discipline" data-testid="discipline">
                {canon.discipline.map((d) => (
                  <li key={d.id} data-testid={`discipline-${d.id}`} data-finding={d.finding}>
                    <strong>{d.rule.split(':')[0]}</strong> ({d.trigger}): {d.finding === 'pending' ? `pending; finding due ${clockLabel(d.openedAt + 12 * 60)}` : d.finding === 'no-action' ? 'closed, no action' : 'formal reprimand'}
                    <div className="muted small">{d.rule} Evidence: {d.evidence.join(' ')}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3>World event log (canonical)</h3>
          <ul className="events" data-testid="event-log">
            {canon.events.slice().sort((a, b) => b.updatedAt - a.updatedAt || b.at - a.at).map((e) => (
              <li key={e.id} data-testid={`event-${e.id}`} data-class={e.classification} data-status={e.status}>
                <div>
                  <span className={`tag ev-${e.status}`}>{e.status.toUpperCase()}</span> <span className="tag">{CLASS[e.classification]}</span> <strong>{e.title}</strong>
                  <span className="muted small"> {e.id} · {clockLabel(e.at)} · {e.authority}{e.missionId ? ` · ${e.missionId}` : ''}{e.links.length ? ` · links ${e.links.join(', ')}` : ''}</span>
                </div>
                <div className="small">{e.summary}</div>
                {e.decisions.length > 0 && <div className="small">Decisions: {e.decisions.join(' ')}</div>}
                {e.consequences.length > 0 && <div className="small">Consequences: {e.consequences.join(' ')}</div>}
              </li>
            ))}
          </ul>
          <h3>Crew: canonical experience</h3>
          {Object.keys(canon.crew).length === 0 && <p className="muted">No canonical missions served together yet.</p>}
          <ul className="crew-exp" data-testid="crew-experience">
            {Object.values(canon.crew).map((x) => (
              <li key={x.id} data-testid={`crew-${x.id}`} data-status={x.status}>
                <strong>{x.name}</strong> <span className="muted small">{x.role} · {x.status} · trust {x.trust} · {x.missions.length} mission(s)</span>
                {x.experiences.length > 0 && <div className="small">{x.experiences[x.experiences.length - 1].text}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
      <h3>Simulator familiarity <span className="tag sim">NOT CANONICAL</span></h3>
      <p className="muted small">Training memory shared by both modes: how you phrase orders and what the crew has drilled. Simulated events are never history; nobody lost in a simulation is dead.</p>
      <ul className="familiarity" data-testid="familiarity">
        <li>Simulation runs: {familiarity.training.simRuns}</li>
        <li>Drilled manoeuvres: {Object.entries(familiarity.training.drilled).map(([k, v]) => `${k} ×${v}`).join(', ') || 'none yet'}</li>
        <li>Learned phrases: {Object.keys(familiarity.aliases).length ? Object.entries(familiarity.aliases).map(([k, v]) => `"${k}" → "${v}"`).join('; ') : 'none'}</li>
        <li>Simulated casualties (training only): {familiarity.training.simulatedCasualties}</li>
      </ul>
    </div>
  );
}
