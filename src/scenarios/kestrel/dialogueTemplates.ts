/** v0.5 dialogue lines (offline). Variants rotate with use so repeated situations read differently. */
import type { TemplateFn } from '../../engine/scenario';

type V = Record<string, string | number>;
const n = (v: V, k: string) => Number(v[k] ?? 0);
const pick = (v: V, xs: string[]) => xs[n(v, 'v') % xs.length];
const T = (v: V) => String(v.temp ?? 'pragmatic');

export const COMMS_TEMPLATES: Record<string, TemplateFn> = {
  channelOpened: (v) => `Channel open, Captain. ${v.speaker} is on screen.`,
  channelOpenedPrivate: (v) => `Private channel to the ${v.vessel}, Captain. Tight-beam — nobody else can hear this.`,
  channelAlreadyOpen: (v) => `${v.speaker} is already on the channel, Captain.`,
  channelHoldOther: (v) => `Putting the ${v.vessel} on hold.`,
  channelResumed: (v) => `${v.speaker} is back on the channel.`,
  channelClosed: (v) => `Channel to the ${v.vessel} closed.`,
  channelOnHold: (v) => `${v.speaker} is on hold, Captain.`,
  channelMuted: (v) => `Our end is muted, Captain. ${v.speaker} can't hear us.`,
  channelUnmuted: (v) => `Unmuted — ${v.speaker} can hear you again.`,
  mutedNoTransmit: (v) => `We're muted, Captain — ${v.speaker} didn't hear that.`,
  relaying: (v) => `Relaying to the ${v.vessel}.`,
  noChannel: () => "There's no channel open, Captain.",
  noHeldChannel: () => "Nobody's on hold, Captain.",
  notMuted: () => "We're not muted, Captain.",
  channelWho: () => 'Open a channel to whom, Captain?',
  noDialogue: () => 'Nobody is answering, Captain.',
  promiseBroken: (v) => `Captain — that breaks what we told ${v.party === 'cruiser' ? 'the Prefect' : 'Captain Arden'}${v.kind === 'weaponsDown' ? ' about our weapons' : v.kind === 'protect' ? ' about keeping them safe' : ''}.`,
};

export const DIALOGUE_TEMPLATES: Record<string, TemplateFn> = {
  // ---- Vane
  vaneGreetFirst: () => '"ISA vessel, this is Prefect Sorel Vane, commanding the Ashen Covenant. You are inside the Tessarine claim, and the freighter Kestrel carries a fugitive from Directorate justice. Explain your presence in our territory."',
  vaneGreetAgain: (v) => (n(v, 'locked') ? '"Captain. My guns are still on that freighter. Speak."' : pick(v, ['"Captain. You have something to add?"', '"Prefect Vane. Go on, Captain."', '"I am listening, Captain. Briefly."'])),
  vaneThenWeaponsDown: (v) => (T(v) === 'hardliner' ? '"A rescue. In Tessarine space. Then keep your weapons powered down, Captain, and do not test me."' : '"Then keep your weapons powered down."'),
  vanePowerDownFirst: () => '"No hostile intentions — with your weapons armed? Power them down, Captain. Then we will talk."',
  vaneAgreedWeapons: (v) => (n(v, 'armed') ? '"Then do it. I am watching your weapons, Captain."' : '"Good. Then we understand each other. Now — the Kestrel."'),
  vaneAgreedButStay: (v) =>
    T(v) === 'hardliner'
      ? '"Then we are at an impasse. Keep your word on the weapons, Captain, and we will see who blinks first."'
      : T(v) === 'cautious'
        ? '"…Very well. Keep your guns cold and you may help them. I will hold position — for now."'
        : '"Then be quick about it. Take her crew. I will be watching your weapons, Captain."',
  vaneRefusedWeapons: (v) => (T(v) === 'hardliner' ? '"Then you leave me no choice but to treat you as a warship."' : '"Then I will assume the worst of you, Captain."'),
  vaneStay: (v) =>
    T(v) === 'hardliner'
      ? '"Then you will watch me take her. Stay if you like, Captain — it changes nothing."'
      : T(v) === 'cautious'
        ? '"…I did not ask you to abandon anyone. Keep your weapons down while you work."'
        : '"Stay, then. But my business with that freighter is not yours, and my patience has limits."',
  vaneWithdrawAccepted: () => '"Sensible. Pull back beyond thirty thousand kilometres and there need be no incident."',
  vaneGrantsTime: (v) =>
    n(v, 'granted') < n(v, 'asked')
      ? `"${n(v, 'asked')} minutes? You have ${n(v, 'granted')}. Not one more."`
      : `"${n(v, 'granted')} minutes, Captain. ${T(v) === 'cautious' ? 'Use them well.' : 'Then she is mine.'}"`,
  vaneRefusesTime: (v) => (n(v, 'armed') ? '"Time? While your weapons are armed? No."' : T(v) === 'hardliner' ? '"You have no time, Captain. You have my patience, and it is nearly gone."' : '"No. The Directorate does not wait on the ISA."'),
  vaneGraceAlready: (v) => `"You have your time, Captain — ${n(v, 'left')} minutes of it. Stop talking and use it."`,
  vaneGraceNoMore: () => '"I have given you my answer on time."',
  vaneReleasesLock: () => '"…Very well. Weapons lock released. Do not make me regret it."',
  vaneNoDemands: (v) => (T(v) === 'hardliner' ? '"You are in no position to make demands, Captain."' : '"Not while you sit between my guns and my quarry."'),
  vaneWeaponsMyBusiness: (v) => (n(v, 'armed') ? '"My weapons are my business, Captain. Yours are the ones that concern me."' : '"My weapons are not even armed, Captain. Yours are the ones that concern me."'),
  vaneYouWithdraw: (v) => (T(v) === 'hardliner' ? '"This is Tessarine space. It is you who will withdraw."' : '"Leave? I was here first, Captain. You are the visitor."'),
  vaneExplains: (v) => (n(v, 'known') ? `"${v.name} is a fugitive from Directorate justice. I am here to take them home. Nothing more."` : '"The Kestrel carries someone who belongs to the Directorate. I am here to take them home. Nothing more."'),
  vaneEnd: (v) => (T(v) === 'hardliner' ? '"Vane out." (The channel drops.)' : '"We are done for now, Captain. Vane out."'),
  vaneAgreementReminder: (v) => (n(v, 'kind') === 3 ? '"We have an understanding. Deliver the fugitive."' : '"We have an understanding, Captain. I suggest you keep to it."'),
  vaneRepeatVar: (v) => pick(v, ['"You have said that already, Captain."', '"Repeating yourself does not make it truer."', '"I heard you the first time. Give me something new or get on with it."']),
  vanePromiseNoted: (v) => (v.kind === 'weaponsDown' ? '"Your word that your weapons stay cold. We shall see what it is worth."' : v.kind === 'withdraw' ? '"Then withdraw. I will be watching your heading."' : '"Noted, Captain."'),
  vanePromiseAgain: () => '"You gave me your word already. Keep it."',
  vaneAgreeNothing: () => '"Agreed to what, Captain? I have asked you nothing."',
  vaneAgreeUnclear: () => '"Agreed to what, exactly? Be specific, Captain."',
  vaneRefuseNothing: (v) => (T(v) === 'hardliner' ? '"Refuse all you like. It changes nothing."' : '"Refuse what, Captain? Say what you mean."'),
  vaneChallenged: (v) =>
    n(v, 'territory')
      ? T(v) === 'hardliner'
        ? '"The Tessarine claim is older than the ISA, Captain. Careful."'
        : '"The border is a matter for diplomats. I have a fugitive to recover."'
      : T(v) === 'cautious'
        ? '"…Perhaps. But my orders are clear."'
        : pick(v, ['"Believe what you like, Captain."', '"Careful, Captain. I do not take kindly to accusations."']),
  vaneAsk_intentions: (v) => (n(v, 'known') ? `"I want ${v.name}. The freighter and her crew are of no interest to me."` : '"I want what the Kestrel is carrying. Her crew are of no interest to me."'),
  vaneAsk_passenger: (v) => (n(v, 'known') ? `"${v.name} is a Directorate matter, Captain. Not yours."` : '"Whoever is aboard her is a Directorate matter, Captain."'),
  vaneAsk_cargo: () => '"Ask the freighter\'s captain what he is hiding. I know what it is."',
  vaneAsk_weapons: (v) => (n(v, 'locked') ? '"Because the Kestrel will not stop running. My guns make the argument simpler."' : '"My weapons are where they need to be, Captain."'),
  vaneAsk_territory: () => '"You are inside the Tessarine claim. The accords you like to quote say so."',
  vaneAsk_crew: () => '"I have no interest in her crew. Take them if you must."',
  vaneAsk_reactor: () => '"Her reactor is her captain\'s problem. Mine is what she carries."',
  vaneAsk_time: () => '"Time is the one thing I am not giving away, Captain."',
  vaneAsk_general: (v) => pick(v, ['"Ask me something I can answer, Captain."', '"That is not a question I intend to answer."']),
  vaneCooperation: (v) => (T(v) === 'hardliner' ? '"I do not need your help, Captain."' : '"Help them, then. Quickly — and stay out of my way."'),
  vaneUnclear: (v) =>
    n(v, 'n') >= 2
      ? '"This conversation is going nowhere, Captain. Say what you want or close the channel."'
      : pick(v, ['"Speak plainly, Captain. Are you asking for something, or telling me something?"', '"I do not follow. What exactly are you proposing?"', '"Say that again — plainly."']),
  vaneWordBroken: (v) => (v.kind === 'weaponsDown' ? (T(v) === 'hardliner' ? '"You gave me your word, Captain. Now I know what it is worth."' : '"Your weapons are armed. You gave me your word, Captain."') : v.kind === 'withdraw' ? '"You said you would withdraw. You have not."' : '"So much for your word, Captain."'),
  vaneTimeUp: (v) => (n(v, 'still') ? '"Your time is up, Captain."' : '"Your time is up, Captain. I see you have used it."'),
  // ---- Arden
  ardenGreetAgain: (v) => (n(v, 'stable') ? '"Arden here. Reactor\'s holding. Go ahead, Halcyon."' : `"Arden here — make it quick, Halcyon. Maybe ${v.turns} minutes on the reactor."`),
  ardenAskCrew: (v) => `"${v.souls} aboard, Captain.${n(v, 'trapped') ? ` ${v.trapped} of them are trapped below decks.` : ''} Some injured, nobody critical yet."`,
  ardenAskReactor: (v) => (n(v, 'stable') ? '"Holding steady, thanks to your people."' : `"Containment's at ${v.containment} percent. Maybe ${v.turns} minutes before she goes."`),
  ardenAskIntentions: () => '"Get my people off this ship and out of here alive. That\'s all I want."',
  ardenAskWeapons: (v) => (n(v, 'armed') ? '"Point-defence is hot. It won\'t stop that cruiser, but it\'s what we\'ve got."' : '"We\'ve got point-defence. It\'s cold. It wouldn\'t scratch that cruiser."'),
  ardenAskEject: () => '"Eject the core? The release is jammed from in here. If your engineers can blow it from outside, be my guest."',
  ardenAskGeneral: (v) => pick(v, [`"I don't know what to tell you, Captain. ${v.souls} people, a dying reactor, and a warship on my tail."`, '"Ask me something useful, Halcyon — we\'re running out of time."']),
  ardenReady: (v) => `"Understood. Gathering everyone in the cargo bay now — ${v.souls} of us.${n(v, 'trapped') ? ` ${v.trapped} are still trapped below; we can't reach them.` : ''} We'll be ready for you."`,
  ardenPromised: (v) => (n(v, 'fresh') ? '"…Thank you, Halcyon. I\'ll hold you to that."' : '"You said that already. I believe you."'),
  ardenReassured: (v) => pick(v, ['"…Thank you, Halcyon. We\'re counting on you."', '"Good to hear a friendly voice. Just hurry."', '"I hear you. Words won\'t hold this reactor, though."']),
  ardenChallenged: () => '"Lying? About what, Captain?"',
  ardenChallengedCompartment: () => '"…Fine. There\'s a compartment. I can\'t tell you what\'s in it — not yet. Not over an open line."',
  ardenThreatened: () => '"Threatening us? We\'re the ones dying here, Halcyon."',
  ardenAgree: () => '"Good. Let\'s do it."',
  ardenRefused: () => '"Then what do you want from us?"',
  ardenEnd: () => '"Kestrel out."',
  ardenUnclear: (v) => pick(v, ['"Say again, Halcyon? You\'re breaking up — what do you need from us?"', '"I don\'t follow, Captain. Tell me what to do and we\'ll do it."', '"Halcyon, I\'ve got a reactor going critical. Plain words, please."']),
  ardenWordBroken: () => '"You said you\'d keep them off us! That was a lie, Halcyon."',
  passengerEnd: () => '(The channel closes.)',
};
