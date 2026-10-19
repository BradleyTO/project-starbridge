import type { Objective } from '../../engine/types';
import { Panel } from './Panel';

const ICON = { active: '◇', complete: '◆', failed: '✕', missed: '–' } as const;

export function Objectives({ objectives }: { objectives: Objective[] }) {
  return (
    <Panel title="Mission Objectives" code="07-332" accent="lilac" testId="objectives">
      {objectives.length === 0 ? (
        <p className="muted">Awaiting mission data…</p>
      ) : (
        <ul className="objectives">
          {objectives.map((o) => (
            <li key={o.id} className={`obj-${o.status}`}>
              <span className="obj-icon" aria-hidden="true">{ICON[o.status]}</span>
              <span>{o.text}</span>
              <span className="obj-status">{o.status}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
