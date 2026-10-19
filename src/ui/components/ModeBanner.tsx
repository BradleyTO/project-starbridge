import type { Timeline } from '../../engine/types';

const CONDITIONS: Record<string, string> = {
  training: 'Training run',
  original: 'Replay of original canonical conditions',
  variation: 'New variation',
};

/** Always-visible statement of which timeline the bridge is in. */
export function ModeBanner({ timeline, conditions, title }: { timeline: Timeline; conditions?: string; title: string }) {
  if (timeline === 'canonical')
    return (
      <div className="mode-banner canonical" data-testid="mode-banner" data-mode="canonical" role="status">
        <strong>CANONICAL · LIVING UNIVERSE</strong>
        <span>{title} · your choices here become permanent history</span>
      </div>
    );
  return (
    <div className="mode-banner simulation" data-testid="mode-banner" data-mode="simulation" role="status">
      <strong>SIMULATION</strong>
      <span>{CONDITIONS[conditions ?? 'training'] ?? 'Simulation'} · {title} · nothing here changes the canonical universe</span>
    </div>
  );
}
