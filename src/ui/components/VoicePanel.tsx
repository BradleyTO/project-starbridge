import type { Assignment, VoiceInfo } from '../../voice/cast';
import { PITCH_RANGE, RATE_RANGE, usableVoices } from '../../voice/cast';
import type { VoiceProfile } from '../../voice/profiles';
import type { VoiceSettings } from '../voices';
import { withOverride } from '../voices';

interface Props {
  /** Every cast member in priority order. */
  members: VoiceProfile[];
  cast: Record<string, Assignment>;
  voices: VoiceInfo[];
  settings: VoiceSettings;
  supported: boolean;
  onSettings(next: VoiceSettings): void;
  onPreview(key: string): void;
}

const EDITABLE = new Set(['computer', 'marrow', 'rask', 'varga', 'adeyemi', 'szabo', 'okafor', 'osei', 'narrator']);

/** v0.6.1 crew voices: who sounds like what, a preview button each, and saved overrides. */
export function VoicePanel({ members, cast, voices, settings, supported, onSettings, onPreview }: Props) {
  const crew = members.filter((m) => EDITABLE.has(m.key));
  const others = members.filter((m) => m.key.startsWith('npc:') || m.key.startsWith('label:') || m.key === '*');
  const usable = usableVoices(voices, settings.allowNetwork);
  const english = voices.filter((v) => /^en/i.test(v.lang)).length;
  const distinct = new Set(crew.map((m) => cast[m.key]?.voiceURI ?? '<default>')).size;
  return (
    <div className="voice-panel" data-testid="voice-panel">
      <p className="muted small">
        Every officer, the ship's computer and the people on comms speak with their own voice, chosen from the voices this device offers (free, built into the browser; no keys, nothing sent anywhere). With few voices, officers share one and are told apart by pitch and rate. Your changes are saved in this browser.
      </p>
      {!supported && <p className="notice small" data-testid="voice-unsupported">This browser has no speech synthesis, so the crew cannot speak aloud here.</p>}
      <p className="small" data-testid="voice-count" data-usable={usable.length} data-distinct={distinct}>
        {voices.length} voices on this device ({english} English, {usable.length} usable{settings.allowNetwork ? '' : ', on-device only'}). The bridge crew uses {distinct} distinct {distinct === 1 ? 'voice' : 'voices'}.
      </p>
      <label className="row small">
        <input type="checkbox" checked={settings.allowNetwork} onChange={(e) => onSettings({ ...settings, allowNetwork: e.target.checked })} data-testid="voice-allow-network" />
        Also use online voices (Chrome's "Google …" and Edge's "Online" voices are generated in the cloud; off keeps Simulation Mode fully offline)
      </label>
      <h3>Bridge crew</h3>
      <ul className="voice-list">
        {crew.map((m) => {
          const a = cast[m.key];
          const o = settings.overrides[m.key] ?? {};
          return (
            <li key={m.key} className="voice-row" data-testid={`voice-row-${m.key}`} data-voice={a?.voiceURI ?? ''} data-pitch={a?.pitch} data-rate={a?.rate}>
              <div className="voice-who">
                <strong>{m.label}</strong> <span className="muted small">{m.role}</span>
                <div className="small" data-testid={`voice-assigned-${m.key}`}>
                  {a?.voiceName ?? 'Browser default voice'} · pitch {a?.pitch.toFixed(2)} · rate {a?.rate.toFixed(2)}
                  {a && a.shareIndex > 0 ? ' · shared voice, separated by pitch/rate' : ''}
                  {a?.overridden ? ' · your choice' : ''}
                </div>
              </div>
              <div className="voice-controls">
                <select
                  aria-label={`${m.label} voice`}
                  value={o.voiceURI ?? ''}
                  onChange={(e) => onSettings(withOverride(settings, m.key, { voiceURI: e.target.value || undefined }))}
                  data-testid={`voice-select-${m.key}`}
                >
                  <option value="">Automatic</option>
                  {usable.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                  ))}
                </select>
                <label className="small">
                  Pitch
                  <input type="range" min={PITCH_RANGE[0]} max={PITCH_RANGE[1]} step={0.05} value={a?.pitch ?? 1} onChange={(e) => onSettings(withOverride(settings, m.key, { pitch: Number(e.target.value) }))} data-testid={`voice-pitch-${m.key}`} />
                </label>
                <label className="small">
                  Rate
                  <input type="range" min={RATE_RANGE[0]} max={RATE_RANGE[1]} step={0.05} value={a?.rate ?? 1} onChange={(e) => onSettings(withOverride(settings, m.key, { rate: Number(e.target.value) }))} data-testid={`voice-rate-${m.key}`} />
                </label>
                <button className="btn" onClick={() => onPreview(m.key)} disabled={!supported} data-testid={`voice-preview-${m.key}`}>Preview</button>
                {settings.overrides[m.key] && (
                  <button className="btn ghost" onClick={() => onSettings(withOverride(settings, m.key, null))} data-testid={`voice-reset-${m.key}`}>Automatic</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {others.length > 0 && (
        <>
          <h3>On comms</h3>
          <ul className="voice-list">
            {others.map((m) => {
              const a = cast[m.key];
              return (
                <li key={m.key} className="voice-row" data-testid={`voice-row-${m.key === '*' ? 'other' : m.key}`} data-voice={a?.voiceURI ?? ''}>
                  <div className="voice-who">
                    <strong>{m.label}</strong> <span className="muted small">{m.role}</span>
                    <div className="small">{a?.voiceName ?? 'Browser default voice'} · pitch {a?.pitch.toFixed(2)} · rate {a?.rate.toFixed(2)}</div>
                  </div>
                  <div className="voice-controls">
                    <button className="btn" onClick={() => onPreview(m.key)} disabled={!supported} data-testid={`voice-preview-${m.key === '*' ? 'other' : m.key}`}>Preview</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div className="offer-actions">
        <button className="btn ghost" onClick={() => onSettings({ ...settings, overrides: {} })} data-testid="voice-reset-all">Reset all to automatic</button>
      </div>
    </div>
  );
}
