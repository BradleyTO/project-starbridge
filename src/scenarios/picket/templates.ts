/**
 * Offline narration and dialogue for The Long Picket. Starts from the shared Kestrel template set
 * (generic engine keys: helm, comms, bridge, validation) and overrides every key whose wording
 * names that scenario's ships or people, plus this scenario's own keys.
 * A test renders fuzzed playthroughs and fails on any leaked name from another simulation or "[missing key]".
 *
 * Commander Lucan Roake is clipped and correct, quotes his orders, and never says "I" when he can
 * say "the Directorate"; his three temperaments (proud, careful, weary) are worded differently but
 * never name themselves. Commander Ysara Dahl, his relief, is cool and procedural. Reeve Odile
 * Marchbank is warm, hurried and frightened for her people.
 */
import type { TemplateFn } from '../../engine/scenario';
import { formalOf } from '../../engine/captain';
import { templates as base } from '../kestrel/templates';
import { ACADEMY, COLONY, DAHL_SHORT, PICKET, PLACE, REEVE_SHORT, ROAKE_SHORT } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
const mins = (x: number) => (x === 1 ? 'a minute' : `${x} minutes`);
const Place = PLACE.replace(/^the/, 'The');

const T: Record<string, TemplateFn> = {
  // ---- channels
  channelOpened: (v) => `${v.speaker}, Captain. ${String(v.vessel) === PICKET ? 'Audio and visual from the picket.' : `Audio only from ${COLONY}; the relay is thin.`}`,
  channelOpenedPrivate: (v) => `${v.speaker} on a closed channel, Captain.`,
  channelAlreadyOpen: (v) => `${v.speaker} is already on the channel, Captain.`,
  channelHoldOther: (v) => `${String(v.vessel) === PICKET ? `The ${PICKET}` : COLONY} stands by.`,
  channelResumed: (v) => `${v.speaker} back on the channel.`,
  channelClosed: (v) => `${String(v.vessel) === PICKET ? `The ${PICKET}` : COLONY} off the channel.`,
  channelOnHold: (v) => `${v.speaker} is standing by, Captain.`,
  noDialogue: () => 'Nobody is answering, Captain.',
  promiseBroken: () => 'Captain, that is not what we told him.',

  // ---- intro
  intro0: () => `${Place}: the one safe road through a dust reef the charts still argue over. On the far side lies ${COLONY}, an ISA colony of four thousand one hundred, and its reactor is failing. The ISV Halcyon carries the replacement assemblies in her own hold. Between her and ${COLONY}, alone and squarely across the passage, sits a Tessarine Directorate picket frigate.`,
  intro1: () => `Captain, she is the ${PICKET}, a Directorate picket frigate, ninety aboard, holding station six kilometres ahead with her guns cold. The Directorate claims these Narrows. So do we. Neither of us has ever made it stick.`,
  intro2: () => `I know her commander, Captain. Lucan Roake. We were cadets together at ${ACADEMY}, a long time ago. I have not spoken to him in years, and I do not know what kind of officer he has become.`,
  intro3: () => `Our guns could take her, Captain, but she is not shooting, and nothing out here is worth starting a war over. Not yet. If he wants to stop us, he will have to do it with words. So will we.`,
  intro4: (_v, s) => `${COLONY}'s reactor will not wait for diplomats, ${formalOf(s)}. Chief Okafor can read their reactor telemetry from here, Szabo can listen to the picket's own traffic, and I can tell you what I think of Roake once I hear him. How we get through is yours.`,
  introHint: () => 'OFFLINE INTERPRETER: give orders in plain English. "hail the picket", "Marrow, what do you make of him?", "Szabo, listen to the picket’s traffic", "Chief, read Wrenmoor’s reactor telemetry", "Varga, scan the picket", "tell him we have a squadron right behind us", "you may inspect one crate", "Marrow, talk to him privately". Type "help" or "options" at any time.',
  help: () =>
    'Speak or type in plain English. Information: "Marrow, what do you make of him?", "Szabo, listen to the picket’s traffic", "Chief, read Wrenmoor’s reactor telemetry", "Varga, scan the picket", "scan our cargo", "hail Wrenmoor" and "how long do you really have?". The picket: "hail the picket", then talk to him: "we are not alone out here", "we are going through, with or without your leave", "you may inspect one crate for your log", "we will wait until your relief arrives", "you may inspect us, as a courtesy and without conceding your claim", "here is our scan of the cargo". Through your officers: "Marrow, tell him our escorts are just behind us", "Marrow, talk to him privately", "Szabo, stage some traffic from our escorts for him to overhear". Also "run the blockade", "turn back", "status" and "options".',

  // ---- shared engine keys, reworded for this scenario
  posture_nonHostile: () => 'Understood. Weapons stay cold, Captain. So are his.',
  incomingHail: () => 'We are being hailed, Captain.',
  noContact: () => `No such ship here, Captain. Just the ${PICKET}, and ${COLONY} far beyond her.`,
  noCompartmentKnown: () => `Nothing hidden out here that a scan would find, Captain. The ${PICKET} is what she looks like.`,
  unknownPassenger: () => 'There is no one by that description out here, Captain.',
  passengerAlreadyMoved: () => 'There is no one by that description out here, Captain.',
  passengerDead: () => 'There is no one by that description out here, Captain.',
  passengerStasis: () => 'There is no one by that description out here, Captain.',
  compartmentShielded: () => `The ${PICKET} is not hiding anything from our scans, Captain.`,
  noneTrapped: () => 'No one is trapped, Captain.',
  cannotInterpose: () => 'There is nothing to put ourselves between, Captain.',
  transportRange: (v) => `That is ${v.km} out; transporters reach ${v.need}.`,
  teamRange: (v) => `That is ${v.km} out, Captain.`,
  teamShields: () => 'Not with our shields up, Captain.',
  transportShields: () => 'Our shields are up, Captain; the transporter cannot cycle through them.',
  extendRange: () => 'Nobody out here is shooting, Captain.',
  kestrelEmpty: () => `There is no one to bring across, Captain. ${COLONY} needs the assemblies, not a lift.`,
  kestrelRepairScope: () => `${COLONY} is a long way past the picket, Captain. The fix is the assemblies in our hold.`,
  kestrelAlreadyStable: () => `${COLONY} is a long way past the picket, Captain. The fix is the assemblies in our hold.`,
  kestrelStabilised: () => `${COLONY} is a long way past the picket, Captain. The fix is the assemblies in our hold.`,
  kestrelStabiliseFailed: () => `${COLONY} is a long way past the picket, Captain. The fix is the assemblies in our hold.`,
  powerReactor: () => `Our reactor is fine, Captain. It is ${COLONY}'s that is failing.`,
  repaired: (v) => `Repair crews have the ${v.system} back to ${v.health}%.`,
  helm_interpose: () => 'There is nothing to put ourselves between, Captain.',
  tractorKestrel: () => `${COLONY} is far out of tractor reach, Captain.`,
  tractorCruiser: () => `Tractor beam on the ${PICKET}, Captain.`,
  tractorRange: (v) => `Target at ${v.km}; tractor reach is ${v.need}.`,
  jumpWithKestrel: () => 'Jump drive engaged.',
  jumpEngaged: () => `Jump drive engaged. Leaving ${PLACE}.`,
  jumpCharging: (v) => `Charging the jump drive (${v.charge}%). Captain, ${COLONY} is still waiting on us.`,
  evacComplete: () => `There is no one to bring across, Captain. ${COLONY} needs the assemblies.`,
  evacPartial: () => `There is no one to bring across, Captain. ${COLONY} needs the assemblies.`,
  passengerAboard: () => 'There is no one by that description out here, Captain.',
  cargoAboard: () => `The reactor assemblies are secure in the hold, Captain: twelve crates, and every one of them is for ${COLONY}.`,
  medicalTeam: () => 'Nobody out here needs a doctor, Captain. Yet.',
  trappedFreed: () => 'No one is trapped, Captain.',
  trappedNotYet: () => 'No one is trapped, Captain.',
  interposeTookHit: () => 'Nothing is shooting at us, Captain.',
  impTractorShield: () => 'Nothing out here is shooting, Captain.',
  impShieldExtend: () => 'Nothing out here is shooting, Captain.',
  kestrelBreachCrew: () => `${COLONY} has gone dark.`,
  kestrelBreachEmpty: () => `${COLONY} has gone dark.`,
  reinforcementsArrive: () => 'Nobody is coming to help us, Captain. It is us and the picket.',
  reinforcementsHoldOff: () => 'Nobody is coming to help us, Captain. It is us and the picket.',
  reinforcementsDetected: () => 'Nobody is coming to help us, Captain. It is us and the picket.',
  scanKestrelDetail: () => `${COLONY}: an ISA colony, four thousand one hundred people. Its reactor is running on failing assemblies.`,
  scanKestrelBasic: (v) => `${COLONY}, at ${v.km}.`,
  scanCruiserBasic: (v) => `The ${PICKET}, at ${v.km}.`,
  scanCruiserDetail: () => `The ${PICKET}: a Directorate picket frigate, ninety aboard, weapons cold, shields down.`,
  areaSweep: () => `Long-range sweep: the ${PICKET} across the passage, and dust. Nothing else in ${PLACE}.`,
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}.`,
  ardenArms: () => 'His guns are cold, Captain.',
  ardenArmsAgainstHalcyon: () => 'His guns are cold, Captain.',
  impPlasmaVent: () => 'Venting plasma at a picket ship in disputed space, Captain? That is how wars start.',
  impSensorGhost: () => 'I can make his sensors see ghosts, Captain, but a ghost does not survive a second look. Szabo could give him something better to listen to.',
  impEjectCore: () => 'There is no reason to touch the core, Captain.',
  impEjectCoreFailed: () => 'There is no reason to touch the core, Captain.',
  contactHostile: () => 'He is not hostile, Captain. He is in the way.',
  improviseUnclear: () => 'Understood, Captain.',
  refuseCivilian: (v) => `Captain, ${v.name} is a civilian colony. I won't fire on it.`,
  refuseFriendly: () => "Captain, that ship's guns are cold. I won't fire first.",
  cededWithPassenger: () => 'There is no one here for us to hand over, Captain.',
  adviseBreach: () => `Captain, ${COLONY} is still waiting.`,
  adviseShields: () => `Captain, ${COLONY} is still waiting.`,
  bridgeSurveyBusy: () => 'Varga can scan the picket if you ask her, Captain.',
  bridgeNotNow: () => `Not now, Captain. ${COLONY} is waiting on us.`,
  impNotHere: () => 'Not here, Captain. Anything that looks like an attack is exactly what he is waiting for.',
  objectivesReport: () => 'The objectives are on your board, Captain.',
  optionsReport: (v) => `Options, Captain: ${v.options}.`,

  // ---- the bridge
  helmThrough: () => `Helm answering, Captain. The ${PICKET} is giving way. Taking us through ${PLACE} for ${COLONY}, best speed.`,
  helmThroughFalse: () => `The ${PICKET} is giving way, Captain. Taking us through. …He thinks we are carrying something we are not.`,
  runProud: () => `Full ahead, Captain. He is not moving. He is putting his ship across our bow… brace!`,
  runThrough: () => `Full ahead, Captain. We are past him. He did not try to stop us. He is recording everything.`,
  turningBack: () => `Coming about, Captain. Leaving ${PLACE}.`,
  leftNarrows: () => `We have left ${PLACE}, Captain, with the assemblies still in our hold.`,
  tooLate: () => `Captain, ${COLONY} has started its reactor shutdown. Even if we got through now, we would not reach them before it is cold.`,
  afterPass: () => 'It is decided, Captain.',
  relayed: () => 'Passing that to the picket, Captain.',
  picketUnclear: (v) => `Captain, I'm not sure how to do "${v.description}" here.`,
  tractorForce: () => `Captain, I've let go of the ${PICKET}. Holding a picket ship in a tractor beam is force, whatever we call it, and he will put it in his report.`,
  handWarn: () => `Captain, if those assemblies go into his hold, ${COLONY} never sees them. The Directorate has no reason to send them on. Say it again if you mean it.`,
  marrowRunWarn: (v) => `Captain, before we do. ${Place} is disputed: the Code says we neither concede his claim nor break it by force while there is a peaceful way through. ${n(v, 'left') > 0 ? `${COLONY} still has ${mins(n(v, 'left'))}.` : ''} If you still want to run the line, say so again.`.trim(),
  marrowImpoundWarn: (v) => (n(v, 'she') ? 'She' : 'He') + ' wants the cargo, Captain, not a look at it. If we agree to that, the assemblies are gone.',
  marrowNeedHear: () => 'I need to hear him first, Captain. Let him speak.',
  marrowDelivers: () => 'Opening a line to him myself, Captain.',
  marrowDrag: () => 'Captain, he is in no hurry to finish that inspection. I think he will take as long as his orders let him.',
  marrowNoDahl: () => `I don't know ${DAHL_SHORT}, Captain. Whatever I had with Lucan went home with him.`,
  marrowTooLate: () => 'Not now, Captain. He has caught us in one story already. Anything I say to him now he will take as another.',
  marrowPrivateOwed: () => `Captain, I'll be honest: at ${ACADEMY} I took the blame for something Lucan did. It cost me a year. He has never forgotten it. I am going to ask him to remember it now.`,
  marrowPrivateFriendsWin: () => 'Going to a closed channel with him, Captain. …He listened. He is going to do it his way, but he is going to do it.',
  marrowPrivateFriends: (v) => `I spoke to him, Captain. He is still the man I knew, and he is not going to break his orders for an old friend. But he told me what they are: ${String(v.orders) === 'delay' ? `hold us until his relief arrives, in about ${mins(n(v, 'relief'))}, and no more` : String(v.orders) === 'pretext' ? 'find a reason to stop the cargo, and let it go if he cannot' : 'see whether we stop when we are told to, and report what we do'}. If we give him the truth to put in his log, I think he will move.`,
  marrowPrivateRivals: () => 'He laughed at me, Captain. Lucan never liked losing to me, and I think he would rather lose his ship than let me talk him round. Whatever we try, it should not come from me.',

  // ---- Marrow's read
  marrowRead: (v) => {
    const t = String(v.temperament);
    const h = String(v.history);
    const man = t === 'proud' ? 'He is proud. He will not be seen to back down, and if we push him, he will push back harder.' : t === 'careful' ? 'He is careful. He has listened to every word we said, and he will want proof before he believes any of it.' : 'He is tired. He has been out here too long, and he would like a reason to go home.';
    const us = h === 'friends' ? 'We were friends, once. He may still take my word.' : h === 'owed' ? 'And he owes me something from the Academy. He knows it.' : 'And he never liked me. Whatever we tell him, I should not be the one to say it.';
    const knows = String(v.intel) === 'escort' ? ' One more thing: he knows exactly where our nearest friends are. He said "a long way from home" like a man who has checked.' : String(v.intel) === 'cargo' ? ' And he knows what is in our hold. He asked about our "cargo" before he asked our name.' : '';
    return `My read, Captain. ${man} ${us}${knows}`;
  },
  marrowReadDahl: () => `I don't know ${DAHL_SHORT}, Captain. By her voice she runs things by the book. A story will not move her; a proper inspection might.`,
  marrowCounsel: (v) =>
    `${COLONY} has ${n(v, 'knowsWindow') ? mins(n(v, 'left')) : n(v, 'claimHeard') ? `${mins(n(v, 'claimed'))}, by the Reeve's word` : 'not long'}, Captain. ${n(v, 'knowsRead') ? '' : 'I would want to hear him and tell you what I think of him before we try anything. '}${n(v, 'knowsOrders') ? '' : 'Szabo might find out what his orders really are. '}A bluff about our strength or our intentions is fair. Pretending to be a mercy ship, or lying to our own people, is not. And whatever we tell him, we should not have to take back.`.replace(/\s+/g, ' ').trim(),
  statusPicket: (v) =>
    `The ${PICKET} is holding across the passage${n(v, 'relieved') ? `, under ${DAHL_SHORT} now` : ''}. ${n(v, 'inspecting') ? `Inspection under way, about ${mins(n(v, 'inspect'))} more. ` : ''}${n(v, 'holding') ? `We have agreed to hold for ${mins(n(v, 'hold'))}. ` : ''}${n(v, 'knowsWindow') ? `${COLONY} has ${mins(n(v, 'left'))}.` : n(v, 'claimHeard') ? `${REEVE_SHORT} says ${COLONY} has ${mins(n(v, 'claimed'))}.` : `We don't yet know how long ${COLONY} has.`}`.trim(),
  timeKnown: (v) => `By their telemetry, ${COLONY} has ${mins(n(v, 'left'))} before it has to shut its reactor down, Captain.`,
  timeClaimed: (v) => `${REEVE_SHORT} says ${mins(n(v, 'claimed'))}, Captain. The Chief could check that against their telemetry.`,
  timeUnknown: () => 'Not long, Captain. The Chief could read their reactor telemetry and tell us exactly.',
  ordersKnown: (v) => `His orders are to ${String(v.orders) === 'delay' ? `hold us until he is relieved, Captain. His relief is ${n(v, 'relief') ? `about ${mins(n(v, 'relief'))} out` : 'here'}` : String(v.orders) === 'pretext' ? 'find a reason to stop the cargo, Captain, and let it go if he cannot' : 'see whether we stop when told, Captain, and report what we do'}.`,
  ordersUnknown: () => 'I don’t know what his orders say, Captain. I could listen to his traffic.',
  reliefKnown: (v) => (n(v, 'relieved') ? `His relief is here, Captain: ${DAHL_SHORT}.` : `His relief is about ${mins(n(v, 'relief'))} out, Captain.`),
  reliefUnknown: () => 'I don’t know whether he is waiting for anyone, Captain. I could listen to his traffic.',
  sweepKnown: (v) => (n(v, 'swept') ? 'His sweep of our wake is done, Captain. He knows there is nobody behind us.' : `His long-range sweep of our wake finishes in about ${mins(n(v, 'sweep'))}, Captain. After that he will know we are alone.`),
  sweepUnknown: () => 'I could scan the picket and see what his sensors are doing, Captain.',

  // ---- the officers' work
  interceptStart: () => 'Listening to his traffic, Captain. It is encrypted, but not well. Two minutes.',
  interceptWorking: () => 'Still working on his traffic, Captain.',
  interceptAgain: (v) => `I have his orders, Captain: ${String(v.orders) === 'delay' ? `hold us until he is relieved, about ${mins(n(v, 'relief'))} from now` : String(v.orders) === 'pretext' ? 'stop the cargo if he can find a reason, and let it go if he cannot' : 'see whether we stop when told, and report it'}.`,
  interceptDone: (v) =>
    `I have his orders, Captain. ${String(v.orders) === 'delay' ? `He is to hold us until his relief arrives, about ${mins(n(v, 'relief'))} from now, and nothing more. He is not to fire unless fired on.` : String(v.orders) === 'pretext' ? 'He is to stop the cargo if he can find any reason to, and let it go if he cannot. He is not to fire unless fired on.' : 'He is to see whether we stop when told and report what we do. That is all. He is not to fire unless fired on.'}${n(v, 'tight') && String(v.orders) === 'delay' ? ` Captain, his relief gets here after ${COLONY}'s deadline. Waiting him out will not work.` : ''}`,
  scanPicket: (v) => `The ${PICKET}, Captain: weapons cold, shields down, ninety aboard. Her long-range array is sweeping our wake, looking for whoever might be behind us. ${n(v, 'swept') ? 'It has finished. He knows there is nobody.' : `It finishes in about ${mins(n(v, 'sweep'))}. Until then he cannot be sure we are alone.`}`,
  sweepDone: () => 'Captain, the picket has finished sweeping our wake. If he did not know we are alone before, he does now.',
  telemetry: (v) => `I have ${COLONY}'s reactor telemetry, Captain. They have ${mins(n(v, 'left'))} before they have to shut it down, and when they do, it is cold and dark for a week, but they live: they have shelters and stores for that. Nobody dies of it. ${n(v, 'claimHeard') && String(v.reeve) === 'desperate' ? `That is five minutes more than ${REEVE_SHORT} told us. ` : ''}It is still a bad week for four thousand people.`,
  cargoScanned: () => 'Scanning our own hold, Captain: twelve crates of reactor assemblies, serial numbers matching the colony’s order. Nothing else.',
  evidenceSent: () => 'Sending him our scan of the hold, Captain.',
  manifestSent: () => 'Sending him our true manifest, Captain.',
  manifestAgain: () => 'He has our manifest already, Captain.',
  staged: () => 'Understood, Captain. I will send our own ship-to-ship chatter on a beam he can just catch: an escort squadron "keeping its distance". It says nothing false to Fleet Command and goes in no log as anything but what it is. It will hold until he has finished sweeping our wake.',
  stagedAgain: () => 'The traffic is already running, Captain.',
  refuseDeceiveCommand: () => 'Captain, I will not send false traffic to Fleet Command, or put it in our logs. The Code allows a ruse against him, not against our own people. I can stage it for him alone.',
  refuseForge: () => 'Captain, I will not alter the manifest. Our records stay true, and I will not dress twelve reactor crates up as medical relief. I can send him the real manifest, or our scan of the hold.',
  refuseRuseComms: () => 'Captain, I will not send him that. The Code allows a ruse about our strength or our intentions, but not one that pretends to a mercy run, or to distress.',
  refuseRuseXo: () => 'No, Captain. Bluff him about our strength, our company or what we will do, and I will say it with a straight face. But I will not tell him we are a mercy ship, or in distress. The Code forbids it, and so do I.',
  refuseLivesXo: () => 'Captain, the Chief says nobody dies if they shut that reactor down. I will not tell him people will die. If he finds out, nothing else we say will be believed.',

  // ---- the picket commander
  roakeHail: (_v, s) => `"ISV Halcyon, this is ${ROAKE_SHORT} of the Directorate picket ship ${PICKET}. You are in Directorate space. Heave to and prepare for inspection. You will not pass this line until I say you may, ${formalOf(s)}."`,
  roakeStillWaiting: () => '"Halcyon, Iron Psalm. I am still waiting for an answer."',
  roakeWaiting: () => '"I am listening, Halcyon. Make it worth my time."',
  roakeOfficial: () => '"My orders are the Directorate\'s business, Halcyon. Your answer is yours."',
  roakeAfter: () => '"We are done here, Halcyon."',
  roakeTruth: () => '"…Reactor assemblies for a colony. That would be a convenient cargo to claim, Halcyon. I will need more than your word."',
  roakeTruthWeary: () => '"…Reactor parts. For a colony. Of course it is. Gods, I am tired of this posting."',
  roakeShrugsEscort: () => '"Escorts. I see none, Halcyon. When I see them, we will talk about them."',
  roakeBelievesEscort: (_v, s) => `"…Then your friends can have the explaining of it, ${formalOf(s)}. I have no orders to fight a squadron. The ${PICKET} will stand aside. Pass, Halcyon."`,
  roakeBelievesMarrow: () => '"…Ilse. If you say they are there, they are there. You never could bluff me." A pause. "Stand aside, helm. Pass, Halcyon."',
  roakeBelievesResolve: () => '"…You would, too. Very well. My orders do not include a collision in the Narrows. The Iron Psalm will stand aside. My report will say you refused inspection."',
  roakeCallsEscortKnown: () => '"Your nearest friends are three days off, Halcyon, and I have their positions. Do not insult me."',
  roakeCallsEscortSweep: () => '"I have swept your wake, Halcyon. There is nothing behind you but dust. Do not insult me."',
  roakeCallsMarrow: () => '"Ilse Marrow. Of course. You always did think you could talk me into anything. Not today."',
  roakeNoMoreStories: () => '"No more stories, Halcyon. Heave to, or show me something I can believe."',
  roakeDigsIn: () => '"Then try it, Halcyon. The Iron Psalm does not move for threats."',
  roakeOrdersStand: () => '"My orders stand, Halcyon. So does the Iron Psalm."',
  roakeLockProud: () => '"You have locked weapons on a Directorate ship. Noted. I will not be moved by it, Halcyon, and I will not forget it."',
  roakeLockNoted: () => '"Your weapons lock is noted, Halcyon. It changes nothing except my report."',
  roakeFiredOn: () => '"You have fired on a Directorate ship in Directorate space. Every gun I have is answering, Halcyon."',
  roakeCollision: () => '"Hold your course and you will hit us, Halcyon!" …The two ships scrape past each other, hull on hull.',
  roakeFiles: () => '"Run, then. Every second of it is going to the Directorate, Halcyon."',
  roakeHoldAccepted: (v) => `"A sensible answer. Hold where you are until I am relieved, about ${mins(n(v, 'hold'))}, and you may pass then. You have my word."`,
  roakeHoldProbe: () => '"You will hold? Good. Three minutes, Halcyon, so that I can report that you did, and then you may pass. My word on it."',
  roakeHoldPretext: () => '"Waiting changes nothing, Halcyon. I need to know what is in your hold."',
  roakeTokenAccepted: () => '"One crate, opened under my eyes, and it goes in my log. …Agreed. My inspector will be quick about it."',
  roakeTokenSlow: (v) => `"One crate. Agreed. My inspector will take his time with it, Halcyon: about ${mins(n(v, 'inspect'))}."`,
  roakeTokenDone: () => '"One crate of reactor assemblies, inspected and logged. You may pass, Halcyon."',
  roakeInspectStart: (v) => `"Inspectors coming across, Halcyon. ${n(v, 'courtesy') ? 'As a courtesy, then: I will log it as one. ' : ''}About ${mins(n(v, 'inspect'))}."`,
  roakeInspecting: (v) => `"My inspectors are still aboard you, Halcyon. About ${mins(n(v, 'inspect'))} more."`,
  roakeHolding: (v) => `"You agreed to hold, Halcyon. About ${mins(n(v, 'hold'))} more."`,
  roakeInspectDone: () => '"Twelve crates of reactor assemblies, just as you said. I have no reason to hold you. Pass, Halcyon."',
  roakeKeepsWord: () => '"You held as you said you would, Halcyon. So will I. The Iron Psalm stands aside. Pass."',
  roakeManifestPretext: () => '"A manifest is a piece of paper, Halcyon. I can write one too."',
  roakeManifestNoted: () => '"Your manifest is noted, Halcyon. It does not get you past me."',
  roakeEvidenceClears: () => '"…Reactor assemblies. Serial numbers matching a colony order. My orders were to find a reason to stop you, Halcyon, and that is not one. Pass."',
  roakeEvidenceNoted: () => '"Your scans are noted, Halcyon. My orders stand."',
  roakeUnmovedLives: () => '"Lives depend on many things, Halcyon. My orders are not one of them."',
  roakeDoubtsLives: () => '"Will they? Your colony\'s reactor telemetry is public, Halcyon. I have been reading it too."',
  roakeMercyPass: () => '"A mercy run. You should have said so, Halcyon. The Directorate does not stop medicine. Pass."',
  roakeCallsMercy: () => '"Medicine? Your hold is full of reactor assemblies, Halcyon. I know exactly what you are carrying. You have just lied to a Directorate officer about a mercy run, and that goes in my report too."',
  roakeImpoundDemand: () => '"I am done with stories, Halcyon. Transfer your cargo to the Iron Psalm, and the Directorate will see it reaches whoever it is for. That is the only way you pass."',
  roakeImpounds: () => '"Your cargo is now in Directorate custody, Halcyon. You may go."',
  roakeOwed: () => '"…I remember, Ilse. I have always remembered. Consider it paid." A pause. "Helm, stand aside. My report will say the Halcyon was inspected and cleared, and that is near enough to true."',
  roakeFriend: () => '"…You always did make me tell the truth, Ilse. Reactor parts for a colony. I am not stopping that for a line on a chart." A pause. "Stand aside, helm. Pass, Halcyon."',

  // ---- the relief
  reliefArrives: () => `A second Directorate frigate is coming alongside the ${PICKET}, Captain. It looks like a change of command.`,
  dahlArrives: () => `"Halcyon, this is ${DAHL_SHORT}. I have relieved ${ROAKE_SHORT} of the picket. Whatever you were saying to him, you will have to say to me. And I go by the book."`,
  dahlWaiting: () => `"I am listening, Halcyon. If you want to pass, you know my terms: a proper inspection."`,
  dahlTruth: () => '"Reactor assemblies. Then you will not mind my inspectors seeing them, Halcyon."',
  dahlNo: () => '"I am not interested in what may or may not be behind you, Halcyon. Inspection, or you wait."',
  dahlToken: () => '"One crate is not an inspection, Halcyon. All of it, or none."',
  dahlHold: () => '"You may hold as long as you like, Halcyon. You will not pass without an inspection."',
  dahlEvidence: () => '"Your own scans prove nothing to me, Halcyon. My inspectors will see for themselves."',
  dahlInspectStart: (v) => `"Inspectors coming across, Halcyon. ${n(v, 'courtesy') ? 'Logged as a courtesy, not a concession, if you insist. ' : ''}About ${mins(n(v, 'inspect'))}."`,
  dahlInspectDone: () => '"Your cargo is what you said it was. Pass, Halcyon."',

  // ---- the Reeve
  reeveCallSteady: (v) => `"Halcyon, this is ${REEVE_SHORT} on ${COLONY}. We can see the picket on our scopes. Our reactor has about ${mins(n(v, 'claimed'))} before we have to shut it down. Please. Get here."`,
  reeveCallDesperate: (v) => `"Halcyon! ${REEVE_SHORT}, ${COLONY}. Our reactor is going, we have ${mins(n(v, 'claimed'))} at the outside, and then… please, whatever you have to do, get here."`,
  reeveTime: (v) => `"${mins(n(v, 'claimed'))}, Captain. Maybe less."`,
  reeveAdmits: (v) => `"…Your engineer's right. ${mins(n(v, 'left'))}, and then we shut down, and it's a cold week, but we have the shelters. I'm sorry. I was frightened you'd stop to talk."`,
  reeveStatement: () => `"A statement? For the picket? Yes. I'll put it on an open band: ${COLONY} ordered those assemblies, and they're nothing but reactor parts. If it helps."`,
  reeveWaiting: (v) => `"We're still here, Captain. ${n(v, 'claimed') ? `${mins(n(v, 'claimed'))}.` : 'Hurry.'}"`,
  reeveAfter: () => `"We can see you coming, Halcyon. Thank you."`,
  reeveDark: () => `"…Halcyon, this is ${COLONY}. We've shut the reactor down. We'll be in the shelters. Come when you can."`,
};

export const templates: Record<string, TemplateFn> = { ...base, ...T };
