/**
 * Offline narration and dialogue for The Gardener. Starts from the shared Kestrel template set
 * (generic engine keys: helm, comms, bridge, validation) and overrides every key whose wording
 * names that scenario's ships or people, plus this scenario's own keys.
 * A test renders fuzzed playthroughs and fails on any leaked name from another simulation or "[missing key]".
 *
 * Claimwarden Bettine Crake is blunt, tired and frightened for her claims, and her three tempers
 * (hothead, pragmatic, frightened) are worded differently but never name themselves. Assayer Lorne
 * Haskett is slow, dry and precise, and knows every rock in the field. Lt. Varga never says more
 * than she knows.
 */
import type { TemplateFn } from '../../engine/scenario';
import { formalOf } from '../../engine/captain';
import { templates as base } from '../kestrel/templates';
import { CRAKE_SHORT, FIELD, GROWTH, HASKETT_SHORT, STATION, TENDER } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
const mins = (x: number) => (x === 1 ? 'a minute' : `${x} minutes`);
const Field = FIELD.replace(/^the/, 'The');
const Growth = GROWTH.replace(/^the/, 'The');
const drawnWord = (v: V) => (String(v.drawn) === 'heat' ? 'heat' : String(v.drawn) === 'metal' ? 'metal' : 'light');

const T: Record<string, TemplateFn> = {
  // ---- channels
  channelOpened: (v) => `${v.speaker}, Captain. ${String(v.vessel) === TENDER ? `Audio from the ${TENDER}; there is a lot of noise behind her.` : `Audio and visual from ${STATION}.`}`,
  channelOpenedPrivate: (v) => `${v.speaker} on a closed channel, Captain.`,
  channelAlreadyOpen: (v) => `${v.speaker} is already on the channel, Captain.`,
  channelHoldOther: (v) => `${String(v.vessel) === TENDER ? `The ${TENDER}` : STATION} stands by.`,
  channelResumed: (v) => `${v.speaker} back on the channel.`,
  channelClosed: (v) => `${String(v.vessel) === TENDER ? `The ${TENDER}` : STATION} off the channel.`,
  channelOnHold: (v) => `${v.speaker} is standing by, Captain.`,
  noDialogue: () => 'Nobody is answering, Captain.',
  promiseBroken: () => 'Captain, that is not what we told her.',

  // ---- intro
  intro0: () => `${Field}: a few hundred tumbling rocks worked by a small claims cooperative, a long way from anywhere. Three days ago something began to grow across one of them, pale and branching, a little further every hour. The miners have started calling it "${GROWTH}". It is spreading toward their claims.`,
  intro1: () => `Captain, the growth is on a rock eight kilometres ahead. The cooperative's tender, the ${TENDER}, is holding off it with cutting charges aboard, and their claims station, ${STATION}, is beyond it with a hundred and forty people. Nobody is shooting at anyone. There is nothing out here to shoot at.`,
  intro2: () => `I have never seen anything like it, Captain. It might be alive. It might be a crystal that only looks alive. I can find out, but not in one look: it will take me a while, a step at a time.`,
  intro3: () => `For the record, Captain, our guns could burn that rock clean in a minute. So could their charges. That is the easy part.`,
  intro4: (_v, s) => `The miners want it gone, ${formalOf(s)}, and they are frightened. Lt. Varga can study it, Chief Okafor can build things, and ${HASKETT_SHORT} on the station knows the field. What we do about it, and when, is yours.`,
  introHint: () => 'OFFLINE INTERPRETER: give orders in plain English. "Varga, study the growth", "send a probe to take a sample", "hail the tender", "tell the Claimwarden to hold her charges", "hail the station", "how does it reach the claims?", "Chief, lay a lure", "pull us back". Type "help" or "options" at any time.',
  help: () =>
    'Speak or type in plain English. The science: "Varga, study the growth", "send a probe for a sample", "is it alive?", "what is it drawn to?", "what would burning it do?". The miners: "hail the tender", then "hold your charges, give us time", "we will protect your claims", "it is alive", "cut the ore rail"; or "tell Crake to wait". The station: "hail the station", "how does it reach your claims?", "dim your floodlights". The Halcyon: "Chief, lay a heat lure" (or metal, or light), "run cold", "pull us back", "burn the growth". Also "status" and "options".',

  // ---- shared engine keys, reworded for this scenario
  posture_nonHostile: () => 'Understood. Weapons stay cold, Captain.',
  incomingHail: () => 'We are being hailed, Captain.',
  noContact: () => `No such ship here, Captain. Just the ${TENDER}, ${STATION}, and the rock.`,
  noCompartmentKnown: () => 'Nothing hidden out here that a scan would find, Captain. Only the growth.',
  unknownPassenger: () => 'There is no one by that description out here, Captain.',
  passengerAlreadyMoved: () => 'There is no one by that description out here, Captain.',
  passengerDead: () => 'There is no one by that description out here, Captain.',
  passengerStasis: () => 'There is no one by that description out here, Captain.',
  compartmentShielded: () => 'Nobody out here is hiding anything from our scans, Captain.',
  noneTrapped: () => 'No one is trapped, Captain.',
  cannotInterpose: () => 'There is nothing to put ourselves between, Captain. It is not that kind of threat.',
  transportRange: (v) => `That is ${v.km} out; transporters reach ${v.need}.`,
  teamRange: (v) => `That is ${v.km} out, Captain.`,
  teamShields: () => 'Not with our shields up, Captain.',
  transportShields: () => 'Our shields are up, Captain; the transporter cannot cycle through them.',
  extendRange: () => 'Nobody out here is shooting, Captain.',
  kestrelEmpty: () => `${STATION} has its own shuttles, Captain. Nobody needs a lift yet.`,
  kestrelRepairScope: () => `${STATION} is not broken, Captain. The problem is on the rock.`,
  kestrelAlreadyStable: () => `${STATION} is not broken, Captain. The problem is on the rock.`,
  kestrelStabilised: () => `${STATION} is not broken, Captain. The problem is on the rock.`,
  kestrelStabiliseFailed: () => `${STATION} is not broken, Captain. The problem is on the rock.`,
  powerReactor: () => 'Our reactor is fine, Captain.',
  repaired: (v) => `Repair crews have the ${v.system} back to ${v.health}%.`,
  helm_interpose: () => 'There is nothing to put ourselves between, Captain.',
  tractorKestrel: () => `Captain, ${STATION} is anchored to its claim. A tractor would only tear it loose.`,
  tractorCruiser: () => `Tractor on the ${TENDER}, Captain.`,
  tractorRange: (v) => `Target at ${v.km}; tractor reach is ${v.need}.`,
  jumpWithKestrel: () => 'Jump drive engaged.',
  jumpEngaged: () => `Jump drive engaged. Leaving ${FIELD}.`,
  jumpCharging: (v) => `Charging the jump drive (${v.charge}%). Captain, the miners are still out here.`,
  evacComplete: () => `${STATION} has its own shuttles, Captain.`,
  evacPartial: () => `${STATION} has its own shuttles, Captain.`,
  passengerAboard: () => 'There is no one by that description out here, Captain.',
  cargoAboard: () => 'Nothing unusual in our hold, Captain, and I would like to keep it that way.',
  medicalTeam: () => 'Nobody out here needs a doctor, Captain. I would like to keep it that way too.',
  trappedFreed: () => 'No one is trapped, Captain.',
  trappedNotYet: () => 'No one is trapped, Captain.',
  interposeTookHit: () => 'Nothing is shooting at us, Captain.',
  impTractorShield: () => 'Nothing out here is shooting, Captain.',
  impShieldExtend: () => 'Nothing out here is shooting, Captain.',
  kestrelBreachCrew: () => `${STATION} has gone quiet.`,
  kestrelBreachEmpty: () => `${STATION} has gone quiet.`,
  reinforcementsArrive: () => 'Nobody else is coming, Captain. It is us, the miners and the rock.',
  reinforcementsHoldOff: () => 'Nobody else is coming, Captain. It is us, the miners and the rock.',
  reinforcementsDetected: () => 'Nobody else is coming, Captain. It is us, the miners and the rock.',
  scanKestrelDetail: () => `${STATION}: the cooperative's claims station, a hundred and forty aboard, with work crews out on the claims around it.`,
  scanKestrelBasic: (v) => `${STATION}, at ${v.km}.`,
  scanCruiserBasic: (v) => `The ${TENDER}, at ${v.km}.`,
  scanCruiserDetail: () => `The ${TENDER}: a mining tender, eighteen aboard, no weapons. There are cutting charges racked in her bay, enough to burn that rock to slag.`,
  areaSweep: () => `${Field}: the growth on its rock, the ${TENDER} standing off it, and ${STATION} beyond, among the claims.`,
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}.`,
  ardenArms: () => 'Nobody out here has guns, Captain, except us.',
  ardenArmsAgainstHalcyon: () => 'Nobody out here has guns, Captain, except us.',
  impPlasmaVent: () => 'Venting plasma at it is just burning it the long way round, Captain.',
  impSensorGhost: () => 'There is nobody to fool out here, Captain.',
  impEjectCore: () => 'There is no reason to touch the core, Captain.',
  impEjectCoreFailed: () => 'There is no reason to touch the core, Captain.',
  contactHostile: () => 'Nobody out here is hostile, Captain. They are frightened.',
  improviseUnclear: () => 'Understood, Captain.',
  refuseCivilian: (v) => `Captain, ${v.name} is a civilian ship full of miners. I won't fire on it.`,
  refuseFriendly: () => "Captain, nobody out here has fired on anyone. I won't fire first.",
  cededWithPassenger: () => 'There is no one here for us to hand over, Captain.',
  adviseBreach: () => 'Captain, the growth is still spreading.',
  adviseShields: () => 'Captain, the growth is still spreading.',
  bridgeSurveyBusy: () => 'Varga is busy with the growth, Captain.',
  bridgeNotNow: () => 'Not now, Captain. The growth is still spreading.',
  impNotHere: () => 'Not here, Captain. Whatever we do to that rock, I would like to know what it is first.',
  objectivesReport: () => 'The objectives are on your board, Captain.',
  optionsReport: (v) => `Options, Captain: ${v.options}.`,

  // ---- the bridge
  relayed: () => 'Passing that on, Captain.',
  afterEnd: () => 'It is done, Captain.',
  gardenerUnclear: (v) => `Captain, I'm not sure how to do "${v.description}" here.`,
  leavingField: () => `Coming about, Captain. Leaving ${FIELD} to the miners.`,
  leftField: () => `We have left ${FIELD}, Captain. Whatever happens to the growth now, the miners will do it.`,
  shotsInField: () => 'Captain, we have fired in a field full of miners. Fleet Training Command has stopped the exercise.',
  backingOff: () => 'Opening the range, Captain. Holding at twenty kilometres.',
  awayAlready: () => 'We are already well back, Captain.',
  chargesSoon: () => `Captain, the ${TENDER} is moving in on the rock. Her crew are out on the hull with the charges.`,
  crakeStatus: (v) => `${CRAKE_SHORT} will fire her charges in about ${mins(n(v, 'burn'))}, Captain, unless somebody gives her a reason not to.`,
  crakeStatusDown: () => `${CRAKE_SHORT} has stood her crew down, Captain. The charges are back in the rack.`,
  statusGardener: (v) => `Where we are, Captain: ${n(v, 'knowsAlive') ? (String(v.nature) === 'stone' ? 'Varga has proved it is not alive. ' : 'Varga says it is alive. ') : n(v, 'studying') ? 'Varga is still working out what it is. ' : 'nobody knows yet what it is. '}It reaches the claims in about ${mins(n(v, 'claims'))}. ${n(v, 'stoodDown') ? `${CRAKE_SHORT} is waiting on us.` : `${CRAKE_SHORT} fires in about ${mins(n(v, 'burn'))}.`}`,
  marrowCounsel: () => 'My advice, Captain? Nobody out here is in danger yet, and everybody wants us to do something. That is exactly when we should not. Let Varga find out what it is, and keep the Claimwarden talking until she has.',
  fieldKnown: (v) => (String(v.link) === 'none' ? `${HASKETT_SHORT} says the growth's rock is jammed against the claims, Captain. Nothing to cut.` : `${HASKETT_SHORT} says the growth's rock is linked to the claims by ${String(v.link) === 'rail' ? 'the ore rail' : 'the cargo tethers'}, Captain.`),
  fieldKnownHabit: (v) => (String(v.link) === 'none' ? `The rock touches the claims, Captain. There is no gap to make.` : `If it can only cross by touch, Captain, ${String(v.link) === 'rail' ? 'the ore rail' : 'the cargo tethers'} are its only road to the claims.`),
  fieldUnknown: () => `I don't know how it gets from rock to rock, Captain. ${HASKETT_SHORT} would.`,

  // ---- Varga
  studyStart: () => 'Starting now, Captain. I will tell you as soon as I can say whether it is alive. After that, what it wants, and then what it would do if we burned it.',
  studyWorking: (v) => (n(v, 'knowsDrawn') ? 'Still working, Captain. I know what it is growing toward. I do not know yet what burning it would do.' : n(v, 'knowsAlive') ? 'Still working, Captain. It is alive. I do not know yet what it is growing toward.' : 'Still working, Captain. I cannot tell you yet whether it is alive. A sample would help.'),
  studyDone: () => 'I have told you everything I can, Captain.',
  vargaAskStudy: () => 'I don\'t know, Captain, and I won\'t guess. Give me the time to study it and I will tell you.',
  sampleAgain: () => 'I have a sample already, Captain. One is enough.',
  probeSample: () => 'Probe away, Captain. It will take a scraping from the edge of the growth and hold it out at arm\'s length for me. Nothing comes aboard. That will speed me up.',
  vargaFoundAlive: () => 'Captain. It is alive. It respires, it has something like cells, and it is growing on purpose. It is not a crystal. Next: what it is growing toward.',
  vargaFoundStone: () => 'Captain, it is not alive. It is a mineral crystallisation, following the metal in the rock as it grows. No cells, no metabolism, nothing. If someone wants to cut it out, nothing dies.',
  vargaFoundDrawn: (v) => `Captain, I know what it wants: ${drawnWord(v)}. It grows toward ${String(v.drawn) === 'heat' ? 'warmth, the warmer the better' : String(v.drawn) === 'metal' ? 'metal, the richer the ore the faster' : 'light, the brighter the better'}. Last thing to learn: what burning it would do.`,
  vargaFoundHabit: (v) => `${String(v.nature) === 'sporing' ? 'Captain, do not burn it. It is full of spores. Heat makes it burst; a fire would scatter them across every rock in the field, the claims included.' : 'Captain, burning it would kill it, and that is all it would do. There are no spores.'} One more thing: it can only grow by touch. It cannot cross open space.${String(v.link) === 'none' ? '' : ' Whatever links its rock to the claims is its only road.'}`,
  vargaHabit: (v) => (String(v.nature) === 'sporing' ? 'If it burns, it bursts, Captain: spores across the whole field. And it cannot cross open space.' : 'Burning would kill it and nothing more, Captain. And it cannot cross open space.'),
  vargaStone: () => 'It is not alive, Captain. A crystal following the metal. Nothing dies if it is cut out.',
  vargaNotYet: () => 'I don\'t know yet, Captain. I will.',
  vargaDrawn: (v) => `It grows toward ${drawnWord(v)}, Captain.`,
  vargaAliveAgain: () => 'It is alive, Captain. I am sure of it.',
  burnStone: () => 'The crystal shatters and slags, Captain. Nothing else on the rock. It was never alive.',
  burnOrganism: () => 'It is burning, Captain. It is… it is pulling back from the heat. It is dying. It was alive, and it was the only one of its kind we have ever seen.',
  burnSpores: () => 'Captain! It burst as it burned. Spores, millions of them, on the drift, toward every rock in the field. The claims as well.',
  lureFollowing: () => 'Captain, it is turning. The whole edge of the growth is bending toward the Chief\'s buoy.',
  lureIgnored: () => 'Nothing, Captain. It is ignoring the buoy. Whatever it wants, that is not it.',
  lureStone: () => 'Nothing, Captain. It is not following anything. It just grows along the metal.',
  dormant: () => 'Captain, with the floodlights out it has stopped growing. It is closing up, like a flower at night. It is not dead. It is asleep, and it will stay asleep as long as the claims stay dark.',
  dimNothing: () => `Nothing, Captain. It does not care about the light. ${HASKETT_SHORT} has his floodlights back on.`,
  reachingForUs: () => 'Captain, part of the growth has turned. It is reaching toward us, toward our heat. At this rate it reaches the hull before long.',
  reachEased: () => 'It has lost us, Captain. The growth is turning back toward the claims.',
  scanTender: () => `The ${TENDER}, Captain: eighteen aboard, no weapons, and enough cutting charges in her bay to burn that rock to slag.`,

  // ---- Okafor, Osei, Rask
  lureWhat: () => 'I can build a buoy, Captain, but bait it with what? Heat, metal or light? Without Varga\'s answer, it is a guess.',
  lureWhatKnown: (v) => `A buoy baited with ${drawnWord(v)}, Captain? Say the word.`,
  lureBuilding: (v) => `A buoy baited with ${v.kind}, Captain. Two minutes to build and lay it well clear of the claims.`,
  lureBuildingGuess: (v) => `A buoy baited with ${v.kind}, Captain, on a guess. Two minutes to build and lay it.`,
  lureBusy: () => 'The buoy is already out, Captain.',
  lureDone: () => `The growth has followed the buoy off its rock and out into the empty end of ${FIELD}, Captain. Nowhere near the claims, and nothing died.`,
  runCold: () => 'Running cold, Captain. Heat to minimum, radiators shuttered. It will be chilly in here.',
  coldAlready: () => 'We are already running cold, Captain.',
  hullGrown: () => 'Captain, it is on the hull. Tendrils across the forward plating, into the radiator seams. We cannot burn it off without burning us. Fleet Training Command has ended the exercise.',
  refuseAboard: () => 'No, Captain. Not into my ship, not until we know what it is. It comes aboard sealed into isolation, or a probe holds it outside.',
  refuseTeam: () => 'Captain, I won\'t send anyone across to that rock in ordinary suits. Send a probe, or send them in full barrier protection.',
  sampleIsolated: () => 'A sealed sample into isolation, Captain. It will stay behind two seals in Varga\'s lab. That will speed her up.',
  teamSuited: () => 'A team in full barrier protection, Captain. They will take their sample and come straight back into isolation. That will speed Varga up.',
  raskWarnUnknown: () => 'Captain, I can burn it. But Varga does not know yet what it is, and nothing on that rock has threatened anyone. Say it again if you want it done.',
  raskWarnAlive: () => 'Captain, Varga says it is alive. It has not hurt anyone. If you still want it burned, say it again.',
  raskBurns: () => 'Firing, Captain. Low power, full spread across the rock.',

  // ---- the Claimwarden
  crakeHail: (v) => `"Halcyon, this is ${CRAKE_SHORT} of the ${TENDER}. You've got guns. Burn that thing off my rock. If you won't, I will: I've charges set, and in ${mins(n(v, 'burn'))} I'm lighting them."`,
  crakeWaiting: (v) => `"I'm listening, Halcyon. ${n(v, 'burn') ? `${mins(n(v, 'burn'))}.` : ''}"`.replace(' "', '"'),
  crakeExplains: () => '"Three days, Halcyon. Three days it\'s been eating across that rock toward my claims. I don\'t know what it is and I don\'t care. I want it gone."',
  crakeAfter: () => '"It\'s done, Halcyon."',
  crakeHoldHot: (v) => `"Wait? For what? …Fine. ${mins(n(v, 'burn'))}. Not a second more."`,
  crakeHoldPragmatic: (v) => `"…All right. Your scientist gets a look first. ${mins(n(v, 'burn'))}, and then you tell me what it is."`,
  crakeHoldFrightened: (v) => `"I don't have time to wait! It's coming at my people!" …"${mins(n(v, 'burn'))}, then. Please hurry."`,
  crakeOneMore: (v) => `"…${mins(n(v, 'burn'))} more. Your scientist had better be close."`,
  crakeNoMore: () => '"No. I\'ve waited. Tell me what it is or get out of my way."',
  crakeNeedPromise: () => '"Waiting doesn\'t keep it off my claims! Will you? Will your ship stand between it and my people?"',
  crakeTrusts: () => '"…You\'ll keep it off my claims? Your word on it? …Then I\'ll wait. I\'ll wait as long as it\'s off my claims."',
  crakeStillStanding: () => '"I\'m not going anywhere, Halcyon. I\'m waiting on you."',
  crakeProof: () => '"Says who? You don\'t know what it is any more than I do. Show me."',
  crakeStoneDoubt: () => '"Just rock, is it? Then why won\'t your scientist say so?"',
  crakeAliveGrudging: (v) => `"…Alive. Alive and eating my claim." A long breath. "${mins(n(v, 'burn'))} more. Then it burns, alive or not."`,
  crakeAliveAgain: () => '"I heard you the first time. It\'s alive. So are my crews."',
  crakeAliveStands: () => '"…Alive. Gods. All right. I\'m not burning something alive if there\'s another way. The charges go back in the rack. Find me that other way, Halcyon."',
  crakeSpores: () => '"Spores? Across every rock I own?" …"Charges back in the rack. Now. Nobody lights anything." A pause. "Thank you, Halcyon. I\'d have done it."',
  crakeStoneCut: () => '"Just crystal? Then it\'s just a bad seam. Stand clear, Halcyon. I\'m cutting it out."',
  crakeWhyCut: () => '"Cut my own lines? Why would I do that?"',
  crakeNoLink: () => '"Cut what? That rock\'s jammed against my claims. There\'s nothing between them to cut."',
  crakeCutting: () => '"We\'re cutting, Halcyon. Give us a minute."',
  crakeCutsRail: () => '"It can\'t cross open space? Then it can\'t cross if there\'s no rail. …Right. Cutting the ore rail at the junction. Charges back in the rack; I\'d rather lose a rail than set fire to something alive."',
  crakeCutsTethers: () => '"It can\'t cross open space? Then it can\'t cross if there\'s nothing to climb. …Right. Casting off the tethers and pulling the claims back. Charges back in the rack."',
  crakeCutDone: () => '"Rail\'s down and the claims are clear, Halcyon. It\'s stopped at the edge of its rock. It\'s growing round and round on itself. It can keep that rock."',
  crakeGladly: () => '"About time."',
  crakeFires: () => `"Charges lit. Fire in the hole."`,

  // ---- the Assayer
  haskettCall: (v) => `"Halcyon, ${HASKETT_SHORT} on ${STATION}. I've been watching it three days. It's grown about a hand's width a minute, steady, toward us. At that rate it reaches our claims in about ${mins(n(v, 'claims'))}. Ask me anything about the field."`,
  haskettStatus: (v) => `"Still coming, Halcyon. About ${mins(n(v, 'claims'))} to our claims."`,
  haskettRail: () => '"Its rock\'s on the ore rail, Halcyon. That rail runs straight to our claims. If it\'s climbing anything, it\'s climbing that."',
  haskettTethers: () => '"Its rock\'s tethered to ours, Halcyon. We tow the rocks in on cargo tethers. Six of them, and they all run to our claims."',
  haskettNone: () => '"There\'s nothing between it and us, Halcyon. The rock drifted in against our claims a month ago. They\'re touching."',
  haskettCrakesCall: () => '"The rail and the tethers are the Claimwarden\'s, Halcyon. Ask her."',
  haskettDims: () => '"Floodlights down? …All right. We\'ll work by hand lamps. Going dark across the claims now."',
  haskettDimmedAlready: () => '"We\'ve tried the dark already, Halcyon."',
  haskettHalfway: (v) => `"It's halfway to our claims, Halcyon. About ${mins(n(v, 'claims'))}."`,
  haskettClose: (v) => `"It's close now, Halcyon. ${mins(n(v, 'claims'))}. I'm getting my crews off the outer claims."`,
  haskettOverrun: () => `"It's on our claims, Halcyon. We're pulling everyone in to ${STATION}. Nobody's hurt. But we've lost the claims."`,
  haskettAfter: () => '"Thank you, Halcyon. We\'ll manage from here."',
};

// Kept in step with the outcome titles (outcome.ts).
export const GROWTH_TITLE = Growth;

export const templates: Record<string, TemplateFn> = { ...base, ...T };
