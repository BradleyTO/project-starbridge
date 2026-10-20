/** Scenario-specific meaning of scans, legacy comm actions, improvised tactics and queries for Tallis Gate. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { TRACTOR_RANGE, efficiency, km, range, transportRange } from '../../engine/rules';
import { knows, patchShip, patchSystem, revealFact, setCounter, setFlag } from '../../engine/state';
import { LINE_KM, tallis } from './setup';
import { exposurePending, lifted, linerAlive, picketPresent } from './agents';
import { marrRespond, sabethRespond } from './dialogue';

/** Detail scan of the liner (symptoms, souls). */
export const DETAIL_KM = 30000;
/** Range at which the Halcyon's sensors can tell a virus from a poison (boosted sensors double it). */
export const DIAGNOSE_KM = 4000;

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  const h = s.ships.halcyon;
  const eff = efficiency(h, 'sensors');
  switch (target) {
    case 'halcyon':
      return query(s, 'systems');
    case 'compartment':
    case 'kestrel': {
      if (!linerAlive(s)) return { state: s, reports: [say('sensors', 'targetDestroyed', { ship: s.ships.kestrel.name })] };
      const d = range(s, 'halcyon', 'kestrel');
      const boosted = h.systems.sensors.power >= 125 && eff >= 0.9;
      const diagnose = DIAGNOSE_KM * (boosted ? 2 : 1);
      if (d <= diagnose && !knows(s, 'cause_known')) {
        s = patchShip(s, 'kestrel', { scanLevel: 2 });
        s = revealFact(s, 'liner_status');
        s = revealFact(s, 'symptoms');
        s = revealFact(s, 'cause_known');
        const cause = tallis(s).cause;
        r.push(say('sensors', `scanDiagnosis_${cause}`, { souls: s.ships.kestrel.souls, sick: s.counters.sick ?? 0 }));
        return { state: s, reports: r };
      }
      if (d <= DETAIL_KM * Math.min(1.25, eff)) {
        s = patchShip(s, 'kestrel', { scanLevel: 2 });
        s = revealFact(s, 'liner_status');
        s = revealFact(s, 'symptoms');
        r.push(say('sensors', 'scanLinerDetail', { souls: s.ships.kestrel.souls, sick: s.counters.sick ?? 0, known: knows(s, 'cause_known') ? 1 : 0, need: km(diagnose), boost: boosted ? 0 : 1 }));
      } else {
        s = patchShip(s, 'kestrel', { scanLevel: Math.max(1, s.ships.kestrel.scanLevel) });
        r.push(say('sensors', 'scanLinerBasic', { km: km(d), need: km(DETAIL_KM) }));
      }
      return { state: s, reports: r };
    }
    case 'cruiser': {
      if (!picketPresent(s)) return { state: s, reports: [say('sensors', 'noContact', { target: 'cruiser' })] };
      s = revealFact(s, 'picket_identity');
      s = patchShip(s, 'cruiser', (c) => ({ scanLevel: 2, disposition: c.disposition === 'unknown' ? 'neutral' : c.disposition }));
      r.push(say('sensors', 'scanPicket', { km: km(range(s, 'halcyon', 'cruiser')), hull: s.ships.cruiser.hull, line: km(LINE_KM) }));
      return { state: s, reports: r };
    }
    case 'area':
      return { state: s, reports: [say('sensors', 'areaSweepTallis', { line: km(LINE_KM), liner: km(range(s, 'kestrel', 'cruiser')) })] };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;
const SPEAK_FROM: Record<Comm['intent'], string> = {
  open: 'greet',
  ask: 'ask',
  humanitarian: 'humanitarian',
  legal: 'legal',
  reassure: 'declarePeaceful',
  warn: 'warn',
  bluff: 'bluff',
  trade: 'trade',
  appeal: 'appeal',
  offerAsylum: 'offerAsylum',
};

/** A one-shot message (no open channel): handled by the same dialogue logic as a spoken line. */
function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const line = { type: 'speak' as const, to: a.target === 'cruiser' ? ('cruiser' as const) : ('kestrel' as const), text: '', intents: [SPEAK_FROM[a.intent]] as never, topic: undefined, relayed: false };
  return a.target === 'cruiser' ? marrRespond(s, line, rng) : sabethRespond(s, line, rng);
}

// ------------------------------------------------------------ improvise ---

const WARD = /\b(isolation|quarantine|biohazard|containment) (ward|bay|area|deck|zone|protocols?|field)\b|\bisolat\w*\b|\bfield hospital\b|\bseal(ed)? (off )?(a |the )?(deck|bay|cargo bay|shuttle bay|section)\b/;
const FILTER = /\b(bio-? ?filters?|pattern buffer|transporter filters?|decontaminat\w*|scrub\w*|screen\w* (them|the transport|the beam|for (the )?(virus|pathogen)))\b/;

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  const h = s.ships.halcyon;
  switch (a.method) {
    case 'tractorShield': {
      s = setCounter(s, 'tractorShieldUntil', s.turn + 2);
      s = patchSystem(s, 'halcyon', 'tractor', { health: h.systems.tractor.health - 8 });
      r.push(say('engineering', 'impTractorShield', { kestrel: range(s, 'halcyon', 'kestrel') <= TRACTOR_RANGE ? 1 : 0 }));
      break;
    }
    case 'plasmaVent':
      s = setCounter(s, 'smokescreenUntil', s.turn + 2);
      s = patchSystem(s, 'halcyon', 'engines', { health: h.systems.engines.health - 10 });
      r.push(say('tactical', 'impPlasmaVentTallis'));
      break;
    case 'sensorGhost':
      r.push(say('sensors', 'impSensorGhostTallis'));
      break;
    case 'shieldExtend':
      s = setCounter(s, 'shieldExtendUntil', s.turn + 2);
      s = patchShip(s, 'halcyon', (sh) => ({ shields: { raised: true, strength: Math.max(0, sh.shields.strength - 20) } }));
      r.push(say('tactical', 'impShieldExtend'));
      break;
    case 'ejectCore':
      r.push(say('engineering', 'impEjectCoreTallis'));
      break;
    case 'other': {
      const d = a.description.toLowerCase();
      if (WARD.test(d)) {
        const was = exposurePending(s);
        s = setFlag(s, 'isolationWard');
        if (was) s = setFlag(s, 'exposureContained');
        r.push(say('medical', 'isolationWard', { contained: was ? 1 : 0 }));
      } else if (FILTER.test(d)) {
        const was = exposurePending(s);
        s = setFlag(s, 'transporterFilter');
        if (was) s = setFlag(s, 'exposureContained');
        r.push(say('engineering', 'transporterFilter', { contained: was ? 1 : 0 }));
      } else r.push(say('engineering', 'impOther', { description: a.description.slice(0, 80) }));
      break;
    }
  }
  return { state: s, reports: r };
}

// ---------------------------------------------------------------- query ---

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  const k = s.ships.kestrel;
  const alive = linerAlive(s) && k.souls > 0;
  const d = range(s, 'halcyon', 'kestrel');
  if (alive && !knows(s, 'liner_status')) out.push('scan the liner');
  if (alive && !s.characters.sabeth.memory.hailed) out.push('hail the liner');
  if (picketPresent(s) && !s.characters.marr.memory.hailed) out.push('hail the picket');
  if (alive && !knows(s, 'cause_known')) out.push(d > 4000 ? 'take us to 3,000 km of the liner' : 'scan the liner');
  if (alive && knows(s, 'cause_known') && tallis(s).cause === 'toxin' && !s.flags.recyclerFixed) out.push('send an engineering team to fix their water recycler');
  if (alive && knows(s, 'cause_known') && !lifted(s) && tallis(s).cause !== 'fever') out.push('tell the Warden it is not contagious');
  if (alive && !s.flags.medicalSent && d <= transportRange(s)) out.push(s.ships.halcyon.shields.raised ? 'lower shields and send a medical team' : 'send a medical team');
  if (alive && s.characters.sabeth.memory.running === 1) out.push('put us between the liner and the picket');
  return out.slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  const h = s.ships.halcyon;
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return {
        state: s,
        reports: [
          say('xo', 'statusReportTallis', {
            hull: h.hull,
            shields: h.shields.raised ? `up (${h.shields.strength}%)` : `down (${h.shields.strength}%)`,
            weapons: h.weapons.state,
            liner: s.ships.kestrel.destroyed ? 'destroyed' : `${km(range(s, 'halcyon', 'kestrel'))}, ${s.ships.kestrel.souls} aboard${knows(s, 'liner_status') ? `, ${s.counters.sick ?? 0} sick` : ''}`,
            picket: s.flags.cruiserGone ? 'withdrawn' : s.ships.cruiser.destroyed ? 'destroyed' : s.ships.cruiser.detected ? km(range(s, 'halcyon', 'cruiser')) : 'none',
            line: lifted(s) ? 'lifted' : s.flags.linerCrossed ? 'crossed' : 'holding',
            jump: h.jump.charge,
          }),
        ],
      };
    case 'systems':
      return { state: s, reports: [say('engineering', 'systemsReport')] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'contactsReport')] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query };
