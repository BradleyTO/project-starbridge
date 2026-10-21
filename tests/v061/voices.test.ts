/** v0.6.1 crew voices: the casting algorithm, saved overrides, and speaker tagging in the log. */
import { describe, expect, it } from 'vitest';
import { assignVoices, usableVoices, voiceGender, type VoiceInfo } from '../../src/voice/cast';
import { CREW_PROFILES, GENERIC_PROFILE, RELIEF_PROFILES } from '../../src/voice/profiles';
import { castMembers, npcKey, voiceKeyOf } from '../../src/voice/members';
import { loadVoiceSettings, saveVoiceSettings, withOverride, VOICE_SETTINGS_KEY } from '../../src/ui/voices';
import { K, play, start } from '../helpers';
import { TS, playT, startT } from '../sim02/helpers';
import { kestrelScenario } from '../../src/scenarios/kestrel';
import { patchCharacter } from '../../src/engine/state';
import { bridgeScenario, createBridge } from '../../src/scenarios/bridge';

const V = (name: string, lang: string, localService = true, voiceURI = name, def = false): VoiceInfo => ({ name, lang, voiceURI, localService, default: def });

/** Representative voice lists (names as these platforms report them). */
const MAC_SAFARI = [
  V('Samantha', 'en-US', true, 'com.apple.voice.compact.en-US.Samantha', true), V('Alex', 'en-US'), V('Fred', 'en-US'), V('Daniel', 'en-GB'), V('Kate', 'en-GB'), V('Serena', 'en-GB'),
  V('Arthur', 'en-GB'), V('Martha', 'en-GB'), V('Karen', 'en-AU'), V('Catherine', 'en-AU'), V('Moira', 'en-IE'), V('Tessa', 'en-ZA'), V('Rishi', 'en-IN'), V('Fiona', 'en-GB'),
  V('Victoria', 'en-US'), V('Allison', 'en-US'), V('Ava', 'en-US'), V('Susan', 'en-US'), V('Tom', 'en-US'), V('Gordon', 'en-AU'),
  V('Bells', 'en-US'), V('Zarvox', 'en-US'), V('Bad News', 'en-US'), V('Whisper', 'en-US'), V('Thomas', 'fr-FR'), V('Anna', 'de-DE'),
];
const CHROME_DESKTOP = [
  V('Microsoft David - English (United States)', 'en-US', true, 'Microsoft David - English (United States)', true), V('Microsoft Zira - English (United States)', 'en-US'), V('Microsoft Mark - English (United States)', 'en-US'),
  V('Google US English', 'en-US', false), V('Google UK English Female', 'en-GB', false), V('Google UK English Male', 'en-GB', false), V('Google Deutsch', 'de-DE', false),
];
const EDGE = [
  ...CHROME_DESKTOP.slice(0, 3), V('Microsoft Hazel - English (United Kingdom)', 'en-GB'), V('Microsoft George - English (United Kingdom)', 'en-GB'), V('Microsoft Catherine - English (Australia)', 'en-AU'),
  V('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false), V('Microsoft Guy Online (Natural) - English (United States)', 'en-US', false), V('Microsoft Sonia Online (Natural) - English (United Kingdom)', 'en-GB', false),
];
const ANDROID = [
  V('English United States', 'en-US', true, 'English United States', true), V('English United Kingdom', 'en-GB'), V('English Australia', 'en-AU'), V('English India', 'en-IN'), V('English Nigeria', 'en-NG'), V('Español Estados Unidos', 'es-US'),
];
const IOS_FEW = [V('Samantha', 'en-US', true, 'com.apple.voice.compact.en-US.Samantha', true), V('Daniel', 'en-GB', true, 'com.apple.voice.compact.en-GB.Daniel')];

const crewKeys = CREW_PROFILES.map((p) => p.key);
const signature = (a: { voiceURI: string | null; pitch: number; rate: number }) => `${a.voiceURI}|${a.pitch}|${a.rate}`;
const shuffle = <T,>(xs: T[], k: number) => xs.map((x, i) => [((i + 1) * 7919 * (k + 3)) % 104729, x] as const).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
const members = castMembers(start(42), K);

describe('v0.6.1 voice casting', () => {
  it('with many voices every crew member (and the computer) gets a different voice', () => {
    for (const list of [MAC_SAFARI, EDGE.map((v) => ({ ...v, localService: true })), ANDROID.concat(V('English Ireland', 'en-IE'), V('English South Africa', 'en-ZA'), V('English Canada', 'en-CA'), V('English Ghana', 'en-GH'))]) {
      const cast = assignVoices(list, members);
      const uris = crewKeys.map((k) => cast[k].voiceURI);
      expect(uris.every(Boolean)).toBe(true);
      expect(new Set(uris).size, list[0].name).toBe(crewKeys.length);
    }
  });

  it('casts to type on a Mac: calm US computer, British XO, deep male tactical officer, no novelty voices', () => {
    const cast = assignVoices(MAC_SAFARI, members);
    expect(cast.computer.voiceName).toBe('Samantha');
    expect(cast.marrow.voiceName).toBe('Kate');
    expect(cast.rask.voiceName).toBe('Alex');
    expect(cast.varga.voiceName).toBe('Moira');
    expect(cast.adeyemi.voiceName).toBe('Daniel');
    expect(cast.okafor.voiceName).toBe('Karen');
    expect(cast.rask.pitch).toBeLessThan(cast.computer.pitch);
    expect(cast.computer.rate).toBeLessThanOrEqual(1);
    for (const a of Object.values(cast)) expect(a.voiceName ?? '').not.toMatch(/Bells|Zarvox|Bad News|Whisper|Thomas|Anna/);
    for (const k of crewKeys) {
      const p = CREW_PROFILES.find((x) => x.key === k)!;
      const g = voiceGender({ name: cast[k].voiceName!, voiceURI: cast[k].voiceURI! });
      expect(g, k).toBe(p.gender);
    }
  });

  it('NPCs on comms get voices distinct from the bridge crew where possible', () => {
    const tm = castMembers(startT(5), TS);
    const cast = assignVoices(MAC_SAFARI, tm);
    const crew = new Set(crewKeys.map((k) => cast[k].voiceURI));
    for (const id of ['sabeth', 'marr']) {
      const a = cast[npcKey(TS.id, id)];
      expect(crew.has(a.voiceURI), id).toBe(false);
    }
    expect(cast[npcKey(TS.id, 'sabeth')].voiceURI).not.toBe(cast[npcKey(TS.id, 'marr')].voiceURI);
    const kc = assignVoices(MAC_SAFARI, members);
    expect(crew.has(kc[npcKey(K.id, 'vane')].voiceURI)).toBe(false);
  });

  it('crew voices do not depend on the scenario (NPCs are cast after the crew)', () => {
    const a = assignVoices(MAC_SAFARI, members);
    const b = assignVoices(MAC_SAFARI, castMembers(startT(9), TS));
    const c = assignVoices(MAC_SAFARI, castMembers(createBridge(1), bridgeScenario));
    for (const k of crewKeys) {
      expect(b[k]).toEqual(a[k]);
      expect(c[k]).toEqual(a[k]);
    }
  });

  it('is deterministic: same voices in any order give the same cast', () => {
    for (const list of [MAC_SAFARI, EDGE, ANDROID, IOS_FEW]) {
      const base = assignVoices(list, members);
      for (let k = 0; k < 5; k++) expect(assignVoices(shuffle(list, k), members)).toEqual(base);
    }
  });

  it('cloud voices are skipped unless allowed (Simulation Mode stays offline)', () => {
    const cast = assignVoices(CHROME_DESKTOP, members);
    for (const a of Object.values(cast)) expect(a.voiceName ?? '').not.toMatch(/^Google/);
    const online = assignVoices(CHROME_DESKTOP, members, { allowNetwork: true });
    expect(Object.values(online).some((a) => /^Google/.test(a.voiceName ?? ''))).toBe(true);
  });

  it.each([
    ['Android (one voice per locale)', ANDROID],
    ['iOS with two voices', IOS_FEW],
    ['one voice', IOS_FEW.slice(0, 1)],
    ['three voices (Windows Chrome, local only)', CHROME_DESKTOP],
    ['no voices', []],
    ['no English voices', [V('Thomas', 'fr-FR'), V('Anna', 'de-DE')]],
  ] as [string, VoiceInfo[]][])('falls back gracefully with %s: everyone still sounds different', (_name, list) => {
    const all = castMembers(startT(5), TS);
    const cast = assignVoices(list, all);
    expect(Object.keys(cast).sort()).toEqual(all.map((m) => m.key).sort());
    const sigs = all.map((m) => signature(cast[m.key]));
    expect(new Set(sigs).size).toBe(sigs.length);
    for (const a of Object.values(cast)) {
      expect(a.pitch).toBeGreaterThanOrEqual(0.5);
      expect(a.pitch).toBeLessThanOrEqual(1.6);
      expect(a.rate).toBeGreaterThanOrEqual(0.7);
      expect(a.rate).toBeLessThanOrEqual(1.4);
    }
    // Every usable voice is put to work (or the browser default when there is none).
    const usable = usableVoices(list);
    const used = new Set(crewKeys.map((k) => cast[k].voiceURI));
    if (usable.length === 0) expect([...used]).toEqual([null]);
    else for (const v of usable) expect(used.has(v.voiceURI), v.name).toBe(true);
    // The computer keeps its calm base pitch and rate even when voices are scarce.
    expect(cast.computer.pitch).toBe(1);
    expect(cast.computer.rate).toBe(0.95);
  });

  it('scarce voices: female officers share a female voice rather than borrow a male one', () => {
    for (const list of [IOS_FEW, CHROME_DESKTOP]) {
      const cast = assignVoices(list, members);
      for (const k of ['marrow', 'varga', 'szabo', 'okafor', 'osei']) expect(voiceGender({ name: cast[k].voiceName!, voiceURI: cast[k].voiceURI! }), `${list[0].name} ${k}`).toBe('female');
      for (const k of ['rask', 'adeyemi']) expect(voiceGender({ name: cast[k].voiceName!, voiceURI: cast[k].voiceURI! }), `${list[0].name} ${k}`).toBe('male');
    }
  });

  it('Android: crew are spread across English locales', () => {
    const cast = assignVoices(ANDROID, members);
    const langs = new Set(crewKeys.map((k) => cast[k].lang));
    expect(langs.size).toBe(5);
    expect(cast.marrow.lang).toBe('en-GB');
    expect(cast.adeyemi.lang).toBe('en-NG');
  });

  it('overrides win, reserve their voice, and persist through storage', () => {
    const mem = new Map<string, string>();
    const st = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    let s = loadVoiceSettings(st);
    expect(s).toEqual({ overrides: {}, allowNetwork: false });
    s = withOverride(s, 'rask', { voiceURI: 'Karen', pitch: 0.7 });
    s = withOverride(s, 'computer', { rate: 1.2 });
    saveVoiceSettings(s, st);
    expect(JSON.parse(mem.get(VOICE_SETTINGS_KEY)!)).toEqual({ overrides: { rask: { voiceURI: 'Karen', pitch: 0.7 }, computer: { rate: 1.2 } }, allowNetwork: false });
    const back = loadVoiceSettings(st);
    expect(back).toEqual(s);
    const cast = assignVoices(MAC_SAFARI, members, back);
    expect(cast.rask.voiceName).toBe('Karen');
    expect(cast.rask.pitch).toBe(0.7);
    expect(cast.rask.overridden).toBe(true);
    expect(cast.computer.rate).toBe(1.2);
    expect(cast.okafor.voiceName).not.toBe('Karen'); // Karen is now taken by Rask
    // Clearing an override restores automatic casting.
    const cleared = withOverride(back, 'rask', null);
    expect(assignVoices(MAC_SAFARI, members, cleared).rask.voiceName).toBe('Alex');
    // An overridden voice that is no longer on the device falls back to automatic.
    expect(assignVoices(MAC_SAFARI, members, withOverride(back, 'rask', { voiceURI: 'gone' })).rask.voiceName).not.toBe('gone');
    // Malformed storage is ignored.
    mem.set(VOICE_SETTINGS_KEY, '{"overrides":{"rask":{"pitch":"loud"},"x":null},"allowNetwork":"yes"}');
    expect(loadVoiceSettings(st)).toEqual({ overrides: {}, allowNetwork: false });
    mem.set(VOICE_SETTINGS_KEY, 'not json');
    expect(loadVoiceSettings(st)).toEqual({ overrides: {}, allowNetwork: false });
  });

  it('a scenario that declares voice hints lists only the characters it declares (the idle bridge: first contact)', () => {
    const b = createBridge(1);
    const npcs = castMembers(b, bridgeScenario).filter((m) => m.key.startsWith('npc:'));
    expect(npcs.map((m) => m.label)).toEqual(['First-contact speakers']);
    const t = castMembers(startT(5), TS).filter((m) => m.key.startsWith('npc:'));
    expect(t.map((m) => m.label).sort()).toEqual(['Capt. Juno Sabeth', 'Warden-Commander Isolde Marr']);
  });

  it('member list: computer and crew first, relief officers and the generic fallback last', () => {
    expect(members.slice(0, CREW_PROFILES.length).map((m) => m.key)).toEqual(crewKeys);
    expect(members.at(-1)).toBe(GENERIC_PROFILE);
    for (const r of RELIEF_PROFILES) expect(members.some((m) => m.key === r.key)).toBe(true);
    expect(members.some((m) => m.key === npcKey(K.id, 'vane'))).toBe(true);
  });
});

describe('v0.6.1 speaker tagging', () => {
  const SPOKEN = new Set(['crew', 'comms', 'narrative']);
  const check = (s: ReturnType<typeof start>, scenario: typeof K) => {
    const keys = new Set(castMembers(s, scenario).map((m) => m.key));
    const spoken = s.log.filter((e) => SPOKEN.has(e.channel) && e.speaker !== 'Captain');
    expect(spoken.length).toBeGreaterThan(5);
    for (const e of spoken) {
      expect(e.voice, `${e.speaker}: ${e.text}`).toBeTruthy();
      expect(keys.has(e.voice!) || e.voice!.startsWith('label:'), e.voice).toBe(true);
      expect(voiceKeyOf(e, s)).toBe(e.voice);
    }
    return spoken;
  };

  it('every spoken line in the Kestrel Incident names its speaker', () => {
    const s = play(start(42), ['scan the kestrel', 'hail the cruiser', 'tell the prefect this is a humanitarian rescue', 'hail the kestrel', 'red alert', 'helm, take us to 5000 km of the kestrel', 'status report']);
    const spoken = check(s, K);
    const by = (v: string) => spoken.filter((e) => e.voice === v);
    expect(by('narrator').every((e) => e.speaker === 'Narrator')).toBe(true);
    expect(by('rask').every((e) => e.speaker.startsWith('Lt. Cmdr. Teodor Rask'))).toBe(true);
    expect(by(npcKey(K.id, 'vane')).every((e) => e.speaker === 'Prefect Sorel Vane')).toBe(true);
    expect(by(npcKey(K.id, 'vane')).length).toBeGreaterThan(0);
    expect(spoken.some((e) => e.voice === 'label:Kestrel distress beacon')).toBe(true);
  });

  it('every spoken line in Quarantine at Tallis Gate names its speaker (Marr and Sabeth)', () => {
    const s = playT(startT(5), ['take us to 3,000 km of the liner', 'wait', 'wait', 'scan the liner', 'hail the picket', 'what do you want', 'close the channel', 'hail the liner', 'how many are sick']);
    const spoken = check(s, TS);
    expect(spoken.some((e) => e.voice === npcKey(TS.id, 'marr') && e.speaker === 'Warden-Commander Isolde Marr')).toBe(true);
    expect(spoken.some((e) => e.voice === npcKey(TS.id, 'sabeth'))).toBe(true);
  });

  it("a relief officer speaks with the relief officer's own voice key", () => {
    let s = start(42);
    s = patchCharacter(s, 'rask', { status: 'dead' });
    s = play(s, ['red alert', 'arm weapons']);
    const tactical = s.log.filter((e) => e.speaker.startsWith('Ens. Sera Pell'));
    expect(tactical.length).toBeGreaterThan(0);
    expect(tactical.every((e) => e.voice === 'relief_tactical')).toBe(true);
  });

  it('log lines saved before v0.6.1 (no voice key) are matched by speaker name', () => {
    const s = start(42);
    expect(voiceKeyOf({ speaker: 'Ship computer' }, s)).toBe('computer');
    expect(voiceKeyOf({ speaker: 'Narrator' }, s)).toBe('narrator');
    expect(voiceKeyOf({ speaker: 'Lt. Oona Varga' }, s)).toBe('varga');
    expect(voiceKeyOf({ speaker: 'Dr. Ama Osei (injured)' }, s)).toBe('osei');
    expect(voiceKeyOf({ speaker: 'Prefect Sorel Vane' }, s)).toBe(npcKey(kestrelScenario.id, 'vane'));
    expect(voiceKeyOf({ speaker: 'Fleet Command' }, s)).toBe('label:Fleet Command');
  });
});
