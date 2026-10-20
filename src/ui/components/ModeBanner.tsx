import type { Timeline } from '../../engine/types';

const CONDITIONS: Record<string, string> = {
  training: 'Training run',
  original: 'Replay of original canonical conditions',
  variation: 'New variation',
};

/** Always-visible statement of which timeline the bridge is in. */
const DUTY_BANNER: Record<string, [string, string]> = {
  active: ['BRIDGE · ACTIVE DUTY', 'On station · this is the real ship; what happens out here becomes history'],
  reserve: ['BRIDGE · RESERVE STATUS', 'Inactive duty · career preserved, canonical timeline frozen · simulations unlimited'],
  pending: ['BRIDGE · COMMISSION PENDING', 'Fleet Command is waiting for your answer'],
  simulation: ['BRIDGE · SIMULATION MODE', 'No simulation running · talk to your crew, or ask the computer to begin a simulation'],
};

export function ModeBanner({ timeline, conditions, title, bridge = false, duty = 'simulation' }: { timeline: Timeline; conditions?: string; title: string; bridge?: boolean; duty?: string }) {
  if (bridge) {
    const [head, tail] = DUTY_BANNER[duty] ?? DUTY_BANNER.simulation;
    return (
      <div className={`mode-banner bridge duty-${duty}`} data-testid="mode-banner" data-mode="bridge" data-duty={duty} role="status">
        <strong>{head}</strong>
        <span>{tail}</span>
      </div>
    );
  }
  if (timeline === 'canonical')
    return (
      <div className="mode-banner canonical" data-testid="mode-banner" data-mode="canonical" role="status">
        <strong>CANONICAL · ACTIVE DUTY</strong>
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
