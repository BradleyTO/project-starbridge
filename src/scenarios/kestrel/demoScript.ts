/**
 * MILESTONE 1 — SCRIPTED DEMONSTRATION
 *
 * A deterministic, keyword-driven stand-in for the real command pipeline.
 * It exists to exercise the UI end-to-end. It is NOT the natural-language
 * interpreter planned for Milestone 2 (interpret → validate → apply → NPC turn
 * → narrate); it only recognises a small vocabulary of orders.
 *
 * Every function here is pure: (state, input) => new state.
 */
import type { WorldState } from '../../engine/types';
import {
  addLog,
  addObjective,
  clamp,
  getContact,
  setCounter,
  setFlag,
  setObjective,
  updateContact,
} from '../../engine/state';
import { COMPUTER, CREW, NPC } from './crew';
import { SCENARIO_TITLE } from './initialState';

export const TURN_SECONDS = 60;
export const CLOSE_RANGE_KM = 5000;

export const DEMO_SUGGESTIONS = [
  'Scan the Kestrel',
  'Hail the Kestrel',
  'Scan the cruiser',
  'Hail the cruiser',
  'Explain this is a humanitarian rescue',
  'Raise shields',
  'Approach the Kestrel',
  'Lower shields',
  'Evacuate the Kestrel crew',
  'Engage tractor beam',
  'Withdraw',
  'Status report',
  'Help',
];

// ---------------------------------------------------------------- opening ---

type Beat = (s: WorldState) => WorldState;

export const OPENING_BEATS: Beat[] = [
  (s) => {
    s = addLog(s, 'system', COMPUTER, `${SCENARIO_TITLE} — scripted demonstration loaded.`);
    return addLog(
      s,
      'narrative',
      'Narrator',
      'The CSV Halcyon drops out of its jump corridor at the edge of the Calloway Reach, a band of contested space claimed by both the Concord and the Tessarine Directorate. The bridge hums. Nothing should be out here.',
    );
  },
  (s) => {
    s = updateContact(s, 'kestrel', { visible: true });
    s = addLog(
      s,
      'crew',
      CREW.sensors,
      'Captain, automated distress beacon dead ahead. Civilian freighter, transponder reads KESTREL. She is adrift at 38,000 kilometres.',
    );
    return addObjective(s, { id: 'assess', text: 'Assess the disabled freighter Kestrel', status: 'active' });
  },
  (s) =>
    addLog(
      s,
      'comms',
      NPC.beacon,
      '"…freighter Kestrel… reactor containment failing… twenty-three aboard… any vessel, please respond…" (loop repeats)',
    ),
  (s) => {
    s = updateContact(s, 'cruiser', { visible: true });
    s = { ...s, alert: 'yellow' };
    s = addLog(
      s,
      'crew',
      CREW.tactical,
      'New contact, bearing 041. Warship profile — heavy cruiser, running hot. Range 210,000 kilometres and closing on the Kestrel. Going to yellow alert.',
    );
    s = addObjective(s, { id: 'intentions', text: "Determine the warship's intentions", status: 'active' });
    s = addObjective(s, { id: 'protect', text: "Protect the Kestrel's crew", status: 'active' });
    return addObjective(s, { id: 'escalation', text: 'Avoid escalating the border dispute', status: 'active' });
  },
  (s) => {
    s = addLog(
      s,
      'crew',
      CREW.xo,
      'The border accords forbid either side from bringing armed ships into the Reach without notice. Someone is breaking the rules today. Your orders, Captain?',
    );
    s = setFlag(s, 'openingComplete');
    return addLog(s, 'system', COMPUTER, `DEMO MODE: limited command vocabulary. Try: ${DEMO_SUGGESTIONS.slice(0, 8).join(' · ')}. Type "help" for more.`);
  },
];

export function advanceOpening(s: WorldState): WorldState {
  if (s.beat >= OPENING_BEATS.length) return s;
  const next = OPENING_BEATS[s.beat](s);
  return { ...next, beat: s.beat + 1, time: next.time + 5 };
}

/** Plays any remaining opening beats immediately (used before the first command and by "skip intro"). */
export function completeOpening(s: WorldState): WorldState {
  while (s.beat < OPENING_BEATS.length) s = advanceOpening(s);
  return s;
}

// ---------------------------------------------------------------- commands ---

export type Intent =
  | 'help'
  | 'status'
  | 'redAlert'
  | 'yellowAlert'
  | 'standDown'
  | 'shieldsUp'
  | 'shieldsDown'
  | 'scan'
  | 'diplomacy'
  | 'hail'
  | 'approach'
  | 'tractor'
  | 'evacuate'
  | 'stabilize'
  | 'fire'
  | 'arm'
  | 'withdraw'
  | 'wait'
  | 'unknown';

export type Target = 'kestrel' | 'cruiser' | 'compartment' | null;

const INTENT_PATTERNS: [Intent, RegExp][] = [
  ['help', /\b(help|commands|what can i)\b/],
  ['status', /\b(status|report|sitrep|damage)\b/],
  ['redAlert', /\b(red alert|battle stations|general quarters)\b/],
  ['yellowAlert', /\byellow alert\b/],
  ['shieldsDown', /\b(lower|drop|disable|down)\b.*\bshields?\b|\bshields?\b.*\b(down|off|lower)\b/],
  ['shieldsUp', /\b(raise|activate|up|enable)\b.*\bshields?\b|\bshields?\b.*\b(up|on|raise)\b/],
  ['standDown', /\b(stand down|condition green|green alert|cancel alert)\b/],
  ['fire', /\b(fire|shoot|open fire|attack|warning shot)\b/],
  ['arm', /\b(arm|target|lock)\b|\bweapons?\b/],
  ['tractor', /\btractor\b|\btow\b/],
  ['evacuate', /\b(evacuat\w*|beam|transport\w*|rescue the crew|bring .* aboard)\b/],
  ['stabilize', /\b(stabili[sz]e|repair|engineering team|containment|fix)\b/],
  ['scan', /\b(scan|analy[sz]e|sensors?|investigate|examine)\b/],
  ['diplomacy', /\b(humanitarian|rescue mission|explain|tell (them|him|the)|negotiat\w*|peaceful|reason with|we mean no harm|no hostile)\b/],
  ['hail', /\b(hail|open (a )?(channel|comms|frequency)|contact|call|respond to)\b/],
  ['withdraw', /\b(withdraw|retreat|leave|jump out|fall back|disengage|get us out)\b/],
  ['approach', /\b(approach|close (in|to|the distance)|intercept|move (to|toward|towards|closer)|ahead|take us (in|to|closer)|head (to|for))\b/],
  ['wait', /\b(wait|hold position|stand by|standby|monitor|observe)\b/],
];

export function parseCommand(input: string): { intent: Intent; target: Target } {
  const t = input.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  let target: Target = null;
  if (/\b(compartment|cargo|hold|hidden|passenger)\b/.test(t)) target = 'compartment';
  else if (/\b(cruiser|warship|directorate|tessarine|ashen|covenant|vane|prefect|second contact)\b/.test(t)) target = 'cruiser';
  else if (/\b(kestrel|freighter|civilian|arden|disabled|distress)\b/.test(t)) target = 'kestrel';
  for (const [intent, re] of INTENT_PATTERNS) if (re.test(t)) return { intent, target };
  return { intent: 'unknown', target };
}

const HELP_TEXT =
  'Demo vocabulary — scan · hail · explain/negotiate · raise/lower shields · red/yellow alert · stand down · approach · evacuate · stabilise · tractor beam · arm weapons · fire · withdraw · wait · status. Mention "Kestrel" or "cruiser" to pick a target. Full natural-language orders arrive in Milestone 2.';

function statusReport(s: WorldState): string {
  const k = getContact(s, 'kestrel');
  const c = getContact(s, 'cruiser');
  const parts = [
    `Hull ${s.ship.hull}%, shields ${s.ship.shieldsRaised ? 'raised' : 'lowered'}, weapons ${s.ship.weapons}.`,
    s.flags.kestrelDestroyed ? 'Kestrel destroyed; her crew is aboard.' : k.visible ? `Kestrel at ${Math.round(k.range).toLocaleString('en-US')} km, reactor ${s.flags.kestrelStabilized ? 'stabilised' : `breach in ~${s.counters.kestrelReactor} min`}.` : '',
    c.visible ? `Cruiser at ${Math.round(c.range).toLocaleString('en-US')} km.` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

/** Applies one captain's order, then runs the independent NPC turn if time passed. */
export function applyCommand(state: WorldState, input: string): WorldState {
  const text = input.trim();
  if (!text) return state;
  let s = completeOpening(state);
  s = addLog(s, 'captain', 'Captain', text);

  if (s.outcome) {
    return addLog(s, 'system', COMPUTER, 'This simulation has ended. Use Restart to run it again, or Load to return to a saved point.');
  }

  const { intent, target } = parseCommand(text);
  const r = handleIntent(s, intent, target);
  s = r.state;
  if (r.consumesTime && !s.outcome) s = npcTurn(s);
  return s;
}

interface IntentResult {
  state: WorldState;
  consumesTime: boolean;
}

function handleIntent(s: WorldState, intent: Intent, target: Target): IntentResult {
  const k = getContact(s, 'kestrel');
  const c = getContact(s, 'cruiser');
  const ok = (state: WorldState, consumesTime = true): IntentResult => ({ state, consumesTime });
  const kestrelAction: Intent[] = ['approach', 'evacuate', 'stabilize', 'tractor'];
  const aimsAtKestrel = target === 'kestrel' || target === 'compartment' || (target === null && (intent === 'scan' || intent === 'hail'));
  if (s.flags.kestrelDestroyed && (kestrelAction.includes(intent) || ((intent === 'scan' || intent === 'hail') && aimsAtKestrel))) {
    return ok(addLog(s, 'crew', CREW.xo, 'The Kestrel is gone, Captain. Her crew is safe aboard the Halcyon.'), false);
  }

  switch (intent) {
    case 'help':
      return ok(addLog(s, 'system', COMPUTER, HELP_TEXT), false);

    case 'status':
      return ok(addLog(s, 'crew', CREW.xo, statusReport(s)), false);

    case 'redAlert':
      s = { ...s, alert: 'red', ship: { ...s.ship, shieldsRaised: true } };
      return ok(addLog(s, 'crew', CREW.tactical, 'Red alert. Shields up, all stations report ready.'), false);

    case 'yellowAlert':
      return ok(addLog({ ...s, alert: 'yellow' }, 'crew', CREW.xo, 'Yellow alert, aye.'), false);

    case 'standDown':
      s = { ...s, alert: 'green', ship: { ...s.ship, shieldsRaised: false, weapons: 'safe' } };
      if (s.flags.weaponsHot) {
        s = setFlag(s, 'weaponsHot', false);
        if (!s.flags.cruiserLockedKestrel) s = updateContact(s, 'cruiser', { disposition: s.flags.cruiserTalked ? 'neutral' : 'unknown' });
      }
      return ok(addLog(s, 'crew', CREW.xo, 'Standing down. Shields lowered, weapons safed.'), false);

    case 'shieldsUp':
      if (s.ship.shieldsRaised) return ok(addLog(s, 'crew', CREW.tactical, 'Shields are already up, Captain.'), false);
      s = { ...s, ship: { ...s.ship, shieldsRaised: true } };
      return ok(addLog(s, 'crew', CREW.tactical, 'Shields raised. Note: transporters cannot cycle through our own shields.'), false);

    case 'shieldsDown':
      if (!s.ship.shieldsRaised) return ok(addLog(s, 'crew', CREW.tactical, 'Shields are already down.'), false);
      s = { ...s, ship: { ...s.ship, shieldsRaised: false } };
      return ok(addLog(s, 'crew', CREW.tactical, 'Shields lowered.'), false);

    case 'scan':
      return scan(s, target ?? 'kestrel');

    case 'hail':
      return hail(s, target ?? 'kestrel');

    case 'diplomacy':
      return diplomacy(s);

    case 'approach': {
      if (target === 'cruiser') {
        return ok(addLog(s, 'crew', CREW.helm, 'Closing on the cruiser is outside the demo script. Holding course for the Kestrel instead.'), false);
      }
      if (k.range <= 1500) return ok(addLog(s, 'crew', CREW.helm, 'We are already holding station alongside the Kestrel.'), false);
      const range = Math.max(1500, k.range - 12000);
      s = updateContact(s, 'kestrel', { range, bearing: range <= CLOSE_RANGE_KM ? 0 : Math.round(k.bearing / 2) });
      return ok(
        addLog(
          s,
          'crew',
          CREW.helm,
          range <= CLOSE_RANGE_KM
            ? `Holding station at ${range.toLocaleString('en-US')} km. We are inside transporter and tractor range.`
            : `Full impulse. Kestrel now ${range.toLocaleString('en-US')} km.`,
        ),
      );
    }

    case 'evacuate': {
      if (s.flags.crewEvacuated) return ok(addLog(s, 'crew', CREW.xo, 'The Kestrel crew is already aboard.'), false);
      if (k.range > CLOSE_RANGE_KM)
        return ok(addLog(s, 'crew', CREW.xo, `Out of transporter range. We need to close within ${CLOSE_RANGE_KM.toLocaleString('en-US')} km.`), false);
      if (s.ship.shieldsRaised)
        return ok(addLog(s, 'crew', CREW.xo, 'Our shields are up — transporters cannot cycle. Lower shields first, Captain.'), false);
      s = setFlag(s, 'crewEvacuated');
      s = setObjective(s, 'protect', 'complete');
      s = updateContact(s, 'kestrel', { details: [...k.details, 'Crew evacuated to Halcyon (23 aboard)'] });
      return ok(addLog(s, 'crew', CREW.xo, 'Transporters cycling… All twenty-three Kestrel crew are aboard, including two injured on their way to medical.'));
    }

    case 'stabilize': {
      if (s.flags.kestrelStabilized) return ok(addLog(s, 'crew', CREW.engineering, 'Containment is holding. She will not blow today.'), false);
      if (k.range > CLOSE_RANGE_KM)
        return ok(addLog(s, 'crew', CREW.engineering, 'I cannot do anything from this distance. Get us close and I will send a team.'), false);
      if (s.ship.shieldsRaised)
        return ok(addLog(s, 'crew', CREW.engineering, 'Need the shields down to send a team across.'), false);
      s = setFlag(s, 'kestrelStabilized');
      s = updateContact(s, 'kestrel', { details: [...k.details, 'Reactor stabilised by Halcyon engineering team'] });
      return ok(addLog(s, 'crew', CREW.engineering, 'Team is across. We vented the plasma and patched the containment ring. Kestrel reactor is stable.'));
    }

    case 'tractor': {
      if (s.ship.tractor === 'engaged') return ok(addLog(s, 'crew', CREW.helm, 'Tractor beam already engaged.'), false);
      if (k.range > CLOSE_RANGE_KM)
        return ok(addLog(s, 'crew', CREW.helm, `Kestrel is beyond tractor range. Close within ${CLOSE_RANGE_KM.toLocaleString('en-US')} km.`), false);
      s = { ...s, ship: { ...s.ship, tractor: 'engaged', impulse: 60 } };
      s = setFlag(s, 'towing');
      return ok(addLog(s, 'crew', CREW.helm, 'Tractor beam locked on the Kestrel. Our maximum impulse drops to sixty percent while towing.'));
    }

    case 'arm': {
      if (s.ship.weapons === 'locked') return ok(addLog(s, 'crew', CREW.tactical, 'Weapons are already locked on the cruiser.'), false);
      s = { ...s, ship: { ...s.ship, weapons: c.visible ? 'locked' : 'armed' } };
      s = setFlag(s, 'weaponsHot');
      if (c.visible) {
        s = markEscalated(s, 'lockedOnCruiser');
        s = updateContact(s, 'cruiser', { disposition: 'hostile' });
      }
      return ok(
        addLog(
          s,
          'crew',
          CREW.tactical,
          c.visible ? 'Weapons armed and locked on the cruiser. They will have detected the lock.' : 'Weapons armed. No targets designated.',
        ),
      );
    }

    case 'fire': {
      if (target === 'kestrel')
        return ok(addLog(s, 'crew', CREW.tactical, 'Captain, the Kestrel is a civilian vessel. I will not fire on her without a confirmed reason.'), false);
      if (!c.visible) return ok(addLog(s, 'crew', CREW.tactical, 'No hostile targets on the board.'), false);
      s = markEscalated(s, 'shotsFired');
      s = setFlag(s, 'weaponsHot');
      s = { ...s, alert: 'red', ship: { ...s.ship, shieldsRaised: true, weapons: 'locked' } };
      s = updateContact(s, 'cruiser', { disposition: 'hostile' });
      s = addLog(s, 'crew', CREW.tactical, 'Firing! Direct hit on their forward shield array. They are powering weapons and returning fire.');
      return ok(
        endWith(s, {
          id: 'shots-fired',
          title: 'Shots Fired in the Reach',
          summary:
            'You opened fire on a Directorate warship inside disputed space. The scripted demo ends here — tactical combat resolution is planned for Milestone 2.',
        }),
        false,
      );
    }

    case 'withdraw':
      return ok(withdraw(s), false);

    case 'wait':
      return ok(addLog(s, 'crew', CREW.xo, 'Holding position and monitoring.'));

    default:
      return ok(
        addLog(
          s,
          'system',
          COMPUTER,
          'Demo interpreter did not recognise that order. (Full natural-language command interpretation arrives in Milestone 2.) Type "help" for the demo vocabulary.',
        ),
        false,
      );
  }
}

function scan(s: WorldState, target: Exclude<Target, null>): IntentResult {
  const k = getContact(s, 'kestrel');
  const c = getContact(s, 'cruiser');

  if (target === 'compartment') {
    if (!s.flags.compartmentDetected)
      return { state: addLog(s, 'crew', CREW.sensors, 'Which compartment, Captain? I would need to scan the Kestrel first.'), consumesTime: false };
    if (k.range > CLOSE_RANGE_KM)
      return { state: addLog(s, 'crew', CREW.sensors, 'The shielding defeats our sensors at this range. Get us inside 5,000 km.'), consumesTime: true };
    if (s.flags.secretRevealed)
      return { state: addLog(s, 'crew', CREW.sensors, 'One occupant, still in medical stasis. Tessarine physiology.'), consumesTime: false };
    s = setFlag(s, 'secretRevealed');
    s = setObjective(s, 'secret', 'complete');
    s = updateContact(s, 'kestrel', { details: [...k.details, 'Hidden passenger: one Tessarine life sign in medical stasis'] });
    return {
      state: addLog(
        s,
        'crew',
        CREW.sensors,
        'Got it. One life sign in the shielded compartment — Tessarine physiology, in a medical stasis pod. Whoever that is, the cruiser wants them badly.',
      ),
      consumesTime: true,
    };
  }

  if (target === 'kestrel') {
    if (!k.visible) return { state: addLog(s, 'crew', CREW.sensors, 'Nothing on sensors yet.'), consumesTime: false };
    if (k.scanned) return scan(s, 'compartment');
    s = updateContact(s, 'kestrel', {
      scanned: true,
      details: [
        'Arden Logistics bulk freighter, 23 life signs',
        'Reactor containment 31% and falling',
        'Shielded aft compartment — contents unknown',
      ],
    });
    s = setFlag(s, 'compartmentDetected');
    s = setObjective(s, 'assess', 'complete');
    s = addObjective(s, { id: 'secret', text: 'Discover what is inside the shielded compartment', status: 'active' });
    return {
      state: addLog(
        s,
        'crew',
        CREW.sensors,
        `Kestrel: twenty-three life signs, reactor containment at thirty-one percent and dropping — I estimate ${s.counters.kestrelReactor} minutes to breach. And Captain… there is a shielded compartment aft that my sensors cannot penetrate.`,
      ),
      consumesTime: true,
    };
  }

  // cruiser
  if (!c.visible) return { state: addLog(s, 'crew', CREW.sensors, 'Nothing on sensors yet.'), consumesTime: false };
  if (c.scanned) return { state: addLog(s, 'crew', CREW.sensors, statusReport(s)), consumesTime: false };
  s = updateContact(s, 'cruiser', {
    name: 'Ashen Covenant',
    faction: 'Tessarine Directorate',
    scanned: true,
    details: ['Directorate heavy cruiser, Vigil class', 'Weapons charged, shields at full', 'Pursuit-speed engine signature'],
  });
  return {
    state: addLog(
      s,
      'crew',
      CREW.sensors,
      'The cruiser is the Ashen Covenant, Tessarine Directorate, Vigil class. Weapons charged, shields at full. She has been running at pursuit speed for hours.',
    ),
    consumesTime: true,
  };
}

function hail(s: WorldState, target: Exclude<Target, null>): IntentResult {
  const c = getContact(s, 'cruiser');
  if (target === 'cruiser') {
    if (!c.visible) return { state: addLog(s, 'crew', CREW.comms, 'No vessel to hail on that bearing.'), consumesTime: false };
    s = addLog(s, 'crew', CREW.comms, 'Channel open to the cruiser.');
    if (s.flags.cruiserTalked) {
      return {
        state: addLog(s, 'comms', NPC.prefect, '"I have stated our position, Captain. Stand aside from the Kestrel."'),
        consumesTime: true,
      };
    }
    s = setFlag(s, 'cruiserTalked');
    s = setObjective(s, 'intentions', 'complete');
    s = updateContact(s, 'cruiser', { name: 'Ashen Covenant', faction: 'Tessarine Directorate', disposition: s.flags.weaponsHot || s.flags.cruiserLockedKestrel ? 'hostile' : 'neutral' });
    s = addLog(
      s,
      'comms',
      NPC.prefect,
      '"Concord vessel, this is Prefect Sorel Vane of the Ashen Covenant. You are inside the Tessarine claim. The Kestrel carries stolen Directorate property. Stand aside and you will not be harmed."',
    );
    return { state: s, consumesTime: true };
  }

  s = addLog(s, 'crew', CREW.comms, 'Channel open to the Kestrel.');
  if (s.flags.secretRevealed && !s.flags.ardenConfessed) {
    s = setFlag(s, 'ardenConfessed');
    return {
      state: addLog(
        s,
        'comms',
        NPC.kestrelMaster,
        '"…You found her. Her name is Dr. Lysa Venn. She ran from the Directorate with what she knows about their weapons programme. If that cruiser takes her back, she is dead. Please."',
      ),
      consumesTime: true,
    };
  }
  return {
    state: addLog(
      s,
      'comms',
      NPC.kestrelMaster,
      '"Halcyon! Thank the stars. Our reactor is going and the escape pods are fused shut. Twenty-three of us, two injured. Whatever you do, do it fast — and keep that cruiser off us."',
    ),
    consumesTime: true,
  };
}

function diplomacy(s: WorldState): IntentResult {
  const c = getContact(s, 'cruiser');
  if (!c.visible) return { state: addLog(s, 'crew', CREW.comms, 'There is nobody to negotiate with yet, Captain.'), consumesTime: false };
  if (!s.flags.cruiserTalked) {
    s = hail(s, 'cruiser').state;
  }
  if (s.flags.weaponsHot) {
    s = addLog(s, 'comms', NPC.prefect, '"You speak of mercy with your weapons locked on my ship? No."');
    return { state: s, consumesTime: true };
  }
  if (s.flags.cruiserPlacated) {
    return { state: addLog(s, 'comms', NPC.prefect, '"I have agreed to observe, Captain. Do not test my patience."'), consumesTime: true };
  }
  s = setFlag(s, 'cruiserPlacated');
  s = updateContact(s, 'cruiser', { disposition: 'neutral' });
  s = addLog(
    s,
    'comms',
    NPC.prefect,
    '"…Very well. The Directorate does not murder civilians. We will hold at a distance and observe your rescue. But the Kestrel and her cargo are ours, Captain."',
  );
  return { state: addLog(s, 'crew', CREW.tactical, 'The cruiser is slowing.'), consumesTime: true };
}

function withdraw(s: WorldState): WorldState {
  const rescued = s.flags.crewEvacuated || s.flags.towing;
  s = addLog(s, 'crew', CREW.helm, 'Plotting a course out of the Reach. Jump drive charging… engaging.');
  if (rescued) {
    return endWith(s, {
      id: 'rescue',
      title: 'Rescue and Withdrawal',
      summary: s.flags.kestrelDestroyed
        ? 'You withdrew from the Reach with the Kestrel crew aboard. The freighter herself was lost to her reactor breach.'
        : s.flags.towing
        ? 'You withdrew from the Reach with the Kestrel in tow. The Directorate will protest, but her crew — and her secret passenger — are under Concord protection.'
        : 'You withdrew from the Reach with the Kestrel crew aboard. The derelict freighter, and whatever remains in her hold, was left to the Ashen Covenant.',
    });
  }
  return endWith(s, {
    id: 'abandoned',
    title: 'Kestrel Abandoned',
    summary: 'You withdrew without rescuing the Kestrel crew. The cruiser closed on the helpless freighter as the Halcyon left the Reach.',
  });
}

/**
 * ESCALATION RULE (deterministic).
 * The border dispute counts as escalated the moment ANY of these happens:
 *   - the Halcyon locks weapons on the cruiser          (flag weaponsHot / lockedOnCruiser)
 *   - the Halcyon fires on anyone                        (flag shotsFired)
 *   - the cruiser locks weapons on the Kestrel or Halcyon (flag cruiserLockedKestrel)
 *   - the cruiser fires on anyone                        (flag cruiserFired; reserved, not reachable in M1)
 * Once escalated, the "Avoid escalating" objective fails immediately and cannot recover.
 * Standing down afterwards de-escalates the ships' posture but does not undo the failure.
 */
export const ESCALATION_FLAGS = ['lockedOnCruiser', 'shotsFired', 'cruiserLockedKestrel', 'cruiserFired'] as const;

export function hasEscalated(s: WorldState): boolean {
  return ESCALATION_FLAGS.some((f) => s.flags[f]);
}

function markEscalated(s: WorldState, flag: (typeof ESCALATION_FLAGS)[number]): WorldState {
  s = setFlag(s, flag);
  return setObjective(s, 'escalation', 'failed');
}

/**
 * Resolves every objective that is still active when the simulation ends.
 *   assess / intentions / secret (informational): complete if achieved, otherwise "missed".
 *   protect: complete if the crew was evacuated or the Kestrel towed out, otherwise failed.
 *   escalation: failed if hasEscalated(), otherwise complete.
 */
export function resolveObjectives(s: WorldState): WorldState {
  const rescued = !!(s.flags.crewEvacuated || (s.flags.towing && s.outcome?.id === 'rescue'));
  const final: Record<string, 'complete' | 'failed' | 'missed'> = {
    assess: getContact(s, 'kestrel').scanned ? 'complete' : 'missed',
    intentions: s.flags.cruiserTalked ? 'complete' : 'missed',
    secret: s.flags.secretRevealed ? 'complete' : 'missed',
    protect: rescued ? 'complete' : 'failed',
    escalation: hasEscalated(s) ? 'failed' : 'complete',
  };
  return {
    ...s,
    objectives: s.objectives.map((o) => (o.status === 'active' && final[o.id] ? { ...o, status: final[o.id] } : o)),
  };
}

function endWith(s: WorldState, outcome: WorldState['outcome']): WorldState {
  s = resolveObjectives({ ...s, outcome });
  s = addLog(s, 'system', COMPUTER, `SIMULATION ENDED — ${outcome!.title}. ${outcome!.summary}`);
  return s;
}

// --------------------------------------------------------------- NPC turn ---

/** Independent actions by other vessels; runs after each time-consuming order. */
export function npcTurn(s: WorldState): WorldState {
  s = { ...s, turn: s.turn + 1, time: s.time + TURN_SECONDS };

  // Kestrel reactor countdown.
  if (!s.flags.kestrelStabilized) {
    const left = s.counters.kestrelReactor - 1;
    s = setCounter(s, 'kestrelReactor', left);
    if (left === 3) {
      s = addLog(s, 'crew', CREW.sensors, 'Kestrel containment is collapsing faster. Three minutes to breach, maybe less.');
    }
    if (left <= 0) {
      s = updateContact(s, 'kestrel', { disposition: 'unknown', details: [...getContact(s, 'kestrel').details, 'Reactor breach — vessel destroyed'] });
      if (s.flags.crewEvacuated) {
        s = addLog(s, 'narrative', 'Narrator', 'The empty Kestrel flares white and is gone. Her crew watch from the Halcyon’s observation deck.');
        s = setFlag(s, 'kestrelDestroyed');
        s = updateContact(s, 'kestrel', { visible: false });
        if (s.flags.towing) s = { ...s, ship: { ...s.ship, tractor: 'idle', impulse: 100 } };
        s = setFlag(s, 'towing', false);
      } else {
        return endWith(s, {
          id: 'kestrel-lost',
          title: 'Kestrel Lost',
          summary: 'The Kestrel’s reactor breached with all twenty-three crew aboard.',
        });
      }
    }
  }

  // Cruiser closes independently.
  const c = getContact(s, 'cruiser');
  if (c.visible) {
    const speed = s.flags.cruiserPlacated ? 8000 : s.flags.weaponsHot ? 45000 : 30000;
    // A placated cruiser holds at 60,000 km (or wherever it already is, if closer); it never jumps backwards.
    const floor = Math.min(s.flags.cruiserPlacated ? 60000 : 8000, c.range);
    const range = clamp(c.range - speed, floor, c.range);
    s = updateContact(s, 'cruiser', { range, bearing: Math.max(12, Math.round(c.bearing - 3)) });

    if (range <= 120000 && !s.flags.cruiserTalked && !s.flags.cruiserHailedUs) {
      s = setFlag(s, 'cruiserHailedUs');
      s = addLog(s, 'crew', CREW.comms, 'The cruiser is hailing us, Captain.');
      s = addLog(s, 'comms', 'Unidentified warship', '"Concord vessel. You will move away from the freighter. This is your only warning."');
    }
    if (range <= 30000 && !s.flags.cruiserPlacated && !s.flags.cruiserLockedKestrel) {
      s = markEscalated(s, 'cruiserLockedKestrel');
      s = updateContact(s, 'cruiser', { disposition: 'hostile' });
      s = { ...s, alert: 'red' };
      s = addLog(s, 'crew', CREW.tactical, 'The cruiser has locked weapons on the Kestrel! Going to red alert.');
    }
  }
  return s;
}
