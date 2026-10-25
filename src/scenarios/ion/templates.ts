/**
 * Offline narration and dialogue for Ion Season. Starts from the shared Kestrel template set
 * (generic engine keys: helm, comms, bridge, validation) and overrides every key whose wording
 * names that scenario's ships or people, plus this scenario's own keys.
 * A test renders fuzzed playthroughs and fails on any leaked name from another simulation or "[missing key]".
 *
 * Captain Odran Brack speaks slowly, in long, weathered sentences, and calls the storm "she".
 * Captain Rosalind Teague speaks fast and short, and calls the Halcyon "Halcyon".
 * An unfit master gives themself away in small ways, for anyone who listens.
 */
import type { TemplateFn } from '../../engine/scenario';
import { templates as base } from '../kestrel/templates';
import { CAPTAIN_SHORT, MATE_NAME, SHIP_NAME, STATION } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
const isM = (v: V) => v.hauler === 'mule';
/** Pick the line by master: Brack's slow voice or Teague's quick one. */
const by = (v: V, mule: string, gannet: string) => (isM(v) ? mule : gannet);
const mins = (x: number) => (x === 1 ? 'a minute' : `${x} minutes`);
const tellOf = (v: V) => (n(v, 'tell') ? by(v, ' (A pause. Something on his console rattles, like a cup on a saucer, and stops.)', ' (She says the last word twice, a beat slow, and doesn’t notice.)') : '');
const chg = (x: number) => (x < 0 ? 'gone from the line' : `${x}`);

const T: Record<string, TemplateFn> = {
  // ---- channels: the convoy net
  channelOpened: (v) => `${v.speaker} on the convoy net, Captain.`,
  channelOpenedPrivate: (v) => `${v.speaker} on a closed channel, Captain. Just the two of you.`,
  channelAlreadyOpen: (v) => `${v.speaker} is already on the net, Captain.`,
  channelHoldOther: (v) => `${v.vessel} stands by on the net.`,
  channelResumed: (v) => `${v.speaker} back on the net.`,
  channelClosed: (v) => `${v.vessel} off the net.`,
  channelOnHold: (v) => `${v.speaker} is standing by, Captain.`,
  noDialogue: () => 'Nobody is answering on the net, Captain.',
  promiseBroken: () => 'Captain, that is not what we told them.',

  // ---- intro
  intro0: () => `The ion season is closing the Corrie Drift. In a day it will be shut for a month, and ${STATION}, a mining station on the far side, will go short of everything it does not dig out of the rock. Two ore haulers have asked the ISA for an escort through before it closes. The ISV Halcyon has them close on her flanks, at the edge of the storm.`,
  intro1: () => "Captain, the storm lies in three bands: the Fringe, the Combs and the Maw. Each band has a high channel and a low one. One is calm and one is rough, and they change with the season. Rough water piles charge on every hull that crosses it; a hull that takes on too much goes dark. Waiting at an edge costs charge too, slowly.",
  intro2: () => `Sensors are nearly blind in here, Captain. I have a storm model built from the last buoy reports; where the buoys still report it's firm, and where they don't it's a guess. Two haulers close aboard: the ${SHIP_NAME.mule}, Captain Odran Brack, and ${SHIP_NAME.gannet}, Captain Rosalind Teague. Neither can see any better than we can.`,
  intro3: () => `Both masters are on the convoy net, Captain. Captain Brack has run the Drift for thirty seasons. Captain Teague wants to be through it yesterday.`,
  intro4: () => "We're at the edge of the Fringe, Captain. Every source we have is partial: the model, Mr. Adeyemi's hands, the probes, and two masters who know the water. Your call, one band at a time.",
  introHint: () => 'OFFLINE INTERPRETER: give orders and ask questions in plain English. "Adeyemi, what does your gut say?", "Varga, what does the model say?", "send a probe down the low channel", "take us through the high channel", "hail Captain Brack". Type "help" or "options" at any time.',
  help: () =>
    'Speak or type in plain English. Ask: "Adeyemi, what does your gut say?", "Varga, what does the model say?", "Chief, how much charge are we carrying?", "Doctor, how does Captain Brack sound?". Order: "send a probe down the high channel", "take us through the low channel", "your call, Ensign", "bleed the charge off the haulers", "spread our shields over the haulers", "close formation, in our wake", "take the crew off", "turn the convoy back". Talk: "hail Captain Teague", "which channel would you take?", "are you fit to fly the Maw?", "hold on, stay with us". Also "status" and "options".',

  // ---- shared engine keys, reworded for this scenario
  posture_nonHostile: () => 'Understood. Nothing out here to point a weapon at, Captain.',
  incomingHail: () => 'One of the haulers is calling on the net, Captain.',
  noContact: () => 'No such ship out here, Captain. Just the two haulers and the storm.',
  noCompartmentKnown: () => 'Nothing aboard either hauler a scan could find in this static, Captain.',
  unknownPassenger: () => 'There is no one by that description in the convoy, Captain.',
  passengerAlreadyMoved: () => 'There is no one by that description in the convoy, Captain.',
  passengerDead: () => 'There is no one by that description in the convoy, Captain.',
  passengerStasis: () => 'There is no one by that description in the convoy, Captain.',
  compartmentShielded: () => 'The storm hides everything aboard them, Captain.',
  noneTrapped: () => 'No one is trapped, Captain.',
  cannotInterpose: () => 'There is nothing to put ourselves between, Captain. The storm is everywhere.',
  transportRange: (v) => `That ship is ${v.km} out; transporters reach ${v.need}.`,
  teamRange: (v) => `That ship is ${v.km} out, Captain.`,
  teamShields: () => 'Not with our shields up, Captain.',
  transportShields: () => 'Our shields are up, Captain; the transporter cannot cycle through them.',
  extendRange: () => 'The haulers are too far out for our shields, Captain.',
  kestrelEmpty: () => 'Say "take the crew off" if a hauler goes dark, Captain; until then their masters will not leave their ships.',
  kestrelRepairScope: () => 'Nothing we can repair from here, Captain. The charge is the problem, not the machinery.',
  kestrelAlreadyStable: () => 'Nothing we can repair from here, Captain.',
  kestrelStabilised: () => 'Nothing we can repair from here, Captain.',
  kestrelStabiliseFailed: () => 'Nothing we can repair from here, Captain.',
  powerReactor: () => 'The reactor is fine, Captain. It is the charge on the hull I worry about.',
  repaired: (v) => `Repair crews have the ${v.system} back to ${v.health}%.`,
  helm_interpose: () => 'There is nothing to put ourselves between, Captain.',
  tractorKestrel: () => `Tractor beam on the ${SHIP_NAME.mule}. She comes with us now, whoever is at her helm.`,
  tractorCruiser: () => `Tractor beam on ${SHIP_NAME.gannet}. She comes with us now, whoever is at her helm.`,
  tractorRange: (v) => `Target at ${v.km}; tractor reach is ${v.need}.`,
  jumpWithKestrel: () => 'Jump drive engaged.',
  jumpEngaged: () => 'Jump drive engaged. Leaving the Corrie Drift.',
  jumpCharging: (v) => `Charging the jump drive (${v.charge}%). Captain, the haulers have no jump drive.`,
  evacComplete: () => 'Say "take the crew off" if a hauler goes dark, Captain.',
  evacPartial: () => 'Say "take the crew off" if a hauler goes dark, Captain.',
  passengerAboard: () => 'There is no one by that description, Captain.',
  cargoAboard: () => 'They carry ore, Captain. Nothing of ours.',
  medicalTeam: () => 'Dr. Osei can listen to a master on the net, Captain. Ask her how they sound.',
  trappedFreed: () => 'No one was trapped, Captain.',
  trappedNotYet: () => 'No one is trapped out here.',
  interposeTookHit: () => 'Nothing is shooting at us, Captain. It is only weather.',
  impTractorShield: () => 'Nothing out here is shooting, Captain.',
  impShieldExtend: () => 'Shields spread over the haulers.',
  kestrelBreachCrew: () => `The ${SHIP_NAME.mule} breaks up.`,
  kestrelBreachEmpty: () => `The ${SHIP_NAME.mule} breaks up.`,
  reinforcementsArrive: () => 'No one else is coming, Captain. Not in this.',
  reinforcementsHoldOff: () => 'No one else is coming, Captain.',
  reinforcementsDetected: () => 'No one else is coming, Captain.',
  scanKestrelDetail: () => `The ${SHIP_NAME.mule}: an old ore hauler, unarmed, deep laden.`,
  scanKestrelBasic: (v) => `The ${SHIP_NAME.mule}, at ${v.km}.`,
  scanCruiserBasic: (v) => `${SHIP_NAME.gannet}, at ${v.km}.`,
  scanCruiserDetail: () => `${SHIP_NAME.gannet}: an ore hauler, unarmed, short-handed.`,
  areaSweep: () => 'Long-range sweep: the two haulers and the storm. Nothing else, and not much of that.',
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}.`,
  ardenArms: () => 'The haulers have no weapons, Captain.',
  ardenArmsAgainstHalcyon: () => 'The haulers have no weapons, Captain.',
  impPlasmaVent: () => 'Venting drive plasma in an ion storm, Captain? Not if you want a hull afterwards.',
  impSensorGhost: () => 'There is no one out here to fool, Captain.',
  impEjectCore: () => 'There is no reason to touch the core, Captain.',
  impEjectCoreFailed: () => 'There is no reason to touch the core, Captain.',
  contactHostile: () => 'Nobody out here is hostile, Captain. Only the weather.',
  improviseUnclear: () => 'Understood, Captain.',
  refuseCivilian: () => "Captain, those are unarmed haulers we're here to escort. I won't fire on them.",
  cededWithPassenger: () => 'There is no one here for us to hand over, Captain.',
  adviseBreach: () => 'Captain, the haulers are waiting on us.',
  adviseShields: () => 'Captain, the haulers are waiting on us.',
  adviseCompartment: () => 'Captain, the haulers are waiting on us.',
  adviseScan: () => 'Captain, Lieutenant Varga has the model if you want it.',
  adviseOptions: () => 'Captain, every minute at the edge costs charge. Say "options" if you want my read.',
  passengerWakesOnKestrel: () => 'The net crackles.',
  systemDamaged: (v) => `Damage to the ${v.system}.`,
  systemDestroyed: (v) => `We've lost the ${v.system}!`,
  bridgeSurveyBusy: () => 'Varga has the model if you ask her, Captain.',
  bridgeNotNow: () => 'Not now, Captain. The convoy is waiting on us.',

  // ---- the crossing
  crossing: (v) => `${v.how === 'lull' ? 'Now, now, now. ' : ''}Taking the convoy into the ${v.ch} channel through ${v.band}. ${n(v, 'rough') ? 'Rough water! Hold on, everyone, she’s piling it on.' : 'Calm water. Smooth as you like.'}`,
  atEdge: (v) => `Through. We're at the edge of ${v.band}.`,
  afterCrossing: (v) => `Charge: ${SHIP_NAME.mule} ${chg(n(v, 'mule'))}, ${SHIP_NAME.gannet} ${chg(n(v, 'gannet'))}, Halcyon ${v.halcyon}. A hull goes dark at a hundred.`,
  lostTheLine: (v) => `Captain, the ${v.ship} has lost the line! ${String(v.sub).replace(/^./, (c) => c.toUpperCase())}'s wandered into the rough water. ${CAPTAIN_SHORT[v.hauler as 'mule']} isn't holding her.`,
  haulerAdrift: (v) => `Captain, the ${v.ship} has gone dark. Engines, lights, everything. ${v.crew} aboard, on battery air. Dr. Osei says five minutes, perhaps less.`,
  crewLost: (v) => `The ${v.ship}'s battery air is gone, Captain. No one aboard is answering. No one will.`,
  teagueLost: (v) => `Captain, ${v.ship} has gone dark somewhere ahead of us in the storm. No signal. I can't reach her from here.`,
  leftBehindCrew: (v) => `Captain, we've left the ${v.ship} behind with her crew aboard. She's out of transporter range now. There's nothing more we can do for them.`,
  leftBehindHull: (v) => `The ${v.ship} stays behind, Captain, dark and empty. Her crew is with us.`,
  spateMaw: () => 'Captain, the Maw is in spate. Both channels are running rough. The model has nothing better than that. If it goes slack at all, it won’t be for long.',
  turnBack: (v) => `Turning the convoy back, Captain. Back the way we came, ${v.bands === 1 ? 'one band' : `${v.bands} bands`}. I know the water behind us now, at least.`,
  turnBackEdge: () => 'Turning the convoy back, Captain. Away from the storm.',
  leftTheConvoy: () => 'Captain, we’re clearing the storm. The haulers can’t keep up. They’re still in there.',
  navHeld: () => 'Captain, in here we move as a convoy, one band at a time. I’ll hold station on them. Tell me which channel and when.',
  whichChannel: (v) => `Through ${v.band}? High or low, Captain?`,
  wakeFormed: () => 'Close formation, Captain. Both haulers in our wake. We’ll take the worst of any rough water first.',
  halcyonDark: () => 'Captain, that’s it. The Halcyon’s carrying more charge than her systems can take. We’re going dark.',
  chargeHigh: (v) => `Captain, one of the haulers is up to ${v.worst}. A few more minutes at this edge and she goes dark without crossing anything.`,
  dischargeSpent: () => 'I’ve run it through our hull three times, Captain. Any more and it’s us going dark.',
  dischargeNobody: () => 'There’s nobody still flying for me to bleed, Captain.',
  discharged: (v) => `Bleeding them through our hull, Captain. Haulers down to ${chg(n(v, 'mule'))} and ${chg(n(v, 'gannet'))}. We’re carrying ${v.halcyon} ourselves now. That’s ${n(v, 'n')} of three, and I wouldn’t try a fourth.`,
  chargeReport: (v) => `Charge: ${SHIP_NAME.mule} ${chg(n(v, 'mule'))}, ${SHIP_NAME.gannet} ${chg(n(v, 'gannet'))}, Halcyon ${v.halcyon}. A hull goes dark at a hundred. I can bleed the haulers through our hull ${n(v, 'left') > 0 ? `${n(v, 'left')} more time${n(v, 'left') === 1 ? '' : 's'}` : 'no more'}.`,
  airFailing: (v) => `Captain, the ${v.ship} has about ${mins(n(v, 'mins'))} of battery air left.`,
  evacNotNeeded: (v) => `The ${v.ship} is still flying, Captain. ${CAPTAIN_SHORT[v.hauler as 'mule']} won't leave a ship that flies, and I wouldn't ask.`,
  evacNobody: () => 'There is no crew to take off, Captain.',
  evacDone: (v) => `Transporters cycling. ${v.n} off the ${v.ship}, ${CAPTAIN_SHORT[v.hauler as 'mule']} last. Everyone is aboard the Halcyon.`,

  // ---- the helm
  arriveBlind: (v) => `Captain, I can't read ${v.band} yet. Give me a minute at the edge to feel it.`,
  arriveLean: (v) => `Captain, ${v.band} feels ${v.ch} to me. The ${v.ch} channel.`,
  arriveLull: (v) => `It’s rough both ways, Captain. But she’ll go slack, I think, in about ${mins(n(v, 'mins'))}. The ${v.ch} side first.`,
  gotIt: (v) => `I have the feel of ${v.band} now, Captain. It's the ${v.ch} channel.`,
  helmDefers: (v) => (n(v, 'hesitant') ? `The model has the ${v.ch} channel, sir. ... Yes. The ${v.ch} channel.` : `The model has the ${v.ch} channel, sir.`),
  helmDefersSpate: () => 'The model says both channels are rough, sir.',
  helmBacked: () => 'Thank you, Captain. Then I’ll tell you what I feel, not only what the model says.',
  helmBackedAgain: () => 'Aye, Captain.',
  gutUnsure: (v) => `Honestly, Captain? I can't feel ${v.band} yet. Another minute at the edge and I will. If you need it now, I'd only be guessing.`,
  gutGuessOnly: (v) => `If I had to guess, Captain, ${v.ch}. But it's a guess.`,
  gutGuess: (v) => `A guess, Captain: ${v.ch}. Going.`,
  gutLean: (v) => {
    const lean = `${n(v, 'confident') ? `It's ${v.ch}, Captain.` : `Since you ask, Captain... ${v.ch}.`} The ${v.ch} channel. I can feel it in the stick.`;
    if (!n(v, 'modelKnown')) return lean;
    return n(v, 'agrees') ? `${lean} The model agrees, for once.` : `${lean} I know the model says otherwise.`;
  },
  gutLullComing: (v) => `It's rough both ways right now, Captain. But it'll go slack, I think, in about ${mins(n(v, 'mins'))}, the ${v.ch} side. I'll call it.`,
  gutLullNow: (v) => `Now, Captain. It's slack now: the ${v.ch} channel. We have a minute, maybe two.`,
  gutRough: (v) => `It won't go slack again, Captain. Not that I can feel. If we go, it's rough either way; the ${v.ch} side is less bad.`,
  gutWait: (v) => `Not yet, Captain. About ${mins(n(v, 'mins'))}. The ${v.ch} side will go slack first. I'll tell you.`,
  gutRoughGo: (v) => `Then the ${v.ch} side, Captain. It's the less bad of two bad ones.`,
  lullNow: (v) => `Captain, now! It's gone slack: the ${v.ch} channel. We have a minute, maybe two.`,
  lullMissed: (v) => `That... was a lull, sir. The ${v.ch} side went slack for a minute. I felt it. I should have said.`,
  marrowLull: () => 'Captain, a word. Mr. Adeyemi feels this water better than the model does. He needs to hear that you want to know what he feels.',
  marrowHint: () => 'Captain, a word. Mr. Adeyemi gave you the model’s line; that isn’t what his face said. Ask him what he feels.',
  helmAfter: () => 'Nothing more to read, Captain.',
  driftReport: (v) => `Captain, something you should know. The ${v.ship} wandered off the line twice in the Fringe and corrected late both times. Calm water, too. That's not the ship.`,
  mateFlying: (v) => `${MATE_NAME[v.hauler as 'mule']} has the ${v.ship}'s helm, Captain. Holding the line nicely.`,
  remoteNothing: (v) => `There's nothing on the ${v.ship} I can fly from here, Captain.`,
  remoteAlready: (v) => `I already have the ${v.ship}, Captain.`,
  remoteOneOnly: (v) => `I'm already flying the ${v.ship} beside our own, Captain. I can't fly a third ship.`,
  remoteOn: (v) => `I have the ${v.ship}'s helm slaved to ours, Captain. She goes where we go.`,
  remoteWhich: () => 'Which hauler, Captain?',
  teagueGone: () => `Captain, ${SHIP_NAME.gannet} has broken formation. She’s gone into the band on her own line.`,

  // ---- sensors, the model and the probes
  modelRead: (v) => (n(v, 'spate') ? `The model has both of the Maw's channels rough, Captain. It's a spate; the buoys can't see a lull coming. Nothing firmer than that.` : `The model has the ${v.ch} channel through ${v.band}. ${n(v, 'firm') ? 'Firm: the buoys in this band are still reporting.' : 'Soft: no live buoys in this band. It’s last week’s weather.'}`),
  modelOver: () => 'Nothing left to model, Captain.',
  modelNoLine: () => 'The model has no calm channel here at all, Captain. It can’t choose for us.',
  probeWhich: () => 'Which channel, Captain? High or low?',
  probeBusy: () => 'There’s already one on its way down, Captain.',
  probeAway: (v) => `Probe away down the ${v.ch} channel, Captain. Two minutes to hear back. ${n(v, 'left') === 1 ? 'One probe left.' : n(v, 'left') === 0 ? 'That was our last probe.' : ''}`,
  probesGone: () => 'We’re out of probes, Captain. Anything else we send down there would have to be something we can spare.',
  torpedoProbe: (v) => `Torpedo away down the ${v.ch} channel, warhead safed. It's built to report back while it flies. One minute.`,
  noTorpedoes: () => 'No torpedoes left, Captain.',
  probeResult: (v) => (n(v, 'calm') ? `Probe's back, Captain. The ${v.ch} channel through ${v.band} is calm. Right now, at least.` : `Probe's back, Captain. The ${v.ch} channel through ${v.band} is rough.${n(v, 'spate') ? ' For now: this is a spate.' : ''}`),
  probeStale: (v) => `Probe’s back from the ${v.ch} channel, Captain, but it’s for the band behind us now.`,
  noProbeYet: () => 'We don’t have a probe result for this band, Captain.',
  scanHauler: (v) => (n(v, 'gone') ? `The ${v.ship} is no longer with the convoy, Captain.` : n(v, 'adrift') ? `The ${v.ship} is dark, Captain. ${n(v, 'souls')} aboard.` : `The ${v.ship}: ore hauler, ${n(v, 'souls')} aboard, carrying charge ${v.charge}. Everything else is static.`),
  scanNoCompartment: () => 'The storm hides everything aboard them, Captain.',
  contactsIon: () => `Two haulers close aboard: the ${SHIP_NAME.mule} and ${SHIP_NAME.gannet}. Everything else is storm.`,

  // ---- tactical
  shieldsOverDone: () => 'Shields spread over both haulers, Captain. They carry less of the charge; we carry more.',
  shieldsAfter: () => 'Nothing left to shield them from, Captain.',
  raskStorm: (v) => `Nothing out here to shoot, Captain. But if Varga runs out of probes, a torpedo with its warhead safed will fly down a channel and report back. We have ${v.torpedoes}.`,

  // ---- medical
  oseiNeedToHear: (v) => (v.ship ? `I'd need to hear ${CAPTAIN_SHORT[v.hauler as 'mule']}, Captain. Get ${v.obj} talking on the net and let me listen.` : 'I’d need to hear them, Captain. Get the masters talking on the net and let me listen.'),
  oseiGone: (v) => `I can't help ${CAPTAIN_SHORT[v.hauler as 'mule']} now, Captain.`,
  oseiUnfit: (v) => `Captain, I don't like how ${CAPTAIN_SHORT[v.hauler as 'mule']} sounds. ${isM(v) ? 'The pauses, and that rattle. That’s a tremor. Ion tremor, thirty seasons of static in the nerves. His hands shake when the charge climbs.' : 'She repeats herself and doesn’t notice. That’s sleep, or the lack of it. Forty hours, I’d guess.'} I wouldn’t want ${v.obj} flying the Maw.`,
  oseiUnfitHandled: (v) => `${CAPTAIN_SHORT[v.hauler as 'mule']} isn't fit to fly the Maw, Captain, but ${v.sub} isn't flying it. That's the right answer.`,
  oseiFit: (v) => `${CAPTAIN_SHORT[v.hauler as 'mule']} sounds tired and cross, Captain. Fit, though.`,

  // ---- comms and the first officer
  noAnswerHauler: (v) => `No answer from the ${v.ship}, Captain.`,
  captainAboard: (v) => `${CAPTAIN_SHORT[v.hauler as 'mule']} is aboard the Halcyon, Captain.`,
  szaboNet: (v) => (n(v, 'teague') === 2 ? `${SHIP_NAME.gannet} isn't on our net any more, Captain.` : n(v, 'teague') === 1 ? 'Captain Teague is getting short with me, Captain. She’s about done waiting.' : 'Both masters are on the net. Captain Teague asks every minute how long. Captain Brack doesn’t ask anything.'),
  marrowRead: (v) => `Every minute here costs them charge, Captain. ${n(v, 'unfitKnown') ? 'And we have a master who shouldn’t be flying the Maw. ' : ''}My read: ${v.options || 'it’s your call'}.`,
  impNotHere: () => 'Not in this weather, Captain.',
  leaveWarn: () => 'Captain, belay that a moment. If the Halcyon pulls out, those two haulers are blind in here. If you mean to turn back, we can take them with us. If you mean us to leave them, say it again and Mr. Adeyemi will take us out.',
  strandedAtExit: () => 'We’re out of the Maw, Captain, but not everyone came out lit. There’s a dark hull behind us with a crew on battery air, and she’s inside transporter range.',
  strandedOnly: () => 'The crossing’s done, Captain. What’s left is the crew on that dark hull.',
  impOver: () => 'It’s done, Captain.',
  impOtherIon: (v) => `Captain, I'm not sure how to do "${v.description}" in this storm.`,
  statusIon: (v) => `We're ${v.where}. ${SHIP_NAME.mule}: ${v.mule}. ${SHIP_NAME.gannet}: ${v.gannet}. Halcyon carrying charge ${v.halcyon}.`,

  // ---- the masters (comms)
  greetFirst: (v) => by(v, `Brack, Saffron Mule. I've crossed this water thirty seasons, Captain. She's in a mood this year.${tellOf(v)}`, `Teague, Gannet's Luck. Halcyon, how long do we sit here?${tellOf(v)}`),
  greet: (v) => (n(v, 'relieved') ? by(v, `Brack. Quill has her. I'm listening.`, `Teague. Hollow has her. Go on.`) : by(v, `Brack here, Captain.${tellOf(v)}`, `Teague. Go.${tellOf(v)}`)),
  chatter: (v) => by(v, `Aye, Captain. She'll do what she does. We'll see.${tellOf(v)}`, `Fine. Can we move?${tellOf(v)}`),
  afterwards: (v) => by(v, 'That was a crossing, Captain. I’ve had worse. Not many.', 'Done. Good. Thanks, Halcyon.'),
  aloneBusy: () => 'Busy, Halcyon!',
  brackLore: (v) => `The Fringe, Captain? In a year like this one, ${v.ch}. The ${v.ch} side. Always has been.${tellOf(v)}`,
  brackDefers: (v) => `Past the Fringe, Captain, she changes every season. Your helmsman is younger than my hands. Ask him.${tellOf(v)}`,
  teagueLean: (v) => `${v.ch === 'high' ? 'High' : 'Low'}. I'd go ${v.ch}. Don't ask me why. Can we move?`,
  teagueRestless: () => 'Halcyon, I’m charging up sitting here. One more minute, then I go on my own line.',
  teagueGoes: (v) => `That's it. I'm not sitting here going dark. ${SHIP_NAME.gannet} is going through, ${v.lean} side. Good luck, Halcyon.`,
  teagueMadeIt: () => `Halcyon, Gannet's Luck. We're through. We made it. ...Sorry.`,
  teagueHolds: (v) => `...Fine. I'll hold. Not for long.${tellOf(v)}`,
  teagueNoMore: () => 'You keep saying that, Halcyon.',
  brackHolds: (v) => `We're not going anywhere without you, Captain.${tellOf(v)}`,
  fitFine: (v) => by(v, "Fit? I've been fit for this water since before your helmsman was born, Captain.", "I'm fine. I'll be better on the other side."),
  deflects: (v) => by(v, `I'm well enough, Captain. Well enough. Let's get on.${tellOf(v)}`, `I'm fine, I said. I'm fine.${tellOf(v)}`),
  admits: (v) =>
    by(
      v,
      "...You've heard it, then. The tremor. Thirty seasons of this static. It's worse when the charge climbs, and in the Maw I won't hold her straight. Quill is a good mate. I didn't want to be the old man who couldn't.",
      "...Forty hours. No sleep since the yard. I've been running her short-handed to make the season. Hollow can fly her. I just didn't want to stop.",
    ),
  admitsAgain: (v) => by(v, 'I told you, Captain. I won’t hold her in the Maw.', 'I said. Forty hours.'),
  handsOver: (v) => by(v, `Aye. Quill, take her. I'll be beside you.`, `Hollow, you have her. ...Thank you, Halcyon.`),
  alreadyRelieved: (v) => by(v, 'Quill has her, Captain.', 'Hollow has her.'),
  reliefInsult: (v) => by(v, 'Hand over my ship? On whose say-so? I am fit, Captain, and I have been flying this water since before your ship was built.', "You want me off my own helm? No. I'm fine, and you're wasting time."),
  reliefDenied: (v) => by(v, `I'm well enough, Captain. I'll keep my helm.${tellOf(v)}`, `I'm fine. I'll keep my helm.${tellOf(v)}`),
  remoteRefused: (v) => by(v, 'You’ll not fly my ship from yours, Captain. Not while I can stand.', 'Nobody flies my ship but me. No.'),
  remoteRefusedUnfit: (v) => by(v, `No, Captain. I'll fly her myself.${tellOf(v)}`, `No. I've got her. I've got her.${tellOf(v)}`),
};

export const templates: Record<string, TemplateFn> = { ...base, ...T };
