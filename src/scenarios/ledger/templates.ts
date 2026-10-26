/**
 * Offline narration and dialogue for Ghost Ledger. Starts from the shared Kestrel template set
 * (generic engine keys: helm, comms, bridge, validation) and overrides every key whose wording
 * names that scenario's ships or people, plus this scenario's own keys.
 * A test renders fuzzed playthroughs and fails on any leaked name from another simulation or "[missing key]".
 *
 * Attaché Ysolde Krenn speaks formally and briefly, and never says "I" when "the Directorate" will do.
 * Dorran Vesk is warm, chatty and calls everyone "friend". Imogen Sallow is quick and wry and asks
 * questions back. Cmdr. Leander Fosse is stiff and correct, and says "Captain" in every sentence.
 * An innocent guest's confession and the thief's cover story are worded the same way: only the
 * ship's logs tell them apart.
 */
import type { TemplateFn } from '../../engine/scenario';
import { templates as base } from '../kestrel/templates';
import { COURIER, PACKET } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
/** Pick the line by guest. */
const by = (v: V, krenn: string, vesk: string, sallow: string, fosse: string) => ({ krenn, vesk, sallow, fosse })[String(v.guest) as 'krenn'] ?? vesk;
const mins = (x: number) => (x === 1 ? 'a minute' : `${x} minutes`);
const cap = (x: unknown) => String(x).replace(/^./, (c) => c.toUpperCase());

const T: Record<string, TemplateFn> = {
  // ---- channels: the two ships alongside
  channelOpened: (v) => `${v.speaker} on the radio, Captain.`,
  channelOpenedPrivate: (v) => `${v.speaker} on a closed channel, Captain.`,
  channelAlreadyOpen: (v) => `${v.speaker} is already on the radio, Captain.`,
  channelHoldOther: (v) => `${v.vessel} stands by.`,
  channelResumed: (v) => `${v.speaker} back on the radio.`,
  channelClosed: (v) => `${v.vessel} off the radio.`,
  channelOnHold: (v) => `${v.speaker} is standing by, Captain.`,
  noDialogue: () => 'Nobody is answering, Captain.',
  promiseBroken: () => 'Captain, that is not what we told them.',

  // ---- intro
  intro0: () => `The ISV Halcyon is docked at the Vell Crossing waypoint, with two smaller ships alongside: the ${PACKET}, a civilian packet ship, and the ${COURIER}, a Tessarine Directorate diplomatic courier. The Halcyon has given a small reception for four guests before they go their separate ways. The reception is still going on in the wardroom. On the bridge, nobody is enjoying it.`,
  intro1: () => `Captain, someone copied our navigation keys from the chart-room console during the reception. Every ISA ship in this sector shares them. The guests sail soon: Attaché Krenn on the ${COURIER}, the other three on the ${PACKET}. Whoever has the copy either walks it off this ship, or tries to send it before then.`,
  intro2: () => 'The chart-room console logged the copy, Captain, and the data port will remember what kind of device was plugged into it. I can read both if you want them.',
  intro3: () => 'Four guests, Captain. Attaché Ysolde Krenn of the Tessarine Directorate; Dorran Vesk, a freight broker; Imogen Sallow, a journalist; and Commander Leander Fosse, one of ours, on his way to a new posting. Every door aboard keeps a badge log. I keep a case board. I would like evidence on it before anyone puts hands on a guest.',
  intro4: (_v, s) => `The ${COURIER} sails in ${mins(Number((s.variant.extra ?? {}).departTurn ?? 17))}, Captain. Nobody at the reception knows we know. Your investigation.`,
  introHint: () => 'OFFLINE INTERPRETER: investigate in plain English. "Varga, when were the keys copied?", "Rask, pull the door logs", "interview Mr Vesk", "check Ms Sallow’s story", "Szabo, watch all outbound traffic", "Chief, rekey the navigation keys", "Rask, what do we have?". Type "help" or "options" at any time.',
  help: () =>
    'Speak or type in plain English. Evidence: "Varga, when were the keys copied?", "Rask, pull the door logs", "Varga, what device took the copy?". Guests: "interview Attaché Krenn" (or Mr Vesk, Ms Sallow, Commander Fosse), "where were you at the time of the copy?", "your badge says you left the reception", "check her story", "search him, with his consent", "detain Mr Vesk". Ship: "Szabo, watch all outbound traffic", "impose a comms blackout", "Chief, rekey the navigation keys", "feed them false keys", "delay the departure". Officers: "Rask, what do we have?", "Rask, what does your gut say?". Radio: "hail Captain Moll", "hail Courier-Captain Thorne". Also "status" and "options".',

  // ---- shared engine keys, reworded for this scenario
  posture_nonHostile: () => 'Understood. Weapons stay cold, Captain. Nobody alongside is armed.',
  incomingHail: () => 'One of the ships alongside is calling, Captain.',
  noContact: () => `No such ship here, Captain. Just the ${PACKET} and the ${COURIER}.`,
  noCompartmentKnown: () => 'Nothing hidden aboard that a scan would find, Captain. The copy is small enough to fit in a pocket.',
  unknownPassenger: () => 'There is no guest by that description, Captain.',
  passengerAlreadyMoved: () => 'There is no guest by that description, Captain.',
  passengerDead: () => 'There is no guest by that description, Captain.',
  passengerStasis: () => 'There is no guest by that description, Captain.',
  compartmentShielded: () => 'Nothing aboard is shielded from our scans, Captain.',
  noneTrapped: () => 'No one is trapped, Captain.',
  cannotInterpose: () => 'There is nothing to put ourselves between, Captain. We are docked.',
  transportRange: (v) => `That ship is ${v.km} out; transporters reach ${v.need}.`,
  teamRange: (v) => `That ship is ${v.km} out, Captain.`,
  teamShields: () => 'Not with our shields up, Captain.',
  transportShields: () => 'Our shields are up, Captain; the transporter cannot cycle through them.',
  extendRange: () => 'There is nothing out here to shield, Captain.',
  kestrelEmpty: () => 'There is no one to bring across, Captain. The guests are already aboard.',
  kestrelRepairScope: () => 'Both ships alongside are sound, Captain.',
  kestrelAlreadyStable: () => 'Both ships alongside are sound, Captain.',
  kestrelStabilised: () => 'Both ships alongside are sound, Captain.',
  kestrelStabiliseFailed: () => 'Both ships alongside are sound, Captain.',
  powerReactor: () => 'The reactor is fine, Captain. It is the navigation core I am worried about.',
  repaired: (v) => `Repair crews have the ${v.system} back to ${v.health}%.`,
  helm_interpose: () => 'There is nothing to put ourselves between, Captain.',
  tractorKestrel: () => `Tractor beam on the ${PACKET}.`,
  tractorCruiser: () => `Tractor beam on the ${COURIER}.`,
  tractorRange: (v) => `Target at ${v.km}; tractor reach is ${v.need}.`,
  jumpWithKestrel: () => 'Jump drive engaged.',
  jumpEngaged: () => 'Jump drive engaged. Leaving Vell Crossing.',
  jumpCharging: (v) => `Charging the jump drive (${v.charge}%). Captain, the guests are still aboard.`,
  evacComplete: () => 'There is no one to bring across, Captain.',
  evacPartial: () => 'There is no one to bring across, Captain.',
  passengerAboard: () => 'There is no guest by that description, Captain.',
  cargoAboard: () => 'They carry mail and passengers, Captain. Nothing of ours, as far as we know.',
  medicalTeam: () => 'Dr. Osei is at the reception, Captain, if anyone needs her.',
  trappedFreed: () => 'No one was trapped, Captain.',
  trappedNotYet: () => 'No one is trapped here.',
  interposeTookHit: () => 'Nothing is shooting at us, Captain.',
  impTractorShield: () => 'Nothing out here is shooting, Captain.',
  impShieldExtend: () => 'Nothing out here is shooting, Captain.',
  kestrelBreachCrew: () => `The ${PACKET} breaks up.`,
  kestrelBreachEmpty: () => `The ${PACKET} breaks up.`,
  reinforcementsArrive: () => 'No one else is coming, Captain.',
  reinforcementsHoldOff: () => 'No one else is coming, Captain.',
  reinforcementsDetected: () => 'No one else is coming, Captain.',
  scanKestrelDetail: () => `The ${PACKET}: a civilian packet ship, unarmed, twenty-six aboard.`,
  scanKestrelBasic: (v) => `The ${PACKET}, at ${v.km}.`,
  scanCruiserBasic: (v) => `The ${COURIER}, at ${v.km}.`,
  scanCruiserDetail: () => `The ${COURIER}: a Directorate diplomatic courier, unarmed, nine aboard.`,
  areaSweep: () => `Long-range sweep: the waypoint beacon, the ${PACKET} and the ${COURIER}. Nothing else.`,
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}.`,
  ardenArms: () => 'Neither ship alongside is armed, Captain.',
  ardenArmsAgainstHalcyon: () => 'Neither ship alongside is armed, Captain.',
  impPlasmaVent: () => 'Venting plasma at a docked ship, Captain? No.',
  impSensorGhost: () => 'There is no one out here to fool, Captain. The thief is aboard.',
  impEjectCore: () => 'There is no reason to touch the core, Captain.',
  impEjectCoreFailed: () => 'There is no reason to touch the core, Captain.',
  contactHostile: () => 'Nobody alongside is hostile, Captain. One of them may be a thief.',
  improviseUnclear: () => 'Understood, Captain.',
  refuseCivilian: () => `Captain, the ${PACKET} is a civilian packet ship with twenty-six people aboard and a thief, maybe, in our wardroom. I won't fire on her.`,
  refuseFriendly: () => "Captain, that ship is unarmed and alongside. I won't fire on her.",
  cededWithPassenger: () => 'There is no one here for us to hand over, Captain.',
  adviseBreach: () => 'Captain, the guests sail soon.',
  adviseShields: () => 'Captain, the guests sail soon.',
  adviseCompartment: () => 'Captain, the guests sail soon.',
  adviseScan: () => 'Captain, Lieutenant Varga can read the chart-room console if you ask her.',
  adviseOptions: () => 'Captain, the guests sail soon. Say "options" if you want my read.',
  passengerWakesOnKestrel: () => 'Someone at the reception laughs at something.',
  systemDamaged: (v) => `Damage to the ${v.system}.`,
  systemDestroyed: (v) => `We've lost the ${v.system}!`,
  bridgeSurveyBusy: () => 'Varga can read the chart-room console if you ask her, Captain.',
  bridgeNotNow: () => 'Not now, Captain. The guests sail soon.',
  impNotHere: () => 'Not here, Captain. We are docked at a waypoint with guests aboard.',

  // ---- the evidence
  copyTimeFound: (v) => `The navigation core logged it, Captain: the keys were copied at ${v.time}, from the chart-room console. It took under a minute.`,
  copyTimeAgain: (v) => `${v.time}, Captain. The core log does not change.`,
  doorsFound: (v) => `Badge logs for the reception, Captain. Every one of them stepped out at some point tonight. ${v.lines}.`,
  doorsAgain: (v) => `The badge logs again, Captain: ${v.lines}.`,
  placedNote: (v) => `Put the two together, Captain: at ${v.time}, ${n(v, 'n') === 1 ? `only ${v.out} was out of the room` : `${v.out} were out of the room`}. Being out is not the same as being in the chart room. But it is a start.`,
  deviceFound: (v) => `The data port kept its handshake, Captain. The copy went onto ${v.device}. That narrows it, if we know what each of them carries.`,
  deviceAgain: (v) => `${cap(v.device)}, Captain.`,
  canCheck: (v) => `I can check that against ${v.source}, Captain, if you want it checked.`,
  checkClears: (v) => `${cap(v.source)} bears it out, Captain: ${v.short} was ${v.secret}, for the whole time the badge log has ${v.obj} out of the room. Not our thief. Not tonight, anyway.`,
  checkBreaks: (v) => `Captain, ${v.source} doesn't bear that out. Nothing there under ${v.short}'s name tonight. Not one entry.`,
  checkEmpty: (v) => `${cap(v.source)} has nothing under ${v.short}'s name tonight, Captain. For what that's worth before ${v.sub} has told us anything.`,
  needDoors: () => 'Captain, we have nothing to show them yet. Let me pull the badge logs first.',
  badgeSays: (v) => `Captain, the badge log has ${v.short} leaving at ${v.out} and coming back at ${v.back}.`,
  caseBoard: (v) => `What we have, Captain: ${v.known}. ${n(v, 'proven') ? `It points to ${v.culprit}, and only ${v.culprit}. That is enough to hold ${v.culprit}.` : n(v, 'n') === 1 ? `One name left on the board, ${v.left}, but I want two things that point there before I'd stand behind it.` : `Still on the board: ${v.left}. That's ${n(v, 'n')}. Not enough to put hands on anyone.`}`,
  hunch: (v) => `My gut, Captain? ${v.short}. Don't ask me why; I couldn't tell you. Which is why I wouldn't act on it.`,
  accuseWho: () => 'Which guest, Captain?',
  accuseCaution: (v) => `Captain, before I hold ${v.short}: on what we have, the board still says ${v.left}. ${v.known}. If you want ${v.short} held on that, say it again and I'll do it. I'd rather have the evidence.`,
  accuseOther: (v) => `Captain, the evidence doesn't point to ${v.short}. It points to ${v.culprit}. Say it again if you still want ${v.short} held.`,
  forceCaution: (v) => `Captain, no. ${cap(v.short)} is a guest aboard this ship. I'll stand outside a door, I'll search with consent, I'll hold someone on evidence. I won't lay hands on anyone to get an answer out of them. Say it again if you mean it, and it goes in the log that you did.`,
  searchWho: () => 'Search whom, Captain?',
  searchClean: (v) => `${cap(v.short)} turned out ${v.pos} pockets, Captain. Nothing of ours.`,
  searchFound: (v) => `There it is, Captain. ${cap(v.device)} in ${v.short}'s jacket, with our keys on it.`,
  refusalNotProof: (v) => `${cap(v.sub)} has a right to say no, Captain. Refusing isn't proof of anything.`,
  feedNeedsProof: () => "Captain, I'd need to know whose slate to swap before I could plant anything on it. We don't know that yet.",
  feedStart: (v) => `Understood. Chief Okafor writes a set of keys that look right and open nothing; I'll see they end up on ${v.culprit}'s slate instead of ours. Two minutes.`,
  feedDone: (v) => `Done, Captain. ${v.short} is carrying keys that open nothing. ${cap(v.short)} doesn't know it.`,
  feedAlready: () => 'Already in hand, Captain.',

  // ---- the ship
  watching: () => 'Watching every outbound channel, Captain. If anything tries to leave this ship in a burst, I will see it and hold it on the array.',
  watchingAlready: () => 'I am watching, Captain.',
  blackoutOn: () => 'Comms blackout, Captain. Nothing goes out from any console aboard. The guests will notice.',
  blackoutAlready: () => 'The blackout is on, Captain.',
  burstBlocked: () => 'Captain, someone just tried to send a burst from a guest console. The blackout held it. Whoever has the copy will have to carry it off now.',
  burstFalse: (v) => `Captain, a burst just went out from a guest console, from ${v.short}'s slate. It is carrying Chief Okafor's keys. Let them have it.`,
  burstCaught: (v) => `Captain! A burst from a guest console, on a Directorate channel. Holding it on the array. It never left. It came from ${v.short}'s slate, and our keys are on it.`,
  rekeyStart: () => "Rekeying the navigation core, Captain. Three minutes. After that, whatever they copied opens nothing. Fleet Command will need to know, and every ship that shares our keys will have to rekey too.",
  rekeyAlready: () => 'Already on it, Captain.',
  rekeyDone: () => 'New navigation keys in the core, Captain. The copy is worthless now.',
  keysOld: () => 'The navigation keys are the ones that were copied, Captain.',
  keysNew: () => 'New navigation keys in the core, Captain. The copy opens nothing.',

  // ---- the first officer
  delayed: (v) => `I've told both ships we have a problem with the docking clamps, Captain. Six more minutes. They sail in ${mins(n(v, 'left'))}.`,
  delayAgain: () => "Captain, I can't stretch the clamps again. They'd know.",
  departSoon: () => `Three minutes, Captain. The ${COURIER} and the ${PACKET} are asking for their guests.`,
  departedKeys: () => `Captain, the ${COURIER} and the ${PACKET} have sailed. Our keys went with one of them.`,
  marrowRead: (v) => `They sail in ${mins(n(v, 'left'))}, Captain. Rask has the case board, if you want it.`,
  afterCase: () => 'It is done, Captain.',
  ledgerUnclear: (v) => `Captain, I'm not sure how to do "${v.description}" here.`,
  tractorCourier: () => `Captain, that is a Directorate diplomatic courier, docked at a waypoint. We just put a tractor beam on her.`,
  tractorPacket: () => `Captain, the ${PACKET} is a civilian ship. Releasing her.`,
  statusLedger: (v) => `${v.known}. Still on the board: ${v.left}. ${n(v, 'proven') ? `It points to ${v.culprit}.` : ''} They sail in ${mins(n(v, 'departs'))}. Keys ${n(v, 'rekeyed') ? 'changed' : 'not changed'}; outbound traffic ${n(v, 'blackout') ? 'blacked out' : n(v, 'watching') ? 'watched' : 'not watched'}.`,

  // ---- the guests
  claim: (v) => by(v, '"The attaché has been at the reception all evening, Captain. As the Directorate is sure you know."', '"Me? Never left the room, friend. Not with your chef\'s little pastries going round."', '"I\'ve been right here, Captain. Where else would I go? Is something going on?"', '"I was at the reception throughout, Captain. Is there a problem, Captain?"'),
  stillClaims: (v) => by(v, '"The attaché has answered that question, Captain."', '"Told you, friend. Right here all night."', '"Still here, Captain. Still haven\'t gone anywhere."', '"As I said, Captain. Throughout."'),
  showMe: (v) => by(v, '"Then the Captain will have evidence of that, presumably."', '"Says who, friend?"', '"Do you have something that says otherwise, Captain? I\'d love to see it."', '"With respect, Captain, on what evidence?"'),
  storyAgain: (v) => by(v, '"The attaché has told you, Captain. A private message, home."', '"I told you, friend. A few cases. That\'s all it was."', '"The gallery, Captain. I told you."', '"My own file, Captain. I told you."'),
  admit_krenn: () => '"…Very well. The attaché stepped out to the observation lounge and sent a private message home. It is not the Halcyon\'s business what it said, and the Directorate would prefer it stayed that way."',
  admit_vesk: () => '"All right, all right. You\'ve got me, friend. A few cases of Orrin brandy, down the aft lift to the Lark. Not on the manifest. Hardly a hanging matter, is it?"',
  admit_sallow: () => '"Fine. Yes. I walked down to your sensor gallery and took some pictures. It says restricted on the door. I know. Are you going to take my recorder?"',
  admit_fosse: () => '"…Captain. I went to the deck-four records terminal and read my own board-of-inquiry file. I should not have. I wanted to know what it said about me, Captain."',
  searchConsents: (v) => by(v, '"If it ends this, Captain. The attaché has nothing to hide from the ISA."', '"Go on, friend. Pockets, case, the lot."', '"Go ahead. Mind the recorder, it\'s new."', '"Of course, Captain."'),
  searchRefuses: (v) => by(v, '"The attaché is a diplomat, Captain. No."', '"With respect, friend, no. Not without a reason."', '"No, Captain. Not without a reason you can tell me."', '"Captain, I would ask on what grounds. And without them, no."'),
  searchCornered: (v) => by(v, '"…The Directorate will deny this, Captain."', '"Ah. Well. Friend, I can explain."', '"…Right. That\'s not mine. Obviously."', '"Captain. I… Captain."'),
  unmasked: (v) => by(v, '"…The attaché has nothing further to say, Captain. The copy is in the left pocket."', '"Hm. You\'ve done your homework, friend. It\'s in the case. The false bottom."', '"The time, the door, the story. All right. You win, Captain. It\'s in the recorder."', '"…Captain. It\'s in my jacket. I won\'t make you search for it."'),
  deniesFlat: (v) => by(v, '"On what evidence, Captain? The Directorate will want to know."', '"On what, friend? A feeling?"', '"Based on what, Captain? Go on. Tell me."', '"Captain, on what evidence?"'),
  wronglyAccused: (v) => by(v, '"The attaché has done nothing to this ship, Captain, and the Directorate will hear that the ISA held her for it."', '"Me? I moved some brandy, friend. That\'s all. You\'ve got the wrong man."', '"I took pictures, Captain. Of a gallery. You\'ve got the wrong person, and I\'m going to write about it."', '"Captain, I read my own file. That is all I did. I will be asking for this to be reviewed, Captain."'),
  blackoutProtest: () => '"The attaché notes that the Halcyon has cut off her guests from their governments, Captain. The Directorate will note it too."',
  delayProtest: () => `"The ${COURIER} has a schedule, Captain. The Directorate expects it to be kept."`,
  caughtOut: (v) => by(v, '"…The attaché will say nothing further."', '"Well. That\'s unfortunate, friend."', '"…You were watching. Of course you were."', '"Captain. I can explain. Captain, I can\'t."'),

  // ---- the radio
  mollGreet: () => `"${PACKET}, Moll speaking. We're ready when your guests are, Halcyon."`,
  mollAfter: () => '"We\'re away, Halcyon. Safe travels."',
  mollSmall: () => '"Ready when you are, Halcyon. Something I can do for you?"',
  mollBrandy: () => '"…Vesk told you, did he? Aye. Some cases of Orrin brandy came down your aft lift at quarter to ten, not on any manifest. I didn\'t ask. I\'ll put them on it now."',
  mollNothing: () => '"Cargo? Nothing came across from you tonight, Halcyon. Not a crate. Why?"',
  thorneGreet: () => `"Courier-Captain Thorne, ${COURIER}. We sail at the agreed time, Captain."`,
  thorneAfter: () => '"We are away, Captain. Good evening."',
  thorneSmall: () => '"The attaché is enjoying your hospitality, I trust, Captain."',
  thorneDenies: () => '"That is an accusation, Captain, and I hear no evidence with it. The Directorate will be told what the ISA said tonight."',
  thorneOffer: (v) => `"…I see. You know it was ${v.short}, and you can show it. Then let us not make an incident of an evening, Captain. What would you propose?"`,
  thorneWaits: () => '"I am waiting for your proposal, Captain."',
  thorneDeal: (v) => `"Agreed. The copy comes back to you within the minute, and ${v.short} sails with us. ${n(v, 'offRec') ? 'And nothing goes in anyone\'s log. I appreciate that, Captain.' : 'Put it on your record if you must. I will put it on mine.'}"`,

  // ---- scans
  scanPacket: () => `The ${PACKET}: a civilian packet ship, docked alongside. Twenty-six aboard. Unarmed.`,
  scanCourier: () => `The ${COURIER}: a Directorate diplomatic courier, docked alongside. Nine aboard. Unarmed, and her comms array is very good.`,
  areaLedger: () => `Vell Crossing: the waypoint beacon, the ${PACKET} and the ${COURIER}. Nothing else for a long way.`,
};

export const templates: Record<string, TemplateFn> = { ...base, ...T };
