/** v0.5: a small indicator showing who is on the comms channel and its state. */
export interface ChannelInfo {
  party: string;
  state: 'open' | 'closed' | 'muted' | 'hold';
  private: boolean;
  speaker: string;
  vessel: string;
  held: string[];
}

const LABEL: Record<ChannelInfo['state'], string> = { open: 'CHANNEL OPEN', muted: 'MUTED', hold: 'ON HOLD', closed: 'CLOSED' };

export function ChannelIndicator({ view }: { view: ChannelInfo | null }) {
  if (!view) return null;
  return (
    <div className={`channel-indicator ch-${view.state}`} data-testid="channel-indicator" data-party={view.party} data-state={view.state} role="status" aria-live="polite">
      <span className="ch-dot" aria-hidden="true" />
      <span className="ch-state">{LABEL[view.state]}{view.private ? ' · PRIVATE' : ''}</span>
      <span className="ch-who">{view.speaker} — {view.vessel}</span>
      {view.held.length > 0 && <span className="ch-held">holding: {view.held.join(', ')}</span>}
    </div>
  );
}
