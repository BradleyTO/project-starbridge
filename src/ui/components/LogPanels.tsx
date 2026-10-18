import { useEffect, useRef } from 'react';
import type { LogEntry } from '../../engine/types';
import { formatMissionClock } from '../../engine/state';
import { Panel } from './Panel';

function useAutoScroll(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dep]);
  return ref;
}

function Entry({ e }: { e: LogEntry }) {
  return (
    <div className={`log-entry ch-${e.channel}`} data-channel={e.channel}>
      <span className="log-time">{formatMissionClock(e.time)}</span>
      <span className="log-speaker">{e.speaker}</span>
      <p className="log-text">{e.text}</p>
    </div>
  );
}

export function NarrativePanel({ log }: { log: LogEntry[] }) {
  const entries = log.filter((e) => e.channel !== 'comms');
  const ref = useAutoScroll(entries.length);
  return (
    <Panel title="Mission Narrative" code="01-001" accent="amber" className="narrative" testId="narrative">
      <div className="log-scroll" ref={ref} aria-live="polite">
        {entries.map((e) => (
          <Entry key={e.id} e={e} />
        ))}
      </div>
    </Panel>
  );
}

export function CommsLog({ log }: { log: LogEntry[] }) {
  const entries = log.filter((e) => e.channel === 'comms');
  const ref = useAutoScroll(entries.length);
  return (
    <Panel title="Communications Log" code="09-554" accent="rose" className="comms" testId="comms">
      <div className="log-scroll" ref={ref}>
        {entries.length === 0 && <p className="muted">No transmissions received.</p>}
        {entries.map((e) => (
          <Entry key={e.id} e={e} />
        ))}
      </div>
    </Panel>
  );
}
