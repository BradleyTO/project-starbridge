/**
 * Offline narration and dialogue for Corsairs of the Veyl Shoals. Starts from the shared Kestrel
 * template set (generic engine keys: helm, comms, bridge, validation) and overrides every key whose
 * wording names that scenario's ships or people, plus this scenario's own keys.
 * A test renders fuzzed playthroughs and fails on any leaked name from another simulation or "[missing key]".
 *
 * Lt. Cmdr. Rask reads ships the way other people read faces, and says only what he is sure of.
 * Captain Draycott is dry, quick and never quite as calm as she sounds; her nerve (desperate, proud
 * or wavering) is worded differently but never names itself. Collector Skerrit is never in a hurry.
 */
import type { TemplateFn } from '../../engine/scenario';
import { formalOf } from '../../engine/captain';
import { templates as base } from '../kestrel/templates';
import { ANVIL, CORSAIR, DRAYCOTT_SHORT, ESCORT_A, ESCORT_B, GAVEL, NEEDLE, SHOALS, SHOALS_CAP, SKERRIT_SHORT, SKIFF, SUMP, SYNDICATE } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
const mins = (x: number) => (x === 1 ? 'a minute' : x <= 0 ? 'no time at all' : `${x} minutes`);
const escorts = (v: V) => (n(v, 'escorts') === 1 ? `one escort, the ${ESCORT_A}` : `two escorts, the ${ESCORT_A} and the ${ESCORT_B}`);
const ground = (v: V) => `${NEEDLE} is ${v.needle === 'open' ? 'open: narrow, but a ship our size can thread it' : 'choked with rubble halfway along; we could not get through without clearing it'}, and ${ANVIL} is ${v.anvil === 'iron' ? 'iron, solid iron: a dark ship in its shadow would vanish against it' : 'ice: it would show a dark ship against it like a lamp in a window'}`;
const Ncap = NEEDLE.replace(/^the/, 'The');
const Acap = ANVIL.replace(/^the/, 'The');

function counsel(p: string, v: V): string {
  const t = n(v, 'terrain') === 1;
  const needleOk = v.needle === 'open';
  const iron = v.anvil === 'iron';
  if (p === 'bleed') {
    const tail = !t ? ` Or dark behind ${ANVIL}, if that rock is iron. I don't know the ground yet; Lt. Szabo can pull the beacon's charts without lighting us up.` : iron ? ` Or go dark in ${ANVIL}'s shadow: it's iron, and they can't bleed what they can't see.` : ` ${Acap} is ice, so hiding won't work. It has to be the charge.`;
    return `Take away their distance, Captain. Go straight at the flagship: up close, her escorts can't fire without hitting her, and she's no match for us alone.${tail}`;
  }
  const what = p === 'pincer' ? 'ground they cannot cover from both sides' : 'ground they did not steer us toward';
  if (!t) return `The answer is ${what}, Captain: ${NEEDLE}, if it's open, or ${ANVIL}'s shadow, dark, if that rock is iron. I don't know the ground yet. Lt. Szabo can pull the beacon's charts without lighting us up.`;
  if (needleOk) return `${Ncap} is open, Captain. Take us in. ${p === 'pincer' ? 'In there they can only come at us one at a time, from one end.' : 'They cannot herd what they cannot get behind.'}${iron ? ` ${Acap}'s shadow would serve as well, if we go dark in it.` : ''}`;
  if (iron) return `${Ncap} is choked, Captain, but ${ANVIL} is iron. Take us into its shadow and go dark. They will lose us against the rock.`;
  return `${Ncap} is choked and ${ANVIL} is ice, Captain. Then it's ${NEEDLE} anyway, and the Chief clears the rubble with the tractor while we sit at the mouth. It will hurt for a minute or two.`;
}

const T: Record<string, TemplateFn> = {
  // ---- channels
  channelOpened: (v) => `${v.speaker}, Captain. ${String(v.vessel) === GAVEL ? `Audio and visual from the ${GAVEL}; a quiet, tidy bridge.` : `Audio and visual from the ${CORSAIR}; a cramped bridge, and someone behind her laughing.`}`,
  channelOpenedPrivate: (v) => `${v.speaker} on a closed channel, Captain.`,
  channelAlreadyOpen: (v) => `${v.speaker} is already on the channel, Captain.`,
  channelHoldOther: (v) => `The ${String(v.vessel) === GAVEL ? GAVEL : CORSAIR} stands by.`,
  channelResumed: (v) => `${v.speaker} back on the channel.`,
  channelClosed: (v) => `The ${String(v.vessel) === GAVEL ? GAVEL : CORSAIR} off the channel.`,
  channelOnHold: (v) => `${v.speaker} is standing by, Captain.`,
  noDialogue: () => 'Nobody is answering, Captain.',
  promiseBroken: () => 'Captain, that is not what we told them.',

  // ---- intro
  intro0: () => `${SHOALS_CAP}: a long reef of asteroids and metallic dust where nothing out of a shipyard would choose to fly. The Halcyon is carrying a consignment of drive lattices for a colony shipyard, and she came in answer to a distress call from an ore skiff, the ${SKIFF}, at an old survey beacon deep in the shoal. Now she is at the beacon, and there is no skiff.`,
  intro1: () => `Captain, the ${SKIFF}'s call is still coming in from the beacon. The same words, the same breath in the same places. Every time.`,
  intro2: (v) => `Contacts coming off the rocks, Captain. A corsair raider, the ${CORSAIR}, and ${escorts(v)}. Weapons warm, and they are not closing. Not yet. This was never a skiff.`,
  intro3: () => `The dust is the problem, Captain. Beyond close range our sensors smear, and torpedo seekers will not hold a lock in it: I would not waste a torpedo here. I can't tell you the ground around us without an active sweep, and that would light us up like a beacon of our own. The old beacon may still have its survey charts.`,
  intro4: (v, s) => `${formalOf(s)}, they will call. Whatever she wants, she chose this ground, and she knows it better than we do. Lt. Cmdr. Rask can read how they mean to come at us, given a minute to watch them move. The ship is yours.${n(v, 'escorts') === 2 ? ' Three ships to our one.' : ' Two ships to our one.'}`,
  introHint: () => 'OFFLINE INTERPRETER: give orders in plain English. "Rask, what are they doing?", "Szabo, pull the charts from the beacon", "Varga, launch a probe into the dust", "take us into the Needle", "take us behind the Anvil and go dark", "Chief, make a sensor ghost", "hail the corsairs". Type "help" or "options" at any time.',
  help: () =>
    `Speak or type in plain English. Reading them: "Rask, what are they doing?", "Number One, what do you recommend?". The ground: "Szabo, pull the charts from the beacon", "Varga, launch a probe", "Varga, active ping". Moving: "take us into the Needle", "take us behind the Anvil", "charge the flagship", "back to the beacon", "get us out of the shoal". Tricks: "go dark", "Chief, make a sensor ghost", "Chief, clear the rubble from the Needle", "Szabo, stage frigate traffic". Talking: "hail the corsairs", then "strike your colours", "who are you working for?", "we know your play". Also "listen to their traffic", "raise shields", "fire on the Hagfish", "status" and "options".`,

  // ---- shared engine keys, reworded for this scenario
  posture_nonHostile: () => 'Understood. Weapons stay cold, Captain.',
  incomingHail: () => 'We are being hailed, Captain.',
  noContact: () => `No such ship here, Captain. Just the ${CORSAIR}, her escorts in the rocks, and the dust.`,
  noCompartmentKnown: () => 'Nothing a scan could find through this dust, Captain.',
  unknownPassenger: () => 'There is no one by that description out here, Captain.',
  passengerAlreadyMoved: () => 'There is no one by that description out here, Captain.',
  passengerDead: () => 'There is no one by that description out here, Captain.',
  passengerStasis: () => 'There is no one by that description out here, Captain.',
  compartmentShielded: () => 'The dust is too thick to see through, Captain.',
  compartmentTooFar: () => 'The dust is too thick to see through, Captain.',
  compartmentRevealed: () => 'The dust is too thick to see through, Captain.',
  compartmentKnown: () => 'The dust is too thick to see through, Captain.',
  noneTrapped: () => 'No one is trapped, Captain.',
  cannotInterpose: () => 'There is no one to put ourselves between, Captain. They want us.',
  transportRange: () => `Not in this dust, Captain. It scatters every transporter lock.`,
  teamRange: () => 'Not in this dust, Captain.',
  teamShields: () => 'Not with our shields up, Captain.',
  transportShields: () => 'Our shields are up, Captain; the transporter cannot cycle through them.',
  extendRange: () => 'There is no one to cover out here, Captain, but ourselves.',
  kestrelEmpty: () => `The ${CORSAIR} is a warship of sorts, Captain, and her crew are aboard her.`,
  kestrelRepairScope: () => `The ${CORSAIR} isn't ours to repair, Captain.`,
  kestrelAlreadyStable: () => `The ${CORSAIR} isn't ours to repair, Captain.`,
  kestrelStabilised: () => `The ${CORSAIR} isn't ours to repair, Captain.`,
  kestrelStabiliseFailed: () => `The ${CORSAIR} isn't ours to repair, Captain.`,
  powerReactor: () => 'Our reactor is fine, Captain.',
  repaired: (v) => `Repair crews have the ${v.system} back to ${v.health}%.`,
  helm_interpose: () => 'There is no one to put ourselves between, Captain.',
  tractorKestrel: () => `Captain, the ${CORSAIR} is too far off for the tractor, and she would fight it.`,
  tractorCruiser: () => `Captain, the ${GAVEL} is too far off for the tractor.`,
  tractorRange: (v) => `Target at ${v.km}; tractor reach is ${v.need}.`,
  jumpWithKestrel: () => 'Jump drive engaged.',
  jumpEngaged: () => `Jump drive engaged. Leaving ${SHOALS}.`,
  jumpCharging: (v) => `Charging the jump drive (${v.charge}%). Captain, the dust will make the jump rough.`,
  evacComplete: () => 'The transporter cannot hold a lock in this dust, Captain.',
  evacPartial: () => 'The transporter cannot hold a lock in this dust, Captain.',
  passengerAboard: () => 'There is no one by that description out here, Captain.',
  cargoAboard: () => 'The lattices are secure in the hold, Captain.',
  medicalTeam: () => 'Dr. Osei has the medical bays ready, Captain.',
  trappedFreed: () => 'No one is trapped, Captain.',
  trappedNotYet: () => 'No one is trapped, Captain.',
  interposeTookHit: () => 'We took that one, Captain.',
  impTractorShield: () => 'The tractor would not stop their guns in this dust, Captain.',
  impShieldExtend: () => 'There is no one else to cover, Captain.',
  impPlasmaVent: () => 'In this dust, Captain? A vent would vanish in it. A sensor ghost would serve better.',
  impEjectCore: () => 'There is no reason to touch the core, Captain.',
  impEjectCoreFailed: () => 'There is no reason to touch the core, Captain.',
  impSensorGhost: () => 'Sensor ghost running, Captain.',
  kestrelBreachCrew: () => `The ${CORSAIR} has gone quiet.`,
  kestrelBreachEmpty: () => `The ${CORSAIR} has gone quiet.`,
  reinforcementsArrive: () => 'Nobody else is coming, Captain.',
  reinforcementsHoldOff: () => 'Nobody else is coming, Captain.',
  reinforcementsDetected: () => 'Nobody else is coming, Captain.',
  scanKestrelDetail: (v) => `The ${CORSAIR}: a corsair raider, rebuilt from an old ore tug, ${n(v, 'crew')} aboard, beams and no torpedoes worth the name. ${n(v, 'escorts') === 1 ? `The ${ESCORT_A} is a gun with an engine on it.` : `The ${ESCORT_A} and the ${ESCORT_B} are guns with engines on them.`} She's no match for us alone, Captain. She isn't alone.`,
  scanKestrelBasic: (v) => `The ${CORSAIR}, at ${v.km}.`,
  scanCruiserBasic: (v) => `The ${GAVEL}, at ${v.km}.`,
  scanCruiserDetail: () => `The ${GAVEL}: a Syndicate gunship, thirty aboard, heavier guns than anything the corsairs have, and her weapons cold. She's watching.`,
  noGavelYet: () => 'Nothing else in sensor range, Captain, as far as the dust lets me see.',
  areaSweep: () => `The ${CORSAIR} and her escorts in the rocks around the beacon, ${ANVIL} to one side of us, ${NEEDLE} to the other, and the open gap behind. Everything else is dust.`,
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}.`,
  ardenArms: () => 'Weapons are warm, Captain.',
  ardenArmsAgainstHalcyon: () => 'Weapons are warm, Captain.',
  contactHostile: () => `The ${CORSAIR} is hostile, Captain.`,
  improviseUnclear: () => 'Understood, Captain.',
  refuseCivilian: (v) => `Captain, the ${v.name} has struck her colours, and she has ${n(v, 'souls')} people aboard. I won't fire on a ship that has surrendered.`,
  refuseFriendly: () => "Captain, nobody out here has fired on anyone. I won't fire first.",
  cededWithPassenger: () => 'There is no one here for us to hand over, Captain.',
  adviseBreach: () => 'Captain, watch the hull.',
  adviseShields: () => 'Captain, shields up would be wise. Their guns are warm.',
  adviseCompartment: () => 'Captain, the dust hides everything past close range.',
  adviseScan: () => 'Captain, the dust hides everything past close range.',
  adviseOptions: () => 'Captain, ask Rask how they mean to come at us.',
  cruiserHit: (v) => `They hit the ${v.target}.`,
  cruiserHitDeflected: () => 'Deflected, Captain.',
  cruiserMissed: () => 'A miss, Captain.',
  bluffHolding: () => 'They are holding, Captain.',
  bridgeSurveyBusy: () => 'Varga is busy with the dust, Captain.',
  bridgeNotNow: () => 'Not now, Captain. The corsairs are in the rocks.',
  impNotHere: () => 'Not here, Captain. Not in this dust.',
  objectivesReport: () => 'The objectives are on your board, Captain.',
  optionsReport: (v) => `Options, Captain: ${v.options}.`,

  // ---- the bridge
  relayed: () => 'Passing that on, Captain.',
  afterEnd: () => 'It is done, Captain.',
  corsairsUnclear: (v) => `Captain, I'm not sure how to do "${v.description}" here.`,
  xoCase: (v) => `${n(v, 'opened') ? `They are firing on us, Captain. Hull ${n(v, 'hull')}.` : n(v, 'toUltimatum') > 0 ? `${DRAYCOTT_SHORT}'s deadline is about ${mins(n(v, 'toUltimatum'))} off.` : 'Her deadline has passed.'} ${n(v, 'read') ? `Rask has their pattern: ${v.patternWords}.` : "We don't know yet how they mean to come at us."} ${n(v, 'terrain') ? 'We know the ground.' : "We don't know the ground."}${n(v, 'broken') ? ' Their plan is broken.' : ''}`,
  statusCorsairs: (v) => `Hull ${n(v, 'hull')}, shields ${n(v, 'shields') ? n(v, 'shields') : 'down'}. The ${CORSAIR} and ${escorts(v)} in the rocks. ${n(v, 'read') ? `Their pattern is ${v.patternWords}.` : 'Their pattern is not yet read.'} ${n(v, 'struck') ? 'She has struck her colours.' : n(v, 'broken') ? 'Their plan is broken; they are holding off.' : n(v, 'opened') ? 'They are firing on us.' : `Her deadline: about ${mins(n(v, 'toUltimatum'))}.`}`,
  statusShip: (v) => `Hull ${n(v, 'hull')}, shields ${n(v, 'shields') ? n(v, 'shields') : 'down'}${n(v, 'dark') ? ', running dark' : ''}. The lattices are secure.`,
  xoNoCollectorYet: () => 'There is no collector here to hand anyone to, Captain.',
  xoNoNeedCargo: () => "Captain, they've stopped. There's no need to give them anything now.",
  xoDraycott: () => `${DRAYCOTT_SHORT} commands the ${CORSAIR}, Captain. Corsairs don't usually ambush ISA ships; something has made her desperate enough, or sure enough, to try.`,
  xoSkerrit: () => `${SKERRIT_SHORT} works for ${SYNDICATE}, Captain. He's here for ${DRAYCOTT_SHORT}'s debt, one way or another.`,
  xoSkerritUnknown: () => "No one by that name has shown themselves, Captain.",
  xoCounselRead: () => "Before we move, let Rask read them, Captain. She chose this ground; every way out of here may be one she's waiting at.",
  xoCounselGround: () => "Rask has their pattern. Now we need the ground, Captain: Szabo can pull the beacon's charts without lighting us up, or Varga can put a probe into the dust.",
  xoCounselBreak: (v) => `We have their pattern and the ground, Captain. ${counsel(String(v.pattern), v)}`,
  xoCounselDebt: () => "Their plan is broken, Captain. She'll talk now. Find out what she's really after; Szabo can listen to their traffic.",
  xoCounselFinish: () => 'Their plan is broken and we know what she owes, Captain. Finish it on the channel, or take us out quietly.',

  // ---- Rask
  raskWatching: () => "They're moving between the rocks, Captain, not at us. Give me a minute of watching them and I'll tell you how they mean to do it.",
  raskTooSoon: () => "One more minute, Captain. They haven't committed to anything I can read.",
  raskTorn: (v) => `It's ${v.a} or ${v.b}, Captain, and I can't yet tell which. The escorts could be doing either. Give me another minute or two, or a better look at them.`,
  raskRead_pincer: () => "It's a pincer, Captain. The escorts are working round both sides of us while the flagship holds the middle. When the arms close, we're in a crossfire, and the open gap behind us is where they close.",
  raskRead_herd: () => `They're herding us, Captain. Every gun is laid so that the open gap looks like the way out. It isn't: I'd bet it leads into a dead end in the rocks, and they'll board us there.`,
  raskRead_bleed: () => "It's a bleed, Captain. They'll never close. Small passes from cover, a little off our shields each time, until we haven't any left. Patient people.",
  raskCounsel_pincer: (v) => counsel('pincer', v),
  raskCounsel_herd: (v) => counsel('herd', v),
  raskCounsel_bleed: (v) => counsel('bleed', v),
  raskTorpedoes: () => 'Not in this dust, Captain. The seekers lose the lock in it. Beams only, if it comes to that.',
  raskTorpedoLost: () => 'Torpedo away, and lost, Captain. The seeker went after the dust. That was the warning about torpedoes.',
  raskTorpedoLostAgain: () => 'Lost in the dust again, Captain.',
  raskBeaten: () => "Captain, she isn't fighting us. She's stopped.",
  hagfishDestroyed: (v) => `The ${CORSAIR} is gone, Captain. ${n(v, 'crew')} people aboard her.`,
  corsairsSlipAway: () => 'The corsairs are pulling back into the dust, Captain. They are letting us go.',
  sumpClosing: () => "Captain, they're not shooting. They don't need to. They're closing in on us.",
  raskGhostDrawing: () => 'They are firing at our ghost, Captain. Not at us.',
  raskLostUs: () => "They've lost us, Captain. Their guns are searching the rock.",
  shieldsCollapsed: () => 'Our shields are down, Captain!',
  boardedHull: () => "Captain, we've lost too much. They are coming alongside to board.",
  boardedInSump: () => `It's a dead end, Captain, ${SUMP}: rock on three sides, and their ships across the fourth. They're coming aboard.`,
  volley: (v) => `They fired on us, Captain.${n(v, 'damage') ? ` Hull down ${n(v, 'damage')}.` : ' The shields took it.'}`,
  volleyCrossfire: (v) => `Crossfire, Captain! The arms have closed on us in the gap.${n(v, 'damage') ? ` Hull down ${n(v, 'damage')}.` : ''}`,
  volleyFlanked: (v) => `They're on our flanks, Captain. Charging the flagship has put us between her escorts.${n(v, 'damage') ? ` Hull down ${n(v, 'damage')}.` : ''}`,
  volleyChoked: (v) => `We're stuck at the mouth of ${NEEDLE}, Captain, and they know it.${n(v, 'damage') ? ` Hull down ${n(v, 'damage')}.` : ''}`,
  volleyBleedNeedle: (v) => `${Ncap} doesn't stop a bleed, Captain. They're still picking at us.${n(v, 'damage') ? ` Hull down ${n(v, 'damage')}.` : ''}`,
  planBroken_pincer: () => "That's broken it, Captain. Their arms can't close round us here. The escorts are pulling back to the flagship.",
  planBroken_herd: () => "That's broken it, Captain. They've nothing left to herd us with. The escorts are drifting back.",
  planBroken_bleed: () => "That's broken it, Captain. They can't bleed us from here. They're pulling back.",

  // ---- the helm
  helmLeaving: () => "We're already on our way out, Captain.",
  helmAlready_pocket: () => "We're at the beacon, Captain.",
  helmAlready_needle: () => `We're in ${NEEDLE}, Captain.`,
  helmAlready_shadow: () => `We're in ${ANVIL}'s shadow, Captain.`,
  helmAlready_charge: () => "We're right on top of her, Captain.",
  helmAlready_gap: () => "We're in the gap, Captain.",
  helmAlready_sump: () => "We're in the dead end, Captain.",
  adeyemiSump: () => "Captain, before we take the gap: it's too clean. Rock everywhere else and a lane through there, wide open? I've flown rocks like these. That's a pocket, not a way out. Order it again and I'll take it, but I don't like it.",
  adeyemiGapOk: () => "The gap looks like what it is, Captain: the long way round, wide open, and exposed all the way.",
  adeyemiRocks: () => `I can thread ${NEEDLE} if it's clear, Captain, and I can put us in ${ANVIL}'s shadow. Just tell me where.`,
  helmMoving_pocket: () => 'Bringing us back to the beacon, Captain.',
  helmMoving_needle: () => `Into ${NEEDLE}, Captain. Slow and steady.`,
  helmMoving_shadow: () => `Taking us into ${ANVIL}'s shadow, Captain.`,
  helmMoving_charge: () => 'Straight at the flagship, Captain. Full impulse.',
  helmMoving_gap: () => 'Taking the gap, Captain.',
  helmNeedleChokedKnown: () => "The charts show rubble across it, Captain. We'll be stuck at the mouth until the Chief clears it.",
  helmNeedleBlocked: () => "We can't get through, Captain. Not until the rubble is cleared.",
  helmExitNeedle: () => `Threading ${NEEDLE} out of the shoal, Captain. Two minutes.`,
  helmExitShadow: () => `Easing out along ${ANVIL}, Captain, keeping the rock between us and them. Three minutes.`,
  helmExitGap: () => 'Taking the gap out of the shoal, Captain. Two minutes, in the open.',
  helmClearWithHer: () => `Clear of ${SHOALS}, Captain, with ${DRAYCOTT_SHORT} aboard under guard.`,
  helmClearStruck: () => `Clear of ${SHOALS}, Captain. The ${CORSAIR} under our guns, her colours struck.`,
  helmClearCalled: () => `Clear of ${SHOALS}, Captain.`,
  helmIntoTheDust: () => `Clear of ${SHOALS}, Captain. Nobody followed us.`,
  helmRanForIt: () => `Clear of ${SHOALS}, Captain. They were on our heels the whole way.`,
  inTheSump: () => `Captain... it's a dead end. ${SUMP}: rock on three sides. They're closing the fourth. We have a minute to get out.`,
  arrivedNeedleChoked: () => `We're at the mouth of ${NEEDLE}, Captain, and it's choked: rubble across the channel. We're not getting through like this.`,
  arrivedShadowIronDark: () => `In ${ANVIL}'s shadow and dark, Captain. The rock is iron; against it, we're nothing.`,
  arrivedShadowIceDark: () => `In ${ANVIL}'s shadow, Captain, but it's ice. We're dark against a bright rock. They can see us.`,
  arrived_pocket: () => 'Back at the beacon, Captain.',
  arrived_needle: () => `In ${NEEDLE}, Captain. Rock close on both sides; they can only come at us from the ends.`,
  arrived_shadow: () => `In ${ANVIL}'s shadow, Captain.`,
  arrived_charge: () => "Right on top of her, Captain. Her escorts can't fire without hitting her.",
  arrived_gap: () => 'In the gap, Captain. Wide open.',

  // ---- Okafor
  okaforAlreadyDark: () => "We're as dark as I can make her, Captain.",
  okaforDarkIron: () => `Dark, Captain. Emissions down to nothing, shields down with them. Against that iron, we're a hole in the rock.`,
  okaforDarkShadow: () => `Dark, Captain. Emissions down, shields down with them. Whether the rock hides us depends on what it's made of.`,
  okaforDarkOpen: () => 'Dark, Captain, shields down with it. Out here in the open, though, dark only makes us quiet. It doesn\'t make us hidden.',
  okaforLit: () => "We're lit, Captain. Everything's back.",
  okaforGhostAlready: () => 'The ghost is already running, Captain.',
  okaforGhost: () => "Sensor ghost running, Captain: a second Halcyon, a few kilometres off, for about three minutes. They'll split their fire, or chase it.",
  okaforPingBroke: () => "That sweep lit us up, Captain. We're not dark any more.",
  okaforFireBroke: () => "Firing lit us up, Captain. We're not dark any more.",
  okaforShieldsBroke: () => "Raising shields lit us up, Captain. We're not dark any more.",
  okaforNeedleClear: () => `${Ncap} is clear, Captain. Nothing to shift.`,
  okaforNeedleUnknown: () => `I'd need to see ${NEEDLE} first, Captain. Get us there, or get me the charts.`,
  okaforNeedleFar: () => `We'd have to be at the mouth of ${NEEDLE} for the tractor to reach the rubble, Captain.`,
  okaforClearing: () => 'Working on it, Captain.',
  okaforClearStart: () => 'Tractor on the rubble, Captain. Two minutes, and we hold still while I do it.',
  okaforNeedleCleared: () => `${Ncap} is clear, Captain. We can get through.`,
  okaforNotDark: () => "We're not running dark, Captain.",
  okaforOptions: () => `I can make her dark, Captain: no emissions, no shields, nothing for them to see, if there's something to hide against. I can make a sensor ghost for a few minutes. And if ${NEEDLE} is choked, the tractor can shift the rubble, given time.`,

  // ---- Varga
  vargaPing: (v) => `Active sweep, Captain. The ground: ${ground(v)}. And everyone in the shoal just saw exactly where we are.`,
  vargaProbeAlready: () => 'The probe is already out there, Captain.',
  vargaProbeOut: () => 'Probe away into the dust, Captain. Running passive, drifting. Two minutes, and it will tell us what it sees without telling them where we are.',
  vargaProbeBack: (v) => `The probe has looked, Captain. The ground: ${ground(v)}. And it got a clear look at the escorts' tracks; Rask will want them.`,
  vargaTerrain: (v) => `The ground, Captain: ${ground(v)}.`,
  vargaBlind: () => "I can't see the ground through this dust, Captain, not passively. An active sweep would show me, and show them us. Or a probe, or the beacon's charts.",
  vargaGavel: () => 'New contact at the edge of the shoal, Captain. A gunship, standing off. Weapons cold.',

  // ---- Szabo
  szaboRecording: () => `The ${SKIFF}'s call is a recording on a loop, Captain. The breathing is in the same places every time. There's no skiff.`,
  szaboDebtAgain: (v) => `From their traffic, Captain: ${DRAYCOTT_SHORT} owes ${SYNDICATE} about ${n(v, 'debt')} thousand marks, and their collector is coming.`,
  szaboChartsStart: () => "Asking the beacon for its survey charts, Captain. It's old, and slow. A minute.",
  szaboChartsWorking: () => "Still pulling them, Captain.",
  szaboChartsIn: (v) => `The beacon's charts are in, Captain. Varga has them: ${ground(v)}.`,
  szaboTraffic: (v) => `Their traffic, Captain, what I can get of it. The ${SKIFF}'s call is a loop; there was never a skiff. And they keep saying one name: ${SYNDICATE}. ${DRAYCOTT_SHORT} owes them about ${n(v, 'debt')} thousand marks, and someone called the collector is coming to see she pays. These lattices are the payment.`,
  szaboStaged: () => "Staging traffic, Captain: an ISA frigate's routine chatter, as if she were just outside the shoal. It's only noise about our own strength; I'll put nothing in it that claims distress or surrender. Now tell them about it.",
  szaboStagedAlready: () => 'The traffic is already running, Captain.',
  szaboRefusesRuse: () => "Captain, I won't send that. I'll mislead them about our strength all day, but not a false surrender, and not false distress or a mercy signal. That's not a ruse the ISA allows, and every real distress call pays for it after.",
  cargoReleased: () => `The cargo lock is open, Captain. The ${CORSAIR}'s tender is taking the lattices.`,

  // ---- Captain Draycott
  draycottCall: (v) => `"Halcyon, this is ${DRAYCOTT_SHORT} of the ${CORSAIR}. No skiff, I'm afraid. You've a hold full of drive lattices. Put them out of your cargo lock and you can be on your way. You've ${mins(n(v, 'toUltimatum'))} to think about it, and then I stop asking."`,
  draycottGreet: () => `"${DRAYCOTT_SHORT}. Have you thought about it, Halcyon?"`,
  draycottStatus: (v) => (n(v, 'opened') ? '"Still here, Halcyon. Still waiting for those lattices."' : `"Lattices, Halcyon. Out of the lock. The clock is still running."`),
  draycottAfter: () => '"We\'re done, Halcyon."',
  draycottTimeUp: () => `"Time's up, Halcyon." The ${CORSAIR}'s guns come round. "All of you, now."`,
  draycottFiredOn: () => `"So that's how it is." The ${CORSAIR}'s guns come round. "All of you, now!"`,
  draycottBroken: (v) => (v.nerve === 'proud' ? '"Clever. That was clever, Halcyon." A pause. "You\'ve made your point."' : v.nerve === 'desperate' ? '"No. No, no." Someone shouting behind her. "Hold off. Everybody hold off."' : '"Hold off, all of you. Hold off." Quieter: "You\'ve made your point, Halcyon."'),
  draycottScoffs: () => '"Oh, come on, Halcyon. I\'ve sent that one myself. Don\'t insult me."',
  draycottTakes: () => '"Sensible. Open the lock and we\'ll be gone before you\'ve finished being ashamed of it."',
  draycottYield: () => '"Good. Then open your cargo lock, and we\'re done."',
  draycottInCustody: () => '"I\'ve struck, Halcyon. I\'m not going anywhere."',
  draycottNoDeal: () => '"After that? No. I don\'t deal with people who lie the way you do."',
  draycottWhatFor: () => '"Protection? From what? You\'re the only thing out here I need protecting from."',
  draycottNoProtection: () => '"I don\'t need the ISA\'s protection, Halcyon. I need your lattices."',
  draycottAccepts: (v) => `A long silence. "…All right. All right. I'll strike. I'll come across, and I'll tell your ISA everything I know about ${SYNDICATE}, and it's a great deal. But you keep me off the ${GAVEL}. ${SKERRIT_SHORT} will be here in ${mins(n(v, 'toCollector'))}, and he'll ask for me by name."`,
  draycottStrikeNo: () => '"Strike? You\'re in my rocks, Halcyon, not the other way round."',
  draycottStrikes: () => `"…All right. The ${CORSAIR} strikes. Weapons down, all of you. You have my word, for what it's worth out here."`,
  draycottProudNo: () => '"You got lucky, Halcyon. I don\'t strike to luck."',
  draycottDesperateNo: () => `"Strike? And then what? You hand me to the Syndicate's collector, or he takes me off you at the next port. I strike and I'm dead, Halcyon. Unless you've something better than that."`,
  draycottBluffBurned: () => '"I\'ve already heard your stories, Halcyon."',
  draycottCallsOff: () => `A pause. "…Not today, then." The ${CORSAIR} turns away into the dust, her escorts after her.`,
  draycottCallsBluff: (v) => (v.nerve === 'desperate' ? '"Let them come. I\'ve nothing left to go home to, Halcyon."' : '"Your frigate, is it? Then where is she, Halcyon?"'),
  draycottWrong: () => '"Is that what you think? Good."',
  draycottNamed: () => '"…So you\'ve a tactician aboard. Lucky you."',
  draycottDebt: (v) => `"You want to know? Fine." Tired, suddenly. "I owe ${SYNDICATE} ${n(v, 'debt')} thousand marks. Their collector, ${SKERRIT_SHORT}, is on his way to see I pay. Those lattices are the payment. If I don't have them when he gets here, he takes it out of me."`,
  draycottNoDebt: () => '"What I want is your lattices, Halcyon. Why is my business."',
  draycottBeaten: () => `"Stop! Stop firing! We'd stopped, Halcyon, we'd stopped!" The ${CORSAIR}'s guns are cold. They have been for some time. "We strike. We strike!"`,
  draycottDisabled: () => `"…Enough. Enough! The ${CORSAIR} strikes." Smoke on her bridge. "Stop firing."`,

  // ---- Collector Skerrit
  skerritArrives: () => `"Halcyon. ${SKERRIT_SHORT}, of ${SYNDICATE}, aboard the ${GAVEL}. Don't mind me. I'm only here to see a debt paid."`,
  skerritDemand: (v) => `"Halcyon. ${SKERRIT_SHORT}, of ${SYNDICATE}. You have ${DRAYCOTT_SHORT}. She owes my employers ${n(v, 'debt')} thousand marks, and she's coming with me. Hand her across, and the ISA and the Syndicate need never have words."`,
  skerritGreet: () => `"${SKERRIT_SHORT}. Take your time, Halcyon. I always do."`,
  skerritStatus: () => '"I\'m still here, Halcyon. So is the debt."',
  skerritWatching: () => '"Carry on, Halcyon. This is between you and her. For now."',
  skerritDebt: (v) => `"${DRAYCOTT_SHORT}? She owes ${SYNDICATE} ${n(v, 'debt')} thousand marks, Halcyon, and the Syndicate doesn't forget."`,
  skerritTakes: () => `"Very good, Halcyon. Very sensible." The ${GAVEL} takes ${DRAYCOTT_SHORT} aboard and turns for home without another word.`,
  skerritRefused: () => `A long pause. "…The ISA keeps strange company these days. Very well, Halcyon. The Syndicate will remember." The ${GAVEL} turns away.`,
  skerritGoes: () => `"I see you've no answer for me, Halcyon. I'll ask again somewhere else." The ${GAVEL} turns away from the shoal.`,
  skerritShot: () => `"That was unwise, Halcyon." The ${GAVEL} turns away and is gone into the dust.`,
  skerritAfter: () => '"Good day, Halcyon."',
};

export const templates: Record<string, TemplateFn> = { ...base, ...T };
