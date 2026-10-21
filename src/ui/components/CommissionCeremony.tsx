import type { CaptainAddress } from '../../engine/types';

/** v0.5: first activation of Active Duty — an in-universe Fleet Command transmission. v0.7: addressed by name. */
export function CommissionCeremony({ onAccept, onLater, captain }: { onAccept(): void; onLater(): void; captain?: CaptainAddress }) {
  return (
    <div className="ceremony-backdrop" role="dialog" aria-modal="true" aria-labelledby="ceremony-title" data-testid="commission">
      <div className="ceremony">
        <p className="ceremony-header">PRIORITY TRANSMISSION · ISA FLEET COMMAND → ISV HALCYON{captain ? ` · ATTN ${captain.formal.toUpperCase()}` : ''}</p>
        <h2 id="ceremony-title">Commission to Active Duty</h2>
        <p className="ceremony-speaker">Admiral Odessa Kaine, ISA Fleet Command</p>
        <blockquote>
          <p data-testid="commission-address">{captain ? `${captain.formal}.` : 'Captain.'} Your training record has been reviewed by ISA Fleet Command, and it has been found sufficient.</p>
          <p>By order of the Intergalactic Space Agency, you are hereby called to active duty in command of the survey cruiser <strong>Halcyon</strong>, assigned to the Tessarine border sector. From this hour, what you do out there is real. It will be recorded, it will be remembered, and the galaxy will go on from it.</p>
          <p>The simulator stays open to you, as it always has. Use it. Then come home and do the work.</p>
          <p>Do you accept the commission?</p>
        </blockquote>
        <div className="ceremony-actions">
          <button className="btn" onClick={onAccept} data-testid="commission-accept" autoFocus>I accept the commission</button>
          <button className="btn ghost" onClick={onLater} data-testid="commission-later">Not yet</button>
        </div>
        <p className="muted small">You can also say “I accept the commission” on the bridge. Development build: Active Duty is a local toggle; there are no payments.</p>
      </div>
    </div>
  );
}
