/**
 * v0.7.1: ISA Fleet Command and Training Command as a comms party (not a ship), and the answers to
 * the captain's training questions. Offline and deterministic. Everything said comes from the
 * Training Record summary the app stamps on the state (WorldState.career) and the captain's
 * address; nothing here reads or touches a scenario's ships or characters.
 */
import type { Report } from './report';
import { say } from './report';
import type { WorldState } from './types';
import { formalOf } from './captain';
import { settingOf } from './setting';
import type { CareerBrief } from '../career/advice';

export type CareerTopic = 'needs' | 'strengths' | 'progress' | 'record' | 'recommend';

const NUMBER = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const count = (n: number, noun: string) => `${NUMBER[n] ?? 'many'} ${noun}${n === 1 ? '' : 's'}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const lower = (xs: string[]) => xs.map((x) => x.toLowerCase());

function recommendLine(b: CareerBrief, n = 2): string {
  const r = b.recommend.slice(0, n);
  if (!r.length) return 'Say "list simulations" to hear what is on file.';
  return `I would recommend ${r.map((x) => `${x.name}, because ${x.why}`).join('; or ')}.`;
}

/** The answer to a training question, from the Training Record (words, no scores). */
export function careerText(s: WorldState, topic: CareerTopic): string {
  const b = s.career;
  if (!b) return 'Your Training Record is not available on this console right now. It is in the Hub, under Service Record, Training.';
  if (b.assessed === 0) {
    const lead = topic === 'strengths' ? 'There is no evidence yet to say where your strengths lie' : topic === 'progress' ? 'There is nothing to measure yet' : topic === 'needs' ? 'I cannot tell you what you need yet' : topic === 'record' ? 'Your Training Record is empty so far' : 'There is no evidence on file to tailor a recommendation';
    return `${lead}: no exercise has been assessed. ${recommendLine(b)}`;
  }
  const latest = b.latest ? `Your most recent exercise was ${b.latest.title}: ${b.latest.outcome}, with conduct recorded as ${b.latest.conduct}.` : '';
  switch (topic) {
    case 'needs': {
      if (!b.concerns.length) return `Your record shows no concerns so far (${count(b.assessed, 'exercise')} assessed). The gaps are what has not been tested yet. ${recommendLine(b)}`;
      const ev = b.evidence[0] ? ` The evidence: ${b.evidence[0].replace(/^Concern in /, '')}` : '';
      const tr = b.training[0] ? ` Training Command also recommends: ${b.training[0]}` : '';
      return `Your record shows concern in ${list(lower(b.concerns))}.${ev}${tr} ${recommendLine(b, 1)}`;
    }
    case 'strengths':
      if (!b.strengths.length) return `No clear strengths on the record yet, from ${count(b.assessed, 'exercise')}. ${latest}`.trim();
      return `Your record shows strength in ${list(lower(b.strengths))}.${b.evidence.find((e) => e.startsWith('Strength')) ? ` For example: ${b.evidence.find((e) => e.startsWith('Strength'))!.replace(/^Strength in /, '')}` : ''}`;
    case 'progress':
      return `${count(b.assessed, 'exercise')[0].toUpperCase()}${count(b.assessed, 'exercise').slice(1)} assessed so far. ${latest} ${b.bands.length ? `Competencies: ${b.bands.slice(0, 4).join('; ')}${b.bands.length > 4 ? '; and more in the Service Record' : ''}.` : ''}`.replace(/\s+/g, ' ').trim();
    case 'record':
      return `Training Record: ${count(b.assessed, 'exercise')} assessed. ${b.bands.length ? `${b.bands.join('; ')}.` : ''} ${latest} The full reports are in the Hub, Service Record, Training.`.replace(/\s+/g, ' ').trim();
    case 'recommend':
      return `${b.concerns.length ? `With concern on record in ${list(lower(b.concerns))}: ` : ''}${recommendLine(b)}`;
  }
}

/** The XO (or the computer) answers a training question on the bridge or in a simulation. */
export function careerAnswer(s: WorldState, topic: CareerTopic): Report[] {
  return [say('xo', 'careerAnswer', { text: careerText(s, topic) })];
}

/** A call to ISA Fleet Command / Training Command: who answered, what can be done now, what is coming. */
export function fleetCall(s: WorldState, to: 'fleet' | 'training', topic: CareerTopic | null): Report[] {
  const where = settingOf(s);
  const formal = formalOf(s);
  const training = to === 'training' || !!topic;
  const fleet = (text: string, label: string) => ({ ...say({ label }, 'fleetLine', { text }, 'comms') });
  const out: Report[] = [say('comms', 'fleetOpening', { who: training ? 'ISA Training Command' : 'ISA Fleet Command' })];
  if (where.kind === 'simulation') {
    out.push(fleet(`Exercise control, ISA Training Command. This is a training simulation, ${formal}: the people in it are part of the exercise, and we are not. Carry on; your after-action report will be ready when it ends.`, 'ISA Training Command (exercise control)'));
    if (topic) out.push(fleet(careerText(s, topic), 'ISA Training Command (exercise control)'));
    return out;
  }
  const label = training ? 'ISA Training Command' : 'ISA Fleet Command';
  const officer = training ? 'Lieutenant Commander Priya Halvorsen, Training Command records' : 'Commander Ines Valcourt, Fleet Command duty officer';
  const waiting = s.duty?.incoming ? ` Your answer on "${s.duty.incoming.title}" is still awaited.` : '';
  const mission = where.kind === 'mission' ? ` We have your mission log; the decision on scene is yours.` : '';
  out.push(fleet(`${officer}. Go ahead, ${formal}.${mission}${waiting}`, label));
  if (topic) {
    out.push(fleet(careerText(s, topic), label));
    return out;
  }
  out.push(
    fleet(
      `On this line I can read you your training record and competencies, recommend simulations, and give you the status of any request on file; you have none at present. Assignment, supply, personnel and legal requests through Fleet Command come in a later update.`,
      label,
    ),
  );
  return out;
}
