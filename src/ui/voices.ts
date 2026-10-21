/**
 * v0.6.1 browser glue for the voice cast: the device's voice list (with the async voiceschanged
 * event), the captain's saved overrides, and a speech queue that knows who is speaking.
 * Everything uses the browser's own speechSynthesis: free, no keys, and offline with local voices.
 */
import { useEffect, useState } from 'react';
import type { Assignment, VoiceInfo, VoiceOverride } from '../voice/cast';
import { speechSynthesisSupported } from './speech';

export const VOICE_SETTINGS_KEY = 'starbridge.voiceCast.v1';

export interface VoiceSettings {
  overrides: Record<string, VoiceOverride>;
  /** Cloud voices (Chrome's "Google …", Edge's "Online (Natural)") are off by default: Simulation Mode is offline. */
  allowNetwork: boolean;
}
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = { overrides: {}, allowNetwork: false };

interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}
function storage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/** Reads saved settings, dropping anything malformed. */
export function loadVoiceSettings(st: StorageLike | null = storage()): VoiceSettings {
  try {
    const raw = st?.getItem(VOICE_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_VOICE_SETTINGS, overrides: {} };
    const j = JSON.parse(raw) as Partial<VoiceSettings>;
    const overrides: Record<string, VoiceOverride> = {};
    for (const [k, o] of Object.entries(j.overrides ?? {})) {
      if (!o || typeof o !== 'object') continue;
      const clean: VoiceOverride = {};
      if (typeof o.voiceURI === 'string' && o.voiceURI) clean.voiceURI = o.voiceURI;
      if (num(o.pitch) !== undefined) clean.pitch = o.pitch;
      if (num(o.rate) !== undefined) clean.rate = o.rate;
      if (Object.keys(clean).length) overrides[k] = clean;
    }
    return { overrides, allowNetwork: j.allowNetwork === true };
  } catch {
    return { ...DEFAULT_VOICE_SETTINGS, overrides: {} };
  }
}

export function saveVoiceSettings(s: VoiceSettings, st: StorageLike | null = storage()): void {
  try {
    st?.setItem(VOICE_SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: settings last for this session only */
  }
}

/** Sets (or, with an empty patch, clears) one member's override. */
export function withOverride(s: VoiceSettings, key: string, patch: VoiceOverride | null): VoiceSettings {
  const overrides = { ...s.overrides };
  if (!patch) delete overrides[key];
  else {
    const next: VoiceOverride = { ...overrides[key], ...patch };
    for (const k of Object.keys(next) as (keyof VoiceOverride)[]) if (next[k] === undefined) delete next[k];
    if (Object.keys(next).length) overrides[key] = next;
    else delete overrides[key];
  }
  return { ...s, overrides };
}

export function deviceVoices(): VoiceInfo[] {
  if (!speechSynthesisSupported()) return [];
  try {
    return window.speechSynthesis.getVoices().map((v) => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI, localService: v.localService, default: v.default }));
  } catch {
    return [];
  }
}

/**
 * The device's voices. Chrome and Android fill the list asynchronously and announce it with
 * voiceschanged; Safari usually has it at once but may not fire the event, so it is also re-read
 * a few times after load.
 */
export function useDeviceVoices(): VoiceInfo[] {
  const [voices, setVoices] = useState<VoiceInfo[]>(() => deviceVoices());
  useEffect(() => {
    if (!speechSynthesisSupported()) return;
    const refresh = () => {
      const next = deviceVoices();
      setVoices((prev) => (sameVoices(prev, next) ? prev : next));
    };
    const synth = window.speechSynthesis;
    const timers = [250, 1000, 3000].map((ms) => window.setTimeout(refresh, ms));
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refresh);
    else (synth as SpeechSynthesis).onvoiceschanged = refresh;
    refresh();
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (typeof synth.removeEventListener === 'function') synth.removeEventListener('voiceschanged', refresh);
      else if ((synth as SpeechSynthesis).onvoiceschanged === refresh) (synth as SpeechSynthesis).onvoiceschanged = null;
    };
  }, []);
  return voices;
}

function sameVoices(a: VoiceInfo[], b: VoiceInfo[]): boolean {
  return a.length === b.length && a.every((v, i) => v.voiceURI === b[i].voiceURI && v.name === b[i].name && v.localService === b[i].localService);
}

/** One spoken line: the speech queue always knows who is talking. */
export interface SpeechItem {
  text: string;
  /** Voice key of the speaker ('computer', 'rask', 'npc:tallis-quarantine:marr', ...). */
  speakerKey: string;
  /** Display name, as in the log. */
  speaker: string;
  assignment: Assignment | null;
}

/** The last few lines handed to the synthesiser (for the panel and for tests). */
export const recentSpeech: SpeechItem[] = [];

export function speakAs(item: SpeechItem): void {
  recentSpeech.push(item);
  if (recentSpeech.length > 50) recentSpeech.shift();
  if (!speechSynthesisSupported()) return;
  const u = new SpeechSynthesisUtterance(item.text.replace(/["“”]/g, ''));
  const a = item.assignment;
  if (a) {
    const v = a.voiceURI ? window.speechSynthesis.getVoices().find((x) => x.voiceURI === a.voiceURI) : undefined;
    try {
      if (v) u.voice = v;
    } catch {
      /* a browser that rejects the voice object speaks with its default voice */
    }
    // Setting lang too helps older iOS honour the chosen voice; with no voice it picks an English default.
    u.lang = v?.lang ?? a.lang;
    u.pitch = a.pitch;
    u.rate = a.rate;
  } else {
    u.rate = 1.02;
    u.pitch = 0.95;
  }
  window.speechSynthesis.speak(u);
}
