import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { WorldState } from './engine/types';
import type { Interpretation } from './engine/schema';
import { completeIntro, playIntroBeat, processOrders } from './engine/turn';
import { loadGame, peekSave, saveGame } from './engine/persistence';
import { formatMissionClock } from './engine/state';
import { kestrelScenario as scenario } from './scenarios/kestrel';
import { OfflineInterpreter } from './interpreter/parser';
import { contextFrom } from './interpreter/types';
import { contactsView } from './ui/view';
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
const APP_VERSION = '0.2.0';
const interpreter = new OfflineInterpreter();

type Msg =
  | { type: 'beat' }
  | { type: 'skipIntro' }
  | { type: 'orders'; text: string; interp: Interpretation }
  | { type: 'replace'; state: WorldState };

function reducer(s: WorldState, m: Msg): WorldState {
  switch (m.type) {
    case 'beat':
      return playIntroBeat(s, scenario);
    case 'skipIntro':
      return completeIntro(s, scenario);
    case 'orders':
      return processOrders(s, m.text, m.interp, scenario).state;
    case 'replace':
      return m.state;
  }
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}

function initialSeed(): number | string {
  const q = new URLSearchParams(window.location.search).get('seed');
  return q && q.trim() ? q.trim() : randomSeed();
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => scenario.create(initialSeed()));
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [hasSave, setHasSave] = useState(() => {
    const st = safeStorage();
    return st ? peekSave(st) !== null : false;
  });
  const [voiceOn, setVoiceOn] = useState(() => safeStorage()?.getItem(VOICE_KEY) === 'on');
  const lastSpoken = useRef(state.nextLogId - 1);
  const introRunning = state.intro < scenario.intro.length;
  const contacts = useMemo(() => contactsView(state, scenario), [state]);
  const suggestions = useMemo(() => scenario.suggestions(state), [state]);

  // Opening exposition beats on a timer until the intro completes (or is skipped).
  useEffect(() => {
    if (!introRunning) return;
    const id = window.setTimeout(() => dispatch({ type: 'beat' }), state.intro === 0 ? 600 : BEAT_MS);
    return () => window.clearTimeout(id);
  }, [introRunning, state.intro]);

  // Optional spoken crew / comms responses.
  useEffect(() => {
    if (!voiceOn) {
      lastSpoken.current = state.nextLogId - 1;
      return;
    }
    const fresh = state.log.filter((e) => e.id > lastSpoken.current && e.speaker !== 'Captain' && (e.channel === 'crew' || e.channel === 'comms' || e.channel === 'narrative'));
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

  const onCommand = useCallback(async (text: string) => {
    setBusy(true);
    try {
      const interp = await interpreter.interpret(text, contextFrom(stateRef.current));
      dispatch({ type: 'orders', text, interp });
    } finally {
      setBusy(false);
    }
  }, []);

  const reset = (next: WorldState, msg: string) => {
    cancelSpeech();
    dispatch({ type: 'replace', state: next });
    setSession((n) => n + 1);
    flash(msg);
  };
  const onSave = () => {
    const st = safeStorage();
    if (!st) return flash('Local storage unavailable — cannot save.');
    const meta = saveGame(state, st, APP_VERSION);
    setHasSave(true);
    flash(`Saved at turn ${meta.turn} (seed ${meta.seed}).`);
  };
  const onLoad = () => {
    const st = safeStorage();
    const res = st ? loadGame(st) : null;
    if (!res || !res.ok) return flash(res?.ok === false && res.reason === 'legacy' ? 'That save is from an older version and cannot be loaded.' : 'No valid save found.');
    reset(res.state, `Loaded save from turn ${res.meta.turn}.`);
  };
  const confirmLoss = () => state.turn === 0 || state.outcome !== null || window.confirm('Abandon this run? Unsaved progress will be lost.');
  const onRestart = () => {
    if (!confirmLoss()) return;
    reset(scenario.create(state.seed), `Restarted with the same seed (${state.seed}).`);
  };
  const onNewScenario = () => {
    if (!confirmLoss()) return;
    const seed = randomSeed();
    reset(scenario.create(seed), `New scenario — seed ${seed}.`);
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
            <p className="subtitle">{scenario.title}</p>
          </div>
        </div>
        <div className="topbar-status">
          <span className="demo-badge" data-testid="demo-badge" title="Deterministic simulation engine with the offline (rule-based) order interpreter. AI interpretation and narration arrive in Milestone 3.">
            SIMULATION · OFFLINE INTERPRETER
          </span>
          <span className={`alert-pill alert-${state.alert}`} data-testid="alert-level">{state.alert.toUpperCase()} ALERT</span>
          <span className="clock" data-testid="mission-clock">{formatMissionClock(state.time)} · TURN {state.turn}</span>
          <span className="seed" data-testid="seed" title="Scenario seed — the same seed and orders reproduce a run exactly. Add ?seed=N to the URL to choose one.">SEED {state.seed}</span>
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
          <button className="btn restart" onClick={onRestart} data-testid="restart" title="Restart this scenario with the same seed">Restart</button>
          <button className="btn ghost" onClick={onNewScenario} data-testid="new-scenario" title="Start a fresh scenario with a random seed">New</button>
        </nav>
      </header>

      {toast && <div className="toast" role="status" data-testid="toast">{toast}</div>}

      <main className="grid">
        <aside className="col-left">
          <ShipStatus ship={state.ships.halcyon} torpedoes={state.counters.torpedoes ?? 0} targetName={(id) => contacts.find((c) => c.id === id)?.name ?? id} />
          <Objectives objectives={state.objectives} />
        </aside>
        <div className="col-center">
          <Viewscreen state={state} contacts={contacts} />
          {state.outcome && (
            <div className={`outcome ${state.outcome.success ? 'outcome-good' : 'outcome-bad'}`} role="alert" data-testid="outcome">
              <strong>{state.outcome.title}</strong>
              <span>{state.outcome.summary}</span>
              <div className="outcome-actions">
                <button className="btn restart" onClick={() => reset(scenario.create(state.seed), `Restarted with the same seed (${state.seed}).`)}>Same seed</button>
                <button className="btn ghost" onClick={() => { const seed = randomSeed(); reset(scenario.create(seed), `New scenario — seed ${seed}.`); }}>New scenario</button>
              </div>
            </div>
          )}
          <NarrativePanel log={state.log} />
          <CommandInput
            key={session}
            onCommand={onCommand}
            suggestions={suggestions}
            disabled={!!state.outcome}
            busy={busy}
            clarification={state.clarification}
          />
        </div>
        <aside className="col-right">
          <Tactical contacts={contacts} shieldsRaised={state.ships.halcyon.shields.raised} />
          <CommsLog log={state.log} />
        </aside>
      </main>
      <footer className="footer">
        Project Starbridge v{APP_VERSION} · Milestone 2: deterministic simulation · Original fiction and artwork · Typed orders always available; voice where supported.
      </footer>
    </div>
  );
}
