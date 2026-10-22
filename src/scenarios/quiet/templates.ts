/**
 * Offline narration and dialogue for The Quiet Signal. Starts from the shared Kestrel template
 * set (generic engine keys: helm, comms, bridge, validation) and overrides every key whose
 * wording names that scenario's ships or people, plus this scenario's own keys.
 * A test renders fuzzed playthroughs and fails on any leaked Kestrel name or "[missing key]".
 */
import type { TemplateFn } from '../../engine/scenario';
import { km, range } from '../../engine/rules';
import { templates as base } from '../kestrel/templates';
import { GLITCH_KM } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
const ord = (q: number) => (q >= 1 ? 'second' : 'first');
const by = (v: V) => (n(v, 'by') === 2 ? "the Cantor's" : 'our');

const T: Record<string, TemplateFn> = {
  channelOpened: (v) => (/^the senders$/i.test(String(v.speaker)) ? "Channel open on the senders' band, Captain. They're listening." : `Channel open, Captain. ${v.speaker} is on screen.`),
  // ---- intro
  intro0: () => 'The ISV Halcyon is on a routine survey of the Teyma pulsar, a dead star turning thirty times a second at the edge of charted space. The bridge is quiet. The pulses tick through the sensor feed like a slow clock.',
  intro1: (_v, s) => `Captain, the pulsar's timing has gaps in it. Pulses are missing in groups, and they aren't random. There's a small craft sitting right in the beam, about ${Math.round(range(s, 'halcyon', 'kestrel') / 1000)},000 kilometres ahead. Something aboard it is blanking pulses on purpose.`,
  intro2: () => "Someone is signalling by silence. It's a sequence that stops short, the way you'd ask a question. I'm certain it's a question, Captain. I'm not yet certain what it's asking.",
  intro3: (_v, s) => `Second contact, about ${Math.round(range(s, 'halcyon', 'cruiser') / 1000)},000 kilometres off our bow: a Tessarine Directorate signals ship. Her weapons are cold, but every dish she has is pointed at that craft. She's listening too.`,
  intro4: () => 'Nobody is threatening anybody, Captain. That may be the hard part. Lieutenant Szabo is standing by; how do you want to handle this?',
  introHint: () => 'OFFLINE INTERPRETER: give orders in plain English, several at once if you like, e.g. "Szabo, work on the code" or "Scan the pulsar and hail the Directorate ship". Type "help" or "options" at any time.',
  help: () =>
    'Speak or type orders in plain English. Combine orders with "and"/"then". Examples: "Szabo, work on the code", "Szabo, how close are you?", "scan the pulsar", "use the main dish as a receiver", "boost power to comms", "hail the senders" (then answer with a number, e.g. "thirteen"), "Szabo, send them 13", "Szabo, echo their question back to them", "hail the Directorate ship", "ask Director Brenn to hold her transmission", "offer to share our decode", "warn the Cantor about the glitch", "open the range to 80,000 km from the pulsar", "put us between the Cantor and the senders", "status", "options".',

  // ---- shared engine keys, reworded for this scenario
  posture_nonHostile: () => "Understood — nothing that could look like a threat. Weapons stay cold and Helm keeps our movements slow.",
  promiseBroken: (v) => `Captain — that breaks what we told ${v.party === 'cruiser' ? 'Director Brenn' : 'the senders'}${v.kind === 'weaponsDown' ? ' about our weapons' : ''}.`,
  incomingHail: () => 'The Directorate ship is hailing us, Captain.',
  noContact: (v) => `No ${v.target === 'cruiser' ? 'Directorate ship' : 'such contact'} on sensors.`,
  noCompartmentKnown: () => "There's nothing hidden aboard that craft that I can find, Captain. The mystery is the signal, not the ship.",
  unknownPassenger: () => "There's no one out here by that description, Captain.",
  passengerAlreadyMoved: () => "There's no one out here by that description, Captain.",
  compartmentShielded: () => 'Nothing aboard the craft is shielded from our scans, Captain.',
  noneTrapped: () => 'No one is trapped, Captain. No one out here is in trouble — yet.',
  cannotInterpose: () => 'I need both the senders and the Directorate ship on the board to put us between them.',
  transportRange: (v) => `The craft is ${v.km} away; transporters reach ${v.need}. And I wouldn't, Captain: we don't know them.`,
  teamRange: (v) => `The craft is ${v.km} away. I'd rather not send anyone across to a people we can't talk to.`,
  extendRange: (v) => `We're ${v.km} from the craft. I'd need us within 2,500 km to wrap our shields around her, and she hasn't asked.`,
  kestrelEmpty: () => 'The craft is empty now, Captain.',
  kestrelRepairScope: () => "Their craft isn't damaged, Captain. There's nothing for our engineers to fix.",
  kestrelAlreadyStable: () => "Their craft isn't damaged, Captain.",
  kestrelStabilised: () => "Their craft isn't damaged, Captain. There's nothing for our engineers to fix.",
  kestrelStabiliseFailed: () => "Their craft isn't damaged, Captain.",
  helm_interpose: () => 'Putting us between the senders and the Directorate ship.',
  tractorKestrel: () => "Tractor beam on the senders' craft. Captain, I don't think they'll read that kindly.",
  tractorCruiser: () => 'Tractor on the Cantor. Grabbing a Directorate ship is going to look like an attack.',
  jumpWithKestrel: () => "Jump drive engaged — with the senders' craft on the tractor beam. That is not how first contacts are supposed to go.",
  jumpEngaged: () => 'Jump drive engaged. We are leaving Teyma.',
  evacComplete: (v) => `Transporters cycling… last ${v.moved} aboard. The craft is empty.`,
  evacPartial: (v) => `Transported ${v.moved}. ${v.left} still aboard.`,
  passengerAboard: () => "There's no one out here by that description, Captain.",
  cargoAboard: () => "There's nothing aboard their craft for us to take, Captain.",
  medicalTeam: () => "Captain, a medical team to a people we can't talk to and who haven't asked? Dr. Osei says she'll go if you order it, but she'd rather they asked first.",
  trappedFreed: () => 'No one was trapped, Captain.',
  trappedNotYet: () => 'No one is trapped out here.',
  interposeTookHit: () => 'Something hit us while we were in the way, Captain.',
  impTractorShield: () => "Nothing out here is shooting, Captain. There's nothing to screen against.",
  impShieldExtend: () => "Nothing out here is shooting, Captain. There's nothing to screen against.",
  kestrelBreachCrew: () => "The senders' craft breaks apart.",
  kestrelBreachEmpty: () => "The senders' craft breaks apart.",
  reinforcementsArrive: () => 'More ships arrive at Teyma.',
  reinforcementsHoldOff: () => 'No other ships are coming.',
  scanKestrelDetail: () => "The senders' craft: small, unarmed, four life signs.",
  scanKestrelBasic: (v) => `At ${v.km} I get the craft and the gaps, nothing more.`,
  scanCruiserBasic: (v) => `The Directorate signals ship Cantor, at ${v.km}.`,
  scanCruiserDetail: (v) => `Cantor: hull ${v.hull}%, shields ${v.shields}%.`,
  areaSweep: () => 'Long-range sweep: the pulsar, the senders and the Cantor. Nothing else out here.',
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}, jump drive ${v.jump}%.`,
  ardenArms: () => "The senders' craft has no weapons.",
  ardenArmsAgainstHalcyon: () => "The senders' craft has no weapons.",
  impPlasmaVent: () => 'Venting drive plasma. It will blind everyone for a minute, including us.',
  impSensorGhost: () => 'Ghost contacts would only confuse the people we are trying to talk to, Captain.',
  impEjectCore: () => 'Our core is fine, Captain. Nothing out here needs it ejected.',
  impEjectCoreFailed: () => 'Our core is fine, Captain.',
  contactHostile: (_v, s) => `The ${s.ships.cruiser.scanLevel > 0 ? s.ships.cruiser.name : 'Directorate ship'} is now classified hostile.`,
  improviseUnclear: () => "Understood, Captain. Let's see what we can do with that.",
  refuseCivilian: (v) => `Captain, that craft has ${v.souls ?? 'four'} people aboard, it's unarmed, and all it has done is ask us a question. I won't fire on it.`,
  cededWithPassenger: () => "Captain, there's no one out here for us to hand over.",
  adviseBreach: () => 'Captain, time is passing. The senders are waiting for an answer.',
  adviseShields: () => 'Something has a lock on us and our shields are down. Recommend we raise them.',
  adviseScan: () => "Lieutenant Varga hasn't measured the pulsar's timing yet. Szabo would work faster with it.",
  adviseOptions: () => 'Captain, time is passing. Szabo can work the code, Varga can time the pulsar, and the Directorate ship is listening too. Say "options" if you want my read.',
  passengerWakesOnKestrel: () => 'The gaps in the pulsar repeat.',
  channelAlreadyOpen: (v) => `Channel's already open to ${v.speaker}, Captain. Anything you say on it, I'll put into their code if I can.`,

  // ---- scans
  scanSenders: (v) =>
    `${n(v, 'fresh') ? "Timing measured to the nanosecond. The gaps aren't just groups: inside each group the missing pulses are spaced, and the spacing carries structure. I've sent the whole thing to Lieutenant Szabo; it should speed her up." : "Same pattern as before. Szabo has my timing data."} ${n(v, 'close') ? 'The craft itself is small and unarmed. Four life signs aboard, of no type I know.' : `The craft is ${v.km} away; for life signs I'd need us within ${v.need}.`}${n(v, 'tasked') ? '' : " Nobody is working the decode yet, Captain."}`,
  scanLedger: (v) => `The Cantor: a Tessarine Directorate signals ship, ${v.km} out, hull ${v.hull}%. Weapons cold, shields down, and every receiver she has pointed at the pulsar. Her transmitter is warm, though. She can answer them too.`,
  areaSweepQuiet: (v) => `Long-range sweep: the Teyma pulsar, the senders' craft in its beam (${v.senders}), and the Cantor (${v.ledger}). Nothing else out here.`,
  sendersGoneScan: () => 'The craft is gone, Captain. Only the pulsar is left, ticking on without gaps.',
  statusReportQuiet: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}, jump drive ${v.jump}%. Senders: ${v.senders}. Cantor: ${v.ledger}. Exchange: ${v.exchange}. Decode: ${v.decode}.`,

  // ---- improvisation
  impSensorGhostQuiet: () => 'Ghost contacts would only confuse the people we are trying to talk to, Captain. I would rather not.',
  impPlasmaVentQuiet: () => "Venting plasma here would blind our own receivers, Captain, and we need every one of them. I'd advise against it.",
  impShieldQuiet: () => "There's nothing to shield against, Captain. Nobody out here is shooting.",
  impEjectCoreQuiet: () => 'Our core is fine, Captain. Nothing out here needs it ejected.',
  dishRigged: (v) => `Done. I've slaved the main navigational dish to the comms array as a second receiver. Szabo gets twice the signal with half the noise.${n(v, 'tasked') ? '' : " She'll need to be working the code to use it, Captain."}`,
  dishAlready: () => 'The main dish is already slaved to the comms array, Captain.',

  // ---- Szabo
  szaboOpensBand: (v) => `I've matched their band, Captain: I can blank our own carrier in their rhythm, so they'll hear us the way we hear them. They don't understand words, only answers. I'm working the pattern now.${n(v, 'p') === 2 ? '' : ' Give me a few minutes before you answer anything.'}`,
  szaboBandAgain: (v) => `Back on their band, Captain.${n(v, 'q') >= 2 ? '' : n(v, 'p') === 2 ? ' I have their grammar.' : n(v, 'p') === 1 ? ' I have two possible readings, not yet one.' : ' Still working the pattern.'}`,
  szaboStarts: (v) => `On it, Captain. It's a question in some kind of grammar, and I don't know which yet. Give me a few minutes. They'll wait about ${v.left} more, I think.`,
  szaboAssessNone: (v) => `Not yet, Captain. I have structure but no meaning. If you answer now you're guessing. They'll wait about ${v.left} more minutes, I think. Varga's timing data, or more gain on the array, would speed me up.`,
  szaboWorking: (v) => (n(v, 'p') === 2 ? "I already have their grammar, Captain. Just tell me what to send." : n(v, 'p') === 1 ? `I'm working on it. I have two readings; a few more minutes and I'll know which.` : "I'm working on it, Captain. Give me a few minutes."),
  szaboPartial: (v) =>
    `Captain, partial decode on the ${ord(n(v, 'q'))} question. The pattern fits two grammars. Read as ${v.lean}, the answer is ${v.a}. Read as ${v.other}, it's ${v.b}. If you made me choose now, I'd say ${v.lean}, but I wouldn't bet the contact on it. A few more minutes and I'll know.`,
  szaboAssessFull: (v) =>
    n(v, 'q') >= 2
      ? "Both questions answered, Captain. Now I'm listening to what they say back. Whatever it is, I can put our reply into their code."
      : `Their grammar is ${v.grammar}, Captain; I'm sure of it. The ${n(v, 'q') === 0 ? 'first' : 'second'} question wants ${v.answer}. Say the word and I'll send it. About ${v.left} minutes left, I think.`,
  szaboAssessPartial: (v) => `Two readings, Captain. As ${v.lean}, the answer is ${v.a}; as ${v.other}, it's ${v.b}. I lean toward ${v.lean}, but I'm not sure yet. About ${v.left} minutes left before they lose patience, I think.`,
  szaboFull: (v) =>
    v.how === 'accepted'
      ? `They accepted it, Captain — so the grammar is ${v.grammar}. I'm sure of it now.`
      : v.how === 'eliminated'
        ? `That rules one reading out, Captain. The grammar is ${v.grammar}.${n(v, 'q') < 2 ? ` The answer they want is ${v.answer}.` : ''}`
        : `I have it, Captain. The grammar is ${v.grammar}.${n(v, 'q') < 2 ? ` The ${ord(n(v, 'q'))} question is asking for ${v.answer}. I'm sure.` : ''}${n(v, 'lean') ? '' : ' My early lean was wrong; I am glad we waited.'}`,
  szaboSecond: (v) => `${n(v, 'by') === 2 ? "Captain, that was the Cantor's answer they accepted, not ours. " : ''}Second question coming through, same grammar. The answer is ${v.answer}.`,
  szaboLedgerWrong: (v) => `And Captain, I've been watching the Cantor's test transmissions. She's working the wrong grammar: she's reading it as ${v.grammar}. If she answers, she'll answer wrongly.`,
  szaboSends: (v) => `Sending ${v.n} on their band.${n(v, 'sure') === 2 ? '' : n(v, 'sure') === 1 ? " I'm not sure of this one, Captain." : ' Captain, this is a guess.'}`,
  szaboStrike: (v) => (v.why === 'lock' ? "They felt our targeting sensors, Captain. That's one wrong note. I wouldn't give them a second." : v.why === 'ledgerWrong' ? "That was the Cantor's wrong answer, Captain, but they can't tell us apart. One more and I think they'll go." : v.why === 'threat' ? "That landed badly, Captain. One more and I think they'll go." : "Wrong answer, Captain. They're repeating the question, harder and faster. One more mistake and I think they'll go."),
  szaboImpatient: (v) => `Captain, the gaps are coming faster. They're waiting for an answer to the ${ord(n(v, 'q'))} question, and I don't think they'll wait more than another couple of minutes.`,
  szaboLastChance: () => "They've asked again, slower, Captain. I think this is the last time they'll ask.",
  szaboEchoWorked: (v) => `It worked. They've stopped repeating: they know someone heard the question. That buys us a few minutes — about ${v.deadline}, I think.`,
  szaboEchoAgain: () => "They've already heard their own question back once, Captain. A second echo just sounds like a parrot. It won't buy anything.",
  szaboEchoLate: () => "They've stopped asking, Captain. There's nothing to echo.",
  szaboNeedsNumber: (v) => `I can't put that into their code, Captain. All they understand right now is the answer.${n(v, 'p') === 0 ? " And I don't know the answer yet." : ''}`,
  szaboWontThreaten: () => "Captain, there's no way to say that in their grammar that isn't just a wrong answer. I'd rather not send it.",
  szaboMessageComing: () => "They accepted the second answer, Captain. Something longer is coming through. Give me a minute.",
  szaboMessage_greeting: (v) => `It's a greeting, Captain. Their whole message is a greeting: who they are, in numbers, and an empty space where they want ours. They want to meet us.${n(v, 'joint') ? ' The Cantor is reading the same thing.' : ''} If we answer warmly, I can put it into their code.`,
  szaboMessage_farewell: (v) => `Captain, it's a goodbye. They've been here a long time, listening, and they're leaving. It's a thank-you to whoever answered. They want it acknowledged, not answered with questions.${n(v, 'joint') ? ' The Cantor has it too.' : ''}`,
  szaboMessage_warning: (v) => `Captain, it's a warning. They've been timing the pulsar much longer than we have: it's about to glitch, and anything near it will be caught. They're leaving, and they're telling us to leave too.${n(v, 'joint') ? ' The Cantor has it as well.' : ''}`,
  szaboWarningNoReply: () => "They aren't waiting for a reply, Captain. They're telling us to get clear.",
  szaboAlreadyReplied: () => "We've already answered them, Captain.",
  szaboEncodesThreat: () => "Encoding it as best I can, Captain. It doesn't come out friendly.",
  szaboEncodesFarewell: () => "Putting it into their code: thanks, and a goodbye. Short and clean.",
  szaboEncodesGreeting: () => "Putting it into their code: who we are, in numbers, where they left the space for it.",
  szaboWrongShape_greeting: () => "Captain, they're greeting us, not leaving. A goodbye now would end it. I'd answer the greeting.",
  szaboWrongShape_farewell: () => "Captain, they're saying goodbye, not hello. If we press them with questions I think they'll just leave. I'd answer in kind.",
  szaboWrongChannel: (v) => `Actually, Captain — that's for the senders, not the Cantor. Sending ${v.n} on their band instead.`,
  szaboNoSenders: () => 'The senders are gone, Captain. There is no one on that band.',
  szaboNoAnswer: () => 'They are not listening any more, Captain.',

  // ---- the senders (their pulses, as Szabo renders them)
  sendersStrike: (v) => (v.why === 'lock' ? '(the gaps stop for three seconds, then resume: shorter, sharper, the question repeated)' : '(the pattern stutters, then repeats the question: harder and faster)'),
  sendersThreatened: () => '(the gaps close all at once. The craft turns out of the pulsar beam and accelerates away.)',
  sendersAccept: (v) => `(a long gap, then a new sequence: ${by(v)} answer, played back to us, and after it a new question)`,
  sendersAcceptFinal: (v) => `(${by(v)} answer, played back, then silence. A longer sequence begins.)`,
  sendersEcho: () => '(a pause. Then the question again, slowly, once. They are waiting.)',
  sendersRepeat: () => '(the question again, slower this time)',
  sendersSilent: () => '(the gaps stop. The pulsar ticks on, perfectly regular. The craft turns out of the beam and is gone.)',
  sendersMessage: () => '(a long sequence of gaps, minutes of it, structured and deliberate)',
  sendersFarewell: () => '(our own goodbye, played back once. Then the craft turns out of the beam and leaves, unhurried.)',
  sendersContact: (v) => `(a burst of new sequences: names, numbers, shapes. They are teaching us their words${n(v, 'joint') ? ', and the Cantor is answering alongside us' : ''}.)`,

  // ---- Brenn
  brennFirst: (v) =>
    `Cantor. I'm Signals Director Halia Brenn, Tessarine Directorate. ${v.director === 'scholar' ? "You've seen the gaps, then. Remarkable, aren't they? Whoever they are, they're patient." : v.director === 'rival' ? "You're late, Halcyon. We've been on this signal longer than you have." : 'This contact is under study by the Directorate, Halcyon. I suggest you leave it to us.'}`,
  brennGreetAgain: (v) => `Brenn here, Halcyon.${n(v, 'holding') ? " We're holding, as agreed." : ''}`,
  brennEnd: () => 'Cantor out.',
  brennNotRelay: () => "Halcyon, I'm not your relay. If you mean to answer them, answer them yourselves.",
  brennWarnWhat: () => 'Warn me about what, Halcyon? You have nothing I can use.',
  brennHeedsWarning: (v) => (v.director === 'hardliner' ? "…Our own team has it now. Your decode matches. Cantor is leaving. I won't forget this, Halcyon." : v.director === 'rival' ? "…You didn't have to tell us. Thank you. Cantor is getting clear." : "Then we're leaving. Thank you, Halcyon. Cantor is getting clear."),
  brennDoubtsWarning: () => "An ISA warning that conveniently clears the Directorate off the contact? Show me the decode, Halcyon, or don't waste my time.",
  brennThreatened: (v) => (v.director === 'scholar' ? "That's beneath you, Halcyon. Nobody here is armed for a fight." : "Threats, Halcyon? Then we'll answer them first and be done with you."),
  brennAlreadyJoint: () => "We're already working together, Halcyon. My team is on your feed.",
  brennJointRefuse: () => "Share with the ISA? I have orders, Halcyon. The Directorate answers this contact.",
  brennJointNothing: () => "Share what, Halcyon? You have nothing yet. Come back when you have a reading worth trading.",
  brennTakesData: () => "Received. Thank you, Halcyon. The Directorate will take it from here.",
  brennJoint_scholar: () => "Gladly. Two teams and one decode is better than two wrong answers. My data is on your feed now, and we hold our transmitter. You answer them; we'll listen with you.",
  brennJoint_rival: () => "All right. A joint decode, on the record, with the Directorate's name beside yours. My data's coming across. We hold our transmitter; you send.",
  brennAlreadyHolding: () => "We're holding, Halcyon. As agreed.",
  brennHolds: () => "Agreed. A wrong answer helps no one. Cantor is holding her transmitter.",
  brennHoldsWrong: () => "…Your reading has them as something else? Then we hold. I won't send them a wrong answer to be first.",
  brennDelays: (v) => `Two minutes, Halcyon.${n(v, 'wrong') ? ' Prove us wrong and I may wait longer.' : ''} Then we answer whether you are ready or not.`,
  brennRefusesHold: (v) => (n(v, 'wrong') ? "Wrong? Our analysts disagree. The Directorate does not wait for the ISA's permission." : "No, Halcyon. The Directorate does not wait for the ISA's permission."),
  brennExplains_scholar: () => "We're a signals ship. This is what we do. Frankly, I care more about reading it right than about who reads it first.",
  brennExplains_rival: () => "First contact, Halcyon. The Directorate's first. And yes, my name on the report.",
  brennExplains_hardliner: () => "My orders are to claim this contact for the Directorate. That's all you need to know.",
  brennDecodeTalk: (v) => (v.director === 'scholar' ? "We think it's a question too. We have a reading. We're not certain of it." : "Our decode is coming along, thank you."),
  brennCourteous: () => 'Halcyon.',
  brennUnclear: () => "I'm not sure what you want, Halcyon.",
  brennWordBroken: () => "So much for the ISA's word, Halcyon.",
  brennBlocked: (v) => (n(v, 'n') ? 'Halcyon, get out of my beam. Again.' : "Halcyon, you're sitting in my beam. Move your ship."),
  brennStopsAfterWrong: () => "…They rejected it. We had it wrong. Cantor is holding; I won't make it worse.",

  // ---- sensors / events
  ledgerTransmits: (v) => `Captain, the Cantor is transmitting on their band. She's answering the ${ord(n(v, 'q'))} question: ${v.n}.`,
  ledgerBlocked: () => "The Cantor tried to transmit, Captain. We're in her beam: our hull took it, and the senders never heard it.",
  vargaGlitchConfirms: (v) =>
    `I see it now, Captain. The pulsar's spin is stuttering: a glitch in about ${v.mins} minutes. Anything inside ${km(GLITCH_KM)} of that craft will be caught.${n(v, 'us') ? " That includes us." : " We're clear."}${n(v, 'ledger') ? ' And the Cantor is inside it.' : ''}`,
  sendersDepart: () => "The senders' craft has turned out of the beam and gone, Captain. They're not waiting for the glitch.",
  glitchHits: () => 'The Teyma pulsar glitches. For three seconds its beam swings wide and blazing across everything near it.',
  glitchHitUs: () => "We're caught in it! Hull damage, sensors and comms burned out, and the jump drive's badly hurt. We'll limp home, Captain.",
  glitchHitLedger: () => "The Cantor was caught in it, Captain. She's dead in space, badly damaged. Her crew are alive, but they're going nowhere soon.",
  ledgerJumpsClear: () => 'The Cantor has jumped clear of the pulsar, Captain.',
};

export const templates: Record<string, TemplateFn> = { ...base, ...T };
