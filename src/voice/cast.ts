/**
 * v0.6.1 voice casting: assign real speech-synthesis voices to the crew, the ship's computer and
 * the people on comms. Pure and deterministic. The result depends only on the set of voices offered
 * (not their order), the members (in priority order) and the captain's overrides.
 *
 * - Each member gets the best-scoring voice not yet taken (ranked candidate names, gender, locale).
 * - With at least as many voices as core members (computer, seven officers, narrator), each core
 *   member gets a voice of their own.
 * - When the device has fewer (iOS can have very few English ones, and Android often has one per
 *   locale), voices are shared, preferring a voice of the character's gender. Members who share one are separated by pitch and
 *   rate, and the result is checked so no two members sound the same: (voice, pitch, rate) is unique.
 * - With no usable voice at all, everyone uses the browser default, separated by pitch and rate.
 * - Cloud voices (localService === false) are skipped unless the captain allows them, honouring
 *   Simulation Mode's no-cloud rule.
 */
import type { VoiceGender, VoiceProfile } from './profiles';

/** The fields of SpeechSynthesisVoice we use. */
export interface VoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
  default: boolean;
}

export interface VoiceOverride {
  /** A voiceURI, or undefined for automatic. */
  voiceURI?: string;
  pitch?: number;
  rate?: number;
}

export interface Assignment {
  key: string;
  voiceURI: string | null;
  voiceName: string | null;
  lang: string;
  pitch: number;
  rate: number;
  /** 0 = has the voice to itself (or is its first user); n = the n-th member sharing it. */
  shareIndex: number;
  overridden: boolean;
}

export interface CastOptions {
  overrides?: Record<string, VoiceOverride>;
  allowNetwork?: boolean;
}

export const PITCH_RANGE = [0.5, 1.6] as const;
export const RATE_RANGE = [0.7, 1.4] as const;
const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Pitch / rate offsets for the 2nd, 3rd, ... member sharing one voice. */
const SEPARATION: [number, number][] = [
  [0, 0], [0.22, -0.05], [-0.18, 0.06], [0.38, 0.03], [-0.3, -0.07], [0.12, 0.1], [-0.08, -0.12], [0.5, -0.02], [-0.4, 0.09], [0.3, 0.12], [-0.25, -0.14], [0.45, 0.07],
];

/** Apple's novelty voices (Bells, Zarvox, ...) are never cast. */
const NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|junior|kathy|organ|pipe organ|princess|ralph|superstar|trinoids|whisper|wobble|zarvox|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy)\b/i;

const FEMALE = /\b(female|woman|samantha|karen|moira|tessa|fiona|victoria|allison|ava|susan|zira|hazel|aria|jenny|sonia|libby|natasha|emma|emily|michelle|nicky|serena|kate|veena|catherine|martha|joanna|salli|kimberly|ivy|kendra|clara|linda|heera|neerja|isha|stephanie|amelie|ellen|sara|anna|alice|helena|laura|lekha|tara|siri female|en-us-x-(?:iob|iog|tpc|tpf|sfg)|en-gb-x-(?:gba|gbc|gbg)|en-au-x-(?:afa|auc)|en-in-x-(?:ena|enc))\b/i;
const MALE = /\b(male|man|alex|daniel|fred|tom|oliver|arthur|rishi|aaron|gordon|lee|david|mark|george|guy|ryan|christopher|eric|brian|thomas|james|matthew|justin|joey|liam|william|prabhat|ravi|richard|sean|evan|nathan|siri male|en-us-x-(?:iol|iom|tpd)|en-gb-x-(?:gbd|rjs)|en-au-x-(?:aub|aud)|en-in-x-(?:end|ene))\b/i;

export function voiceGender(v: Pick<VoiceInfo, 'name' | 'voiceURI'>): VoiceGender | null {
  const s = `${v.name} ${v.voiceURI}`;
  // "Female" contains no word "male", but check female first for names like "Google UK English Female".
  if (FEMALE.test(s)) return 'female';
  if (MALE.test(s)) return 'male';
  return null;
}

export const normLang = (l: string) => {
  const [a, b] = l.replace('_', '-').split('-');
  return b ? `${a.toLowerCase()}-${b.toUpperCase()}` : (a ?? '').toLowerCase();
};
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameRe = new Map<string, RegExp>();
function matches(v: VoiceInfo, candidate: string): boolean {
  let re = nameRe.get(candidate);
  if (!re) nameRe.set(candidate, (re = new RegExp(`(^|[^a-z0-9])${esc(candidate)}([^a-z0-9]|$)`, 'i')));
  return re.test(v.name) || re.test(v.voiceURI);
}

/** The voices the caster may use, de-duplicated and in a canonical order (independent of getVoices order). */
export function usableVoices(voices: VoiceInfo[], allowNetwork = false): VoiceInfo[] {
  const seen = new Set<string>();
  const out: VoiceInfo[] = [];
  for (const v of voices) {
    if (!v || !v.voiceURI || seen.has(v.voiceURI)) continue;
    if (!allowNetwork && v.localService === false) continue;
    if (NOVELTY.test(v.name)) continue;
    if (!normLang(v.lang).startsWith('en')) continue;
    seen.add(v.voiceURI);
    out.push(v);
  }
  return out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : a.voiceURI < b.voiceURI ? -1 : a.voiceURI > b.voiceURI ? 1 : 0));
}

/** How well a voice suits a profile (higher is better). Exported for tests. */
export function suitability(v: VoiceInfo, p: VoiceProfile): number {
  let s = 0;
  const idx = p.candidates.findIndex((c) => matches(v, c));
  if (idx >= 0) s += 100 - idx * 5;
  const g = voiceGender(v);
  if (p.gender !== 'neutral' && g) s += g === p.gender ? 40 : -60;
  const lang = normLang(v.lang);
  const li = p.locales.indexOf(lang);
  if (li >= 0) s += 25 - li * 4;
  if (v.default) s += 1;
  return s;
}

export function assignVoices(voices: VoiceInfo[], members: VoiceProfile[], opts: CastOptions = {}): Record<string, Assignment> {
  const pool = usableVoices(voices, opts.allowNetwork);
  const byUri = new Map(pool.map((v) => [v.voiceURI, v]));
  // Overrides may name any English voice the device offers (even a cloud one the captain chose).
  const anyByUri = new Map(voices.filter((v) => v && v.voiceURI).map((v) => [v.voiceURI, v]));
  const usage = new Map<string, number>();
  const take = (uri: string | null) => {
    const k = uri ?? '<default>';
    const n = usage.get(k) ?? 0;
    usage.set(k, n + 1);
    return n;
  };
  const chosen = new Map<string, VoiceInfo | null>();
  const overridden = new Set<string>();

  // 1. Voices the captain picked are reserved first.
  for (const m of members) {
    const uri = opts.overrides?.[m.key]?.voiceURI;
    const v = uri ? (byUri.get(uri) ?? anyByUri.get(uri)) : undefined;
    if (v) {
      chosen.set(m.key, v);
      overridden.add(m.key);
    }
  }
  const share = new Map<string, number>();
  for (const m of members) if (chosen.has(m.key)) share.set(m.key, take(chosen.get(m.key)!.voiceURI));

  // 2. Everyone else, in priority order, takes the best voice still free (or the least-shared one).
  //    With at least one voice per core member (computer, crew, narrator) every one of them gets
  //    their own. With fewer, a fitting shared voice beats a free voice of the wrong gender: a
  //    female officer keeps a female voice at a different pitch rather than borrowing a male one.
  const core = members.filter((m) => !/^(npc:|label:|relief_|\*$)/.test(m.key)).length;
  const reusePenalty = pool.length >= core ? 1000 : 10;
  for (const m of members) {
    if (chosen.has(m.key)) continue;
    let best: VoiceInfo | null = null;
    let bestScore = -Infinity;
    for (const v of pool) {
      const sc = suitability(v, m) - reusePenalty * (usage.get(v.voiceURI) ?? 0);
      if (sc > bestScore) {
        best = v;
        bestScore = sc;
      }
    }
    chosen.set(m.key, best);
    share.set(m.key, take(best?.voiceURI ?? null));
  }

  // 3. Pitch and rate: the profile's, separated for members sharing a voice, then any override.
  const out: Record<string, Assignment> = {};
  const signature = new Set<string>();
  for (const m of members) {
    const v = chosen.get(m.key) ?? null;
    const n = share.get(m.key) ?? 0;
    const [dp, dr] = SEPARATION[n % SEPARATION.length];
    const lap = Math.floor(n / SEPARATION.length) * 0.05;
    let pitch = m.pitch + dp + lap;
    let rate = m.rate + dr;
    // A shared or default voice of the wrong gender is nudged toward the character.
    const g = v ? voiceGender(v) : null;
    if (m.gender === 'male' && g !== 'male' && n > 0) pitch -= 0.1;
    if (m.gender === 'female' && g === 'male') pitch += 0.12;
    const o = opts.overrides?.[m.key];
    if (o?.pitch !== undefined) pitch = o.pitch;
    if (o?.rate !== undefined) rate = o.rate;
    pitch = round2(clamp(pitch, PITCH_RANGE));
    rate = round2(clamp(rate, RATE_RANGE));
    // Guarantee: no two members sound identical (same voice, pitch and rate).
    const uri = v?.voiceURI ?? '<default>';
    let guard = 0;
    while (signature.has(`${uri}|${pitch}|${rate}`) && guard++ < 40) {
      pitch = round2(pitch + 0.07 > PITCH_RANGE[1] ? PITCH_RANGE[0] + ((pitch + 0.07) % 0.1) : pitch + 0.07);
    }
    signature.add(`${uri}|${pitch}|${rate}`);
    out[m.key] = {
      key: m.key,
      voiceURI: v?.voiceURI ?? null,
      voiceName: v?.name ?? null,
      lang: v ? normLang(v.lang) : (m.locales[0] ?? 'en-US'),
      pitch,
      rate,
      shareIndex: n,
      overridden: overridden.has(m.key) || o?.pitch !== undefined || o?.rate !== undefined,
    };
  }
  return out;
}
