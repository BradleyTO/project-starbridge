import { useEffect, useRef, type ReactNode } from 'react';

export type HubTab = 'universe' | 'archive' | 'record' | 'voices' | 'settings';
const LABELS: Record<HubTab, string> = { universe: 'Active Duty', archive: 'Mission Archive', record: "Captain's Record", voices: 'Crew voices', settings: 'Settings (dev)' };

/** Full-screen bridge overlay holding the mode hub's sections. */
export function Hub({ tab, onTab, onClose, tabs, children, credits }: { tab: HubTab; onTab(t: HubTab): void; onClose(): void; tabs: HubTab[]; children: ReactNode; credits?: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="hub-backdrop" role="dialog" aria-modal="true" aria-label="Command hub" data-testid="hub">
      <div className="hub panel accent-lilac">
        <div className="panel-head">
          <span className="panel-elbow" />
          <h2>Command Hub</h2>
          <span className="panel-rule" />
          {credits}
          <button ref={closeRef} className="btn ghost" onClick={onClose} data-testid="hub-close">Back to bridge</button>
        </div>
        <nav className="hub-tabs" role="tablist">
          {tabs.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => onTab(t)} data-testid={`hub-tab-${t}`}>
              {LABELS[t]}
            </button>
          ))}
        </nav>
        <div className="hub-body">{children}</div>
      </div>
    </div>
  );
}
