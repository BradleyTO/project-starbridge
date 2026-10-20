/**
 * Offline narration templates (Milestone 2). Keys come from Reports emitted by
 * the validator, reducer, diff and agents. In Milestone 3 an AI narrator may
 * rephrase these, but the facts in them come from the engine.
 */
import type { TemplateFn } from '../../engine/scenario';
import { SYSTEM_IDS } from '../../engine/types';
import { efficiency, km, range, systemLabel } from '../../engine/rules';
import { knows } from '../../engine/state';
import { HELM_TEMPLATES } from '../../engine/helmTemplates';
import { BRIDGE_TEMPLATES } from '../../engine/bridge';
import { COMMS_TEMPLATES, DIALOGUE_TEMPLATES } from './dialogueTemplates';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);

const T: Record<string, TemplateFn> = {
  // ---- v0.4: the Kestrel's point-defence
  ardenArms: () => "We're powering our point-defence. It won't scratch that cruiser, but I'm not sitting here with my hands in my lap.",
  ardenArmsAgainstHalcyon: () => "You've got a lock on us? Then we're powering our point-defence. Explain yourselves, Halcyon.",
  // ---- intro / narrative
  intro0: () => 'The CSV Halcyon drops out of her jump corridor at the edge of the Calloway Reach, a band of space claimed by both the Concord and the Tessarine Directorate. Nothing should be out here.',
  intro1: () => 'Captain, automated distress beacon dead ahead. Civilian freighter, transponder reads KESTREL, adrift at about 38,000 kilometres.',
  intro2: () => '"…freighter Kestrel… reactor containment failing… crew aboard… any vessel, please respond…" (loop repeats)',
  intro3: (_v, s) => `New contact, bearing ${String(Math.round((Math.atan2(s.ships.cruiser.position.x, s.ships.cruiser.position.y) * 180) / Math.PI + 360) % 360).padStart(3, '0')}. Warship profile, running hot, about ${Math.round(range(s, 'halcyon', 'cruiser') / 1000)},000 kilometres out and closing on the Kestrel. Yellow alert.`,
  intro4: () => 'The border accords forbid armed ships in the Reach without notice. Someone is breaking the rules today. Your orders, Captain?',
  introHint: () => 'OFFLINE INTERPRETER: give orders in plain English, several at once if you like, e.g. "Scan the Kestrel and hail the cruiser" or "Take us to 5,000 km of the freighter". Type "help" or "options" at any time.',
  shipDestroyed: (v) => `${v.ship} is destroyed${n(v, 'souls') > 0 ? ` with ${v.souls} souls aboard` : ''}.`,
  kestrelBreachCrew: (v) => `The Kestrel's reactor breaches. A white flare, then debris. ${v.souls} people were still aboard.`,
  kestrelBreachEmpty: () => "The empty Kestrel's reactor breaches in a silent white flare. Her crew watch from the Halcyon.",
  reinforcementsArrive: () => 'Three Directorate warships drop into the Reach and surround the Halcyon.',
  reinforcementsHoldOff: () => 'Directorate reinforcements arrive at the edge of the Reach, see the situation settled, and hold position.',

  // ---- system / meta
  simEnded: (_v, s) =>
    s.provenance.timeline === 'canonical'
      ? 'This mission has ended and is part of canonical history. Replay it as a simulation from the Mission Archive, or return to Active Duty.'
      : 'This simulation has ended. Restart, start a new seed, or load a save.',
  shipLost: () => 'The Halcyon has been lost.',
  help: () =>
    'Speak or type orders in plain English. Combine orders with "and"/"then". Examples: "red alert", "divert power from weapons to sensors", "take us to 4,000 km of the Kestrel", "lower shields and evacuate the crew", "tell the Prefect this is a humanitarian rescue", "offer them the cargo", "bluff that a Concord battle group is on the way", "use the tractor beam as a shield", "vent plasma for cover", "eject the Kestrel\'s core", "status", "options".',
  invalidAction: () => 'An order failed schema validation and was ignored.',
  outcome: (v, s) => `${s.provenance.timeline === 'canonical' ? 'MISSION ENDED (canonical record)' : 'SIMULATION ENDED'} — ${v.title}. ${v.summary}`,
  objectiveNew: (v) => `New objective: ${v.text}.`,
  objectiveUpdate: (v) => `Objective ${String(v.status).toUpperCase()}: ${v.text}.`,
  notUnderstood: (v) => `I didn't follow that order, Captain ("${v.text}"). Try "options" for suggestions, or "help".`,
  partlyUnderstood: (v) => `Acting on the rest, but I didn't understand: "${v.text}".`,
  clarify: (v) => String(v.question),

  // ---- validation (rejections / adjustments)
  alreadyAlert: (v) => `We're already at ${v.level} alert.`,
  systemUnavailable: (v) => `Our ${v.system} ${v.status === 'destroyed' ? 'are destroyed' : 'are ' + v.status} — I can't do that.`,
  shieldsAlready: (v) => `Shields are already ${v.state}.`,
  shieldsDepleted: () => 'Shield generators are drained; they need a minute to recharge.',
  noCompartmentKnown: () => "What compartment, Captain? We'd need a detailed scan of the Kestrel first.",
  targetDestroyed: (v) => `The ${v.ship} is gone, Captain.`,
  noContact: (v) => `No ${v.target === 'cruiser' ? 'warship' : 'such contact'} on sensors.`,
  unknownPassenger: () => "We don't know of any passenger, Captain.",
  passengerDead: (v) => `${v.name} is dead.`,
  passengerStasis: (v) => `${v.name} is still in stasis — there's no one to talk to yet.`,
  nobodyAnswers: (v) => `No answer from the ${v.ship}.`,
  cannotOfferUnknown: () => "We can't offer them something we don't know exists, Captain.",
  cannotInterpose: () => 'I need both the Kestrel and the warship on the board to put us between them.',
  needTarget: () => 'Which contact, Captain?',
  rangeClamped: (v) => `That's too close for safety. I'll hold at ${v.km}.`,
  powerWhich: () => 'Where do you want the power, Captain?',
  powerReactor: () => "The reactor is the source, Captain — I can't route power into it.",
  powerSame: () => "That's the same system, Captain.",
  powerDestroyed: (v) => `The ${v.system} are destroyed; power won't help.`,
  powerMaxed: (v) => `${v.system} are already at maximum safe power.`,
  powerEmpty: (v) => `There's no power left in the ${v.system} to take.`,
  powerAdjusted: (v) => `I can only move ${v.amount}% safely; doing that.`,
  weaponsAlreadySafe: () => 'Weapons are already safe.',
  weaponsAlreadyArmed: () => 'Weapons are already armed.',
  refuseCivilian: (v) => `Captain, the ${v.name ?? 'Kestrel'} has ${v.souls} people aboard. I won't fire on her.`,
  whyRefused: (v) => `You ordered me to ${v.order}. I refused because ${v.reasons}. Give me a real threat and I'll act — or order a warning shot.`,
  whyNothing: () => 'Why what, Captain? Nobody has refused an order.',
  alreadyLocked: () => 'Already locked on, Captain.',
  noTorpedoesUseBeams: () => 'Torpedo magazine is empty — using beams.',
  noTorpedoes: () => 'No torpedoes left, and they are beyond beam range.',
  outOfBeamRangeUseTorpedoes: (v) => `They're at ${v.km}, beyond beam range — launching a torpedo instead.`,
  outOfRange: (v) => `Target at ${v.km} is out of range for ${v.weapon}.`,
  tractorAlreadyOff: () => 'The tractor beam is not engaged.',
  tractorAlready: () => 'Tractor beam is already locked on.',
  tractorRange: (v) => `Target at ${v.km}; tractor reach is ${v.need}. Bring us closer.`,
  transportRange: (v) => `The Kestrel is ${v.km} away; transporters reach ${v.need}. We need to get closer.`,
  transportShields: () => 'Our shields are up — transporters cannot cycle through them. Lower shields first.',
  kestrelEmpty: () => 'There is no one left aboard the Kestrel.',
  crewTrapped: (v) => `The remaining ${v.n} crew are trapped behind a blast door. We need a rescue team over there first.`,
  passengerAlreadyMoved: () => 'The passenger is no longer aboard the Kestrel.',
  compartmentShielded: () => "The compartment's shielding blocks a transporter lock. Captain Arden has the codes — we'd need him to trust us.",
  noCargo: () => 'The cargo is already aboard.',
  noneTrapped: () => 'No one is trapped aboard the Kestrel.',
  kestrelRepairScope: () => "The only thing on the Kestrel worth our team's time is her reactor.",
  kestrelAlreadyStable: () => "The Kestrel's reactor is already stable.",
  teamRange: (v) => `The Kestrel is ${v.km} away. Get us inside transporter range and I'll send a team.`,
  teamShields: () => 'I need our shields down to put a team across.',
  beyondRepair: (v) => `The ${v.system} are beyond field repair.`,
  noRepairNeeded: (v) => `The ${v.system} are undamaged.`,
  jumpDownImpulseOnly: () => 'Jump drive is down — best I can do is open the range on impulse.',
  jumpReadyAlready: () => 'The jump drive is already charged.',
  jumpNotReady: (v) => `The jump drive isn't ready (${v.charge}%).`,
  ventTooDamaged: () => 'The engines are too damaged to vent plasma safely.',
  extendRange: (v) => `We're ${v.km} from the Kestrel. I'd need us within 2,500 km to wrap our shields around her.`,
  improviseUnclear: () => "Unorthodox, Captain. We'll try it, but I can't promise it does anything.",

  // ---- actions
  redAlert: () => 'Red alert. Shields up, all stations report ready.',
  standDown: () => 'Standing down. Shields lowered, weapons safed.',
  alertSet: (v) => `${String(v.level).replace(/^./, (c) => c.toUpperCase())} alert, aye.`,
  shieldsUp: (v) => `Shields up, ${v.strength}% strength. Transporters are blocked while they're raised.`,
  shieldsDown: () => 'Shields lowered.',
  holding: () => 'All stop. Holding position.',
  evasive: () => 'Evasive pattern for the next minute — harder to hit, harder to aim.',
  helm_approach: (v) => `Setting course for the ${v.target}, currently ${v.now}.`,
  helm_range: (v) => `Adjusting to ${v.km} from the ${v.target} (currently ${v.now}).`,
  helm_away: (v) => `Opening the range from the ${v.target}.`,
  helm_interpose: () => 'Putting us between the Kestrel and the warship.',
  powerShift: (v) => `Moving ${v.amount}% from ${v.from} to ${v.to}${n(v, 'toPct') ? ` — now at ${v.toPct}%` : ''}.`,
  weaponsSafe: () => 'Weapons safed.',
  weaponsArmed: () => 'Weapons armed. No target designated.',
  weaponsLocked: (v) => `Weapons locked on the ${v.target}. They will have detected the lock.`,
  warningShot: (v) => `Warning shot across the ${v.target}'s bow.`,
  hit: (v) => `Direct hit on the ${v.target}${n(v, 'damage') ? ` — ${v.damage} points of hull damage` : `, absorbed by their shields (now ${v.shields}%)`}.${v.weapon === 'torpedoes' ? ` ${v.torps} torpedoes left.` : ''}`,
  hitWeakness: (v) => `Torpedo through their misaligned aft emitter! ${v.damage} points of hull damage. ${v.torps} torpedoes left.`,
  miss: (v) => `Missed the ${v.target}.`,
  tractorReleased: () => 'Tractor beam released.',
  tractorKestrel: () => 'Tractor beam locked on the Kestrel. Our speed is halved while towing.',
  tractorCruiser: () => "Tractor on the cruiser. She's massive — we can slow her, but the emitter won't last.",
  tractorFailed: () => 'Tractor beam has lost its grip.',
  kestrelStabilised: () => "Team's across. We patched the containment ring — the Kestrel's reactor is stable.",
  kestrelStabiliseFailed: (v) => `The patch didn't hold. Containment now ${v.containment}%. We can try again.`,
  repaired: (v) => `Repair crews have the ${v.system} back to ${v.health}%.`,
  jumpCharging: (v) => `Charging the jump drive (${v.charge}%). About two minutes.`,
  jumpWithKestrel: () => 'Jump drive engaged — and the Kestrel comes with us on the tractor beam.',
  jumpEngaged: () => 'Jump drive engaged. We are leaving the Reach.',
  withdrawing: (v) => `Withdrawing. Jump drive charging from ${v.charge}%, opening the range on impulse.`,
  waiting: () => 'Holding and monitoring.',
  evacComplete: (v) => `Transporters cycling… last ${v.moved} aboard. The Kestrel is empty.`,
  evacPartial: (v) => `Transported ${v.moved}. ${v.left} still aboard${n(v, 'trapped') ? ` (${v.trapped} trapped)` : ''} — cycling again on your order.`,
  passengerAboard: (v) => `Stasis pod materialising… ${v.name} is aboard and waking up.${n(v, 'watched') ? ' The cruiser will have seen that.' : ''}`,
  cargoAboard: () => 'The Kestrel\'s cargo — medical isotopes for the border colonies — is in our hold.',
  trappedFreed: () => 'Rescue team cut through the blast door. The trapped crew are free and ready for transport.',
  trappedNotYet: () => "The blast door is fighting us. Another minute.",
  medicalTeam: () => "Medical team is aboard the Kestrel treating the injured. Captain Arden's grateful.",

  // ---- turn / diff
  arrived: (v) => `We're alongside the ${v.target}, ${v.km}.`,
  atRange: (v) => `Holding at ${v.km} from the ${v.target}.`,
  jumpReady: () => 'Jump drive fully charged. Ready on your order.',
  contactDetected: (v) => `New contact on sensors: ${v.ship}.`,
  contactLost: (v) => `The ${v.ship} has left sensor range.`,
  contactHostile: (v) => `${v.ship} is now classified hostile.`,
  hullDamage: (v) => `Hull at ${v.hull}% (−${v.loss}).`,
  systemDestroyed: (v) => `We've lost the ${v.system}!`,
  systemDamaged: (v) => `Damage to the ${v.system}.`,
  enemyDamaged: (v) => `Their hull is at roughly ${v.hull}%.`,
  shieldsCollapsed: () => 'Our shields have collapsed!',
  enemyShieldsDown: (v) => `The ${v.ship}'s shields are down!`,
  officerInjured: (v) => `${v.name} is hurt — ${v.role} station reporting casualties.`,
  officerKilled: (v) => `We've lost ${v.name}. I'm sorry, Captain.`,
  breachShockwave: (v) => (n(v, 'shielded') ? 'Shockwave hitting our shields — holding.' : 'Shockwave! We were too close with our shields down.'),

  // ---- scans
  stormDetected: () => 'Ion storm in the area — it is degrading our sensors and cutting transporter range to 3,000 km.',
  scanKestrelDetail: (v) =>
    `Kestrel: ${v.souls} crew, reactor containment ${v.containment}% and falling — about ${v.turns} minutes to breach. There's also a shielded compartment aft that my sensors can't penetrate.${v.extra === 'coolant' ? ' And her coolant is leaking — that timeline will get worse.' : v.extra === 'trapped' ? ' Four of the crew are sealed behind a jammed blast door.' : ''}`,
  scanKestrelBasic: (v) => `At ${v.km} I get life signs and a failing reactor, nothing more. I need to be within ${v.need} for detail.`,
  scanCruiserBasic: (v) => `Tessarine Directorate heavy cruiser, the Ashen Covenant, at ${v.km}. Closer and I can read her systems.`,
  scanCruiserDetail: (v) => `Ashen Covenant: hull ${v.hull}%, shields ${v.shields}%, weapons charged.${n(v, 'hint') ? ' Something odd in her shield harmonics — with more power to sensors I might resolve it.' : ''}`,
  scanCruiserWeakness: () => "Got it! Their aft shield emitter is misaligned. A torpedo aimed there would bypass most of their shielding.",
  compartmentTooFar: (v) => `The shielding defeats us at ${v.km}. I need ${v.need}${n(v, 'boost') ? ', or more power to sensors' : ''}.`,
  compartmentRevealed: (v, s) => `One life sign in the compartment, in a stasis pod. It's ${v.name} — ${knows(s, 'passenger_identity') ? s.facts.passenger_identity.text.replace(/^The compartment holds [^,]+, /, '').replace(/, in a medical stasis pod\.$/, '') : ''}. That's who the cruiser wants.`,
  compartmentKnown: (v) => `${v.name}${v.status === 'moved' ? ' is no longer in the compartment.' : ` is still there, ${v.status === 'stasis' ? 'in stasis' : 'awake'}.`}`,
  areaSweep: (v) => (n(v, 'known') ? `Directorate reinforcements still inbound, about ${v.known} minutes out.` : 'Long-range sweep: nothing else in the Reach — for now.'),
  reinforcementsDetected: (v) => `Long-range contacts: three more Directorate warships inbound. ETA about ${v.turns} minutes.`,

  // ---- reports
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}, jump drive ${v.jump}%. Kestrel: ${v.kestrel}. Cruiser: ${v.cruiser}.`,
  systemsReport: (_v, s) =>
    SYSTEM_IDS.filter((id) => id !== 'lifeSupport')
      .map((id) => `${systemLabel(id)} ${Math.round(efficiency(s.ships.halcyon, id) * 100)}%`)
      .join(', ') + '.',
  contactsReport: (_v, s) =>
    (['kestrel', 'cruiser'] as const)
      .filter((id) => s.ships[id].detected)
      .map((id) => `${s.ships[id].scanLevel ? s.ships[id].name : s.ships[id].classification}: ${s.ships[id].destroyed ? 'destroyed' : km(range(s, 'halcyon', id))}`)
      .join('; ') || 'No contacts.',
  objectivesReport: (_v, s) => s.objectives.map((o) => `${o.text} (${o.status})`).join('; ') || 'No objectives yet.',
  optionsReport: (v) => `Options as I see them: ${v.options || 'hold and reassess'}.`,

  // ---- Arden
  ardenFirst: (v) => `"Halcyon! Thank the stars. Our reactor's going and the escape pods are fused shut. ${v.souls} of us aboard, some injured. Whatever you do, do it fast — and keep that warship off us."`,
  ardenReveals: (v) => `"…All right. The compartment holds ${v.name}. ${v.kind === 'defector' ? 'She ran from their weapons programme.' : v.kind === 'prisoner' ? 'He escaped one of their labour colonies.' : "The Prefect's own sibling, running from him."} If that cruiser takes them back, they're dead. Please."`,
  ardenDeflects: () => '"Medical isotopes, Captain. That\'s all we\'re hauling." (He looks away from the camera.)',
  ardenCargo: () => '"Medical isotopes for the border colonies. Nothing worth a warship."',
  ardenBetrayed: () => '"You\'d sell them out? Then you\'ll get nothing more from me."',
  ardenUpdate: (v) => (n(v, 'stable') ? `"Reactor's holding thanks to your people. ${v.souls} still aboard."` : `"Containment's dropping — maybe ${v.turns} minutes. ${v.souls} of us still here, Captain."`),
  ardenUrgent: (v) => `"Halcyon, containment's almost gone — ${v.turns} minutes, maybe less! Get my people off!"`,
  ardenPanic: () => '"They\'ve locked weapons on us! Halcyon, for pity\'s sake!"',
  ardenCodes: () => '"I\'m sending you the compartment\'s shield codes. You\'ve earned that much."',
  ardenVolunteers: (v) => `"You've been straight with us, so I'll be straight with you. The compartment holds ${v.name}. That's why the Directorate is here."`,

  // ---- Passenger
  passengerWakesOnKestrel: () => '"…Is anyone there? The stasis pod is failing — please, whoever you are—" (signal from the Kestrel\'s aft compartment)',
  passengerAsksAsylum: (v) => `"I'm asking the Concord for asylum. ${v.kind === 'defector' ? 'I know things about the Directorate fleet you will want to hear.' : v.kind === 'prisoner' ? 'I can prove what they are doing in the colonies.' : 'My brother will not stop until he has me back.'}"`,
  passengerIntel_defector: () => '"Their Vigil-class cruisers share a flaw: the aft shield emitter drifts out of alignment under pursuit load. Aim torpedoes there."',
  passengerIntel_prisoner: () => '"I have recordings from the labour colony. Under the border accords that is a crime — show them to the Prefect if you must."',
  passengerIntel_sibling: () => '"Sorel is my brother. He is proud, but not cruel. If you appeal to him on my behalf he may listen."',
  passengerRepeat: () => '"I have told you what I know, Captain."',
  passengerWary: (v) => `${v.name} studies you warily and says nothing yet.`,
  passengerOffersToTalk: () => '"Let me speak to my brother. Put me on the channel — appeal to him through me."',

  // ---- Vane
  vaneFirst: (_v, s) => `"Concord vessel, this is Prefect Sorel Vane of the Ashen Covenant. You are inside the Tessarine claim. The Kestrel is carrying a fugitive from Directorate justice. ${s.variant.temperament === 'hardliner' ? 'Stand aside or be removed.' : 'Stand aside and there need be no incident.'}"`,
  vaneDemand: (v) => `"Concord vessel, this is Prefect Sorel Vane. You will move away from the freighter Kestrel. She carries a fugitive of the Directorate. ${v.temp === 'hardliner' ? 'This is your only warning.' : 'I would prefer this ended quietly.'}"`,
  vaneRepeat: () => '"My position has not changed, Captain."',
  vaneHumanitarian: (v, s) => (n(v, 'weaponsOnHim') ? '"You speak of mercy with your weapons locked on my ship?"' : s.variant.temperament === 'hardliner' ? '"Lives. Yes. Mine are at stake too, Captain. Be quick."' : '"…The Directorate does not murder civilians. Go on."'),
  vaneReassure: () => '"Words are cheap. Your actions will tell me what you are."',
  vaneLegal: (_v, s) => (s.variant.temperament === 'hardliner' ? '"The accords are paper. This is Tessarine space."' : '"The accords. Yes. I know them better than you, Captain."'),
  vaneLegalShaken: () => '"…Where did you get that? This changes nothing. Yet."',
  vaneAppealGeneric: () => '"Do not presume to know me, Captain."',
  vaneAppealWavers: () => '"…Ivet. Is she— Is she well? No. My duty is clear. Give me time."',
  vaneWarn_hardliner: () => '"You threaten a Directorate warship? Then we understand each other."',
  vaneWarn_pragmatic: () => '"Threats. How tiresome. I can make them too."',
  vaneWarn_cautious: () => '"…There is no need for that. We will hold position while we talk."',
  vaneTradeInterested: () => '"That has some value to us. Continue."',
  vaneTradeRejected: () => '"That is not what I came for."',
  vaneBluffWorks: () => '"…Very well. We will keep our distance — for now." (The cruiser slows.)',
  vaneBluffFails: () => '"There is nothing on my sensors, Captain. Do not insult me."',
  vaneBluffExposed: () => '"No battle group, Captain. You lied to me. That was a mistake."',
  vaneHoldsAgreement: (v) => (n(v, 'kind') === 3 ? '"We have an understanding. Deliver the fugitive."' : '"We have an understanding. Do not test it."'),
  vaneInCombat: () => '"You chose to fire. Now you will live with it."',
  vaneAgreement_1: () => '"…Very well. Take the Kestrel\'s crew. The freighter and her hold stay with us. Do not interfere."',
  vaneAgreement_2: (v) => `"…Enough. Go, and take ${v.name} with you. I will explain it to the Directorate myself."`,
  vaneAgreement_3: (v) => `"A sensible choice. Transfer ${v.name} and you may all go."`,
  vaneCollectsPassenger: (v) => `"We have ${v.name}. You are free to go, Captain."`,
  vaneBetrayed: () => '"You took the fugitive under cover of our agreement. Our understanding is over."',
  vaneSeesPeaceful: () => '"Shields down and guns cold. Either you are very brave or very foolish, Captain. I will allow you a little time."',
  vaneSeesPeacefulInterpose: () => '"You put your ship between my guns and that freighter with your shields down? ... Bold. Very well — I will not fire through you. Yet."',
  vaneSeesClosing: () => '"You are closing on my ship at speed, Captain. Turn away or be treated as hostile."',
  vaneSeesThreat: () => '"Raised shields, armed weapons. I see how this is going to go, Captain."',
  vaneLockWarning: () => '"Your weapons are locked on my ship. Release them, now."',
  vaneUltimatumKestrel: () => '"I have run out of patience. Weapons are locked on the Kestrel. You have one minute."',
  vaneUltimatumHalcyon: () => '"Weapons locked on your ship, Captain. Your move."',
  vaneReturnsFire: () => '"You fired on a Directorate warship. All batteries — return fire!"',
  vaneHoldsFire: () => '"You are fortunate I want my fugitive alive, Captain. My guns stay on you. Reinforcements are coming, and you cannot outrun them."',
  vaneQuarryLost: () => '"Then there is nothing left here for the Directorate. We are leaving, Captain. This will be remembered."',
  vaneAfterWarningShot: () => '"Consider that a warning. The next one will not miss its mark."',
  vaneRetreats: () => '"…All hands, break off. This is not over, Captain."',
  vaneYields: () => '"Enough. We withdraw. The Directorate will remember this."',
  vaneBlind: () => "The cruiser can't get a firing solution through our plasma screen.",
  incomingHail: () => 'The warship is hailing us, Captain.',
  cededWithPassenger: (v) => `Captain, that leaves ${v.name} aboard the Kestrel — in their hands.`,

  // ---- combat (NPC)
  cruiserHit: (v) => n(v, 'damage') > 0 ? `The cruiser hit the ${v.target} — ${v.damage} points of hull damage.` : `The cruiser hit the ${v.target}; shields absorbed it${n(v, 'raised') ? ` (now ${v.shields}%)` : ''}.`,
  cruiserHitDeflected: (v) => `The cruiser fired on the ${v.target}; ${v.by === 'tractorShield' ? 'our tractor field scattered most of it' : 'our extended shields took most of it'} (${v.damage} hull damage).`,
  cruiserMissed: (v) => `The cruiser fired on the ${v.target} and missed.`,
  interposeTookHit: () => "They're firing on the Kestrel — we're in the way! Taking the hit.",
  bluffHolding: () => 'The cruiser is still hanging back. Our bluff seems to be holding.',

  // ---- improvisation
  impTractorShield: (v) => `Unorthodox, but it works on paper: I'm projecting the tractor field as a scattering screen${n(v, 'kestrel') ? ' over us and the Kestrel' : ' over us (the Kestrel is out of reach)'}. Good for about two minutes; it's straining the emitter.`,
  impPlasmaVent: (v) => `Venting drive plasma. They're blind to us for a minute or two${n(v, 'brokeLock') ? ' — and their weapons lock just broke' : ''}. Transports in the cloud won't show on their sensors.`,
  impSensorGhost: (v) => `Ghost contacts are on their scopes now.${v.temp === 'hardliner' ? " I doubt the Prefect will flinch, but it'll make a bluff more convincing." : ' They are hesitating.'}`,
  impShieldExtend: () => 'Shields extended around the Kestrel. It is draining them fast, but she is covered for now.',
  impEjectCore: () => "Core ejected! It's tumbling clear… detonation at a safe distance. The Kestrel's dark but she won't blow.",
  impEjectCoreFailed: (v) => `The ejection clamps jammed. Containment now ${v.containment}%. We can try again.`,
  impOther: (v) => `I've looked at "${v.description}". I can't find a way for the ship to do that, Captain — nothing changes.`,

  // ---- advice (officer agents)
  adviseBreach: (v) => `Captain, the Kestrel has about ${v.turns} minutes. If we don't get those people off or stabilise her, they die.`,
  adviseShields: () => "They're targeting us or the Kestrel and our shields are down. Recommend we raise them.",
  adviseRestraint: () => 'Captain, a weapons lock is how wars start. We can still talk our way out of this.',
  adviseDamage: (v) => `Hull at ${v.hull}%. We can't take much more of this.`,
  adviseWeakness: () => "Remember their aft emitter — torpedoes, Captain.",
  adviseReinforcements: () => "Those reinforcements are minutes away. Whatever we're doing, we need to finish it.",
  adviseCompartment: () => "We're close enough to try resolving that compartment now.",
  adviseScan: () => "We still don't have a detailed scan of the Kestrel. I'd like one.",
  adviseOptions: () => 'Captain, time is passing. We could close and evacuate, send engineers to stabilise her, or talk to the Prefect. Say "options" if you want my read.',
};

export const templates: Record<string, TemplateFn> = { ...HELM_TEMPLATES, ...BRIDGE_TEMPLATES, ...COMMS_TEMPLATES, ...DIALOGUE_TEMPLATES, ...T };
