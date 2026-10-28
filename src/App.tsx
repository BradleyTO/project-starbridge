import { ChannelIndicator } from './ui/components/ChannelIndicator';
import { CommissionCeremony } from './ui/components/CommissionCeremony';
import { channelView } from './engine/comms';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { WorldState } from './engine/types';
import type { Interpretation } from './engine/schema';
import { completeIntro, playIntroBeat, processOrders } from './engine/turn';
import type { Timeline } from './engine/types';
import { loadGame, peekSave, saveGame } from './engine/persistence';
import { formatMissionClock } from './engine/state';
import { scenarioFor } from './scenarios/registry';
import { simulationById, simulationForScenario } from './scenarios/catalogue';
import { BRIDGE_TITLE, ambientLine, createBridge } from './scenarios/bridge';
import { appendReports } from './engine/turn';
import { narrate, say } from './engine/report';
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
import { cancelSpeech, speechSynthesisSupported } from './ui/speech';
import { loadVoiceSettings, saveVoiceSettings, speakAs, useDeviceVoices, type VoiceSettings } from './ui/voices';
import { VoicePanel } from './ui/components/VoicePanel';
import { assignVoices } from './voice/cast';
import { castMembers, voiceKeyOf } from './voice/members';
import { useUniverse } from './ui/useUniverse';
import { ModeBanner } from './ui/components/ModeBanner';
import { Hub, type HubTab } from './ui/components/Hub';
import { RecordPanel } from './ui/components/RecordPanel';
import { HandbookPanel, type HandbookView } from './ui/components/HandbookPanel';
import { handbookRequest, type HandbookRequest } from './handbook/command';
import { viewOf } from './handbook';
import { ArchivePanel } from './ui/components/ArchivePanel';
import { UniversePanel } from './ui/components/UniversePanel';
import { SettingsPanel } from './ui/components/SettingsPanel';
import { TRAINING } from './universe/archive';
import { expandAliases } from './universe/familiarity';
import type { BridgeSession, CanonicalSession } from './universe/sessions';
import { arriveOnBridge, handleDutyRequest, withDuty } from './dutyBridge';
import { withCaptain, withCareer } from './engine/captain';
import type { CaptainAddress } from './engine/types';
import { CaptainNamePrompt } from './ui/components/CaptainNamePrompt';
import type { RecordSection } from './ui/components/RecordPanel';
import './App.css';

const BEAT_MS = 3500;
const VOICE_KEY = 'starbridge.voice';
const APP_VERSION = '0.8.9';
const TRAINING_ID = TRAINING[0].id;
const AMBIENT_MS = 22000;
const interpreter = new OfflineInterpreter();

type Msg = { type: 'beat' } | { type: 'skipIntro' } | { type: 'replace'; state: WorldState };

/** What the bridge is currently playing (the WorldState itself lives in the reducer). */
export type SessionMeta =
  | { timeline: 'bridge'; title: string }
  | { timeline: 'simulation'; archiveId: string; runId: string; conditions: 'training' | 'original' | 'variation'; title: string }
  | { timeline: 'canonical'; missionId: string; archiveId: string; title: string };

function canonicalOf(m: Extract<SessionMeta, { timeline: 'canonical' }>, state: WorldState): CanonicalSession {
  return { timeline: 'canonical', missionId: m.missionId, archiveId: m.archiveId, scenarioId: state.scenarioId, state };
}

function metaOf(sess: BridgeSession, title: string): Exclude<SessionMeta, { timeline: 'bridge' }> {
  return sess.timeline === 'canonical'
    ? { timeline: 'canonical', missionId: sess.missionId, archiveId: sess.missionId, title }
    : { timeline: 'simulation', archiveId: sess.archiveId ?? TRAINING_ID, runId: sess.runId, conditions: sess.conditions, title };
}

/** What a finished simulation leaves behind on the bridge (the debrief card). */
interface Debrief {
  title: string;
  summary: string;
  success: boolean;
  seed: number | string;
  meta: Extract<SessionMeta, { timeline: 'simulation' }>;
  /** v0.7: the after-action report filed for this run (Training Record). */
  evaluationId?: string;
}

/** v0.7: the captain's address for dialogue, refreshed by the app on every render. */
let captainAddress: CaptainAddress | null = null;

/** The idle bridge (optionally with a debrief of the simulation that just ended). */
function bridgeState(seed: number | string, debrief?: { title: string; summary: string; objectives: string; canonical?: boolean } | 'ended'): WorldState {
  const b = withCaptain(createBridge(seed), captainAddress);
  if (!debrief) return b;
  const done = completeIntro(b, scenarioFor(b.scenarioId));
  const reports =
    debrief === 'ended'
      ? [narrate('simEndedByOrder'), say('xo', 'simEndedByOrderXo')]
      : debrief.canonical
        ? [narrate('dutyDebriefNarr', { title: debrief.title, summary: debrief.summary }), say('xo', 'dutyDebriefXo', { objectives: debrief.objectives })]
        : [narrate('simDebriefNarr', { title: debrief.title, summary: debrief.summary }), say('xo', 'simDebriefXo', { objectives: debrief.objectives })];
  return appendReports({ ...done, log: [] }, scenarioFor(b.scenarioId), reports);
}

function reducer(s: WorldState, m: Msg): WorldState {
  const scenario = scenarioFor(s.scenarioId);
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
  captainAddress = universe.address();
  // v0.5: the app opens on the idle bridge. ?seed=N seeds the bridge and the first simulation launched from it.
  const [firstSeed] = useState(() => initialSeed());
  const nextSimSeed = useRef<number | string | null>(new URLSearchParams(window.location.search).get('seed') ? firstSeed : null);
  const [meta, setMeta] = useState<SessionMeta>(() => ({ timeline: 'bridge', title: BRIDGE_TITLE }));
  const [state, dispatch] = useReducer(reducer, undefined, () => withCareer(withDuty(universe, bridgeState(firstSeed)), universe.careerBrief()));
  /** v0.7: open the Service Record at a section (optionally on one after-action report). */
  const openRecord = (section: RecordSection, report: string | null = null) => {
    setRecordView({ section, report });
    setHubTab('record');
  };
  /** v0.7: a name change re-stamps how the crew addresses the captain; progress is untouched. */
  const restampCaptain = () => {
    const next = withCareer(withCaptain(stateRef.current, universe.address()), universe.careerBrief());
    if (next !== stateRef.current) {
      dispatch({ type: 'replace', state: next });
      stateRef.current = next;
    }
  };
  const renameCaptain = (name: string) => {
    const r = universe.setCaptainName(name);
    if (r.ok) {
      captainAddress = universe.address();
      restampCaptain();
      touch();
    }
    return r.ok ? ({ ok: true } as const) : r;
  };
  const [hubTab, setHubTab] = useState<HubTab | null>(null);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [showCommission, setShowCommission] = useState(false);
  // v0.7: the one-time naming prompt (new captains and pre-v0.7 saves), and the Service Record view.
  const [askName, setAskName] = useState(() => universe.needsName());
  const [recordView, setRecordView] = useState<{ section: RecordSection; report: string | null }>({ section: 'overview', report: null });
  // v0.8.0: the Captain's Handbook view. Opening it (Hub, bridge command, a citation) changes no game state.
  const [handbookView, setHandbookView] = useState<HandbookView>({ kind: 'contents' });
  const openHandbook = (v: HandbookView | HandbookRequest) => {
    setHandbookView(v);
    setHubTab('handbook');
  };
  const openArticle = (id: string) => openHandbook(viewOf(id) ?? { kind: 'contents' });
  const openHandbookRef = useRef(openHandbook);
  openHandbookRef.current = openHandbook;
  const onBridge = meta.timeline === 'bridge';
  const timeline: Timeline = meta.timeline === 'bridge' ? 'simulation' : meta.timeline;
  const scenario = scenarioFor(state.scenarioId);
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
  // v0.6.1 crew voices: cast the device's voices onto the crew, the computer and the people on comms.
  const deviceVoices = useDeviceVoices();
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => loadVoiceSettings());
  const castState = useMemo(() => state, [state.scenarioId, state.characters]); // eslint-disable-line react-hooks/exhaustive-deps
  const voiceMembers = useMemo(() => castMembers(castState, scenarioFor(castState.scenarioId)), [castState]);
  const voiceCast = useMemo(() => assignVoices(deviceVoices, voiceMembers, voiceSettings), [deviceVoices, voiceMembers, voiceSettings]);
  const voiceCastRef = useRef(voiceCast);
  useEffect(() => {
    voiceCastRef.current = voiceCast;
  }, [voiceCast]);
  const updateVoiceSettings = (next: VoiceSettings) => {
    setVoiceSettings(next);
    saveVoiceSettings(next);
  };
  const previewVoice = (key: string) => {
    const m = voiceMembers.find((x) => x.key === key);
    if (!m) return;
    cancelSpeech();
    speakAs({ text: m.sample, speakerKey: key, speaker: m.label, assignment: voiceCast[key] ?? null });
  };
  const introRunning = state.intro < scenario.intro.length;
  const contacts = useMemo(() => contactsView(state, scenarioFor(state.scenarioId)), [state]);
  const helm = useMemo(() => helmView(state), [state]);
  const orders = useMemo(() => ordersView(state), [state]);
  const suggestions = useMemo(() => scenarioFor(state.scenarioId).suggestions(state), [state]);
  const channel = useMemo(() => channelView(state, scenarioFor(state.scenarioId).hooks.dialogue), [state]);

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
    const cast = voiceCastRef.current;
    for (const e of fresh) {
      const key = voiceKeyOf(e, state);
      speakAs({ text: e.text, speakerKey: key, speaker: e.speaker, assignment: cast[key] ?? cast['*'] ?? null });
    }
  }, [state, state.log, state.nextLogId, voiceOn]);

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
      // v0.8.0: "computer, open the handbook" / "show me section 3.3": opens the handbook and nothing else.
      // It never reaches the interpreter or the engine, so no order is issued, no time passes and no state changes.
      const hb = handbookRequest(text);
      if (hb) {
        openHandbookRef.current(hb);
        return;
      }
      setBusy(true);
      try {
        const fam = universe.familiarity();
        const expanded = expandAliases(text, fam.aliases).text;
        const interp: Interpretation = await interpreter.interpret(expanded, contextFrom(stateRef.current));
        const before = stateRef.current;
        const res = processOrders(before, text, interp, scenarioFor(before.scenarioId));
        dispatch({ type: 'replace', state: res.state });
        stateRef.current = res.state;
        const m = metaRef.current;
        universe.noteCommand(m.timeline === 'bridge' ? 'simulation' : m.timeline, text, res.results);
        // Canonical progress is committed after every order (saving is free).
        if (m.timeline === 'canonical' && !res.state.outcome) universe.saveCanonical(canonicalOf(m, res.state));
        // A finished run is filed: simulations in simulation history, canonical missions through the commit gate.
        if (res.state.outcome && !before.outcome) {
          if (m.timeline === 'simulation') {
            const evaluation = universe.finishSimulation({ timeline: 'simulation', runId: m.runId, archiveId: m.archiveId, conditions: m.conditions, scenarioId: res.state.scenarioId, state: res.state }, res.state);
            // v0.5: the simulation ends and the captain is back on the bridge, with a debrief.
            const o = res.state.outcome;
            const met = res.state.objectives.filter((x) => x.status === 'complete').length;
            setDebrief({ title: o.title, summary: o.summary, success: o.success, seed: res.state.seed, meta: m, evaluationId: evaluation?.id });
            returnToBridge.current?.(bridgeState(res.state.seed, { title: o.title, summary: o.summary, objectives: `${met} of ${res.state.objectives.length} objectives met` }), `Simulation complete: ${o.title}. Back on the bridge.`);
          } else if (m.timeline === 'canonical') {
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



  const reset = (raw: WorldState, msg: string) => {
    cancelSpeech();
    const next = withCareer(withCaptain(raw, universe.address()), universe.careerBrief());
    dispatch({ type: 'replace', state: next });
    stateRef.current = next;
    setSession((n) => n + 1);
    flash(msg);
  };
  const enter = (sess: BridgeSession, title: string, msg: string) => {
    setMeta(metaOf(sess, title));
    metaRef.current = metaOf(sess, title);
    setDebrief(null);
    reset(sess.state, msg);
    setHubTab(null);
    touch();
  };
  /** Back to the idle bridge (after a simulation ends, or on the captain's order). */
  const goBridge = (next: WorldState, msg: string) => {
    const m: SessionMeta = { timeline: 'bridge', title: BRIDGE_TITLE };
    setMeta(m);
    metaRef.current = m;
    reset(withDuty(universe, next), msg);
    touch();
  };
  const returnToBridge = useRef<typeof goBridge | null>(null);
  returnToBridge.current = goBridge;
  /** v0.6: archive titles and training ids come from the catalogue (any number of simulations). */
  const titleFor = (archiveId: string) => universe.archive().find((e) => e.id === archiveId)?.title ?? simulationById(archiveId)?.title ?? 'Training simulation';
  /** A training id for an archive id: itself if it is a training mission, else the training mission of the same scenario. */
  const trainingOf = (archiveId: string) => (simulationById(archiveId) ? archiveId : simulationForScenario(universe.archive().find((e) => e.id === archiveId)?.scenarioId ?? '')?.trainingId ?? TRAINING_ID);
  /** The training simulation being played (for "New scenario": same simulation, new seed). */
  const currentTraining = () => (metaRef.current.timeline === 'simulation' ? trainingOf(metaRef.current.archiveId) : simulationForScenario(stateRef.current.scenarioId)?.trainingId ?? TRAINING_ID);
  /** Start a training simulation from the bridge (spoken, typed or from the archive). */
  const beginTraining = (id: string) => {
    const seed = nextSimSeed.current ?? randomSeed();
    nextSimSeed.current = null;
    enter(universe.startTraining(id, seed), titleFor(id), `Training simulation, seed ${seed}.`);
  };
  // v0.5: bridge commands ask the app to act (open the archive, begin / end a simulation).
  const handledRequest = useRef<WorldState['uiRequest']>(null);
  useEffect(() => {
    const r = state.uiRequest;
    if (!r || r === handledRequest.current) return;
    handledRequest.current = r;
    const id = window.setTimeout(() => {
      if (r.kind === 'openArchive') setHubTab('archive');
      else if (r.kind === 'beginSim') beginTraining(r.id ?? TRAINING_ID);
      else if (r.kind === 'acceptCommission') {
        if (universe.dutyStatus() === 'pending') acceptCommission();
        else bridgeSay([say('comms', 'dutyNoCommission')]);
      }
      else if (r.kind === 'endSim') {
        setDebrief(null);
        goBridge(bridgeState(state.seed, 'ended'), 'Simulation ended. Back on the bridge.');
      } else if (r.kind === 'patrol' || r.kind === 'respond' || r.kind === 'course' || r.kind === 'firstContact') {
        // v0.5 Active Duty: patrol, answer a call, travel, record first contact (through the Universe API).
        if (stateRef.current.scenarioId !== 'bridge') return;
        const out = handleDutyRequest(universe, stateRef.current, r);
        touch();
        if (out.enter) enter(out.enter.session, out.enter.title, `Canonical mission begun: ${out.enter.title}. 1 credit used.`);
        else {
          dispatch({ type: 'replace', state: out.state });
          stateRef.current = out.state;
          if (out.flash) flash(out.flash);
        }
      }
    }, r.kind === 'openArchive' ? 0 : r.kind === 'firstContact' ? 0 : 700);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.uiRequest]);
  // v0.5: routine bridge activity while the captain is on station and quiet.
  useEffect(() => {
    if (!onBridge || busy || hubTab || introRunning) return;
    const id = window.setTimeout(() => {
      const cur = stateRef.current;
      if (cur.scenarioId !== 'bridge') return;
      const a = ambientLine(cur);
      const next = appendReports(a.state, scenarioFor(cur.scenarioId), a.reports);
      dispatch({ type: 'replace', state: next });
      stateRef.current = next;
    }, AMBIENT_MS);
    return () => window.clearTimeout(id);
  }, [onBridge, busy, hubTab, introRunning, state.nextLogId]);
  /** Re-derive the Active Duty overlay on the idle bridge (and let priority traffic in on arrival). */
  const refreshBridge = (arrive: boolean) => {
    const cur = stateRef.current;
    if (cur.scenarioId !== 'bridge') return;
    const next = arrive ? arriveOnBridge(universe, cur) : withDuty(universe, cur);
    if (next === cur) return;
    dispatch({ type: 'replace', state: next });
    stateRef.current = next;
  };
  // v0.5: once the bridge intro is done, anything waiting for the captain (a Fleet directive) comes in.
  useEffect(() => {
    if (!onBridge || introRunning) return;
    const id = window.setTimeout(() => refreshBridge(true), 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBridge, introRunning, session]);
  /** Append crew / comms lines to the idle bridge (no-op elsewhere). */
  const bridgeSay = (reports: Parameters<typeof appendReports>[2]) => {
    const cur = stateRef.current;
    if (cur.scenarioId !== 'bridge') return;
    const next = appendReports(cur, scenarioFor(cur.scenarioId), reports);
    dispatch({ type: 'replace', state: next });
    stateRef.current = next;
  };
  const acceptCommission = () => {
    universe.acceptCommission();
    setShowCommission(false);
    touch();
    bridgeSay([say('comms', 'dutyCommissionComms'), say('xo', 'dutyCommissionXo')]);
    refreshBridge(true);
    flash('Commission accepted. You are on active duty.');
  };
  /** The Active Duty subscription changed (dev toggle). Off = reserve status, never misconduct. */
  const onDuty = (on: boolean) => {
    if (on) {
      universe.setActiveDuty(true);
      touch();
      if (universe.dutyStatus() === 'pending') return setShowCommission(true);
      bridgeSay([say('comms', 'dutyWelcomeBack')]);
      refreshBridge(true);
      return flash('Back on active duty. Your career is restored.');
    }
    const m = metaRef.current;
    // A canonical mission under way is saved first; it resumes when the captain returns to duty.
    if (m.timeline === 'canonical' && !stateRef.current.outcome) universe.saveCanonical(canonicalOf(m, stateRef.current));
    const hadCareer = universe.canon() !== null;
    universe.setActiveDuty(false);
    setShowCommission(false);
    touch();
    if (m.timeline === 'canonical') goBridge(bridgeState(stateRef.current.seed), 'Reserve status: mission saved, canonical timeline frozen.');
    else {
      bridgeSay(hadCareer ? [say('comms', 'dutyReserve')] : []);
      refreshBridge(false);
    }
    flash(hadCareer ? 'Reserve status. Your career is preserved; the canonical timeline is frozen.' : 'Active Duty off.');
  };
  const archiveActions = {
    onTrain: (id: string) => beginTraining(id),
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
    onEnable: () => onDuty(true),
    onShowCommission: () => setShowCommission(true),
    onStart: (offerId: string) => {
      const r = universe.startCanonical(offerId);
      if (!r.ok) return flash(r.reason === 'no-credits' ? 'No new canonical missions left today. Simulations are unlimited.' : 'That offer is not available.');
      const m = universe.canon()!.missions[r.missionId];
      if (r.session) enter(r.session, m.title, `Canonical mission begun: ${m.title}.`);
      else {
        touch();
        refreshBridge(false);
        flash(`${m.title}: ${m.outcome?.title ?? 'under way'}.`);
      }
    },
    onRespond: (offerId: string, response: 'decline' | 'ignore' | 'question' | 'refuse' | 'disobey', reason?: string) => {
      universe.respond(offerId, response, reason);
      touch();
      refreshBridge(false);
      flash(`Logged: ${response}. No credit used.`);
    },
    onResume: (missionId: string) => enter(universe.resumeCanonical(missionId), universe.canon()!.missions[missionId].title, 'Canonical mission resumed. No credit used.'),
    onAdvance: (hours: number) => {
      const r = universe.advanceTime(hours);
      touch();
      refreshBridge(false);
      flash(r.ok ? `${hours} hours of canonical time pass.` : 'Canonical time is paused until the allowance resets.');
    },
  };
  const canonical = meta.timeline === 'canonical';
  const simMeta = meta.timeline === 'simulation' ? meta : null;
  const duty = universe.dutyStatus();
  const luOn = duty === 'active';
  const left = luOn ? universe.creditsRemaining() : 0;
  void rev;
  /** Same conditions again (training seed, original snapshot or the same variation seed). */
  const rerun = (seed: number | string, from?: SessionMeta): BridgeSession => {
    const m = from ?? metaRef.current;
    if (m.timeline === 'simulation' && m.conditions === 'original') return universe.replayOriginal(m.archiveId);
    if (m.timeline === 'simulation' && m.conditions === 'variation') return universe.replayVariation(m.archiveId, Number(seed));
    return universe.startTraining(m.timeline === 'simulation' ? trainingOf(m.archiveId) : TRAINING_ID, seed);
  };
  const onSave = () => {
    if (meta.timeline === 'bridge') return flash('Nothing to save on the bridge. Simulations and Active Duty missions save while they run.');
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
    const m: SessionMeta = { timeline: 'simulation', archiveId: loaded.provenance.archiveId ?? simulationForScenario(loaded.scenarioId)?.trainingId ?? TRAINING_ID, runId: `loaded-${Date.now()}`, conditions: 'training', title: scenarioFor(loaded.scenarioId).title };
    setDebrief(null);
    setMeta(m);
    metaRef.current = m;
    reset(loaded, res.meta.migratedFrom ? `Loaded a v0.${res.meta.migratedFrom} save (upgraded) from turn ${res.meta.turn}.` : `Loaded save from turn ${res.meta.turn}.`);
  };
  const confirmLoss = () => onBridge || state.turn === 0 || state.outcome !== null || window.confirm('Abandon this run? Unsaved progress will be lost.');
  const onRestart = () => {
    if (onBridge || !confirmLoss()) return;
    enter(rerun(state.seed), meta.title, `Restarted with the same seed (${state.seed}).`);
  };
  const onNewScenario = () => {
    if (!confirmLoss()) return;
    const seed = randomSeed();
    nextSimSeed.current = null;
    const tid = currentTraining();
    enter(universe.startTraining(tid, seed), titleFor(tid), `New simulation — seed ${seed}.`);
  };
  const onEndSim = () => {
    if (!simMeta) return;
    if (!(state.turn === 0 || state.outcome !== null || window.confirm('End this simulation and return to the bridge? Nothing will be recorded.'))) return;
    setDebrief(null);
    goBridge(bridgeState(state.seed, 'ended'), 'Simulation ended. Back on the bridge.');
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
            {timeline === 'canonical' ? 'CANONICAL' : onBridge ? 'BRIDGE' : 'SIMULATION'} · OFFLINE INTERPRETER
          </span>
          <span className={`alert-pill alert-${state.alert}`} data-testid="alert-level">{state.alert.toUpperCase()} ALERT</span>
          <span className="clock" data-testid="mission-clock">{formatMissionClock(state.time)} · TURN {state.turn}</span>
          <span className="seed" data-testid="seed" title="Scenario seed — the same seed and orders reproduce a run exactly. Add ?seed=N to the URL to choose one.">SEED {state.seed}</span>
          {(duty === 'active' || duty === 'reserve') && (
            <span className={`duty-chip ${duty}`} data-testid="duty-status" data-duty={duty}>{duty === 'active' ? 'ACTIVE DUTY' : 'RESERVE'}</span>
          )}
          {luOn && (
            <button className={`credits-chip ${left === 0 ? 'empty' : ''}`} onClick={() => setHubTab('universe')} data-testid="credits" data-remaining={left} title="New canonical missions you can start today">
              ◆ {left}/{universe.credits().dailyLimit} canonical
            </button>
          )}
        </div>
        <nav className="controls" aria-label="Simulation controls">
          <button className="btn hub-btn" onClick={() => setHubTab(luOn ? 'universe' : 'archive')} data-testid="open-hub" title="Active Duty, Mission Archive, Service Record, Captain's Handbook">Hub</button>
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
          {simMeta && <button className="btn ghost" onClick={onEndSim} data-testid="end-sim" title="End the simulation and return to the bridge">End sim</button>}
          <button className="btn save" onClick={onSave} disabled={onBridge} data-testid="save" title={onBridge ? 'Nothing to save on the idle bridge' : undefined}>Save</button>
          <button className="btn load" onClick={onLoad} disabled={!hasSave || canonical} data-testid="load" title={canonical ? 'Canonical missions resume from Active Duty' : 'Load the saved simulation'}>Load</button>
          <button className="btn restart" onClick={onRestart} disabled={canonical || onBridge} data-testid="restart" title={canonical ? 'Canonical history cannot be restarted. Replay it as a simulation from the Mission Archive.' : 'Restart this scenario with the same seed'}>Restart</button>
          <button className="btn ghost" onClick={onNewScenario} disabled={canonical} data-testid="new-scenario" title={canonical ? 'Leave via the Hub; this mission stays saved' : 'Start a fresh scenario with a random seed'}>New</button>
        </nav>
      </header>

      <ModeBanner timeline={timeline} bridge={onBridge} duty={duty} conditions={meta.timeline === 'simulation' ? meta.conditions : undefined} title={meta.title} />
      {toast && <div className="toast" role="status" data-testid="toast">{toast}</div>}
      {askName && (
        <CaptainNamePrompt
          current={universe.profile().name}
          onSave={(name) => {
            const r = renameCaptain(name);
            if (r.ok) {
              setAskName(false);
              flash(`Entered in the record: ${universe.address().formal}.`);
            }
            return r;
          }}
          onDismiss={() => {
            const n = universe.dismissNamePrompt();
            setAskName(false);
            captainAddress = universe.address();
            restampCaptain();
            touch();
            flash(`Recorded as ${n}. Change it any time in the Service Record.`);
          }}
        />
      )}
      {!askName && showCommission && duty === 'pending' && <CommissionCeremony captain={universe.address()} onAccept={acceptCommission} onLater={() => { setShowCommission(false); flash('Fleet Command will wait. Answer from the Active Duty tab, or say "I accept the commission".'); }} />}
      {hubTab && (
        <Hub tab={hubTab} onTab={(t) => { if (t === 'record') setRecordView({ section: 'overview', report: null }); setHubTab(t); }} onClose={() => { setHubTab(null); setRecordView({ section: 'overview', report: null }); }} tabs={['universe', 'archive', 'record', 'handbook', 'voices', 'settings']}>
          {hubTab === 'universe' && <UniversePanel key={rev} universe={universe} actions={universeActions} />}
          {hubTab === 'archive' && <ArchivePanel key={rev} entries={universe.archive()} actions={{ ...archiveActions, onResume: universeActions.onResume }} />}
          {hubTab === 'record' && <RecordPanel key={`${recordView.section}-${recordView.report ?? ''}`} canon={universe.canon()} familiarity={universe.familiarity()} profile={universe.profile()} service={universe.service()} training={universe.training()} onRename={renameCaptain} initialSection={recordView.section} initialReport={recordView.report} onCite={openArticle} />}
          {hubTab === 'handbook' && <HandbookPanel key={JSON.stringify(handbookView)} view={handbookView} onView={setHandbookView} />}
          {hubTab === 'voices' && (
            <VoicePanel members={voiceMembers} cast={voiceCast} voices={deviceVoices} settings={voiceSettings} supported={speechSynthesisSupported()} onSettings={updateVoiceSettings} onPreview={previewVoice} />
          )}
          {hubTab === 'settings' && <SettingsPanel key={rev} universe={universe} onChange={(msg) => { captainAddress = universe.address(); restampCaptain(); touch(); flash(msg); }} onDuty={onDuty} />}
        </Hub>
      )}

      <main className="grid">
        <aside className="col-left">
          <ShipStatus ship={state.ships.halcyon} torpedoes={state.counters.torpedoes ?? 0} targetName={(id) => contacts.find((c) => c.id === id)?.name ?? id} />
          <Objectives objectives={state.objectives} emptyText={onBridge ? 'No mission. On station.' : undefined} />
        </aside>
        <div className="col-center">
          <Viewscreen state={state} contacts={contacts} />
          {onBridge && debrief && (
            <div className={`outcome debrief ${debrief.success ? 'outcome-good' : 'outcome-bad'}`} role="status" data-testid="outcome" data-debrief="1">
              <strong>Debrief — {debrief.title}</strong>
              <span>{debrief.summary}</span>
              <div className="outcome-actions">
                <span className="tag sim">Simulated outcome</span>
                <button className="btn restart" onClick={() => enter(rerun(debrief.seed, debrief.meta), debrief.meta.title, `Running it again — seed ${debrief.seed}.`)} data-testid="outcome-same">Run it again</button>
                <button className="btn ghost" onClick={() => { const seed = randomSeed(); enter(universe.replayVariation(debrief.meta.archiveId, seed), debrief.meta.title, `New variation — seed ${seed}.`); }} data-testid="outcome-new">New variation</button>
                {debrief.evaluationId && <button className="btn" onClick={() => openRecord('training', debrief.evaluationId)} data-testid="outcome-aar">Read the after-action report</button>}
                <button className="btn load" onClick={() => setHubTab('archive')} data-testid="outcome-archive">Mission Archive</button>
                <button className="btn ghost" onClick={() => setDebrief(null)} data-testid="outcome-dismiss">Dismiss</button>
              </div>
            </div>
          )}
          {state.outcome && (
            <div className={`outcome ${state.outcome.success ? 'outcome-good' : 'outcome-bad'}`} role="alert" data-testid="outcome">
              <strong>{state.outcome.title}</strong>
              <span>{state.outcome.summary}</span>
              {canonical ? (
                <div className="outcome-actions">
                  <span className="tag canon">Recorded in canonical history</span>
                  <button className="btn" onClick={() => setHubTab('universe')} data-testid="outcome-universe">Active Duty</button>
                  <button className="btn save" onClick={() => archiveActions.onReplayOriginal(meta.missionId)} data-testid="outcome-replay">Replay as simulation</button>
                  <button className="btn ghost" onClick={() => goBridge(bridgeState(state.seed, { title: state.outcome!.title, summary: state.outcome!.summary, objectives: `${state.objectives.filter((x) => x.status === 'complete').length} of ${state.objectives.length} objectives met`, canonical: true }), 'Back on the bridge. The mission is filed in canonical history.')} data-testid="outcome-bridge">Return to the bridge</button>
                </div>
              ) : (
                <div className="outcome-actions">
                  <span className="tag sim">Simulated outcome</span>
                  <button className="btn restart" onClick={() => enter(rerun(state.seed), meta.title, `Restarted with the same seed (${state.seed}).`)} data-testid="outcome-same">Same seed</button>
                  <button className="btn ghost" onClick={() => { const seed = randomSeed(); const tid = currentTraining(); enter(universe.startTraining(tid, seed), titleFor(tid), `New scenario — seed ${seed}.`); }} data-testid="outcome-new">New scenario</button>
                  <button className="btn load" onClick={() => setHubTab('archive')} data-testid="outcome-archive">Mission Archive</button>
                </div>
              )}
            </div>
          )}
          <NarrativePanel log={state.log} />
          <OrdersStrip orders={orders} />
          <ChannelIndicator view={channel} />
          <CommandInput
            onChannel={!!channel && channel.state !== 'hold'}
            key={session}
            endedHint={canonical ? 'Canonical mission ended — open the Hub to continue' : 'Simulation ended — restart or load'}
            onCommand={onCommand}
            suggestions={suggestions}
            disabled={!!state.outcome}
            placeholderIdle={onBridge ? 'Talk to your crew, e.g. "Computer, list simulations"' : undefined}
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
        Project Starbridge v{APP_VERSION} (Captain's Handbook) · Simulation Mode & Active Duty · Original fiction and artwork · Typed orders always available; voice where supported.
      </footer>
    </div>
  );
}
