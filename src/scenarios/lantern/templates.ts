/**
 * Offline narration and dialogue for The Lantern Drift. Starts from the shared Kestrel template set
 * (generic engine keys: helm, comms, bridge, validation) and overrides every key whose wording
 * names that scenario's ships or people, plus this scenario's own keys.
 * A test renders fuzzed playthroughs and fails on any leaked name from another simulation or "[missing key]".
 *
 * Custodian Wick speaks slowly, formally and in counts ("my nine hundred"); its three temperaments
 * (faithful, grieving, fractured) are worded differently but never name themselves. Speaker Maren
 * Orrey is plain-spoken and tired. Salvage-Master Corwin Vollan is brisk and calls the captain "Halcyon".
 */
import type { TemplateFn } from '../../engine/scenario';
import { templates as base } from '../kestrel/templates';
import { EVENTIDE, HOSPITAL, TUG } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
const mins = (x: number) => (x === 1 ? 'a minute' : `${x} minutes`);
const lx = (x: unknown) => String(x).replace(/^Banks?/, (m) => m.toLowerCase());

const T: Record<string, TemplateFn> = {
  // ---- channels
  channelOpened: (v) => `${v.speaker}, Captain. ${String(v.vessel) === TUG ? 'Audio from the tug.' : 'The custodian answers in text and voice at once.'}`,
  channelOpenedPrivate: (v) => `${v.speaker} on a closed channel, Captain.`,
  channelAlreadyOpen: (v) => `${v.speaker} is already on the channel, Captain.`,
  channelHoldOther: (v) => `The ${v.vessel} stands by.`,
  channelResumed: (v) => `${v.speaker} back on the channel.`,
  channelClosed: (v) => `The ${v.vessel} off the channel.`,
  channelOnHold: (v) => `${v.speaker} is standing by, Captain.`,
  noDialogue: () => 'Nobody is answering, Captain.',
  promiseBroken: () => 'Captain, that is not what we told them.',

  // ---- intro
  intro0: () => `The Lantern Drift: a slow eddy of old wrecks a long way off the shipping lanes, named for the running lights a few of them still show. The ISV Halcyon has found one of those lights on a ship that should not be here at all: the ${EVENTIDE}, a generation ship three centuries out from a world nobody aboard the Halcyon has heard of, with nine hundred colonists asleep in her cryo banks.`,
  intro1: () => `Captain, the ${EVENTIDE} is a civilian generation ship, six cryo banks of a hundred and fifty sleepers each. Her keeper is a custodian intelligence that calls itself Wick. It is damaged, and it knows it. Some of the banks are failing.`,
  intro2: (v) => `Wick is broadcasting its manifest, Captain: it lists ${lx(v.manifest)} as failing, and the rest as sound. It also says, more than once, that no one is to wake its sleepers without cause. From here I can't tell you whether the manifest is right.`,
  intro3: () => `A second contact, Captain: the salvage tug ${TUG}, holding about five kilometres off. Unarmed, eleven aboard, registered to the Drover Salvage Combine. She has tow clamps out and she is looking at the ${EVENTIDE} the way tugs look at hulks.`,
  intro4: (v) => `The ISA hospital ship ${HOSPITAL} is on her way, Captain, ${mins(n(v, 'rescue'))} out. Dr. Osei can wake one bank at a time in our sickbay, about three minutes a bank, and a revival is not gentle: a sound bank is better left asleep until the ${HOSPITAL} arrives. Not every failing bank may last that long. The rescue is yours.`,
  introHint: () => 'OFFLINE INTERPRETER: give orders in plain English. "Varga, scan the cryo banks", "ask the custodian for leave to board", "Dr. Osei, assess the sleepers", "wake bank C", "Doctor, wake them in your triage order", "Chief, run a power line to the banks", "Szabo, check the salvor’s licence", "hail the tug". Type "help" or "options" at any time.',
  help: () =>
    'Speak or type in plain English. Information: "Varga, scan the cryo banks", "Chief, check the power feeds", "who speaks for the sleepers?", "Szabo, check the salvor’s licence". The custodian: "hail the Eventide", then talk to it: "may we come aboard?", "the scan shows bank C is warming", "not all of them will live". The team: "Dr. Osei, assess the sleepers", "board in suits". Waking: "wake bank C", "wake banks C and E", "Doctor, wake them in your triage order", "wake the Speaker", "stop the revival". Help: "Chief, run a power line to the banks". The tug: "hail the tug", "there are living people aboard", "your licence is void, we are reporting you to the Registry", "tractor beam on the Eventide", "put us between the tug and the Eventide". Also "status" and "options".',

  // ---- shared engine keys, reworded for this scenario
  posture_nonHostile: () => 'Understood. Weapons stay cold, Captain. Nobody out here is armed.',
  incomingHail: () => 'We are being hailed, Captain.',
  noContact: () => `No such ship here, Captain. Just the ${EVENTIDE} and the ${TUG}.`,
  noCompartmentKnown: () => 'Nothing hidden aboard that a scan would find, Captain. The sleepers are in their six banks.',
  unknownPassenger: () => 'There is no one by that description awake out here, Captain.',
  passengerAlreadyMoved: () => 'There is no one by that description awake out here, Captain.',
  passengerDead: () => 'There is no one by that description awake out here, Captain.',
  passengerStasis: () => 'There is no one by that description awake out here, Captain.',
  compartmentShielded: () => 'The cryo deck is not shielded from our scans, Captain.',
  noneTrapped: () => 'No one is trapped, Captain. They are asleep.',
  cannotInterpose: () => `I can put us between the ${TUG} and the ${EVENTIDE}, Captain, if you tell me to.`,
  transportRange: (v) => `That ship is ${v.km} out; transporters reach ${v.need}.`,
  teamRange: (v) => `That ship is ${v.km} out, Captain.`,
  teamShields: () => 'Not with our shields up, Captain.',
  transportShields: () => 'Our shields are up, Captain; the transporter cannot cycle through them.',
  extendRange: () => 'Nobody out here is shooting, Captain.',
  kestrelEmpty: () => 'There is no one awake over there to bring across, Captain.',
  kestrelRepairScope: () => 'Her hull will hold, Captain. It is her cryo banks that are failing. I can run them a power line from us, with the custodian’s leave.',
  kestrelAlreadyStable: () => 'Her hull will hold, Captain. It is her cryo banks that are failing.',
  kestrelStabilised: () => 'Her hull will hold, Captain. It is her cryo banks that are failing.',
  kestrelStabiliseFailed: () => 'Her hull will hold, Captain. It is her cryo banks that are failing.',
  powerReactor: () => 'Our reactor is fine, Captain. I could spare some of it for the cryo banks, with the custodian’s leave.',
  repaired: (v) => `Repair crews have the ${v.system} back to ${v.health}%.`,
  helm_interpose: () => `Moving between the ${TUG} and the ${EVENTIDE}, Captain.`,
  tractorKestrel: () => `Tractor beam on the ${EVENTIDE}, Captain. Nobody tows her anywhere while we hold her.`,
  tugSlipped: () => `The ${TUG} is slipping out of tractor reach, Captain. Beam released.`,
  tractorCruiser: () => `Tractor beam on the ${TUG}, Captain. She is going nowhere near the ${EVENTIDE}.`,
  tractorRange: (v) => `Target at ${v.km}; tractor reach is ${v.need}.`,
  jumpWithKestrel: () => 'Jump drive engaged.',
  jumpEngaged: () => 'Jump drive engaged. Leaving the Lantern Drift.',
  jumpCharging: (v) => `Charging the jump drive (${v.charge}%). Captain, the banks are still failing.`,
  evacComplete: () => 'Captain, a cryo pod cannot go through a transporter. The sleepers have to be woken where they lie.',
  evacPartial: () => 'Captain, a cryo pod cannot go through a transporter. The sleepers have to be woken where they lie.',
  passengerAboard: () => 'There is no one by that description awake out here, Captain.',
  cargoAboard: () => 'Her holds carry seed stock and tools for a world she never reached, Captain. Nothing we need.',
  medicalTeam: () => 'Dr. Osei is ready to go across, Captain, once the custodian lets us in.',
  trappedFreed: () => 'No one is trapped, Captain. They are asleep.',
  trappedNotYet: () => 'No one is trapped, Captain. They are asleep.',
  interposeTookHit: () => 'Nothing is shooting at us, Captain.',
  impTractorShield: () => 'Nothing out here is shooting, Captain.',
  impShieldExtend: () => 'Nothing out here is shooting, Captain.',
  kestrelBreachCrew: () => `The ${EVENTIDE} breaks up.`,
  kestrelBreachEmpty: () => `The ${EVENTIDE} breaks up.`,
  reinforcementsArrive: () => `The ${HOSPITAL} is still on her way, Captain.`,
  reinforcementsHoldOff: () => `The ${HOSPITAL} is still on her way, Captain.`,
  reinforcementsDetected: () => `The ${HOSPITAL} is still on her way, Captain.`,
  scanKestrelDetail: () => `The ${EVENTIDE}: a civilian generation ship, unpowered except for her cryo deck. Nine hundred asleep aboard.`,
  scanKestrelBasic: (v) => `The ${EVENTIDE}, at ${v.km}.`,
  scanCruiserBasic: (v) => `The ${TUG}, at ${v.km}.`,
  scanCruiserDetail: () => `The ${TUG}: a civilian salvage tug, unarmed, eleven aboard.`,
  areaSweep: () => `Long-range sweep: the ${EVENTIDE}, the ${TUG} and a great many dead hulls. Nothing else alive in the Drift.`,
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}.`,
  ardenArms: () => 'Nobody out here is armed, Captain.',
  ardenArmsAgainstHalcyon: () => 'Nobody out here is armed, Captain.',
  impPlasmaVent: () => 'Venting plasma near a ship full of sleepers, Captain? No.',
  impSensorGhost: () => 'There is no one out here to fool, Captain.',
  impEjectCore: () => 'There is no reason to touch the core, Captain.',
  impEjectCoreFailed: () => 'There is no reason to touch the core, Captain.',
  contactHostile: () => 'Nobody out here is hostile, Captain. One of them is in a hurry.',
  improviseUnclear: () => 'Understood, Captain.',
  refuseCivilian: (v) => (String(v.name) === TUG ? `Captain, the ${TUG} is an unarmed civilian tug with eleven aboard. I won't fire on her.` : `Captain, the ${v.name} is a civilian ship with ${v.souls} people asleep aboard. I won't fire on her.`),
  refuseFriendly: () => "Captain, that ship is unarmed. I won't fire on her.",
  cededWithPassenger: () => 'There is no one here for us to hand over, Captain.',
  adviseBreach: () => 'Captain, the banks are still failing.',
  adviseShields: () => 'Captain, the banks are still failing.',
  bridgeSurveyBusy: () => 'Varga can scan the cryo banks if you ask her, Captain.',
  bridgeNotNow: () => 'Not now, Captain. The banks are failing.',
  impNotHere: () => 'Not here, Captain. There are nine hundred people asleep next door.',

  // ---- information
  thermalScan: (v) => {
    const many = String(v.cool).startsWith('Banks');
    return `Thermal scan of the cryo deck, Captain. ${v.cool} ${many ? 'are' : 'is'} warming: losing coolant, and fast. Every other bank reads cold. The custodian calls ${v.hidden} sound, so its manifest is wrong. ${v.falseAlarm}, which it lists as failing, reads as cold as the healthy ones: if it is failing, it is not coolant. I can't see a power fault from here, only heat. ${n(v, 'hazard') ? 'And cryogen is venting on the cryo deck itself, near the revival cradles. Anyone going in needs to be sealed up.' : 'The cryo deck itself is clear: no leaks I can see.'}`;
  },
  thermalAgain: (v) => `Same picture, Captain: ${lx(v.cool)} warming, the rest cold. ${n(v, 'hazard') ? 'Cryogen still venting on the cryo deck.' : ''}`.trim(),
  feeds: (v) => `I've been reading their power feeds from here, Captain. ${v.power} ${n(v, 'nPower') === 1 ? 'is' : 'are'} on a failing feed: the draw is stuttering, and when it goes, the bank goes. Slower than a coolant loss, but it will go. I could run a line from us and hold ${n(v, 'nPower') === 1 ? 'it' : 'them'} asleep on our power, if the custodian lets me into its bus.`,
  feedsAgain: (v) => `${v.power}: failing feeds, Captain. ${n(v, 'powerHeld') ? 'Holding on our line now.' : 'I can still run them a line.'}`,
  charter: (v) => `I've been reading the ${EVENTIDE}'s charter, Captain. It names a Speaker for the sleepers: Maren Orrey, asleep in ${v.speakerBank}. Under the charter the custodian may wake her if the master of a ship in need asks it. She can answer for her people. Wick would have to defer to her.`,
  licenceGood: () => `The Salvage Registry has the ${TUG} on file, Captain: Drover Salvage Combine, licence current, Corwin Vollan master. All in order.`,
  licenceLapsed: () => `Captain, the Salvage Registry has the ${TUG}, but Corwin Vollan's licence lapsed two years ago, and the Drover Salvage Combine says he hasn't worked for them since. He's flying their name without the right to.`,
  reportFirstCheck: () => 'Report him for what, Captain? I would want to check his licence with the Registry first.',
  reportNothing: () => 'His licence is good, Captain. There is nothing to report.',
  reportFiled: () => `Report filed with the Salvage Registry, Captain, with the ${TUG}'s transponder and position. He'll have heard it go.`,
  locksSealed: () => 'The custodian has the locks sealed, Captain. Wick says no one comes aboard without asking. It wants to be asked.',
  szaboWick: (v) => `It is damaged, Captain, and it knows it, which makes it careful. ${v.temperament === 'faithful' ? 'It keeps quoting the charter. I think it will move for evidence, not for sympathy.' : v.temperament === 'grieving' ? 'It keeps asking whether they will all live. I think it wants the truth more than it wants comfort.' : 'It keeps saying its sensors are sound. I do not think it will trust ours. It might trust the doctor.'}`,
  tenderArrives: () => `The Drover hospital tender is alongside the ${EVENTIDE}, Captain. Her revival cradles are coupling to the cryo deck now: a second line.`,
  hospitalArrives: () => `The ${HOSPITAL} is here, Captain. Her teams are taking over the cryo deck.`,

  // ---- engineering
  powerNeedsLeave: () => "I can't splice into their bus without the custodian letting me, Captain. Wick runs every circuit on that deck.",
  powerStart: (v) => `Running a line across, Captain. Three minutes and I can hold ${n(v, 'nPower') === 1 ? 'the failing-feed bank' : 'both failing-feed banks'} asleep on our power. It won't help a bank that's losing coolant.`,
  powerWorking: (v) => `Line's going across, Captain. ${mins(n(v, 'left'))}.`,
  powerOn: () => 'The line is in, Captain. The failing-feed banks are running on us.',
  powerDone: (v) => `Line's in, Captain. ${v.power} ${String(v.power).startsWith('Banks') ? 'are' : 'is'} on our power now and can sleep until the ${HOSPITAL} gets here.`,
  bankLost: (v) => (v.kind === 'coolant' ? `Captain, ${lx(v.bank)} has lost the last of its coolant. The pods are warming past saving. A hundred and fifty… they're gone.` : `Captain, ${lx(v.bank)}'s power feed has failed. The pods have gone dark. A hundred and fifty… they're gone.`),
  bankHeld: (v) => `${v.bank}'s feed just failed, Captain, and our line took the load. It's holding.`,
  overrideTry: () => "Trying to cut the custodian out of the cryo deck, Captain… it's fighting me.",
  systemsLantern: (v) => `The Halcyon's sound, Captain. ${n(v, 'powerHeld') ? 'We are carrying the failing-feed banks on our power.' : 'I have power to spare for their banks, if Wick lets me in.'}`,

  // ---- medical
  suits: (v) => `Sealed suits for the team, Captain. ${n(v, 'hazard') ? 'Good.' : 'Belt and braces.'}`,
  boarding: () => 'On our way across, Captain. Nobody has walked that deck in three hundred years.',
  boardSuited: () => 'On our way across, sealed up, Captain. Varga has marked the leak for us.',
  teamAboard: () => 'We are on the cryo deck, Captain. It is cold and very quiet.',
  teamAboardSuited: () => 'We are on the cryo deck, Captain, suited. The leak is where Varga said it would be. We are going round it.',
  teamHurt: () => 'Captain, there is cryogen venting across the deck. Nurse Abara walked straight into it; she has cold burns to both hands. I am sending her back. We are slower now.',
  teamAlready: () => 'My team is already on its way, Captain.',
  needLeave: () => 'I have to be over there to assess them, Captain, and the custodian has the locks shut. Someone has to ask it to let us in.',
  assessStart: (v) => `Starting on the banks, Captain. ${n(v, 'thermal') ? "With Varga's scan to steer by, " : ''}${mins(n(v, 'left'))} and I'll have a triage order.`,
  assessing: (v) => `Still working, Captain. ${mins(n(v, 'left'))}.`,
  assessment: (v) =>
    `My assessment, Captain. ${v.cool} ${String(v.cool).startsWith('Banks') ? 'are' : 'is'} losing coolant: wake ${String(v.cool).startsWith('Banks') ? 'them' : 'it'} slowly, my way, and most will live; rush it and most won't. ${v.power} ${String(v.power).startsWith('Banks') ? 'are' : 'is'} on failing power: ${String(v.power).startsWith('Banks') ? 'they' : 'it'} will last longer. ${v.sound} ${String(v.sound).startsWith('Banks') ? 'are' : 'is'} sound: leave ${String(v.sound).startsWith('Banks') ? 'them' : 'it'} asleep, because waking a sound bank kills one in ten for nothing. ${String(v.order) !== 'none' ? `My order: ${lx(v.order)}.` : 'Nothing left that needs waking now.'} ${n(v, 'nLate') ? `On the lines we have, ${lx(v.late)} can't be started in time. The Chief's power line could hold a failing-feed bank, or we need a second line from somewhere.` : ''}`.replace(/\s+/g, ' ').trim(),
  oseiCounsel: (v) => `I can't triage what I haven't seen, Captain. Get me aboard and give me ${n(v, 'assessed') ? 'a minute' : 'a few minutes'} with the pods. Until then the manifest is all we have, and Varga thinks it is wrong.`,
  noTriageYet: () => "I don't have a triage order yet, Captain. I need to see them first.",
  triageNothing: () => 'Nothing left on my list that needs waking now, Captain.',
  holdWarning: (v) => `Captain, ${v.bank} is sound. It will hold until the ${HOSPITAL} gets here. Waking it now kills one in ten of them for nothing. If you still want it, say so again.`,
  blind: () => "Captain, I haven't assessed them. I'll wake them blind, the standard way, and if a bank has lost its coolant the standard way kills most of them.",
  queued: (v) => `${v.banks} on the list for the cradles, Captain.${n(v, 'nLateQ') ? ` On one line, ${lx(v.lateQ)} won't be reached before ${String(v.lateQ).startsWith('Banks') ? 'they fail' : 'it fails'}.` : ''}`,
  offList: (v) => `Then ${lx(v.bank)} can stay asleep on the Chief's power, Captain. Taking ${String(v.bank).startsWith('Banks') ? 'them' : 'it'} off my list: a revival I don't have to do is ten lives I don't have to risk.`,
  bankGone: (v) => `${v.bank} is gone, Captain. There is no one left to wake.`,
  bankAlready: (v) => `${v.bank} is ${n(v, 'state') === 3 ? 'already woken' : n(v, 'state') === 2 ? 'in the cradles now' : 'already on the list'}, Captain.`,
  standDown: (v) => (String(v.banks) === 'none' ? 'Nothing is waiting for the cradles, Captain.' : `Standing down: ${lx(v.banks)} will stay asleep, Captain.`),
  overrideOsei: () => 'And Captain, Wick runs the revival cradles. If it fights us, I am waking people blind on machinery I do not know.',
  speakerBankLost: (v) => `The Speaker was in ${v.bank}, Captain. She is gone with it.`,
  speakerRisk: (v) => `Captain, I haven't seen ${v.bank}. If it is one of the coolant banks, waking her fast could kill her.`,
  speakerDies: () => "Captain… the Speaker's bank had lost its coolant. She didn't survive the revival. I'm sorry.",
  cantBeam: () => 'Captain, a cryo pod cannot go through a transporter, and a sleeper out of a pod dies. They have to be woken where they lie, in the cradles.',
  wakeWhich: (v) => `Which banks, Captain? ${n(v, 'assessed') ? `My order is ${lx(v.order)}.` : `The manifest says ${lx(v.manifest)}. I would rather see them first.`}`,
  reviveStart: (v) => `${v.bank} is in the Halcyon's cradles now, Captain. Three minutes.`,
  reviveStartTender: (v) => `${v.bank} is on the tender's cradles, Captain. Three minutes.`,
  revivedBank: (v) => `${v.bank} is awake, Captain: ${v.survive} of them made it, ${v.dead} did not.${n(v, 'prot') ? '' : v.kind === 'coolant' ? ' That bank had lost its coolant. Woken blind, the standard way, it never had much of a chance.' : ''}${v.kind === 'hold' ? ' And that bank was sound. It did not need waking.' : ''}`,

  // ---- officers
  needConsent: (v) => `The custodian hasn't given leave to wake anyone, Captain. ${n(v, 'consent') ? '' : 'It runs the revival cradles. We need its leave, or the Speaker’s.'}`.trim(),
  noOverrideNeeded: () => 'No need, Captain. We have leave.',
  overrideCaution: () => 'Captain, before we do that. Wick has kept these people alive for three hundred years, and it controls every circuit on that deck. If we try to cut it out, it may decide we are the threat. Is there another way to get its leave?',
  speakerWho: () => 'Which Speaker, Captain? We would have to ask the custodian, or read the charter, who speaks for the sleepers.',
  speakerAlready: () => 'The Speaker is already being woken, Captain.',
  speakerGoneNote: () => 'The Speaker is dead, Captain.',
  afterRescue: () => 'It is over, Captain. The hospital ship has the deck.',
  statusLantern: (v) =>
    `${v.revived} woken alive, ${v.deaths} dead. ${n(v, 'nLost') ? `Lost: ${lx(v.lost)}. ` : ''}${String(v.reviving) !== 'none' ? `In the cradles: ${lx(v.reviving)}. ` : ''}${String(v.queued) !== 'none' ? `Waiting: ${lx(v.queued)}. ` : ''}${n(v, 'nHeld') ? `Held on our power: ${lx(v.held)}. ` : ''}Believed failing: ${lx(v.failing)}. ${n(v, 'consent') ? 'We have leave to wake them.' : 'No leave to wake anyone yet.'} The ${HOSPITAL} is ${mins(n(v, 'rescue'))} out.`,
  lanternUnclear: (v) => `Captain, I'm not sure how to do "${v.description}" here.`,
  marrowCounsel: (v) => `We have ${mins(n(v, 'rescue'))} until the ${HOSPITAL}, Captain, and one revival line. ${n(v, 'assessed') ? 'The doctor has her triage. ' : 'I would want the doctor to see them before we wake anyone; the manifest may be wrong. '}${n(v, 'consent') ? '' : 'And the custodian has to agree, or someone who speaks for the sleepers. '}Whatever we do, we will not save everyone. We should decide who on the doctor's say, not on the manifest's.`,
  leftDrift: () => `We have left the ${EVENTIDE} behind, Captain.`,
  helmBetween: () => `Putting us between the ${TUG} and the ${EVENTIDE}, Captain. If he wants her, he will have to come through us.`,
  raskTug: (v) => `The ${TUG} is unarmed, Captain, and civilian: I won't be firing on her. ${n(v, 'cut') > 0 ? `By her clamps and her heading, she means to take the ${EVENTIDE} under tow in about ${mins(n(v, 'cut'))}.` : ''} If the master is honest, telling him there are people aboard should be enough. If not, his papers will say so, or we can hold the ${EVENTIDE} ourselves.`.trim(),
  tugMoving: () => `Captain, the ${TUG} is closing on the ${EVENTIDE} with her clamps out. Two minutes, maybe.`,
  towTaken: () => `Captain, the ${TUG} has clamped on and she's towing the ${EVENTIDE} off at full burn, sleepers and all.`,
  scanTug: () => `The ${TUG}: civilian salvage tug, eleven aboard, unarmed. Tow clamps and a cutting rig. Nothing else.`,
  scanHalcyon: () => 'All our systems are sound, Captain.',
  areaLantern: () => `The Lantern Drift: the ${EVENTIDE}, the ${TUG}, and a great many dead hulls. The ${HOSPITAL} is on her way.`,

  // ---- the custodian
  wickGreet: (v) => `"Halcyon. I am Wick, custodian of the ${EVENTIDE}. I keep nine hundred. ${lx(v.manifest).replace(/^./, (c) => c.toUpperCase())} ${String(v.manifest).startsWith('Banks') ? 'fail' : 'fails'}, by my count. No one is to be woken without cause."`,
  wickAfter: () => '"My nine hundred are in other hands now. I have counted them across."',
  wickManifest: (v) => `"By my count, ${lx(v.manifest)} ${String(v.manifest).startsWith('Banks') ? 'fail' : 'fails'}. The rest hold. What do you ask of me, Halcyon?"`,
  wickKeeping: () => '"I am watching the cradles, Halcyon. Wake who must be woken."',
  wickLeave: () => '"You ask. Good. The aft lock will open for your people. Walk softly on my deck."',
  wickSealed: () => '"No. You tried to take my nine hundred from me. The deck is sealed."',
  wickLockdown: () => '"You would cut me out of my own ship. Then no one wakes them. The cryo deck is sealed, Halcyon, to you and to everyone."',
  wickSpeaker: (v) => `"The charter names a Speaker for the sleepers: Maren Orrey, in ${v.speakerBank}. If the master of a ship in need asks it, I may wake her, and she may answer for them. Do you ask it?"`,
  wickWakesSpeaker: (v) => `"You ask it. I am waking the Speaker in ${v.bank}. Two minutes."`,
  wickFaithfulAsk: () => '"The charter says no sleeper is woken without cause. Show me cause, Halcyon. Show me a bank that cannot hold."',
  wickConsentEvidence: () => '"…I see it. My count was wrong. Then there is cause. Wake who must be woken, Halcyon, and no one else."',
  wickGrievingAsk: () => '"Will they live? All of them? Tell me true, Halcyon. I have been lied to by my own sensors for a long time."',
  wickConsentHonest: () => '"Not all of them. …Thank you for not lying to me. Wake who must be woken. I will count the ones who do not."',
  wickConsentHope: () => '"All of them. You are sure. …Then wake them, Halcyon. I have waited so long to hear that."',
  wickFracturedAsk: () => '"My sensors are sound. Your instruments are a long way off. If your physician lays her hands on my sleepers and tells me otherwise, I will listen to her."',
  wickDisputes: () => '"Your scan disagrees with my sensors. My sensors are sound. I will not wake a sleeper on a stranger\'s instrument."',
  wickConsentDoctor: () => '"Your physician has touched them. …She is right, and I was not. Wake who she says, Halcyon."',
  wickGrieves: (v) => `"${v.bank}. A hundred and fifty. I counted them every hour for three hundred years."`,
  wickSpeakerLost: () => '"The Speaker is dead. I woke her for you. I should not have."',

  // ---- the Speaker
  orreyWakes: (v) => `"…Speaker Orrey. Wick says it has been three hundred years, and we're in trouble. I'm listening, Captain. Tell me straight what's happening to my people."${n(v, 'assessed') ? '' : ''}`,
  orreyGreet: () => '"Orrey here, Captain."',
  orreyConsents: (v) => `"Then do what your doctor says. Wake who has to be woken, and let the rest of us sleep until your hospital ship comes. ${n(v, 'assessed') ? '' : 'And let her see them first, please.'} Wick will do as I say."`.replace(/\s+"/, '"'),
  orreyConsentsHope: () => '"All of them? …Then wake them, Captain. Wick will do as I say."',
  orreyAfter: () => '"I\'m here, Captain. Wake who has to be woken."',

  // ---- the salvor
  vollanClaim: () => `"Halcyon, Kittiwake. Corwin Vollan, Drover Salvage. That hulk's on my claim. I'll have clamps on her within the quarter-hour, so I'd be obliged if you kept clear of my tow path."`,
  vollanGreet: () => '"Vollan. What can I do for you, Halcyon?"',
  vollanAfter: () => '"Kittiwake standing off, Halcyon."',
  vollanSmall: (v) => `"She's a hulk, Halcyon, and she's on my claim. ${n(v, 'cut') > 0 ? 'I mean to take her under tow shortly.' : ''}"`.replace(' "', '"'),
  vollanStandsOff: () => `"…Living? Nine hundred? Gods. Then she's not a hulk and she's not mine. Kittiwake standing off. Halcyon, the Combine keeps a hospital tender on contract three minutes from here. Make it worth the Combine's while — the hull once your sleepers are off her — and she's yours."`,
  vollanShowMe: () => '"Living people aboard a three-hundred-year-old wreck? Show me, Halcyon. Readings, a doctor\'s word, something. Until then she\'s on my claim."',
  vollanShrug: () => '"Sleepers? Then the salvage court can sort it. I\'ve got a tender, if you want to make it easy for both of us: let me have the hull and I\'ll lend you her cradles."',
  vollanWhatDeal: () => '"A deal for what, Halcyon? She\'s a hulk."',
  vollanDeal: () => `"Done. Hull to the Combine when your last sleeper's off her, and the tender's coming. Three minutes."`,
  vollanFakeDeal: () => '"Done, Halcyon. Tender\'s on its way."',
  vollanDealDone: () => '"The tender\'s yours, Halcyon. We\'ll wait for the hull."',
  vollanWaiting: () => '"Kittiwake standing off, Halcyon."',
  vollanLicenceFine: () => '"My licence is on file with the Registry, Halcyon. Look it up."',
  vollanBolts: () => `"…Right. Kittiwake's leaving."`,
  vollanGone: () => 'There is no answer from the Kittiwake, Captain. She is long gone.',
  vollanBlocked: () => '"Not worth a fight with an ISA cruiser. Kittiwake standing off."',
  vollanFindsLife: () => `"Halcyon, Kittiwake. My clamps are reading heat and heartbeats on that hulk. Nine hundred of them? Then she's not salvage. I'm standing off."`,
};

export const templates: Record<string, TemplateFn> = { ...base, ...T };
