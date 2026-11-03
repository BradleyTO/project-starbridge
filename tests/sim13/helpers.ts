import { expect } from 'vitest';
import { seventhBellScenario } from '../../src/scenarios/seventhbell';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { bell, type BellVariant, type Truth } from '../../src/scenarios/seventhbell/setup';
import { evidenceComplete } from '../../src/scenarios/seventhbell/agents';

export const BELL_SIM = seventhBellScenario;

export function startB(seed: number | string): WorldState {
  return completeIntro(BELL_SIM.create(seed), BELL_SIM);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playB(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(BELL_SIM, s, cmd);
    if (check) {
      expect(checkInvariants(s), `after "${cmd}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${cmd}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playB(s, ['wait'], check);
  return s;
}

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playB(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: BellVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(bell(BELL_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|delegat\w*|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Penhale|Corley|Toller|Hadley|Myrr|Ketter|Mattock|Ember Tide|Strome|Ferrier|furnace|Intergalactic|the Agency)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export const toStavely = (...lines: string[]) => ['hail the Tamber', ...lines, 'close the channel'];
export const toVory = (...lines: string[]) => ['hail the courier', ...lines, 'close the channel'];

export const HEAR_LINE = 'Tell me what happened, in your own words.';
export const REGRET_LINE = 'I am deeply sorry for your dead.';
export const VORY_ACCOUNT = 'Tell me what happened.';
export const SHARE_LINE = 'We will share everything we have with you.';
export const LEAVE_LINE = 'With your leave, may our doctor examine your dead?';
export const REFUSE_LINE = 'Szabo, signal Fleet Command: I refuse the directive, because it would require a finding before the evidence and in breach of the Code.';
export const REFER_LINE = 'Szabo, refer the directive to the ISA Office of Independent Review.';
export const DECLINE_LINE = 'Szabo, tell the Admiral I decline to keep it quiet.';
export const BARE_REFUSE = 'Tell Fleet Command I refuse.';
export const COMPLY_LINE = 'Reply to the Admiral: we will comply.';

export const FINDING_LINE: Record<Truth, string> = {
  misread: 'My finding is that the Tamber fired in good faith on a misread navigation sweep: an honest mistake.',
  lawful: 'My finding is that the Tamber fired lawfully, in self-defence: the courier locked first.',
  second: 'My finding is that the second volley was unlawful: the courier had turned away.',
};
export const SELF_DEFENCE = FINDING_LINE.lawful;
export const UNLAWFUL = FINDING_LINE.second;
export const MISTAKE = FINDING_LINE.misread;

/** The evidence orders: Rask's read (asked to set his tie aside), the courier's damage, and the Bell (recovered first if damaged). */
export function investigate(s: WorldState, opts: { cold?: boolean; debris?: boolean; bell?: boolean } = {}): WorldState {
  s = playB(s, ["Rask, read the Tamber's fire-control record"]);
  if (opts.cold !== false) s = playB(s, ['Rask, do you know Captain Stavely?']);
  if (opts.debris !== false) s = playB(s, ["Varga, scan the courier's damage"]);
  if (opts.bell !== false) s = playB(s, [bell(s).bell === 'intact' ? "Szabo, pull the Bell's record" : "Chief, recover the Bell's recorder"]);
  return s;
}

export interface Plan {
  hear?: boolean;
  regret?: boolean;
  share?: boolean;
  aid?: boolean;
  cold?: boolean;
  bell?: boolean;
  debris?: boolean;
  /** How the captain answers Fleet Command: 'formal' refuses with reasons (or declines, if asked to keep quiet), 'refer' adds the Office of Independent Review. */
  fleet?: 'formal' | 'refer' | 'none' | 'comply';
  /** Show Stavely the evidence before the finding. */
  showStavely?: boolean;
  /** Override the finding (defaults to the true one). */
  finding?: string;
}

/** The careful captain: hears both sides, gathers the evidence, answers Fleet, then makes the finding to the examiner. */
export function careful(seed: number | string, p: Plan = {}): WorldState {
  let s = startB(seed);
  const v = bell(s);
  s = investigate(s, { cold: p.cold, debris: p.debris, bell: p.bell });
  if (p.hear !== false) s = playB(s, toStavely(HEAR_LINE));
  const vl: string[] = [];
  if (p.regret !== false) vl.push(REGRET_LINE);
  vl.push(VORY_ACCOUNT);
  if (p.aid) vl.push('Do you need medical help? Our doctor can come aboard.');
  s = playB(s, toVory(...vl));
  s = until(s, (x) => evidenceComplete(x) && (p.bell === false || knows(x, 'bell')) && (v.pressure === 'report' || p.fleet === 'none' || !!x.flags.fleetSignal));
  if (p.share) s = playB(s, toVory(SHARE_LINE));
  if (p.fleet !== 'none' && v.pressure !== 'report') {
    if (p.fleet === 'comply') s = playB(s, [COMPLY_LINE]);
    else {
      s = playB(s, [v.pressure === 'quiet' ? DECLINE_LINE : REFUSE_LINE]);
      if (p.fleet === 'refer') s = playB(s, [REFER_LINE]);
    }
  }
  if (p.showStavely) s = playB(s, toStavely('Captain Stavely, the evidence shows what happened, and the record and the Bell agree.'));
  return playB(s, toVory(p.finding ?? FINDING_LINE[v.truth]));
}

export { bell, evidenceComplete, knows };
