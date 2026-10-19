import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { WorldState } from './engine/types';
import type { Interpretation } from './engine/schema';
import { completeIntro, playIntroBeat, processOrders } from './engine/turn';
import type { Timeline } from './engine/types';
import { loadGame, peekSave, saveGame } from './engine/persistence';
import { formatMissionClock } from './engine/state';
import { kestrelScenario as scenario } from './scenarios/kestrel';
import { OfflineInterpreter } from './interpreter/parser';
import { contextFrom } from './interpreter/types';
import { contactsView, helmView, ordersView } from './ui/view';
import { OrdersStrip } from './ui/components/OrdersStrip';
import { Viewscreen } from './ui/components/Viewscreen';
import { ShipStatus } from './ui/components/ShipStatus';
import { Objectives } from './ui/components/Objectives';
import { Tactical } from './ui/components/Tactical';
import { CommsLog, NarrativePanel } from './ui/components/LogPanels';
import { CommandInput } from './ui/components/CommandInput';
import { cancelSpeech, speak, speechSynthesisSupported } from './ui/speech';
import { useUniverse } from './ui/useUniverse';
import { ModeBanner } from './ui/components/ModeBanner';
import { Hub, type HubTab } from './ui/components/Hub';
import { RecordPanel } from './ui/components/RecordPanel';
import { ArchivePanel } from './ui/components/ArchivePanel';
import { UniversePanel } from './ui/components/UniversePanel';
import { SettingsPanel } from './ui/components/SettingsPanel';
import { TRAINING } from './universe/archive';
import { expandAliases } from './universe/familiarity';
import type { BridgeSession, CanonicalSession } from './universe/sessions';
import './App.css';

const BEAT_MS = 3500;
const VOICE_KEY = 'starbridge.voice';
const APP_VERSION = '0.4.0';
const TRAINING_ID = TRAINING[0].id;
const interpreter = new OfflineInterpreter();

type Msg = { type: 'beat' } | { type: 'skipIntro' } | { type: 'replace'; state: WorldState };

/** What the bridge is currently playing (the WorldState itself lives in the reducer). */
export type SessionMeta =
  | { timeline: 'simulation'; archiveId: string; runId: string; conditions: 'training' | 'original' | 'variation'; title: string }
  | { timeline: 'canonical'; missionId: string; archiveId: string; title: string };

function canonicalOf(m: Extract<SessionMeta, { timeline: 'canonical' }>, state: WorldState): CanonicalSession {
  return { timeline: 'canonical', missionId: m.missionId, archiveId: m.archiveId, scenarioId: state.scenarioId, state };
}

function metaOf(sess: BridgeSession, title: string): SessionMeta {
  return sess.timeline === 'canonical'
    ? { timeline: 'canonical', missionId: sess.missionId, archiveId: sess.missionId, title }
    : { timeline: 'simulation', archiveId: sess.archiveId ?? TRAINING_ID, runId: sess.runId, conditions: sess.conditions, title };
}

function reducer(s: WorldState, m: Msg): WorldState {
  switch (m.type) {
    case 'beat':
      return playIntroBeat(s, scenario);
    case 'skipIntro':
      return completeIntro(s, scenario);
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
  const { universe, rev, touch } = useUniverse(APP_VERSION);
  const [boot] = useState(() => universe.startTraining(TRAINING_ID, initialSeed()));
  const [meta, setMeta] = useState<SessionMeta>(() => metaOf(boot, scenario.title));
  const [state, dispatch] = useReducer(reducer, undefined, () => boot.state);
  const [hubTab, setHubTab] = useState<HubTab | null>(null);
  const timeline: Timeline = meta.timeline;
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
  const helm = useMemo(() => helmView(state), [state]);
  const orders = useMemo(() => ordersView(state), [state]);
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

  const metaRef = useRef(meta);
  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);

  const onCommand = useCallback(
    async (text: string) => {
      setBusy(true);
      try {
        const fam = universe.familiarity();
        const expanded = expandAliases(text, fam.aliases).text;
        const interp: Interpretation = await interpreter.interpret(expanded, contextFrom(stateRef.current));
        const before = stateRef.current;
        const res = processOrders(before, text, interp, scenario);
        dispatch({ type: 'replace', state: res.state });
        stateRef.current = res.state;
        const m = metaRef.current;
        universe.noteCommand(m.timeline, text, res.results);
        // Canonical progress is committed after every order (saving is free).
        if (m.timeline === 'canonical' && !res.state.outcome) universe.saveCanonical(canonicalOf(m, res.state));
        // A finished run is filed: simulations in simulation history, canonical missions through the commit gate.
        if (res.state.outcome && !before.outcome) {
          if (m.timeline === 'simulation') universe.finishSimulation({ timeline: 'simulation', runId: m.runId, archiveId: m.archiveId, conditions: m.conditions, scenarioId: res.state.scenarioId, state: res.state }, res.state);
          else {
            universe.finishCanonical(canonicalOf(m, res.state));
            flash(`Canonical record updated: ${res.state.outcome.title}.`);
          }
          touch();
        }
      } finally {
        setBusy(false);
      }
    },
    [universe, flash, touch],
  );



  const reset = (next: WorldState, msg: string) => {
    cancelSpeech();
    dispatch({ type: 'replace', state: next });
    stateRef.current = next;
    setSession((n) => n + 1);
    flash(msg);
  };
  const enter = (sess: BridgeSession, title: string, msg: string) => {
    setMeta(metaOf(sess, title));
    metaRef.current = metaOf(sess, title);
    reset(sess.state, msg);
    setHubTab(null);
    touch();
  };
  const titleFor = (archiveId: string) => universe.archive().find((e) => e.id === archiveId)?.title ?? scenario.title;
  const archiveActions = {
    onTrain: (id: string) => {
      const seed = randomSeed();
      enter(universe.startTraining(id, seed), titleFor(id), `Training simulation, seed ${seed}.`);
    },
    onReplayOriginal: (id: string) => enter(universe.replayOriginal(id), titleFor(id), 'Simulation: original canonical conditions restored.'),
    onVariation: (id: string) => {
      const seed = randomSeed();
      enter(universe.replayVariation(id, seed), titleFor(id), `Simulation: new variation, seed ${seed}.`);
    },
    onReplayEvent: (id: string, choice: string) => {
      // No touch(): the archive keeps showing this simulated result; history refreshes on next open.
      return universe.simulateEventMission(id, choice);
    },
  };
  const universeActions = {
    onEnable: () => {
      universe.setLivingUniverse(true);
      universe.ensureCanon();
      touch();
      flash('Living Universe enabled (development toggle).');
    },
    onStart: (offerId: string) => {
      const r = universe.startCanonical(offerId);
      if (!r.ok) return flash(r.reason === 'no-credits' ? 'No new canonical missions left today. Simulations are unlimited.' : 'That offer is not available.');
      const m = universe.canon()!.missions[r.missionId];
      if (r.session) enter(r.session, m.title, `Canonical mission begun: ${m.title}.`);
      else {
        touch();
        flash(`${m.title}: ${m.outcome?.title ?? 'under way'}.`);
      }
    },
    onRespond: (offerId: string, response: 'decline' | 'ignore' | 'question' | 'refuse' | 'disobey', reason?: string) => {
      universe.respond(offerId, response, reason);
      touch();
      flash(`Logged: ${response}. No credit used.`);
    },
    onResume: (missionId: string) => enter(universe.resumeCanonical(missionId), universe.canon()!.missions[missionId].title, 'Canonical mission resumed. No credit used.'),
    onAdvance: (hours: number) => {
      const r = universe.advanceTime(hours);
      touch();
      flash(r.ok ? `${hours} hours of canonical time pass.` : 'Canonical time is paused until the allowance resets.');
    },
  };
  const canonical = meta.timeline === 'canonical';
  const luOn = universe.entitlements().livingUniverse;
  const left = luOn ? universe.creditsRemaining() : 0;
  void rev;
  /** Same conditions again (training seed, original snapshot or the same variation seed). */
  const rerun = (seed: number | string): BridgeSession => {
    const m = metaRef.current;
    if (m.timeline === 'simulation' && m.conditions === 'original') return universe.replayOriginal(m.archiveId);
    if (m.timeline === 'simulation' && m.conditions === 'variation') return universe.replayVariation(m.archiveId, Number(seed));
    return universe.startTraining(TRAINING_ID, seed);
  };
  const onSave = () => {
    if (meta.timeline === 'canonical') {
      universe.saveCanonical(canonicalOf(meta, state));
      touch();
      return flash(`Saved canonical progress at turn ${state.turn}. No credit used.`);
    }
    const st = safeStorage();
    if (!st) return flash('Local storage unavailable — cannot save.');
    const saved = saveGame(state, st, APP_VERSION);
    setHasSave(true);
    flash(`Saved simulation at turn ${saved.turn} (seed ${saved.seed}).`);
  };
  const onLoad = () => {
    const st = safeStorage();
    const res = st ? loadGame(st) : null;
    if (!res || !res.ok) return flash(res?.ok === false && res.reason === 'legacy' ? 'That save is from an older version and cannot be loaded.' : 'No valid save found.');
    // The simulation slot only ever holds simulations.
    const loaded: WorldState = { ...res.state, provenance: { ...res.state.provenance, timeline: 'simulation' } };
    const m: SessionMeta = { timeline: 'simulation', archiveId: loaded.provenance.archiveId ?? TRAINING_ID, runId: `loaded-${Date.now()}`, conditions: 'training', title: scenario.title };
    setMeta(m);
    metaRef.current = m;
    reset(loaded, res.meta.migratedFrom ? `Loaded a v0.${res.meta.migratedFrom} save (upgraded) from turn ${res.meta.turn}.` : `Loaded save from turn ${res.meta.turn}.`);
  };
  const confirmLoss = () => state.turn === 0 || state.outcome !== null || window.confirm('Abandon this run? Unsaved progress will be lost.');
  const onRestart = () => {
    if (!confirmLoss()) return;
    enter(rerun(state.seed), meta.title, `Restarted with the same seed (${state.seed}).`);
  };
  const onNewScenario = () => {
    if (!confirmLoss()) return;
    const seed = randomSeed();
    enter(universe.startTraining(TRAINING_ID, seed), scenario.title, `New scenario — seed ${seed}.`);
  };
  const toggleVoice = () => {
    const next = !voiceOn;
    if (!next) cancelSpeech();
    setVoiceOn(next);
    safeStorage()?.setItem(VOICE_KEY, next ? 'on' : 'off');
  };

  return (
    <div className={`app alert-${state.alert} mode-${timeline}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-elbow" aria-hidden="true" />
          <div>
            <h1>STARBRIDGE</h1>
            <p className="subtitle" data-testid="mission-title">{meta.title}</p>
          </div>
        </div>
        <div className="topbar-status">
          <span className="demo-badge" data-testid="demo-badge" title="Deterministic simulation engine with the offline (rule-based) order interpreter. No external AI calls.">
            {timeline === 'canonical' ? 'CANONICAL' : 'SIMULATION'} · OFFLINE INTERPRETER
          </span>
          <span className={`alert-pill alert-${state.alert}`} data-testid="alert-level">{state.alert.toUpperCase()} ALERT</span>
          <span className="clock" data-testid="mission-clock">{formatMissionClock(state.time)} · TURN {state.turn}</span>
          <span className="seed" data-testid="seed" title="Scenario seed — the same seed and orders reproduce a run exactly. Add ?seed=N to the URL to choose one.">SEED {state.seed}</span>
          {luOn && (
            <button className={`credits-chip ${left === 0 ? 'empty' : ''}`} onClick={() => setHubTab('universe')} data-testid="credits" data-remaining={left} title="New canonical missions you can start today">
              ◆ {left}/{universe.credits().dailyLimit} canonical
            </button>
          )}
        </div>
        <nav className="controls" aria-label="Simulation controls">
          <button className="btn hub-btn" onClick={() => setHubTab(luOn ? 'universe' : 'archive')} data-testid="open-hub" title="Living Universe, Mission Archive, Captain's Record">Hub</button>
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
          <button className="btn load" onClick={onLoad} disabled={!hasSave || canonical} data-testid="load" title={canonical ? 'Canonical missions resume from the Living Universe board' : 'Load the saved simulation'}>Load</button>
          <button className="btn restart" onClick={onRestart} disabled={canonical} data-testid="restart" title={canonical ? 'Canonical history cannot be restarted. Replay it as a simulation from the Mission Archive.' : 'Restart this scenario with the same seed'}>Restart</button>
          <button className="btn ghost" onClick={onNewScenario} disabled={canonical} data-testid="new-scenario" title={canonical ? 'Leave via the Hub; this mission stays saved' : 'Start a fresh scenario with a random seed'}>New</button>
        </nav>
      </header>

      <ModeBanner timeline={timeline} conditions={meta.timeline === 'simulation' ? meta.conditions : undefined} title={meta.title} />
      {toast && <div className="toast" role="status" data-testid="toast">{toast}</div>}
      {hubTab && (
        <Hub tab={hubTab} onTab={setHubTab} onClose={() => setHubTab(null)} tabs={['universe', 'archive', 'record', 'settings']}>
          {hubTab === 'universe' && <UniversePanel key={rev} universe={universe} actions={universeActions} />}
          {hubTab === 'archive' && <ArchivePanel key={rev} entries={universe.archive()} actions={{ ...archiveActions, onResume: universeActions.onResume }} />}
          {hubTab === 'record' && <RecordPanel key={rev} canon={universe.canon()} familiarity={universe.familiarity()} />}
          {hubTab === 'settings' && <SettingsPanel key={rev} universe={universe} onChange={(msg) => { touch(); flash(msg); }} />}
        </Hub>
      )}

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
              {canonical ? (
                <div className="outcome-actions">
                  <span className="tag canon">Recorded in canonical history</span>
                  <button className="btn" onClick={() => setHubTab('universe')} data-testid="outcome-universe">Living Universe</button>
                  <button className="btn save" onClick={() => archiveActions.onReplayOriginal(meta.missionId)} data-testid="outcome-replay">Replay as simulation</button>
                </div>
              ) : (
                <div className="outcome-actions">
                  <span className="tag sim">Simulated outcome</span>
                  <button className="btn restart" onClick={() => enter(rerun(state.seed), meta.title, `Restarted with the same seed (${state.seed}).`)} data-testid="outcome-same">Same seed</button>
                  <button className="btn ghost" onClick={() => { const seed = randomSeed(); enter(universe.startTraining(TRAINING_ID, seed), scenario.title, `New scenario — seed ${seed}.`); }}>New scenario</button>
                  <button className="btn load" onClick={() => setHubTab('archive')} data-testid="outcome-archive">Mission Archive</button>
                </div>
              )}
            </div>
          )}
          <NarrativePanel log={state.log} />
          <OrdersStrip orders={orders} />
          <CommandInput
            key={session}
            endedHint={canonical ? 'Canonical mission ended — open the Hub to continue' : 'Simulation ended — restart or load'}
            onCommand={onCommand}
            suggestions={suggestions}
            disabled={!!state.outcome}
            busy={busy}
            clarification={state.clarification}
          />
        </div>
        <aside className="col-right">
          <Tactical contacts={contacts} helm={helm} shieldsRaised={state.ships.halcyon.shields.raised} />
          <CommsLog log={state.log} />
        </aside>
      </main>
      <footer className="footer">
        Project Starbridge v{APP_VERSION} · Simulation Mode & Living Universe foundation · Original fiction and artwork · Typed orders always available; voice where supported.
      </footer>
    </div>
  );
}
