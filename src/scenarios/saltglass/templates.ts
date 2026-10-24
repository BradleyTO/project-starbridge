/**
 * Offline narration and dialogue for The Saltglass Accord. Starts from the shared Kestrel template set
 * (generic engine keys: helm, comms, bridge, validation) and overrides every key whose wording
 * names that scenario's ships or people, plus this scenario's own keys.
 * A test renders fuzzed playthroughs and fails on any leaked name from another simulation or "[missing key]".
 *
 * Speaker Edda Rhune speaks in short, plain sentences and asks questions back; Holder Caius Tarvo
 * speaks slowly and formally, in long sentences, and calls the captain "Captain of the Halcyon".
 */
import type { TemplateFn } from '../../engine/scenario';
import { templates as base } from '../kestrel/templates';
import { CLAN_NAME, DELEGATE_SHORT, ELDER_NAME, ELDER_PRONOUN, SHIP_NAME, interestText, saltglass } from './setup';
import type { Clan, Interest } from './setup';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
const isR = (v: V) => v.clan === CLAN_NAME.rhune;
const clanOf = (v: V): Clan => (isR(v) ? 'rhune' : 'tarvo');
/** Pick the line by delegate: Rhune's plain voice or Tarvo's formal one. */
const by = (v: V, rhune: string, tarvo: string) => (isR(v) ? rhune : tarvo);
const mins = (x: number) => (x === 1 ? 'a minute' : `${x} minutes`);
const NEED: Record<Interest, string> = { water: 'the Brine Springs', burial: 'the Barrow Ice', succession: "the Founders' Seat" };

const T: Record<string, TemplateFn> = {
  // ---- channels: the wardroom table and the side room
  channelOpened: (v) => `${v.speaker} has the floor, Captain. Both delegations are at the table.`,
  channelOpenedPrivate: (v) => `${v.speaker} is in the side room, Captain. Just the two of you; the other delegation can't hear.`,
  channelAlreadyOpen: (v) => `${v.speaker} already has the floor, Captain.`,
  channelHoldOther: (v) => `${v.vessel} yields the floor.`,
  channelResumed: (v) => `${v.speaker} has the floor again.`,
  channelClosed: (v) => `${v.vessel} sits back from the table.`,
  channelOnHold: (v) => `${v.speaker} is waiting, Captain.`,
  noDialogue: () => 'Neither delegate is at the table to answer, Captain.',
  promiseBroken: () => 'Captain, that breaks what we told them.',

  // ---- intro
  intro0: () => 'The ISV Halcyon holds orbit over Saltglass, a small white moon of salt-crusted ice at the edge of the ISA’s settled lanes. Two clan ships hold orbit beside her. In the Halcyon’s wardroom, two delegations sit at opposite ends of one table.',
  intro1: () => "Captain, the ISA has been asked to mediate, not to rule. Clan Rhune and Clan Tarvo both claim Saltglass, and both have said so for forty years. We have no orders on who is right, and no authority to decide it. We're here to help them find terms they'll both keep.",
  intro2: (_v, s) => `Two ships alongside: the ${SHIP_NAME.rhune}, a Rhune ice hauler, and the ${SHIP_NAME.tarvo}, a Tarvo transport. Unarmed, both of them. Nothing else in the sky.${saltglass(s).elderClan ? ` One of them is running its medical bay hard; I can't tell more from here.` : ''}`,
  intro3: () => 'Speaker Edda Rhune for Clan Rhune; Holder Caius Tarvo for Clan Tarvo. Each will speak if you give them the floor. If you want a word with one alone, the side room is next door.',
  intro4: () => "They've each made their claim, Captain: the whole moon, by right. Neither has said why it matters so much. Your table.",
  introHint: () => 'OFFLINE INTERPRETER: talk to the delegates in plain English. "Open a channel to Speaker Rhune" gives her the floor at the table, where both clans hear; "open a private channel to Holder Tarvo" takes him into the side room. Type "help" or "options" at any time.',
  help: () =>
    'Speak or type in plain English. At the table: "open a channel to Speaker Rhune" (or Holder Tarvo), then talk: "What does Saltglass mean to your clan?", "I hear you.", "Will you both agree to a standstill on the ice while we talk?", or propose terms. In private: "open a private channel to Holder Tarvo", then "What do you really need?", "May I raise that at the table?". Officers: "Marrow, have a quiet word with Speaker Rhune", "Marrow, ask Holder Tarvo if I may raise it at the table", "Szabo, how do they sound?", "Varga, survey the moon", "Doctor, can you help the elder?". Also: "take the delegates down to the ice", "close the channel", "status", "options".',

  // ---- shared engine keys, reworded for this scenario
  posture_nonHostile: () => 'Understood. Weapons stay cold, Captain. Nobody at this table is armed.',
  incomingHail: () => 'One of the delegations is asking for the floor, Captain.',
  noContact: () => 'No such ship out here, Captain. Just the two clan ships and the moon.',
  noCompartmentKnown: () => 'Nobody is hiding anything aboard, Captain. Not anything a scan would find.',
  unknownPassenger: () => 'There is no one by that description at the table, Captain.',
  passengerAlreadyMoved: () => 'There is no one by that description at the table, Captain.',
  passengerDead: () => 'There is no one by that description at the table, Captain.',
  passengerStasis: () => 'There is no one by that description at the table, Captain.',
  compartmentShielded: () => 'Nothing out here is shielded from our scans, Captain.',
  noneTrapped: () => 'No one is trapped, Captain.',
  cannotInterpose: () => 'There is nothing to put ourselves between, Captain. Not with the ship.',
  transportRange: (v) => `That ship is ${v.km} out; transporters reach ${v.need}.`,
  teamRange: (v) => `That ship is ${v.km} out, Captain.`,
  teamShields: () => 'Not with our shields up, Captain.',
  transportShields: () => 'Our shields are up, Captain; the transporter cannot cycle through them.',
  extendRange: () => 'There is nothing out here to shield, Captain.',
  kestrelEmpty: () => 'There is no one to bring across, Captain. The delegates are already aboard.',
  kestrelRepairScope: () => 'Both clan ships are sound, Captain. Nothing to repair.',
  kestrelAlreadyStable: () => 'Both clan ships are sound, Captain.',
  kestrelStabilised: () => 'Both clan ships are sound, Captain. Nothing to repair.',
  kestrelStabiliseFailed: () => 'Both clan ships are sound, Captain. Nothing to repair.',
  powerReactor: () => 'The reactor is fine, Captain.',
  repaired: (v) => `Repair crews have the ${v.system} back to ${v.health}%.`,
  helm_interpose: () => 'There is nothing to put ourselves between, Captain.',
  tractorKestrel: () => `Tractor beam on the ${SHIP_NAME.rhune}.`,
  tractorCruiser: () => `Tractor beam on the ${SHIP_NAME.tarvo}.`,
  tractorRange: (v) => `Target at ${v.km}; tractor reach is ${v.need}.`,
  jumpWithKestrel: () => 'Jump drive engaged.',
  jumpEngaged: () => 'Jump drive engaged. Leaving Saltglass.',
  jumpCharging: (v) => `Charging the jump drive (${v.charge}%).`,
  evacComplete: () => 'There is no one to bring across, Captain.',
  evacPartial: () => 'There is no one to bring across, Captain.',
  passengerAboard: () => 'There is no one by that description, Captain.',
  cargoAboard: () => 'That ship carries nothing of ours, Captain.',
  medicalTeam: () => 'Dr. Osei will not board a clan ship without the clan’s leave, Captain. Ask them.',
  trappedFreed: () => 'No one was trapped, Captain.',
  trappedNotYet: () => 'No one is trapped out here.',
  interposeTookHit: () => 'Nothing is shooting at us, Captain.',
  impTractorShield: () => 'Nothing out here is shooting, Captain.',
  impShieldExtend: () => 'Nothing out here is shooting, Captain.',
  kestrelBreachCrew: () => `The ${SHIP_NAME.rhune} breaks up.`,
  kestrelBreachEmpty: () => `The ${SHIP_NAME.rhune} breaks up.`,
  reinforcementsArrive: () => 'No one else is coming, Captain.',
  reinforcementsHoldOff: () => 'No one else is coming, Captain.',
  reinforcementsDetected: () => 'No one else is coming, Captain.',
  scanKestrelDetail: () => `The ${SHIP_NAME.rhune}: a Rhune ice hauler, unarmed.`,
  scanKestrelBasic: (v) => `The ${SHIP_NAME.rhune}, at ${v.km}.`,
  scanCruiserBasic: (v) => `The ${SHIP_NAME.tarvo}, at ${v.km}.`,
  scanCruiserDetail: () => `The ${SHIP_NAME.tarvo}: a Tarvo transport, unarmed.`,
  areaSweep: () => 'Long-range sweep: the two clan ships, the moon, and nothing else.',
  statusReport: (v) => `Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}.`,
  ardenArms: () => 'The clan ships have no weapons, Captain.',
  ardenArmsAgainstHalcyon: () => 'The clan ships have no weapons, Captain.',
  impPlasmaVent: () => 'Venting drive plasma at a peace table, Captain? No.',
  impSensorGhost: () => 'Ghost contacts would only frighten them, Captain.',
  impEjectCore: () => 'There is no reason to touch the core, Captain.',
  impEjectCoreFailed: () => 'There is no reason to touch the core, Captain.',
  contactHostile: () => 'Nobody out here is hostile, Captain. Angry, but not hostile.',
  improviseUnclear: () => 'Understood, Captain.',
  refuseCivilian: () => "Captain, those are unarmed clan ships, and their delegates are sitting in our wardroom. I won't fire on them.",
  refuseFriendly: () => "Captain, those are unarmed clan ships. I won't fire on them.",
  cededWithPassenger: () => 'There is no one here for us to hand over, Captain.',
  adviseBreach: () => 'Captain, the delegates are waiting.',
  adviseShields: () => 'Captain, the delegates are waiting.',
  adviseCompartment: () => 'Captain, the delegates are waiting.',
  adviseScan: () => 'Captain, Lieutenant Varga has not surveyed the moon yet. Neither clan has a map they both trust.',
  adviseOptions: () => 'Captain, the delegates are waiting. Say "options" if you want my read.',
  passengerWakesOnKestrel: () => 'Someone at the table clears their throat.',
  systemDamaged: (v) => `Damage to the ${v.system}.`,
  systemDestroyed: (v) => `We've lost the ${v.system}!`,
  bridgeSurveyBusy: () => 'Varga can survey the moon if you ask her, Captain.',
  bridgeNotNow: () => 'Not now, Captain. The table is waiting.',

  // ---- the delegates
  opens: (v) =>
    by(
      v,
      n(v, 'hard') ? '"Captain. Clan Rhune has cut ice on Saltglass since before the Tarvos had ships. The moon is ours. I am here because you asked. Ask what you want to ask."' : '"Captain. Thank you for the table. Clan Rhune claims Saltglass, as you know. I am listening. I hope the Holder is."',
      n(v, 'hard') ? '"Captain of the Halcyon. Clan Tarvo has held Saltglass in its name for forty years, and in its heart for longer than that. We have not come to give it away. Say what the ISA has come to say."' : '"Captain of the Halcyon. Clan Tarvo thanks the ISA for its table. Our claim to Saltglass is old and it is just, and I will hear what is said against it with patience."',
    ),
  floor: (v) => by(v, n(v, 'tabled') ? '"I have said what we need, Captain. Go on."' : '"Captain."', n(v, 'tabled') ? '"The Holder has said what Clan Tarvo needs, Captain of the Halcyon. Go on."' : '"Captain of the Halcyon. The Holder is listening."'),
  privateOpenFirst: (v) => by(v, '"Just us, then. All right, Captain. What is it?"', '"A side room. The Holder understands. Speak freely, Captain of the Halcyon; nothing said here leaves it unless I say so."'),
  privateOpen: (v) => by(v, n(v, 'confided') ? '"Captain. About what I told you?"' : '"Captain."', n(v, 'confided') ? '"Captain of the Halcyon. You come about what I told you."' : '"Captain of the Halcyon."'),
  walkingGreet: (v) => by(v, '"I am leaving, Captain. Say it quickly."', '"The Holder is leaving the Halcyon, Captain. If you have something to say, say it now."'),
  afterTalks: (v) => by(v, '"It is done, Captain."', '"It is done, Captain of the Halcyon."'),
  acknowledged: (v) => by(v, '"…Thank you. Not many people bother to say it."', '"The Holder hears that, Captain of the Halcyon, and is grateful for it."'),
  restates: (v) => by(v, n(v, 'hard') ? '"Saltglass is ours, Captain. I have nothing to add to that."' : '"Clan Rhune claims Saltglass. You know that. What else do you want to ask me?"', n(v, 'hard') ? '"Clan Tarvo\'s claim stands, Captain of the Halcyon, as it has stood for forty years."' : '"Our claim is as I have stated it, Captain of the Halcyon. Ask, if there is something you want to know."'),
  repeatsNeed: (v) => by(v, `"You know what we need: ${NEED[v.interest as Interest]}. The rest can be talked about."`, `"Clan Tarvo has said what it needs, Captain of the Halcyon: ${NEED[v.interest as Interest]}. The rest is for discussion."`),
  statesClaim_water: (v) => by(v, '"Why? Because we need it. Saltglass is ice, Captain, and ice is what keeps a clan alive. That\'s all I\'ll say at this table."', '"Saltglass is a working moon, Captain of the Halcyon, and Clan Tarvo is a working clan. The Holder will say no more than that before the Rhune delegation."'),
  statesClaim_burial: (v) => by(v, '"Saltglass is not a quarry, Captain. Some places should not be cut. That\'s all I\'ll say here."', '"There are places on Saltglass that are not for cutting, Captain of the Halcyon. The Holder will not say more before the Rhune delegation."'),
  statesClaim_succession: (v) => by(v, '"We need it settled, Captain, and soon. Sooner than the Holder thinks. That\'s all I\'ll say at this table."', '"Clan Tarvo cannot wait forty more years for this, Captain of the Halcyon. It cannot wait one. The Holder will not say why before the Rhune delegation."'),
  privateHint_water: (v) => by(v, '"You want to know why it matters? Ask yourself what a clan drinks when its own ice runs out. That\'s more than I meant to say."', '"The Holder will say this much, Captain: a clan whose ice is cut out does not argue over moons for pride. That is more than the Holder meant to say."'),
  privateHint_burial: (v) => by(v, '"Some of us are already on Saltglass, Captain. We always will be. Leave it there for now."', '"Clan Tarvo has people on Saltglass, Captain of the Halcyon, who will never leave it. The Holder will leave it there for now."'),
  privateHint_succession: (v) => by(v, `"Ask your doctor what is happening aboard the ${SHIP_NAME.rhune}. No. Don't. I shouldn't have said that."`, `"The ${SHIP_NAME.tarvo} carries someone who matters more than this moon, Captain of the Halcyon. The Holder should not have said that."`),
  confides_water: (v) => `${by(v, '"All right. Between us, Captain.', '"Between us, then, Captain of the Halcyon.')} ${interestText(clanOf(v), 'water')} ${by(v, 'If the Tarvos knew how badly we need it, they would make us pay for every litre. Don\'t say it at the table."', 'If the Rhunes knew how close to dry we are, they would name their price. The Holder asks that it not be said at the table."')}`,
  confides_burial: (v) => `${by(v, '"All right. Between us, Captain.', '"Between us, then, Captain of the Halcyon.')} ${interestText(clanOf(v), 'burial')} ${by(v, 'It is not a thing we talk about with outsiders. Don\'t say it at the table."', 'It is not a thing Clan Tarvo speaks of before strangers. The Holder asks that it not be said at the table."')}`,
  confides_succession: (v) => {
    const c = clanOf(v);
    const p = ELDER_PRONOUN[c];
    return `${by(v, '"All right. Between us, Captain.', '"Between us, then, Captain of the Halcyon.')} ${ELDER_NAME[c]} is dying aboard the ${SHIP_NAME[c]}. We name a new head only at the Founders' Seat, while the old head lives to pass the name on. If ${p.sub} dies before the naming, the clan has no lawful head. ${by(v, 'If the Tarvos knew, they would wait us out. Don\'t say it at the table."', 'If the Rhunes knew, they would wait for the funeral. The Holder asks that it not be said at the table."')}`;
  },
  repeatsConfidence: (v) =>
    n(v, 'tabled')
      ? by(v, '"It\'s out now, Captain. Use it."', '"It is said now, Captain of the Halcyon. Make use of it."')
      : n(v, 'leave')
        ? by(v, '"You know what I told you. You have my leave to raise it."', '"You know what the Holder told you, Captain of the Halcyon. You have leave to raise it."')
        : by(v, '"You know what I told you. It stays here."', '"You know what the Holder told you, Captain of the Halcyon. It stays in this room."'),
  nothingToRaise: (v) => by(v, '"Raise what? I haven\'t told you anything."', '"The Holder has told you nothing to raise, Captain of the Halcyon."'),
  leaveGiven: (v) => by(v, '"…Yes. All right. Say it at the table. Better you than me."', '"…Very well. You have the Holder\'s leave to say it at the table, Captain of the Halcyon. Say it carefully."'),
  leaveAlready: (v) => by(v, '"I said yes, Captain."', '"You have the Holder\'s leave already, Captain of the Halcyon."'),
  leaveRefused: (v) => by(v, '"No. Not yet. I don\'t trust them with it. I\'m not sure I trust you with it."', '"No. Not yet, Captain of the Halcyon. The Holder is not ready to put that in Rhune hands."'),
  notAtTheTable: (v) => by(v, '"Not here, Captain."', '"Not at this table, Captain of the Halcyon."'),
  pressed: (v) => by(v, '"Give it up? We came here because the ISA said it would listen."', '"Clan Tarvo did not come to the ISA\'s table to be told to surrender its claim, Captain of the Halcyon."'),
  sidesThanks: (v) => by(v, '"…Well. Thank you, Captain."', '"The Holder is gratified, Captain of the Halcyon."'),
  sidesProtest: (v) => by(v, '"So that\'s the ISA\'s mediation. You\'ve already decided."', '"Then the ISA has chosen its side, Captain of the Halcyon, and Clan Tarvo is sitting at the wrong end of the table."'),
  betrayed: (v) => by(v, '"I told you that in confidence. In confidence, Captain. And you\'ve just said it to them."', '"The Holder told you that in a closed room, Captain of the Halcyon, and asked you to keep it there. Clan Tarvo will remember this."'),
  deflects_water: (v) => by(v, '"You\'re guessing, Captain. Don\'t guess about us at this table."', '"The Captain of the Halcyon is guessing. Clan Tarvo will not discuss its affairs on a guess."'),
  deflects_burial: (v) => by(v, '"You\'re guessing, Captain. Leave that alone."', '"That is not a thing to be guessed at in front of strangers, Captain of the Halcyon."'),
  deflects_succession: (v) => by(v, '"Who told you that? Nobody told you that. Leave it."', '"Clan Tarvo\'s household is not a matter for this table, Captain of the Halcyon."'),
  tables_water: (v) => `${by(v, '"…All right. I\'ll say it.', '"…Very well. The Holder will say it.')} ${interestText(clanOf(v), 'water')} ${by(v, 'That\'s it. That\'s all it is. Water."', 'That is all of it, before the Rhune delegation and before the ISA."')}`,
  tables_burial: (v) => `${by(v, '"…All right. I\'ll say it.', '"…Very well. The Holder will say it.')} ${interestText(clanOf(v), 'burial')} ${by(v, 'That\'s what Saltglass is to us."', 'That is what Saltglass is to Clan Tarvo."')}`,
  tables_succession: (v) => `${by(v, '"…All right. I\'ll say it.', '"…Very well. The Holder will say it.')} ${interestText(clanOf(v), 'succession')} ${by(v, 'That\'s why we can\'t wait."', 'That is why Clan Tarvo cannot wait."')}`,
  reciprocates_water: (v) => `${by(v, '"Then I\'ll say ours too.', '"Then the Holder will answer honesty with honesty.')} ${interestText(clanOf(v), 'water')}"`,
  reciprocates_burial: (v) => `${by(v, '"Then I\'ll say ours too.', '"Then the Holder will answer honesty with honesty.')} ${interestText(clanOf(v), 'burial')}"`,
  reciprocates_succession: (v) => `${by(v, '"Then I\'ll say ours too.', '"Then the Holder will answer honesty with honesty.')} ${interestText(clanOf(v), 'succession')}"`,
  impatient: (v) => by(v, '"Captain, we have been here a long time and heard nothing new."', '"The Holder\'s patience is not without end, Captain of the Halcyon."'),
  walkOut: (v) => by(v, `"That's enough. I'm going back to the ${SHIP_NAME.rhune}."`, `"Clan Tarvo has heard enough. The Holder is returning to the ${SHIP_NAME.tarvo}."`),
  comesBack: (v) => by(v, '"…All right. One more try, Captain."', '"…Very well. The Holder will sit down again, Captain of the Halcyon. Once more."'),
  keepsWalking: (v) => by(v, '"No, Captain."', '"No, Captain of the Halcyon."'),
  forceWalkOut: (v) => by(v, '"You put a beam on our ship. At a peace table. We\'re done."', '"The ISA has laid hands on a Tarvo ship while its Holder sat at the ISA\'s own table. Clan Tarvo is leaving."'),
  imposeBristle: (v) => by(v, '"Decide? You were asked to help, not to rule."', '"The ISA was asked to hold a table, Captain of the Halcyon, not to hand down judgments from the end of it."'),
  imposeSign: (v) => by(v, '"…We\'ll sign. You have the bigger ship. Don\'t mistake that for agreement."', '"Clan Tarvo will put its name to it, Captain of the Halcyon. Clan Tarvo will remember how it was asked."'),
  guaranteeReply: (v) => by(v, n(v, 'hard') ? '"The ISA\'s word? The ISA leaves, Captain. We stay."' : '"Can you promise that? Truly? I\'ll take it home and they\'ll ask me that."', n(v, 'hard') ? '"The ISA will be gone in a week, Captain of the Halcyon. Saltglass will still be here."' : '"The Holder notes the ISA\'s guarantee, Captain of the Halcyon, and will hold the ISA to it."'),
  leavePrivate: (v) => by(v, '"Leave me to what? There\'s only me in here."', '"The Holder is alone in this room already, Captain of the Halcyon."'),
  standstillYes: (v) => by(v, '"No one from Clan Rhune goes down while we talk. You have my word."', '"Clan Tarvo will set no foot on Saltglass while these talks go on. The Holder gives you that."'),
  standstillNo: (v) => by(v, '"While you talk, the Tarvos cut ice. No."', '"The Holder will not tie Clan Tarvo\'s hands while words are all the Rhunes have offered, Captain of the Halcyon."'),
  standstillAlready: (v) => by(v, '"I already said so, Captain."', '"The Holder has already given you that, Captain of the Halcyon."'),
  recallYes: (v) => by(v, '"…All right. I\'ll call them back. For you, Captain. Not for them."', '"…Very well. The Holder will call the hauler back. Let it be noted that Clan Tarvo did so."'),
  recallNo: (v) => by(v, '"No. They are going down. You can talk all you like."', '"No, Captain of the Halcyon. The hauler goes down. Clan Tarvo has waited forty years."'),
  landingProtest: (v) => by(v, `"Captain, they've sent a hauler down! While we sit here! Is that what this table is for?"`, `"Captain of the Halcyon, the Rhunes have put a ship on its way to Saltglass while their Speaker sits at your table. The Holder demands to know what the ISA means to do."`),
  elderUrgent: (v) => by(v, '"Captain, we need this settled. We do not have weeks. We may not have hours."', '"Captain of the Halcyon, Clan Tarvo does not have time to spend. The Holder cannot say more than that."'),
  noOneIll: (v) => by(v, '"No one here is sick, Captain."', '"No one of Clan Tarvo is ill, Captain of the Halcyon."'),
  notOurElder: (v) => by(v, '"Not one of ours, Captain."', '"Not one of Clan Tarvo\'s, Captain of the Halcyon."'),
  elderDenied: (v) => by(v, '"Our elder is resting. That\'s all."', '"The Holder\'s elder is resting, Captain of the Halcyon. That is a private matter."'),
  elderConsent: (v) => by(v, `"…Yes. Please. Send your doctor to the ${SHIP_NAME.rhune}."`, `"…Clan Tarvo accepts, Captain of the Halcyon. Your doctor may come aboard the ${SHIP_NAME.tarvo}."`),
  elderRefuse: (v) => by(v, '"No. Not one of your people, not yet."', '"Clan Tarvo does not open its sickrooms to outsiders, Captain of the Halcyon. Not yet."'),
  rejectUntabled: (v) => by(v, '"Terms for what? You don\'t know what we need yet. Nobody\'s asked."', '"Terms, Captain of the Halcyon, before anyone at this table has asked what Clan Tarvo needs?"'),
  rejectPartitionSuccession: (v) => by(v, '"A line won\'t help us. The Seat is in the middle, and we need it now."', '"A line on a map does not hold a naming, Captain of the Halcyon. Clan Tarvo needs the Seat, and needs it soon."'),
  partitionNoMap: (v) => by(v, '"Draw a line where? Neither of us has a map the other trusts."', '"A line drawn on whose map, Captain of the Halcyon? Clan Tarvo has its own and the Rhunes have theirs."'),
  notYet: (v) => by(v, '"Maybe. Not yet. I need to trust the people across the table first."', '"Perhaps, Captain of the Halcyon. Not yet. The Holder is not there yet."'),
  acceptPartition: (v) => by(v, '"South for us, the springs; north for them, their dead. Yes. Clan Rhune agrees."', '"The ridge for Clan Tarvo, untouched, and the flats for the Rhunes. Clan Tarvo agrees."'),
  rejectDeferNoRush: (v) => by(v, '"Put it off? We\'ve put it off for forty years."', '"Defer it, Captain of the Halcyon? Clan Tarvo has deferred for forty years."'),
  rejectDeferAll: (v) => by(v, '"We can\'t wait on everything. The naming can\'t wait."', '"Clan Tarvo cannot defer the naming, Captain of the Halcyon. Defer the rest if you must."'),
  rejectDeferTrust: (v) => by(v, '"And in a season they\'ll say the naming gave them the moon. No."', '"And when the season is out, Captain of the Halcyon, the Rhunes will say their naming made Saltglass theirs. No."'),
  acceptTimetable: (v) => by(v, '"The naming first, and the rest in a season. All right. We can live with that."', '"The naming at the Seat now, the rest by timetable. Clan Tarvo can live with that."'),
  rejectIgnored: (v) => by(v, `"And ${NEED[v.interest as Interest]}? You've left out the one thing we need."`, `"The Captain of the Halcyon has left out ${NEED[v.interest as Interest]}, which is the whole of what Clan Tarvo needs."`),
  acceptShared: (v) => by(v, '"…Yes. That gives us what we need, and I can see it gives them theirs. Clan Rhune agrees."', '"That gives Clan Tarvo what it needs, Captain of the Halcyon, and the Rhunes what they need. Clan Tarvo agrees."'),
  privateYes: (v) => by(v, '"That would do it for us. Say it at the table."', '"That would serve Clan Tarvo. Say it at the table, Captain of the Halcyon."'),
  privateNo: (v) => by(v, '"That doesn\'t give us anything, Captain."', '"That does nothing for Clan Tarvo, Captain of the Halcyon."'),

  // ---- the XO
  marrowCautionImpose: () => "Captain, a word. We weren't asked to rule, and we've no authority to. If we hand them a settlement, they'll sign it with this ship in the window and tear it up when we're gone.",
  marrowCautionPromise: () => "Captain, quietly: Fleet Command hasn't authorised us to guarantee anything out here. If we promise patrols we don't have, it's the ISA's word that breaks.",
  marrowWalkOut: (v) => `${v.short} is gathering papers, Captain. We have about a minute before ${isR(v) ? 'she' : 'he'} leaves the ship. Say "Marrow, bring ${isR(v) ? 'her' : 'him'} back" and I'll try the airlock; or you could ask ${isR(v) ? 'her' : 'him'} yourself.`,
  marrowArmed: () => "Captain, both delegations just saw our weapons come up on the wardroom display. That's not a thing you do at a peace table.",
  tractorReleasedClan: (v) => `Releasing the tractor beam on the ${v.ship}. Captain, they saw that from the wardroom.`,
  marrowOnIce: () => 'I am on the ice with the delegates, Captain. When we are back.',
  marrowBusy: (v) => `I'm already away from the table, Captain. Give me ${mins(n(v, 'left'))}.`,
  marrowGoes: (v) => `I'll find ${v.who} in the corridor, Captain. Coffee, no notes.${n(v, 'ask') ? ' And I\'ll ask about raising it at the table.' : ''} Give me a couple of minutes.`,
  marrowChases: (v) => `Going after ${v.who}, Captain. I'll catch them at the airlock.`,
  marrowBringsBack: (v) => `I caught ${v.short} at the airlock, Captain. ${isR(v) ? 'She' : 'He'} is coming back to the table. Don't waste it.`,
  marrowCouldNot: (v) => `I caught ${v.short} at the airlock, Captain. ${isR(v) ? 'She' : 'He'} wouldn't stop.`,
  marrowAlreadyTabled: (v) => `${v.short} has already said it at the table, Captain. Nothing more to find out in a corridor.`,
  marrowLeaveGiven: (v) => `${v.short} says you may raise it at the table, Captain. Carefully.`,
  marrowLeaveRefused: (v) => `${v.short} isn't ready for it to be said at the table, Captain. Not yet.`,
  marrowAlreadyTold: (v) => `${v.short} has told us what ${isR(v) ? 'she' : 'he'} can, Captain.${n(v, 'leave') ? ' We have leave to raise it.' : ' We do not have leave to raise it at the table. If you want it, ask me to ask.'}`,
  marrowRebuffed_water: (v) => `${v.short} wouldn't say much, Captain. But ${isR(v) ? 'she' : 'he'} asked me twice how much water the ISA ships out to the outer habitats. That's not idle.`,
  marrowRebuffed_burial: (v) => `${v.short} wouldn't say much, Captain. But when I mentioned the ice cutting on Saltglass, ${isR(v) ? 'she' : 'he'} went very still. There's something on that moon ${isR(v) ? 'she' : 'he'} doesn't want cut.`,
  marrowRebuffed_succession: (v) => `${v.short} wouldn't say much, Captain. ${isR(v) ? 'She' : 'He'} kept looking at the clock. ${isR(v) ? 'Her' : 'His'} clan's ship is running its medical bay hard. Someone over there is ill.`,
  marrowLearned_water: (v) => `${v.short} talked, Captain. It's water. ${interestText(clanOf(v), 'water')} ${isR(v) ? 'She' : 'He'} doesn't want it said at the table${n(v, 'leave') ? ', but I asked, and you may raise it' : '; it\'s a confidence until we have leave'}.`,
  marrowLearned_burial: (v) => `${v.short} talked, Captain. It's their dead. ${interestText(clanOf(v), 'burial')} ${isR(v) ? 'She' : 'He'} doesn't want it said at the table${n(v, 'leave') ? ', but I asked, and you may raise it' : '; it\'s a confidence until we have leave'}.`,
  marrowLearned_succession: (v) => `${v.short} talked, Captain. ${interestText(clanOf(v), 'succession')} ${isR(v) ? 'She' : 'He'} doesn't want it said at the table${n(v, 'leave') ? ', but I asked, and you may raise it' : '; it\'s a confidence until we have leave'}.`,
  marrowRead: (v) =>
    `My read, Captain: ${n(v, 'tabled') === 2 ? 'both needs are on the table. Now they need terms that answer both.' : n(v, 'tabled') === 1 ? 'one need is on the table; the other side is closer than it looks.' : n(v, 'unknown') === 2 ? "we don't know what either of them actually needs. They've each told us what they want. That isn't the same thing." : 'we know more than the table does.'}${n(v, 'confided') && !n(v, 'leave') ? ' And remember what we were told in private stays private until we have leave.' : ''}${n(v, 'landing') ? ' And there is a hauler on its way down.' : ''}${v.options ? ` Options: ${v.options}.` : ''}`,
  marrowAfter: () => 'It is done, Captain, one way or the other.',
  ownTalksBegin: () => "Understood, Captain. We'll step out. Marrow will be in the corridor if they need us; the wardroom is theirs.",
  ownTalksTooSoon: (v) => (n(v, 'tabled') ? "Captain, I'd not leave them alone yet. They know what each other needs, but they don't trust each other with it." : "Captain, if we leave them alone now they'll be at each other's throats in five minutes. Neither has said what they need yet."),
  ownTalksGoing: () => 'Still talking in there, Captain. Voices raised once, and then lowered again. I take that as a good sign.',
  impOtherSaltglass: () => "I'm not sure how that helps at the table, Captain. If you want them to see something, we could take them down to the ice.",
  impNotAtTable: () => 'Not at a peace table, Captain.',

  // ---- the ice
  iceGo: () => "Taking both delegations down to Saltglass in the Halcyon's shuttle, Captain, with Varga's survey team. I'll keep them talking. Three minutes or so on the surface.",
  iceAlready: (v) => `We're on the ice already, Captain. About ${mins(n(v, 'left'))} more.`,
  iceDone: () => "We've been down once, Captain. They've seen what there is to see.",
  iceNotNow: (v) => `Not with a ${v.clan} hauler on its way down, Captain. Deal with that first.`,
  iceNoOne: () => 'Someone has to be at the table to take them anywhere, Captain.',
  iceRefused: (v) => `${v.short} won't go, Captain. ${isR(v) ? 'She' : 'He'} doesn't trust us enough to step off the ship with the other clan.`,
  iceBack: (v) =>
    `We're back aboard, Captain. ${n(v, 'shown') === 0 ? "They walked the ice together and didn't say much. They're calmer for it." : n(v, 'shown') === 1 ? `${v.a} took us somewhere without being asked and told us what it was: ${NEED[v.aNeed as Interest]}. The other delegation heard every word.` : `Both of them showed us. ${v.a} took us to ${NEED[v.aNeed as Interest]}, and ${v.b} to ${NEED[v.bNeed as Interest]}. Nobody had to be asked twice.`}`,
  onTheIceNow: () => 'Both delegations are on the surface with Commander Marrow, Captain. They will be back aboard shortly.',

  // ---- the moon, the hauler, the elder
  surveyDone: () => "Survey of Saltglass complete, Captain. The Brine Springs are on the southern flats. The Barrow Ice is on the northern ridge, eighty kilometres north of the springs. The Founders' Seat is on the central saddle between them. Nothing much else down there but salt and wind.",
  surveyAgain: () => "Same survey, Captain: springs south, barrows north, the Founders' Seat in the middle.",
  vargaOffersSurvey: () => "Captain, I can put an ISA survey on the table that neither clan drew. Say the word.",
  scanClanShip: (v) => `The ${v.ship}: ${isR(v) ? 'a Rhune ice hauler' : 'a Tarvo transport'}, unarmed, crew of about forty.${n(v, 'elderHere') ? ` Her medical bay is running hard. One patient, elderly, failing.` : ''}${n(v, 'landing') ? ' Her hauler is away and descending.' : ''}`,
  scanOwnShip: () => 'All systems normal, Captain.',
  clanShipGone: (v) => `The ${v.ship} is gone, Captain.`,
  landingLaunched: (v) => `Captain, the ${v.ship} has launched a hauler. It is descending toward Saltglass. ${v.clan} is going to plant its claim on the ice.`,
  landingProgress: (v) => `The ${v.clan} hauler is still descending. About ${mins(n(v, 'left'))} to the surface.`,
  landingWatch: (v) => `The ${v.clan} hauler is descending, Captain. About ${mins(n(v, 'left'))}.`,
  noLanding: () => 'Nothing moving toward the surface, Captain.',
  landed: (v) => `The ${v.clan} hauler is down on Saltglass, Captain. They are cutting.`,
  landingRecalled: (v) => `The ${v.clan} hauler has turned back, Captain.${n(v, 'marrow') ? ' Commander Marrow talked them round.' : ''}`,
  oseiElderWarn: (v) => `Captain, Dr. Osei. From what I can read of the ${v.elderHere ? v.ship : 'clan ship'}'s medical telemetry, ${v.elder} has hours, perhaps less.`,
  elderDied: (v) => `Captain, ${v.clan} reports that ${v.elder} has died.`,
  oseiTreats: (v) => `Captain, Dr. Osei. I'm aboard the ${v.ship} with ${v.elder}. I can't cure this. I can buy time: a good deal more than we had.`,
  oseiAlreadyTreating: (v) => `I'm already with ${v.elder}, Captain.`,
  oseiNeedsLeave: (v) => `I can help ${v.elder}, Captain, if the clan lets me aboard. I won't go without their leave.${n(v, 'left') ? ` From the telemetry, ${mins(n(v, 'left'))} at most.` : ''}`,
  oseiNoPatient: () => "Nobody has told me anyone is ill, Captain. If someone is, I'll need to be told, and asked.",
  oseiElderGone: (v) => `${v.elder} has died, Captain. There's nothing more I can do.`,
  szaboRead: (v) => `My read of their voices, Captain: ${v.hardShort} is the one holding the line for ${v.hard}; I'd not push. ${v.soft} wants this to work and is waiting to be asked the right question. Neither of them will say anything real with the other in the room. Not first.`,
  statusReportSaltglass: (v) => `Clan Rhune: ${v.rhune}. Clan Tarvo: ${v.tarvo}. The ice: ${v.ice}. Elder: ${v.elder}. Commander Marrow: ${v.marrow}.`,
  systemsQuiet: () => 'All quiet down here, Captain. Nothing for Engineering today.',
};

export const templates: Record<string, TemplateFn> = { ...base, ...T };
export { DELEGATE_SHORT };
