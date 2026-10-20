/**
 * Offline narration and dialogue for Quarantine at Tallis Gate. Starts from the shared
 * Kestrel template set (generic engine keys: helm, comms, bridge, validation) and overrides
 * every key whose wording names that scenario's ships or people, plus this scenario's own keys.
 * A test renders fuzzed playthroughs and fails on any leaked Kestrel name or "[missing key]".
 */
import type { TemplateFn } from '../../engine/scenario';
import { km, range } from '../../engine/rules';
import { templates as base } from '../kestrel/templates';
import { tallis } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
const pick = (v: V, xs: string[]) => xs[n(v, 'v') % xs.length];
const plural = (x: number, one: string, many: string) => `${x} ${x === 1 ? one : many}`;

const T: Record<string, TemplateFn> = {
  // ---- intro
  intro0: () => 'The ISV Halcyon drops out of her jump corridor above Tallis Gate, an independent mining colony at the end of the Ilun pilgrim route. The colony has closed its orbital gate.',
  intro1: (_v, s) => `Captain, a civilian liner is holding position about ${Math.round(range(s, 'halcyon', 'kestrel') / 1000)},000 kilometres ahead: the Mercy of Ilun, a pilgrim ship. Her transponder is flying a medical-emergency code.`,
  intro2: () => '"…This is the Mercy of Ilun. We have sick passengers, many of them, and our doctor is out of medicine. Tallis Gate will not let us dock. Any ship, please…" (the broadcast repeats)',
  intro3: (_v, s) => `Second contact at the colony gate: an armed cutter, the Thornwake, about ${Math.round(range(s, 'halcyon', 'cruiser') / 1000)},000 kilometres out. She is broadcasting a quarantine line at ${km(40000)} from the gate. Ships that cross it will be fired on. Yellow alert.`,
  intro4: () => "A sick ship that may not be allowed to dock, and a picket that has been told to shoot. We don't know yet what the pilgrims have. Your orders, Captain?",
  introHint: () => 'OFFLINE INTERPRETER: give orders in plain English, several at once if you like, e.g. "Scan the liner and hail the picket" or "Take us to 3,000 km of the liner". Type "help" or "options" at any time.',
  help: () =>
    'Speak or type orders in plain English. Combine orders with "and"/"then". Examples: "take us to 3,000 km of the liner", "scan the liner", "hail Captain Sabeth", "ask how the sickness started", "send a medical team", "set up an isolation ward in the cargo bay", "fix their water recycler", "tell the Warden our scans show it isn\'t contagious", "ask her for the colony\'s antiviral", "put us between the liner and the picket", "extend our shields around the liner", "tow the liner and jump", "status", "options".',

  // ---- shared engine keys, reworded for this scenario
  posture_nonHostile: () => "Understood — we'll keep everything non-threatening. Helm will keep our approach slow near the picket.",
  promiseBroken: (v) => `Captain — that breaks what we told ${v.party === 'cruiser' ? 'Warden-Commander Marr' : 'Captain Sabeth'}${v.kind === 'weaponsDown' ? ' about our weapons' : v.kind === 'protect' ? ' about keeping them safe' : ''}.`,
  incomingHail: () => 'The picket is hailing us, Captain.',
  noContact: (v) => `No ${v.target === 'cruiser' ? 'picket ship' : 'such contact'} on sensors.`,
  noCompartmentKnown: () => "There's nothing hidden aboard the liner that I can find, Captain — just a lot of sick people.",
  unknownPassenger: () => "There's no one aboard the liner by that description, Captain.",
  passengerAlreadyMoved: () => "There's no one aboard the liner by that description, Captain.",
  compartmentShielded: () => 'Nothing aboard the liner is shielded, Captain.',
  noneTrapped: () => 'No one is trapped aboard the Mercy of Ilun.',
  cannotInterpose: () => 'I need both the liner and the picket on the board to put us between them.',
  transportRange: (v) => `The Mercy of Ilun is ${v.km} away; transporters reach ${v.need}. We need to get closer.`,
  teamRange: (v) => `The liner is ${v.km} away. Get us inside transporter range and I'll send a team.`,
  extendRange: (v) => `We're ${v.km} from the liner. I'd need us within 2,500 km to wrap our shields around her.`,
  kestrelEmpty: () => 'There is no one left aboard the Mercy of Ilun.',
  kestrelRepairScope: () => "The only system on that liner worth our team's time is her water recycler.",
  kestrelAlreadyStable: () => "We've already been through the liner's water recycler, Captain.",
  kestrelStabilised: (_v, s) => (tallis(s).cause === 'toxin' ? "Team's across. We've found it — the recycler's filter bed is leaching cadmium salts into the drinking water. We're purging and replacing it now." : "Team's across and through the water recycler. It's clean, Captain — whatever is making them sick, it isn't the water."),
  kestrelStabiliseFailed: () => "The recycler's access panels are welded shut from that cheap refit. We're cutting through — another minute.",
  helm_interpose: () => 'Putting us between the liner and the picket.',
  tractorKestrel: () => 'Tractor beam locked on the Mercy of Ilun. Our speed is halved while towing.',
  tractorCruiser: () => "Tractor on the picket. She's light — but grabbing a colony warship is going to look like an attack.",
  jumpWithKestrel: () => "Jump drive engaged — and the Mercy of Ilun comes with us on the tractor beam. Next stop, Corran's Rest.",
  jumpEngaged: () => 'Jump drive engaged. We are leaving Tallis Gate.',
  evacComplete: (v) => `Transporters cycling… last ${v.moved} aboard. The liner is empty.`,
  evacPartial: (v) => `Transported ${v.moved} pilgrims. ${v.left} still aboard — cycling again on your order.`,
  passengerAboard: () => "There's no one aboard the liner by that description, Captain.",
  cargoAboard: () => "We've taken the liner's medical stores aboard. There isn't much — they ran out days ago.",
  medicalTeam: (_v, s) => `Medical team is across to the Mercy of Ilun${s.flags.isolationWard || s.flags.transporterFilter ? ', in full barrier gear' : ''}. Captain Sabeth's grateful. We'll have a diagnosis within a minute.`,
  trappedFreed: () => 'No one was trapped, Captain — but the team has checked every deck.',
  trappedNotYet: () => 'No one is trapped aboard the liner.',
  interposeTookHit: () => "The picket is firing on the liner — we're in the way! Taking the hit.",
  impTractorShield: () => "I'm projecting the tractor field as a scattering screen. It'll blunt anything the picket fires for a minute or two.",
  impShieldExtend: () => 'Shields extended around the Mercy of Ilun. It is draining them fast, but she is covered for now.',
  kestrelBreachCrew: () => 'The Mercy of Ilun breaks apart.',
  kestrelBreachEmpty: () => 'The empty liner breaks apart.',
  reinforcementsArrive: () => 'More colony ships launch from Tallis Gate.',
  reinforcementsHoldOff: () => 'Colony ships hold position at the gate.',
  scanKestrelDetail: (v) => `Mercy of Ilun: ${v.souls} aboard.`,
  scanKestrelBasic: (v) => `At ${v.km} I get life signs, nothing more.`,
  scanCruiserBasic: (v) => `The colony picket Thornwake, at ${v.km}.`,
  scanCruiserDetail: (v) => `Thornwake: hull ${v.hull}%, shields ${v.shields}%.`,
  areaSweep: () => 'Long-range sweep: the colony, the picket and the liner. Nothing else out here.',
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}, jump drive ${v.jump}%.`,
  ardenArms: () => 'The liner has no weapons.',
  ardenArmsAgainstHalcyon: () => 'The liner has no weapons.',
  impPlasmaVent: () => "Venting drive plasma. The picket's sensors are blind to us for a minute or two.",
  impSensorGhost: () => 'Ghost contacts are on their scopes now. A colony picket has no reason to care.',
  impEjectCore: () => "The liner's reactor is fine, Captain. That isn't her problem.",
  impEjectCoreFailed: () => "The liner's reactor is fine, Captain. That isn't her problem.",

  contactHostile: (_v, s) => `The ${s.ships.cruiser.scanLevel > 0 ? s.ships.cruiser.name : 'picket'} is now classified hostile.`,
  improviseUnclear: () => "Understood, Captain. Let's see what we can do with that.",

  // ---- scans
  scanLinerBasic: (v) => `At ${v.km} I get life signs and a lot of elevated body temperatures, nothing more. I need to be within ${v.need} for detail.`,
  scanLinerDetail: (v) =>
    `Mercy of Ilun: ${v.souls} aboard, about ${v.sick} of them febrile, some collapsing. ${n(v, 'known') ? 'It matches what we already know.' : `From here I can't tell a virus from a poison. To run a pathogen panel through her hull I'd need us inside ${v.need}${n(v, 'boost') ? ' (more power to sensors would double that)' : ''}.`}`,
  scanDiagnosis_fever: (v) => `Pathogen panel's back. It's a virus, Captain — Ilun fever, haemorrhagic and contagious by breath and touch. ${v.sick} sick of ${v.souls}. Anyone we bring aboard, or send over, needs isolation. Dr. Osei says she can make an antiviral if she gets a blood sample.`,
  scanDiagnosis_toxin: (v) => `Panel's back, and there's no pathogen. It's cadmium poisoning — heavy metal in their blood, and the highest levels are in the galley crew. Their water is poisoning them. ${v.sick} sick, and it's not contagious.`,
  scanDiagnosis_panic: (v) => `Panel's back: no pathogen, no toxin. Histamine through the roof. It's an allergic reaction — resin incense from their rites, by the look of the air samples. ${v.sick} frightened, miserable people, and nothing contagious.`,
  scanPicket: (v) => `The Thornwake: a colony picket cutter, ${v.km} out, hull ${v.hull}%, weapons armed. She's enforcing a quarantine line at ${v.line} from the gate.`,
  areaSweepTallis: (v) => `Long-range sweep: Tallis Gate, the picket at the gate, and the liner ${v.liner} from it. The quarantine line is at ${v.line}. Nothing else out here.`,
  statusReportTallis: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}, jump drive ${v.jump}%. Liner: ${v.liner}. Picket: ${v.picket}. Quarantine line: ${v.line}.`,

  // ---- improvisation
  impPlasmaVentTallis: () => "Venting drive plasma. The picket is blind to us for a minute or two — though nobody is shooting at us yet.",
  impSensorGhostTallis: () => "Ghost contacts are on the picket's scopes. A colony cutter with orders from her council isn't going to be frightened off by phantoms, Captain.",
  impEjectCoreTallis: () => "The liner's reactor is fine, Captain. That isn't her problem.",
  isolationWard: (v) => `Cargo bay two is sealed and on its own air supply. It's an isolation ward now: anyone coming from the liner goes there first, in barrier gear.${n(v, 'contained') ? ' And I have moved the exposed team into it. The exposure is contained.' : ''}`,
  transporterFilter: (v) => `I've set the transporter's biofilters to screen out anything viral before people rematerialise. It'll slow transports a little, but nobody brings a bug aboard.${n(v, 'contained') ? ' I ran the exposed team back through it as well. They are clean.' : ''}`,

  // ---- agents
  pilgrimsDied: (v) => `The liner reports ${plural(n(v, 'n'), 'more death', 'more deaths')}. That makes ${v.total}.`,
  recyclerFound: () => 'Found it, Captain: the recycler was leaching cadmium into their drinking water. It is purged and replaced. Nobody else is going to be poisoned, and nothing here is contagious.',
  recyclerClean: () => "The water recycler is clean. Whatever is wrong with them, it isn't the water.",
  teamExposed: () => "Captain, my team went across without barrier gear and it's a virus. They've been exposed. If they come back aboard without isolation, we'll have it on the Halcyon within minutes. I need an isolation ward or a screened transport, now.",
  evacExposed: () => "Captain, those pilgrims are carrying a contagious virus and we've just put them into our corridors. We need an isolation ward or a screened transport, now, or we will have an outbreak aboard.",
  cureStarted: (v) => `I have a sample. Synthesising an antiviral; it'll be ready in about ${v.turns} minutes. We'll need to be in transporter range, with our shields down, to deliver it.`,
  cureReady: () => "The antiviral's ready, Captain. Get us inside transporter range of the liner with our shields down and I'll beam it across.",
  cureDelivered: (v) => `Antiviral delivered to the Mercy of Ilun.${n(v, 'exposed') ? ' And to our own exposed people.' : ''} Fevers are already breaking.`,
  linerCrossed: () => 'Captain — the liner has crossed the quarantine line!',
  picketHit: (v) => `The picket fired ${v.weapon === 'torpedoes' ? 'a torpedo' : 'her beams'} at the ${v.target}: ${v.damage} points of hull damage.`,
  picketHitDeflected: (v) => `The picket fired on the ${v.target}; our screen took most of it (${v.damage} hull damage).`,
  picketMissed: (v) => `The picket fired on the ${v.target} and missed.`,
  diagnosis_fever: () => "Diagnosis from my team: Ilun fever. It's a virus, and it is contagious. We're drawing blood for an antiviral now.",
  diagnosis_toxin: () => "Diagnosis from my team: cadmium poisoning. It's coming from their water. It isn't a disease. Treatment's started; someone needs to fix that recycler.",
  diagnosis_panic: () => "Diagnosis from my team: an allergic reaction to the incense they burn in their rites. They're frightened, not dying. Antihistamines are going round, and it isn't contagious.",
  halcyonOutbreak: () => "Captain… we have fever cases on deck four. It's Ilun fever. The Halcyon has an outbreak.",

  // ---- Captain Sabeth
  sabethFirst: (v) => `"Halcyon! Thank you for answering. I'm Juno Sabeth, master of the Mercy of Ilun. I have ${v.souls} souls aboard and ${v.sick} of them are burning with fever. My doctor has nothing left to give them. Tallis Gate says we'll be fired on if we cross the line. If no one helps us, I'll run it in ${v.runIn} minutes or so. I'd rather be shot at than watch them die."`,
  sabethGreetAgain: (v) => `"Sabeth here. ${v.sick} sick now. Go ahead, Halcyon."`,
  sabethEnd: () => '"Mercy of Ilun out."',
  sabethKin: () => '"…There\'s something you should know. One of my pilgrims is Teodric Marr, from Tallis Gate itself. He\'s the Warden-Commander\'s brother. He came home with us to see her. She doesn\'t know he\'s aboard."',
  sabethNoKin: (v) => `"${v.souls} of us: pilgrims from Ilun and Corvel and my crew of twelve. Nobody from Tallis Gate. ${v.sick} are sick."`,
  sabethFirstCases_fever: () => '"It started with eight pilgrims who boarded at Corvel Station. Corvel had a fever advisory up; we didn\'t think it mattered. Then it spread."',
  sabethFirstCases_toxin: () => '"My galley crew went down first, then the passengers who eat early. We had our water recycler patched at Corvel by a cheap yard. Is that…?"',
  sabethFirstCases_panic: () => '"It started on the observation deck during the incense rites. People couldn\'t breathe, came out in welts, collapsed. Nobody who skipped the rites is sick. Does that mean something?"',
  sabethAcceptsTow: () => '"An Agency hospital? If you can get us there, we\'ll go. Anything is better than sitting here waiting to be shot. Tell me what you need from us."',
  sabethTowAccepted: () => '"We feel your beam, Halcyon. Take us out of here."',
  sabethTowProtest: () => '"Halcyon, what are you doing? You\'ve got a tractor on my ship! Tell me where you\'re taking us."',
  sabethAgreesHold: (v) => (n(v, 'running') ? '"…All right. All right. We\'re stopping. Don\'t make me regret it, Halcyon."' : `"We'll hold for now — another ${v.minutes} minutes. Give me something real by then."`),
  sabethNeedsReason: (v) => `"Wait for what? I've got ${v.sick} sick${n(v, 'dead') ? ` and ${v.dead} dead` : ''}. Give me a reason to wait: medicine, a doctor, a way in. Then I'll wait."`,
  sabethThreatened: () => '"You\'ll threaten us too? We\'re a pilgrim ship, Halcyon, not pirates."',
  sabethReassured: (v) => pick(v, ['"Thank you. Truly. But please — hurry."', `"I'm holding on to that. I can give you maybe ${v.runIn} more minutes."`, '"My people can hear the Agency is here. It helps. It won\'t cure them."']),
  sabethUpdate: (v) => (n(v, 'running') === 1 ? `"We're running the line. ${v.sick} sick, ${v.dead} dead. Get out of our way or help us."` : `"${v.sick} sick${n(v, 'dead') ? `, ${v.dead} dead` : ''}. I can hold maybe ${v.runIn} more minutes."`),
  sabethUnclear: () => '"Say again, Halcyon? We\'re all very tired over here."',
  sabethWarning: (v) => `"Halcyon, I can't keep waiting. ${v.sick} sick${n(v, 'dead') ? `, ${v.dead} dead` : ''}. In two minutes I'm running the line, whatever that picket does."`,
  sabethRuns: () => '"That\'s it. We\'re going in. All engines ahead — and may the Warden have a heart."',
  sabethStandsDown: () => '"The antiviral\'s working — I can see it on their faces. We\'re stopping. Thank you, Halcyon."',
  sabethDocking: () => '"Tallis Gate has cleared us to dock! Taking her in now. Thank you, Halcyon."',
  sabethWordBroken: () => '"You gave us your word, Halcyon."',

  // ---- Warden-Commander Marr
  marrFirst: (v) =>
    `"Agency vessel, this is Warden-Commander Isolde Marr of the colony picket Thornwake. Eleven years ago a sick ship docked here and forty of our people died. The council has closed the gate. ${v.temp === 'strict' ? 'My orders are clear and I will follow them.' : v.temp === 'fearful' ? 'I will not let that happen again. I cannot.' : 'I do not want to fire on that liner, Captain. Do not make me.'} Any ship that crosses the line will be fired on. That includes yours."`,
  marrGreetAgain: (v) => (n(v, 'lifted') ? '"Marr here. The gate is open to her."' : '"Marr. Go ahead, Captain. My line has not moved."'),
  marrEnd: () => '"Thornwake out."',
  marrInCombat: () => '"You fired on a colony ship. We are done talking."',
  marrLiftedAlready: () => '"The line is lifted, Captain. She may dock."',
  marrCuredAccepts: () => '"Your doctor has treated them. When the course is complete she can come in, under supervision. Thank you, Captain."',
  marrExplains: () => '"Forty people died here eleven years ago. My mother was one of them. We have one hospital and two doctors. If an epidemic gets in, we lose the colony. That is why the gate is closed."',
  marrUnclear: () => '"Be plain with me, Captain. What are you asking?"',
  marrDosesWhatIsIt: () => '"We keep an antiviral stockpile from the last outbreak. But I won\'t send medicine blind. Tell me what they actually have."',
  marrDosesNotNeeded: () => '"Our stockpile is for fevers. From what you say they don\'t need it."',
  marrDosesComing: () => '"The doses are already on their way."',
  marrSendsDoses: () => '"Ilun fever… that\'s what our stockpile was made for. I\'m sending a shuttle with doses, about two minutes out. My guns stay quiet while it flies. Keep them on their side of the line."',
  marrDosesRefused: () => '"That stockpile is the colony\'s only protection, Captain. I won\'t hand it over to a stranger. Give me a reason to trust you."',
  marrDosesArrive: () => '"Our shuttle has delivered the doses to the Mercy of Ilun. That is the best I can do for them."',
  marrKinLifts: () => '"Teodric? He\'s… on that ship? …Gods. All right. Open the outer isolation ring: she can dock there. Get him home, Captain."',
  marrKinHolds: () => '"…My brother is on that ship. I won\'t let her in, I can\'t. But I won\'t fire on him either. My guns are cold."',
  marrKinWavers: () => '"You\'re lying. You must be lying. …Teodric? I — my orders don\'t change because of who is aboard. Give me a minute."',
  marrNoEvidence: () => '"You don\'t know that, Captain. You haven\'t even examined them. Wishing is not evidence."',
  marrFeverConfirmed: (v) => (n(v, 'cure') ? '"Your own doctor says it is contagious. Treat them, then we\'ll talk. Until then, the line holds."' : '"Then it is exactly what I feared. The line holds."'),
  marrWaitsForCure: () => '"An antiviral? …Then I will hold my fire while your doctor works. If she crosses before they are treated, I will not be able to help it."',
  marrWantsData: () => '"Words are not proof, Captain. Send me your medical data: scans, blood work, all of it. Then I will decide."',
  marrFixWaterFirst: () => '"Poisoned water? …Then fix their water first. When your engineers tell me it is done, she can come in. I will hold my fire until then."',
  marrLifts_toxin: () => '"Cadmium in their water. Not a disease. …I\'ve read your data. I\'m lifting the line. She can dock; our hospital will take the worst of them. Thank you, Captain."',
  marrLifts_panic: () => '"An allergy. To incense. …All this over incense. I\'m lifting the line; she can dock. And Captain, thank you for checking."',
  marrLiftsAfterRepair: () => '"Your engineers say the water is clean. Then I have no reason to keep her out. The line is lifted; she can dock."',
  marrRefusesLift: (v) => (v.temp === 'humane' ? '"Give me a reason I can tell the council, Captain, and I will. Until then I can\'t."' : '"Not on your word alone, Captain. Show me what they have."'),
  marrAgreesHoldFire: () => '"…Very well. I will hold my fire while you are in the way. Do not make me regret it."',
  marrRefusesHoldFire: (v) => (v.temp === 'strict' ? '"My orders do not change because you ask politely."' : '"Not yet, Captain. Give me a reason."'),
  marrThreatened_strict: () => '"You threaten a colony ship? Weapons on the Agency vessel. Your move, Captain."',
  marrThreatened_fearful: () => '"…Don\'t. Please. I — I will hold my fire. Just keep that ship on its side of the line."',
  marrThreatened_humane: () => '"Threats won\'t change what happened here, Captain."',
  marrHumanitarian_strict: () => '"Compassion is easy from orbit, Captain. The council gave me an order."',
  marrHumanitarian_fearful: () => '"I know they\'re suffering. I know. I watched my own people suffer. I can\'t let it in again."',
  marrHumanitarian_humane: () => '"I hear you, Captain. Believe me, I do. Bring me something I can take to the council."',
  marrWarnsLiner: () => '"Mercy of Ilun, you have crossed the quarantine line. Turn back now or I will fire. Weapons locked."',
  marrWarningShot: () => '"That was across your bow, Mercy of Ilun. The next one will not be."',
  marrWontFireThroughYou: () => '"You\'ve put an Agency ship between my guns and that liner. I will not fire through you, Captain. Holding fire."',
  marrHoldsFire: () => '"The liner is inside my line, and I gave my word I would hold fire. I am keeping it."',
  marrStandsDown: () => '"She\'s back outside the line. Releasing the lock."',
  marrReturnsFire: () => '"You fired on a colony ship! All weapons, return fire!"',
  marrWithdraws: () => '"Thornwake is breaking off. You will answer for this to Tallis Gate, Captain."',
  marrWordBroken: () => '"You gave me your word, Captain."',
};

export const templates: Record<string, TemplateFn> = { ...base, ...T };
