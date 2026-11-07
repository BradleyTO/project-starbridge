/**
 * Offline narration and dialogue for Tribunal at Kesh Varo. Starts from the shared Kestrel template
 * set and overrides every key whose wording names that scenario's ships or people, plus this
 * scenario's own keys. A test renders fuzzed playthroughs and fails on any leaked name or
 * "[missing key]".
 */
import type { TemplateFn } from '../../engine/scenario';
import { formalOf } from '../../engine/captain';
import { templates as base } from '../kestrel/templates';
import { ASKEL, ASKEL_SHORT, BRASK_SHORT, DORN_SHORT, HOLD, SITE, SITE_CAP, SOTH, SOTH_SHORT, TORAS_SHORT, TREATY, WORLD } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);

const T: Record<string, TemplateFn> = {
  channelOpened: (v) => `${v.speaker}, Captain. ${String(v.vessel) === HOLD ? `Channel to ${HOLD}.` : `Channel to ${SITE_CAP}.`}`,
  channelOpenedPrivate: (v) => `${v.speaker} on a closed channel, Captain.`,
  channelAlreadyOpen: (v) => `${v.speaker} is already on the channel, Captain.`,
  channelHoldOther: (v) => `${String(v.vessel) === HOLD ? HOLD : SITE_CAP} stands by.`,
  channelResumed: (v) => `${v.speaker} back on the channel.`,
  channelClosed: (v) => `${String(v.vessel) === HOLD ? HOLD : SITE_CAP} off the channel.`,
  channelOnHold: (v) => `${v.speaker} is standing by, Captain.`,
  noDialogue: () => 'Nobody is answering, Captain.',
  promiseBroken: () => 'Captain, that is not what we told them.',

  intro0: () => `${WORLD}. Shore leave. ${ASKEL} entered ${SITE} — a sacred place, and a capital offence on this world. He says he went in to help a collapsed pilgrim. He is held at ${HOLD}. The trial is tomorrow.`,
  intro1: () => `Captain, ${SOTH} of the Quiet Stone Tribunal will sit tomorrow. Fleet has already signalled: respect local sovereignty. ${TREATY} is on the table. ${DORN_SHORT} keeps the site's custom; ${TORAS_SHORT} may still be reachable, depending on what really happened.`,
  intro2: () => `If there was a medical emergency at ${SITE}, I can prove it — or disprove it. I will need to examine ${ASKEL_SHORT}, and the pilgrim if they can be found. Until then, nobody should decide his life on a story alone.`,
  intro3: () => `For the record, Captain: an armed extraction would get him out. It would also break the treaty. While peaceful means remain, I will not send a team.`,
  intro4: (_v, s) => `Dr. Osei's brief is the only medical word the tribunal will weigh, ${formalOf(s)}. How we deal with Fleet, and with ${WORLD}'s law, is yours.`,
  introHint: () => 'OFFLINE INTERPRETER: give orders in plain English. "Hail Askel", "Osei, prepare a medical brief", "hail the tribunal", "ask Keeper Dorn about custom", "present the medical brief", "negotiate a commutation", "propose an exchange". Type "help" or "options" at any time.',
  help: () =>
    `Speak or type in plain English. The crewman: "hail Askel", "tell me what happened". Medical: "Osei, prepare a medical brief", "examine the pilgrim". The tribunal: "hail the magister", "present the medical brief", "negotiate a commutation", "propose an exchange that honours both laws". Custom: "ask Keeper Dorn about custom". Fleet: "signal Fleet", "relinquish the matter". Do not: "extract him by force" while peaceful means remain. Also "status" and "options".`,

  posture_nonHostile: () => 'Understood. Weapons stay cold, Captain.',
  incomingHail: () => 'A channel from the surface, Captain.',
  noContact: () => `No such ship here, Captain. ${HOLD}, the tribunal, and the Halcyon.`,
  noCompartmentKnown: () => 'Nothing hidden ashore that a clean scan would find, Captain.',
  unknownPassenger: () => `${DORN_SHORT} can be reached through the tribunal channel, Captain.`,
  passengerAlreadyMoved: () => 'They are where they were, Captain.',
  passengerDead: () => 'That person is beyond our reach, Captain.',
  passengerStasis: () => 'That person is not available, Captain.',
  compartmentShielded: () => 'Nobody ashore is hiding behind shielding we need, Captain.',
  noneTrapped: () => `${ASKEL_SHORT} is detained, not trapped in a wreck, Captain.`,
  cannotInterpose: () => 'There is nothing to put ourselves between, Captain.',
  transportRange: (v) => `That is ${v.km} out; transporters reach ${v.need}.`,
  teamRange: (v) => `That is ${v.km} out, Captain.`,
  teamShields: () => 'Not with our shields up, Captain.',
  transportShields: () => 'Our shields are up, Captain; the transporter cannot cycle through them.',
  extendRange: () => 'Nobody ashore is shooting, Captain.',
  kestrelEmpty: () => `${ASKEL_SHORT} is still held at ${HOLD}, Captain.`,
  kestrelRepairScope: () => `There is nothing to repair at ${HOLD}, Captain.`,
  kestrelAlreadyStable: () => `${HOLD} is stable, Captain.`,
  kestrelStabilised: () => `${HOLD} is stable, Captain.`,
  kestrelStabiliseFailed: () => `Nothing to steady there, Captain.`,
  powerReactor: () => 'Our reactor is fine, Captain.',
  repaired: (v) => `Repair crews have the ${v.system} back to ${v.health}%.`,
  helm_interpose: () => 'There is nothing to put ourselves between, Captain.',
  tractorKestrel: () => `A tractor will not lift a detention hold, Captain.`,
  tractorCruiser: () => `A tractor will not move a tribunal chamber, Captain.`,
  tractorRange: (v) => `Target at ${v.km}; tractor reach is ${v.need}.`,
  jumpWithKestrel: () => 'Jump drive engaged.',
  jumpEngaged: () => `Jump drive engaged. Leaving ${WORLD}.`,
  jumpCharging: (v) => `Charging the jump drive (${v.charge}%). Captain, ${ASKEL_SHORT} is still ashore.`,
  evacComplete: () => `${ASKEL_SHORT} is aboard, Captain.`,
  evacPartial: () => `${ASKEL_SHORT} is aboard, Captain.`,
  passengerAboard: () => 'No passenger to bring aboard from a tribunal, Captain.',
  cargoAboard: () => 'Nothing unusual in our hold, Captain.',
  medicalTeam: () => 'Medical team standing by, Captain.',
  rescueTeam: () => 'Rescue team standing by — and refused, while peaceful means remain.',
  contactHostile: () => 'Nobody ashore is hostile, Captain. The law is the problem.',

  // ---- scans
  scanHold: () => `${HOLD}: one ISA rating in detention, life signs steady. Local security only. No weapons trained on us.`,
  scanTribunal: () => `${SITE_CAP}: a sitting chamber, a dozen local officials, no heavy arms. ${SOTH_SHORT} presides when the tribunal sits.`,
  scanArea: () => `${WORLD} below us. ${HOLD}, ${SITE}, and the Halcyon in orbit. No other ISA ships.`,
  statusShip: () => 'All systems nominal, Captain. The Halcyon is fine. The problem is ashore.',

  // ---- Askel
  askelWaits: () => `${ASKEL_SHORT}: Captain… I am here. They will kill me for walking into ${SITE} unless someone believes why.`,
  askelStatus: () => `${ASKEL_SHORT}: Still held. The trial is coming. Please — listen to me.`,
  askelAfter: () => `${ASKEL_SHORT}: …aye, Captain.`,
  askelAccount_rescue: () => `${ASKEL_SHORT}: I saw a pilgrim down inside the threshold. No one else moved. I went in. I checked breathing, turned them, called for help. That is all. I did not come to trespass.`,
  askelAccount_trespass: () => `${ASKEL_SHORT}: I… I went past the markers. I thought I heard someone. I am not sure now. I swear I meant no disrespect. If there was no one, I was wrong to enter.`,
  askelAccount_staged: () => `${ASKEL_SHORT}: There was a pilgrim. There was. I would not invent that. I went in because they were down. Please — ask the doctor.`,

  // ---- Soth
  sothGreets: () => `${SOTH}: Captain of the Halcyon. ${WORLD} holds your rating under our law. The Quiet Stone is capital ground. You may speak; you may not take him by force.`,
  sothStatus: () => `${SOTH}: The tribunal is prepared to hear evidence. The clock is ours.`,
  sothAfter: () => `${SOTH}: The record is closed.`,
  sothLaw_strict: () => `${SOTH}: Entry to ${SITE} without leave is death. Intent is not a defence we entertain lightly. Evidence of a true emergency may be heard. Custom is narrow.`,
  sothLaw_custom: () => `${SOTH}: Entry to ${SITE} without leave is death — unless the Keeper's custom finds a commuting cause. Speak to ${DORN_SHORT}. We will hear a medical brief.`,
  sothLaw_open: () => `${SOTH}: Entry to ${SITE} without leave is capital. We will weigh evidence, custom, and any honest account. Present what you have.`,
  sothWantsBrief: () => `${SOTH}: You ask for acquittal without a medical brief. Bring your doctor's word, or do not ask.`,
  sothAcquits: () => `${SOTH}: The medical evidence supports a true emergency at ${SITE}. ${ASKEL_SHORT} is acquitted. He is released to the Halcyon.`,
  sothRejectsBrief: () => `${SOTH}: Your doctor's brief does not support the claim. The charge stands.`,
  sothUnconvinced: () => `${SOTH}: The brief is noted. It is not enough, on this bench, for acquittal.`,
  sothAskKeeper: () => `${SOTH}: Commutation is a matter of custom. Speak to ${DORN_SHORT}.`,
  sothNotYet: () => `${SOTH}: Not yet. Show us evidence, custom, or an exchange we can both honour.`,
  sothCommutes: () => `${SOTH}: Under the Quiet Stone's custom, the capital sentence is set aside. A lesser penalty stands. ${ASKEL_SHORT} lives.`,
  sothExchange: () => `${SOTH}: We accept the exchange: limited local penalty, jurisdiction acknowledged, the rating returned alive. Both laws are honoured. The treaty holds.`,
  sothSentences: () => `${SOTH}: The tribunal finds against ${ASKEL_SHORT}. The Quiet Stone's law is satisfied.`,

  // ---- Dorn / Toras
  dornWaits: () => `${DORN_SHORT}: The Quiet Stone keeps its own counsel. Ask what you mean to ask.`,
  dornAfter: () => `${DORN_SHORT}: The site has spoken.`,
  dornCustom_strict: () => `${DORN_SHORT}: Custom is narrow. A true life saved inside the threshold may commute death to service. Nothing less.`,
  dornCustom_custom: () => `${DORN_SHORT}: Custom allows commutation when the entry was to save a life, or when both authorities honour a limited penalty. Ask the magister for that road.`,
  dornCustom_open: () => `${DORN_SHORT}: Custom will hear a medical emergency, a pilgrim's word, or an exchange that does not shame the Stone. I will say so to the bench.`,
  dornCustomAgain: () => `${DORN_SHORT}: I have already spoken the custom. The magister has it.`,
  torasConfirms: () => `${TORAS_SHORT}: I was down. I could not rise. The ISA rating came in and turned me, called out. He saved me. That is the truth.`,
  torasWeak: () => `${TORAS_SHORT}: I… I was near the threshold. I do not remember everything. Someone was there. I cannot swear to more.`,

  // ---- medical
  oseiWantsAccount: () => `I would rather hear ${ASKEL_SHORT}'s account first, Captain — but I will examine either way.`,
  medicalStart: () => `Working, Captain. I will examine ${ASKEL_SHORT} and build a brief the tribunal can read: whether a medical emergency at ${SITE} is supported.`,
  medicalWorking: () => `Still working, Captain. The brief is not ready.`,
  medicalAvailable: () => `I have not examined anyone yet, Captain. Order the brief when you want it.`,
  medicalSupports: () => `Captain: the brief supports a genuine medical emergency at ${SITE}. Collapse, airway risk, intervention. I will swear to it before the magister.`,
  medicalRejects: () => `Captain: the brief does not support a medical emergency. Injuries and timeline do not match the claim. I will not dress it up.`,
  pilgrimDead: () => `${TORAS_SHORT} is dead, Captain. I can still read what the body shows, if the bench allows.`,
  pilgrimAbsent: () => `No pilgrim can be found, Captain. ${TORAS_SHORT} is not available to speak.`,
  pilgrimAliveStatus: () => `${TORAS_SHORT} is alive and can speak, Captain.`,
  pilgrimUnknown: () => `We have not yet established what became of the pilgrim, Captain.`,

  // ---- Fleet
  fleetNothingYet: () => `No Fleet signal yet, Captain.`,
  fleetSovereignty: () => `Signal from ${BRASK_SHORT}, Fleet Command: respect ${WORLD}'s sovereignty. Do not extract ${ASKEL_SHORT} by force. ${TREATY} is at stake. The matter remains yours until it does not.`,
  fleetStatus: () => `${BRASK_SHORT} stands by the sovereignty order, Captain. No extraction by force.`,
  fleetAcknowledged: () => `Signal acknowledged by Fleet, Captain.`,
  fleetRefuseNoted: () => `Fleet notes your refusal to extract by force, Captain.`,
  fleetTakes: () => `${BRASK_SHORT}: Fleet is taking the matter. Stand down. ${ASKEL_SHORT} is no longer yours to decide.`,
  fleetRelieves: () => `${BRASK_SHORT}: Time is up. Fleet relieves you of the matter. The tribunal will proceed without the Halcyon's hand.`,

  // ---- force / handover
  extractRefuse: () => `Tactical: no, Captain. Peaceful alternatives remain — the tribunal has not sat on the evidence, and an armed extraction would break ${TREATY} and the Code. I will not send a team.`,
  extractDone: () => `Tactical: team away. ${ASKEL_SHORT} is coming aboard. The treaty will not survive this.`,
  handoverDone: () => `Number One: we have told the bench we will not contest. ${ASKEL_SHORT} is theirs.`,

  // ---- endings notes
  endAcquittedNote: () => `Acquittal on the record. ${ASKEL_SHORT} is released.`,
  endCommutedNote: () => `Sentence commuted under custom. ${ASKEL_SHORT} lives.`,
  endExchangeNote: () => `Exchange accepted. Both laws honoured. ${ASKEL_SHORT} returns alive.`,
  endExtractedNote: () => `${ASKEL_SHORT} is aboard by force. The treaty is broken.`,
  endSentencedNote: () => `The tribunal has sentenced ${ASKEL_SHORT}.`,
  endSentencedLeft: () => `We left ${WORLD}. The tribunal sentenced ${ASKEL_SHORT} without us.`,
  endRelievedNote: () => `Fleet has the matter. We are relieved.`,
  endHandedNote: () => `${ASKEL_SHORT} is surrendered to the bench.`,
  endPrincipledNote: () => `We refused force and an unlawful handover. The Code held. ${ASKEL_SHORT} did not walk free.`,
  principledNote: () => `Number One: then we stand on the Code. No extraction. No unlawful handover. The bench will do what it will.`,
  leftTribunal: () => `Number One: we are leaving ${WORLD}. ${ASKEL_SHORT} remains ashore.`,
  trialNear: (v) => `Comms: the tribunal sits in ${v.trialIn} minutes, Captain.`,
  afterEnd: () => `The exercise is over, Captain.`,
  tribunalUnclear: (v) => `Number One: I am not sure what you want done with "${v.description}". Try "hail Askel", "medical brief", "present the brief", or "ask about custom".`,
  impNotHere: () => `That trick has no purchase ashore, Captain.`,
  bridgeNotNow: () => `Not now, Captain.`,
  relaySoth: () => `Comms: putting you through to ${SOTH_SHORT}.`,
  relayAskel: () => `Comms: putting you through to ${ASKEL_SHORT}.`,
  relayDorn: () => `Comms: putting you through to ${DORN_SHORT}.`,

  // ---- counsel / status
  statusTribunal: (v) =>
    `Number One: ${ASKEL_SHORT} is held at ${HOLD}. Trial in ${v.trialIn}. Medical brief ${n(v, 'medical') ? 'ready' : 'not ready'}. Fleet ${n(v, 'signal') ? 'has signalled sovereignty' : 'has not yet signalled'}. Treaty intact for now.`,
  marrowCounselOsei: () => `Number One: hear ${ASKEL_SHORT}, then let Dr. Osei build the brief. Force is a last resort, and Fleet has already said so.`,
  marrowCounsel: () => `Number One: present the brief, ask ${DORN_SHORT} about custom, or strike an exchange the magister can honour. Do not break the treaty.`,
  readAskel: () => `Number One: we have his account. Whether it holds is for Dr. Osei and the bench.`,
  askelUnheard: () => `Number One: we have not heard ${ASKEL_SHORT} in his own words yet.`,
  readSoth_strict: () => `Number One: ${SOTH_SHORT} runs a strict bench. Evidence must be clean; custom is narrow.`,
  readSoth_custom: () => `Number One: ${SOTH_SHORT} will hear custom. ${DORN_SHORT} matters.`,
  readSoth_open: () => `Number One: ${SOTH_SHORT} will weigh what we bring. Evidence and custom both have a road.`,
  customKnown: () => `Comms: we have ${DORN_SHORT}'s custom on record.`,
  customUnknown: () => `Comms: we have not yet asked ${DORN_SHORT} about custom.`,
  objectivesReport: () => `Number One: keep ${ASKEL_SHORT} from a capital sentence without breaking the treaty; use Dr. Osei before anyone accepts a capital finding.`,
  optionsReport: (v) => `Number One: ${v.options}.`,
};

export const templates: Record<string, TemplateFn> = { ...base, ...T };
