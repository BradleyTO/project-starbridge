/**
 * v0.5 (M3.1) first contact on the Active Duty bridge: an offline, deterministic DialogueProvider.
 *
 * At an investigated system the civilization occupies the bridge's contact slot (ship 'kestrel',
 * character 'arden'), so every existing comms mechanism applies: hail, persistent channel,
 * hold / close, clarification, and the ROE (Rask will not fire on a civilian station).
 * They ask why the Halcyon has come; the captain's answer (peaceful / firm / hostile) meets their
 * hidden disposition (engine/firstContact.ts) and the app records the outcome canonically.
 */
import type { DialogueProvider, SpeakAction } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { FirstContactState, WorldState } from '../../engine/types';
import { bumpRepeat, closeChannel, patchComms, recordLine } from '../../engine/comms';
import { contactOutcome, type Approach } from '../../engine/firstContact';
import { request } from '../../engine/bridge';

const HOSTILE = new Set(['warn', 'bluff', 'challenge']);
const FIRM = new Set(['demand', 'refuse', 'negotiate']);
const PEACEFUL = new Set(['declarePeaceful', 'greet', 'offerCooperation', 'humanitarian', 'appeal', 'promise', 'agree', 'legal', 'trade', 'requestAssist', 'offerAsylum']);
/** Words that make an otherwise peaceful line an aggressive one ("we come in peace, but our guns are ready"). */
const THREAT = /\b(or else|guns|weapons (are )?(ready|armed|hot)|destroy|surrender|submit|we will take|by force|annex|you will obey|comply or)\b/i;
const FIRM_WORDS = /\b(we (demand|require|insist)|you (must|will) (let|allow|tell)|concord (territory|space|claim)|under concord (law|authority)|by order of)\b/i;

export function approachOf(line: SpeakAction): Approach | null {
  const I = new Set(line.intents);
  if (THREAT.test(line.text) || [...I].some((i) => HOSTILE.has(i))) return 'hostile';
  if (FIRM_WORDS.test(line.text) || [...I].some((i) => FIRM.has(i))) return 'firm';
  if ([...I].some((i) => PEACEFUL.has(i))) return 'peaceful';
  if (/\b(peace|peaceful|friend|friends|explore|exploring|learn|meet you|hello|greetings|curious|science|survey|no harm|mean you no harm)\b/i.test(line.text)) return 'peaceful';
  return null;
}

function contactOf(s: WorldState): FirstContactState | null {
  return s.duty?.contact ?? null;
}

function patchContact(s: WorldState, patch: Partial<FirstContactState>): WorldState {
  const c = contactOf(s);
  if (!c || !s.duty) return s;
  return { ...s, duty: { ...s.duty, contact: { ...c, ...patch } } };
}

function line(s: WorldState, key: string, vars: Record<string, string | number> = {}): { state: WorldState; report: Report } {
  return { state: recordLine(s, { from: 'kestrel', intents: [], text: key }), report: comms('arden', key, vars) };
}

const SUGGEST = ['We come in peace. We are explorers from the Concord.', 'Who are your people?', 'We would like to establish contact.', 'Close the channel.'];

function conclude(s: WorldState, c: FirstContactState, approach: Approach, r: Report[]): Applied {
  const outcome = contactOutcome(c.disposition, approach);
  s = patchContact(s, { stage: 'concluded', approach, outcome });
  const l = line(s, `contactOutcome_${outcome}`, { people: c.people });
  s = request(l.state, 'firstContact', c.systemId, { response: approach });
  return { state: s, reports: [...r, l.report] };
}

export const contactDialogue: DialogueProvider = {
  id: 'bridge-first-contact',
  speakerName: (s) => contactOf(s)?.leader ?? 'unknown',
  vesselName: (s) => contactOf(s)?.station ?? 'unknown vessel',
  greet(s): Applied {
    const c = contactOf(s);
    if (!c) return { state: s, reports: [say('comms', 'bridgeNobodyToHail')] };
    if (c.stage === 'concluded') {
      const l = line(s, 'contactAgain', { outcome: c.outcome ?? '' });
      return { state: l.state, reports: [l.report] };
    }
    s = patchContact(s, { stage: 'talking' });
    s = patchComms(s, { pending: { party: 'kestrel', kind: 'explain', turn: s.turn }, suggestions: SUGGEST });
    const l = line(s, `contactGreet_${c.disposition}`, { station: c.station, people: c.people });
    return { state: l.state, reports: [l.report] };
  },
  respond(s, a): Applied {
    const c = contactOf(s);
    if (!c) return { state: s, reports: [say('comms', 'bridgeNobodyToHail')] };
    const I = new Set(a.intents);
    if (I.has('end')) {
      const l = line(s, c.stage === 'concluded' ? 'contactFarewell' : 'contactCutOff', { people: c.people });
      return { state: closeChannel(l.state, 'kestrel'), reports: [l.report] };
    }
    if (c.stage === 'concluded') {
      const l = line(s, 'contactAgain', { outcome: c.outcome ?? '' });
      return { state: l.state, reports: [l.report] };
    }
    const approach = approachOf(a);
    // Questions are answered (their people, their world) and they ask again why the Halcyon came.
    if (!approach && I.has('ask')) {
      const asks = c.asks + 1;
      s = patchContact(s, { asks });
      const l = line(s, asks >= 3 ? `contactPress_${c.disposition}` : `contactAnswer_${c.disposition}`, { v: asks - 1, people: c.people });
      return { state: l.state, reports: [l.report] };
    }
    if (!approach) {
      const b = bumpRepeat(s, 'contact:unknown');
      s = patchComms(b.state, { suggestions: SUGGEST });
      const l = line(s, 'contactUnclear', { v: b.before % 3 });
      return { state: l.state, reports: [l.report] };
    }
    return conclude(s, c, approach, []);
  },
  onPromiseBroken: (s) => ({ state: s, reports: [] }),
};

export const CONTACT_TEMPLATES: Record<string, (v: Record<string, string | number>) => string> = {
  contactGreet_open: (v) => `This is the ${v.station}. We have listened to your ships cross our sky for a generation, Halcyon. Now you have come. Why?`,
  contactGreet_cautious: () => 'You are far from your own stars. Speak your purpose — and keep your distance while you do.',
  contactGreet_isolationist: () => 'This is the Quiet Council. We did not call you. Say why you are here, and say it briefly.',
  contactGreet_guarded: (v) => `Unknown vessel: you are under the guns of the ${v.station}. State your purpose, or leave our system.`,
  contactAnswer_open: (v) => ['We are the Ossari. One world, three moons, and a great deal of listening. We have learned your languages from your broadcasts. And you — why have you come?', 'Our cities are on the coasts; our council is chosen by the oldest listeners. Now answer us: why are you here?'][Number(v.v) % 2],
  contactAnswer_cautious: (v) => ['We are the Kethren. We trade among our own moons and we remember what happened the last time strangers came. Your purpose?', 'What we are is our concern. What you want is the question.'][Number(v.v) % 2],
  contactAnswer_isolationist: (v) => ['We are the Lumae. We have chosen to be few and quiet. That is all you need to know. Why are you here?', 'Our ways are our own. Your purpose, Captain.'][Number(v.v) % 2],
  contactAnswer_guarded: (v) => ['We are the Drassk, and this is our system. Others have come with soft words before. Why are YOU here?', 'You ask a great deal for a guest who has not said why he came.'][Number(v.v) % 2],
  contactPress_open: () => 'You ask and ask, Halcyon. We will answer more once you tell us why you came.',
  contactPress_cautious: () => 'Enough questions. Your purpose, or we end this.',
  contactPress_isolationist: () => 'We will not be studied. Your purpose.',
  contactPress_guarded: () => 'Last time: why are you here?',
  contactUnclear: (v) => ['We do not follow. Speak plainly: why have you come?', 'Your words do not translate well. Peace, trade, or something else?', 'We are waiting for your purpose, Halcyon.'][Number(v.v) % 3],
  'contactOutcome_membership-talks': (v) => `Then you are welcome, Halcyon. The ${v.people} would hear what your Concord is — and what joining it would mean. Send your envoys; we will listen.`,
  'contactOutcome_trade-contact': (v) => `Then we will trade knowledge, and perhaps goods. But understand: the ${v.people} will not join your Concord. We have seen what alliances cost.`,
  'contactOutcome_wary-contact': (v) => `Words are easily spoken. The ${v.people} will watch what your ships do, not what you say. You may go.`,
  contactOutcome_declined: () => 'Your courtesy is noted, Captain, and it is returned. Our answer is no. We want no contact with your Concord. Do not come back uninvited.',
  'contactOutcome_warned-off': () => 'Leave our system. Now. Do not mistake our patience for welcome.',
  contactOutcome_hostile: (v) => `Then we understand each other. Leave — and tell your Concord the ${v.people} will be ready for the next ship.`,
  contactAgain: () => 'We have said what we had to say, Halcyon.',
  contactFarewell: () => 'Go well, Halcyon.',
  contactCutOff: () => 'You came all this way to say nothing? Very well.',
};
