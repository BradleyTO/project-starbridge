/**
 * v0.6.1 voice profiles: who should sound like what. Pure data; no browser APIs.
 *
 * Each profile names the traits we want (gender, preferred English locales, ranked candidate voice
 * names across platforms) plus a base pitch and rate. The caster (cast.ts) turns these into real
 * voices from whatever speechSynthesis.getVoices() offers on the device.
 *
 * Candidate names, by platform:
 *  - Apple (Safari macOS / iOS): Samantha, Daniel, Karen, Moira, Tessa, Rishi, Fiona, Alex, Fred,
 *    Victoria, Serena, Kate, Oliver, Arthur, Martha, Catherine, Gordon, Aaron, Nicky, Evan, Allison, Ava.
 *  - Windows (Edge / Chrome): Microsoft Zira, David, Mark, Hazel, George, Susan, Catherine, Heera,
 *    Ravi, James, Linda, Richard, Sean (local) and the "Online (Natural)" voices (cloud).
 *  - Chrome desktop: "Google US English", "Google UK English Female/Male" (cloud voices).
 *  - Android Chrome: usually one voice per locale ("English United States", "English United
 *    Kingdom", ...), sometimes with engine codes such as en-us-x-iom / en-gb-x-gbd. Locale hints are
 *    what separate the crew there.
 */
export type VoiceGender = 'female' | 'male' | 'neutral';

/** Optional voice hints a scenario can declare for its characters (see docs/SCENARIO_GUIDE.md). */
export interface VoiceHint {
  gender?: VoiceGender;
  /** Preferred BCP-47 English locales, best first (e.g. ['en-GB', 'en-IE']). */
  locales?: string[];
  /** Preferred voice names, best first (matched as whole words against name and voiceURI). */
  candidates?: string[];
  /** Base pitch 0.5–1.6 (1 = normal) and rate 0.7–1.4 (1 = normal). */
  pitch?: number;
  rate?: number;
  /** Optional display name for the voice panel (defaults to the character's name). */
  label?: string;
}

export interface VoiceProfile extends Required<Omit<VoiceHint, 'label'>> {
  /** Voice key: a crew character id, 'computer', 'narrator', 'npc:<scenario>:<id>', 'label:<text>' or '*'. */
  key: string;
  /** Who this is, for the panel ("Lt. Cmdr. Teodor Rask"). */
  label: string;
  /** What they do ("Tactical"). */
  role: string;
  /** A short line used by the preview button. */
  sample: string;
}

const P = (key: string, label: string, role: string, h: Required<Omit<VoiceHint, 'label'>>, sample: string): VoiceProfile => ({ key, label, role, sample, ...h });

/** The ship's computer and the bridge crew, in assignment priority order (the computer picks first). */
export const CREW_PROFILES: VoiceProfile[] = [
  P('computer', 'Ship computer', 'Computer', {
    gender: 'female', locales: ['en-US', 'en-CA'], pitch: 1.0, rate: 0.95,
    candidates: ['Samantha', 'Allison', 'Ava', 'Microsoft Zira', 'Google US English', 'Microsoft Aria', 'en-us-x-tpc', 'en-us-x-sfg', 'Linda'],
  }, 'Computer online. All systems nominal.'),
  P('marrow', 'Cmdr. Ilse Marrow', 'First Officer', {
    gender: 'female', locales: ['en-GB', 'en-IE'], pitch: 0.95, rate: 1.0,
    candidates: ['Kate', 'Serena', 'Martha', 'Stephanie', 'Microsoft Hazel', 'Microsoft Sonia', 'Google UK English Female', 'en-gb-x-gba', 'en-gb-x-gbc'],
  }, 'Captain, the bridge is yours. All departments report ready.'),
  P('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', {
    gender: 'male', locales: ['en-US', 'en-CA'], pitch: 0.82, rate: 0.98,
    candidates: ['Alex', 'Aaron', 'Evan', 'Nathan', 'Fred', 'Microsoft David', 'Microsoft Guy', 'Microsoft Richard', 'en-us-x-iom', 'en-us-x-tpd'],
  }, 'Tactical. Weapons are safe and standing by, Captain.'),
  P('varga', 'Lt. Oona Varga', 'Sensors & Science', {
    gender: 'female', locales: ['en-IE', 'en-AU', 'en-ZA', 'en-NZ'], pitch: 1.08, rate: 1.06,
    candidates: ['Moira', 'Tessa', 'Fiona', 'Microsoft Emily', 'Microsoft Libby', 'Microsoft Natasha', 'en-ie', 'en-au-x-afa'],
  }, 'Sensors. I am reading something out there, Captain, and it is fascinating.'),
  P('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', {
    gender: 'male', locales: ['en-NG', 'en-GB', 'en-ZA', 'en-GH'], pitch: 1.04, rate: 1.08,
    candidates: ['Daniel', 'Oliver', 'Arthur', 'Microsoft George', 'Microsoft Ryan', 'Google UK English Male', 'en-gb-x-gbd', 'en-gb-x-rjs'],
  }, 'Helm. Course laid in, ready when you are, Captain.'),
  P('szabo', 'Lt. Mirela Szabo', 'Communications', {
    gender: 'female', locales: ['en-US', 'en-CA', 'en-GB'], pitch: 1.12, rate: 1.0,
    candidates: ['Victoria', 'Susan', 'Ava', 'Allison', 'Nicky', 'Microsoft Michelle', 'Microsoft Jenny', 'en-us-x-iob', 'en-us-x-iog'],
  }, 'Communications. Hailing frequencies are open.'),
  P('okafor', 'Chief Dana Okafor', 'Engineering', {
    gender: 'female', locales: ['en-AU', 'en-ZA', 'en-NZ', 'en-IN'], pitch: 0.9, rate: 1.1,
    candidates: ['Karen', 'Catherine', 'Microsoft Catherine', 'Microsoft Natasha', 'Microsoft Heera', 'Veena', 'Isha', 'en-au-x-auc', 'en-in-x-ena'],
  }, 'Engineering. She will hold together, Captain, but do not ask me for miracles.'),
  P('osei', 'Dr. Ama Osei', 'Medical', {
    gender: 'female', locales: ['en-GH', 'en-IN', 'en-GB', 'en-US'], pitch: 1.02, rate: 0.93,
    candidates: ['Samantha', 'Serena', 'Microsoft Emma', 'Microsoft Clara', 'Microsoft Neerja', 'en-us-x-tpf', 'en-gb-x-gbg', 'en-in-x-enc'],
  }, 'Sickbay. Everyone here is stable, Captain.'),
  P('narrator', 'Narrator', 'Narration', {
    gender: 'male', locales: ['en-GB', 'en-US'], pitch: 0.9, rate: 0.95,
    candidates: ['Daniel', 'Arthur', 'Gordon', 'Microsoft George', 'Microsoft James', 'Microsoft Christopher', 'Google UK English Male', 'en-gb-x-gbd'],
  }, 'The Halcyon holds station at the edge of the Reach.'),
];

/** Relief officers stand in when a primary officer is lost; they are cast last. */
export const RELIEF_PROFILES: VoiceProfile[] = [
  ['relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'male', ['en-GB', 'en-US'], 0.86, 0.98],
  ['relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'female', ['en-US', 'en-CA'], 1.0, 1.04],
  ['relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'female', ['en-AU', 'en-IE'], 1.12, 1.02],
  ['relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'male', ['en-US', 'en-GB'], 0.95, 1.05],
  ['relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'female', ['en-GB', 'en-US'], 1.06, 1.0],
  ['relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'neutral', ['en-US', 'en-AU'], 1.0, 1.08],
  ['relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'male', ['en-US', 'en-GB'], 0.98, 0.96],
].map(([key, label, role, gender, locales, pitch, rate]) =>
  P(key as string, label as string, role as string, { gender: gender as VoiceGender, locales: locales as string[], pitch: pitch as number, rate: rate as number, candidates: [] }, `${label as string}, standing in.`),
);

/** Voices heard over comms that are not tied to a scenario character. */
export const LABEL_PROFILES: VoiceProfile[] = [
  P('label:Fleet Command', 'Admiral Odessa Kaine', 'ISA Fleet Command', {
    gender: 'female', locales: ['en-US', 'en-CA'], pitch: 0.88, rate: 0.96, candidates: ['Susan', 'Microsoft Linda', 'Allison'],
  }, 'Halcyon, this is Fleet Command.'),
];

/** The fallback for any other speaker (beacons, broadcasts, unknown parties). */
export const GENERIC_PROFILE: VoiceProfile = P('*', 'Other speakers', 'Comms', { gender: 'neutral', locales: ['en-US', 'en-GB'], pitch: 1.0, rate: 1.0, candidates: [] }, 'This is an open broadcast.');

/** A profile for a scenario character from its (optional) hints. */
export function npcProfile(key: string, name: string, role: string, hint: VoiceHint | undefined): VoiceProfile {
  const label = hint?.label ?? name;
  return P(key, label, hint?.label ? 'Comms' : role, {
    gender: hint?.gender ?? 'neutral',
    locales: hint?.locales ?? ['en-US', 'en-GB'],
    candidates: hint?.candidates ?? [],
    pitch: hint?.pitch ?? 1.0,
    rate: hint?.rate ?? 1.0,
  }, `This is ${label}.`);
}
