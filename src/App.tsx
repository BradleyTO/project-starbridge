import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { gameReducer } from './ui/gameReducer';
import { createInitialState, SCENARIO_TITLE } from './scenarios/kestrel/initialState';
import { DEMO_SUGGESTIONS, OPENING_BEATS } from './scenarios/kestrel/demoScript';
import { loadGame, peekSave, saveGame } from './engine/persistence';
import { formatMissionClock } from './engine/state';
import { Viewscreen } from './ui/components/Viewscreen';
import { ShipStatus } from './ui/components/ShipStatus';
import { Objectives } from './ui/components/Objectives';
import { Tactical } from './ui/components/Tactical';
import { CommsLog, NarrativePanel } from './ui/components/LogPanels';
import { CommandInput } from './ui/components/CommandInput';
import { cancelSpeech, speak, speechSynthesisSupported } from './ui/speech';
import './App.css';

const BEAT_MS = 3500;
const VOICE_KEY = 'starbridge.voice';

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [toast, setToast] = useState('');
  const [hasSave, setHasSave] = useState(() => {
    const st = safeStorage();
    return st ? peekSave(st) !== null : false;
  });
  const [voiceOn, setVoiceOn] = useState(() => safeStorage()?.getItem(VOICE_KEY) === 'on');
  const lastSpoken = useRef(state.nextLogId - 1);
  const introRunning = state.beat < OPENING_BEATS.length;

  // Scripted opening: play beats on a timer until the intro completes.
  useEffect(() => {
    if (!introRunning) return;
    const id = window.setTimeout(() => dispatch({ type: 'beat' }), state.beat === 0 ? 600 : BEAT_MS);
    return () => window.clearTimeout(id);
  }, [introRunning, state.beat]);

  // Optional spoken crew / comms responses.
  useEffect(() => {
    if (!voiceOn) {
      lastSpoken.current = state.nextLogId - 1;
      return;
    }
    const fresh = state.log.filter((e) => e.id > lastSpoken.current && (e.channel === 'crew' || e.channel === 'comms' || e.channel === 'narrative'));
    lastSpoken.current = state.nextLogId - 1;
    for (const e of fresh) speak(e.text);
  }, [state.log, state.nextLogId, voiceOn]);

  const toastTimer = useRef<number | undefined>(undefined);
  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  // Bumped on load/restart so transient input state (e.g. voice notes) resets with the simulation.
  const [session, setSession] = useState(0);

  const onSave = () => {
    const st = safeStorage();
    if (!st) return flash('Local storage unavailable — cannot save.');
    const meta = saveGame(state, st);
    setHasSave(true);
    flash(`Saved at turn ${meta.turn}.`);
  };
  const onLoad = () => {
    const st = safeStorage();
    const res = st ? loadGame(st) : null;
    if (!res) return flash('No valid save found.');
    cancelSpeech();
    dispatch({ type: 'load', state: res.state });
    setSession((n) => n + 1);
    flash(`Loaded save from turn ${res.meta.turn}.`);
  };
  const onRestart = () => {
    if (state.turn > 0 && !window.confirm('Restart the simulation? Unsaved progress will be lost.')) return;
    cancelSpeech();
    dispatch({ type: 'restart' });
    setSession((n) => n + 1);
    flash('Simulation restarted.');
  };
  const toggleVoice = () => {
    const next = !voiceOn;
    if (!next) cancelSpeech();
    setVoiceOn(next);
    safeStorage()?.setItem(VOICE_KEY, next ? 'on' : 'off');
  };

  return (
    <div className={`app alert-${state.alert}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-elbow" aria-hidden="true" />
          <div>
            <h1>STARBRIDGE</h1>
            <p className="subtitle">{SCENARIO_TITLE}</p>
          </div>
        </div>
        <div className="topbar-status">
          <span className="demo-badge" data-testid="demo-badge" title="Milestone 1: deterministic keyword script, not the full simulation">SCRIPTED DEMO</span>
          <span className={`alert-pill alert-${state.alert}`} data-testid="alert-level">{state.alert.toUpperCase()} ALERT</span>
          <span className="clock" data-testid="mission-clock">{formatMissionClock(state.time)} · TURN {state.turn}</span>
        </div>
        <nav className="controls" aria-label="Simulation controls">
          {introRunning && (
            <button className="btn ghost" onClick={() => dispatch({ type: 'skipIntro' })} data-testid="skip-intro">Skip intro</button>
          )}
          <button
            className={`btn ${voiceOn ? 'on' : 'ghost'}`}
            onClick={toggleVoice}
            disabled={!speechSynthesisSupported()}
            aria-pressed={voiceOn}
            data-testid="voice-toggle"
            title={speechSynthesisSupported() ? 'Speak crew and comms responses aloud' : 'Speech synthesis not supported in this browser'}
          >
            Voice {voiceOn ? 'on' : 'off'}
          </button>
          <button className="btn save" onClick={onSave} data-testid="save">Save</button>
          <button className="btn load" onClick={onLoad} disabled={!hasSave} data-testid="load">Load</button>
          <button className="btn restart" onClick={onRestart} data-testid="restart">Restart</button>
        </nav>
      </header>

      {toast && <div className="toast" role="status" data-testid="toast">{toast}</div>}

      <main className="grid">
        <aside className="col-left">
          <ShipStatus ship={state.ship} />
          <Objectives objectives={state.objectives} />
        </aside>
        <div className="col-center">
          <Viewscreen state={state} />
          {state.outcome && (
            <div className="outcome" role="alert" data-testid="outcome">
              <strong>{state.outcome.title}</strong>
              <span>{state.outcome.summary}</span>
              <button className="btn restart" onClick={() => { cancelSpeech(); dispatch({ type: 'restart' }); setSession((n) => n + 1); }}>Run again</button>
            </div>
          )}
          <NarrativePanel log={state.log} />
          <CommandInput key={session} onCommand={(text) => dispatch({ type: 'command', text })} suggestions={DEMO_SUGGESTIONS} disabled={!!state.outcome} />
        </div>
        <aside className="col-right">
          <Tactical contacts={state.contacts} shieldsRaised={state.ship.shieldsRaised} />
          <CommsLog log={state.log} />
        </aside>
      </main>
      <footer className="footer">
        Project Starbridge · Milestone 1 prototype · Original fiction and artwork · Typed orders always available; voice where supported.
      </footer>
    </div>
  );
}
