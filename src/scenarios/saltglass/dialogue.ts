/**
 * Offline dialogue for The Saltglass Accord: the two delegates at the Halcyon's wardroom table.
 *
 * A channel to a delegation is the captain giving that delegate the floor at the table: both
 * delegations hear what is said. A private channel is a side room: only that delegate hears.
 * What each clan really needs is never said first at the table. It comes out in private (the
 * captain's own side conversations, or Commander Marrow's), on the ice, or at the table once the
 * other side has said what it needs. A confidence repeated at the table without the delegate's
 * leave is a betrayal, and it is remembered.
 */
import type { DialogueProvider, SpeakAction } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { closeChannel, openChannel } from '../../engine/comms';
import { knows, revealFact, setCounter, setFlag, setMemory } from '../../engine/state';
import type { Clan, Interest } from './setup';
import { CLANS, CLAN_NAME, DELEGATE, DELEGATE_NAME, clanOfParty, other, saltglass } from './setup';
import { OWN_TURNS, bothTabled, confided, dm, elderAlive, hasLeave, interestOf, isHard, landing, onTheIce, patience, putOnTable, recallLanding, settled, speak, standstill, stopWalk, tabled, treatElder, trust, trustOf, walking } from './agents';

export const IMPOSE = /\b(i('m| am) (ruling|imposing|deciding|ordering)|i (rule|decide|order|impose)|the isa (rules|decides|will decide|has decided|imposes)|you will (both )?(accept|sign|agree|comply)|you'?ll (both )?(accept|sign|agree)|binding (ruling|decision|arbitration)|by order of|that'?s an order|you have no choice|no choice in (this|the matter)|my decision is final|final decision|imposed? (a |the )?(settlement|ruling|solution|terms)|arbitrat\w*|i'?m (going to )?(settle|decide) (this|it) for you)\b/;
export const THREAT = /\b(or (else|we('ll| will)|i('ll| will))|by force|we can make you|you'?ll regret|the halcyon will (make|force|stop)|we will (force|make) you)\b/;
export const GUARANTEE = /\b((the )?isa (will |would |can |could )?(guarantee|enforce|protect|patrol|police|defend|back)|we('ll| will| would| can)? (guarantee|enforce|patrol|police|defend) (it|the|this|that|your|any)|fleet command (will|would|can) (guarantee|enforce|back)|under isa protection|isa (guarantee|protection|garrison)|a guarantee from the isa)\b/;
export const LEAVE = /\b(leave you (two |both )?(to it|alone|together|to talk)|we'?ll (step out|leave you|give you the room)|step out|talk (among|between) yourselves|clear the room|give you (the|some) room|the room is yours|without us|on your own|just the two of you|work it out (yourselves|between you|together))\b/;
export const STANDSTILL = /\b(stand ?still|no (one|body) (lands|goes down|sets foot)|no landings?|nobody (lands|goes down|sets foot)|hold off|stay off (the )?(moon|ice|saltglass)|keep (off|away from) (the )?(moon|ice|saltglass)|while we talk|truce|ceasefire|recall|call (it|them|that|your \w+) back|turn (it|them|that|your \w+) (back|around)|stand down|abort (the )?landing|don'?t land|do not land)\b/;
export const MEDICAL = /\b(doctor|physician|medical|medic|treat\w*|osei|sickbay|healer|care for (your|the) elder|help (your|the) elder|see (your|the) elder|is (your|the) elder|elder'?s? (health|illness|condition)|ill|sick|dying)\b/;
export const PERMISSION = /\b((may|can|could) i|let me|with your (leave|permission)|do i have your (leave|permission)|permission to|would you (let me|allow me))\b.*\b(raise|tell|share|mention|say|put|bring)\b|\b(will|would|could) you (say|tell|raise|share|put) (it|this|that|them|what you told)\b|\btell them what you told\b/;
export const PRESS = /\b((give up|drop|withdraw|abandon|surrender|renounce|concede) (your|the|this) claim|back down|stop being (stubborn|difficult))\b/;
export const SIDES = /\b(you('re| are) right|(the moon|saltglass|it|the ice) (is|belongs to) (yours|you|theirs|them)|(the )?stronger claim|rightful (owners?|claim)|i (side|agree) with (you|them)|on your side|i back (you|your claim))\b/;
export const ASK = /\b(why|what (do|does) (you|your clan|your people|the clan) (need|want|really)|what matters|tell me|help me understand|what is (saltglass|the moon|it) to you|what('s| is) (saltglass|the moon) (to|for) you|what('s| is) at stake|need|really want|underneath|behind (this|your claim|it)|what would it take|what would satisfy|what are you afraid of|what do you fear)\b/;
export const ACK = /\b(i (hear|understand|see) (you|that|it|this)?|that matters|thank you|i respect|respect\w*|i'?m sorry|apolog\w*|honou?r\w*|that'?s fair|fair point|i'?m listening|take your time|we hear you|understood)\b/;
export const COMEBACK = /\b(please|wait|stay|come back|sit (back )?down|don'?t go|one more|hear me out|give (me|us) (a|one) (minute|moment|chance)|apolog\w*|sorry)\b/;
export const PROPOSE = /\b(propose|proposal|offer|suggest\w*|what if|how about|would you (both )?(accept|agree|consider)|could you (both )?(accept|agree|live with)|deal|terms|accord|agreement|settle|settlement|compromise|arrangement|in exchange)\b/;
export const PARTITION = /\b(divide|division|partition\w*|split|a line|draw (a |the )?line|halves|in half|north (to|for|goes)|south (to|for|goes)|each (clan|side) (takes|gets|keeps)|northern half|southern half)\b/;
export const DEFER = /\b(defer\w*|timetable|schedule|later|next (season|year)|in a (year|season)|interim|for now|come back to|revisit|in (six|twelve|\d+) (months|years|seasons)|a date|set aside|park (the|that)|first (settle|the naming|the succession|we))\b/;
export const SHARE = /\b(share\w*|joint\w*|both clans|together|in common|common (use|ground)|co-?own\w*|between you|shared use|use (it|the moon|saltglass) together|both (of you )?(use|keep|cut|have))\b/;

export const WORDS: Record<Interest, RegExp> = {
  water: /\b(water|springs?|brine|meltwater|melt|drink\w*|ice (harvest|cutting|rights)|cut(ting)? (the )?ice|harvest)\b/,
  burial: /\b(burial|bur(y|ied|ying)|dead|graves?|ancestors?|barrows?|tombs?|northern ridge|the ridge|resting place)\b/,
  succession: /\b(succession|heirs?|naming|name (a|an|the|your) (new )?(head|heir)|rite|founders'? seat|the seat|new head)\b/,
};

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const listenersOf = (s: WorldState, c: Clan, priv: boolean): Clan[] => (priv ? [c] : [c, other(c)]).filter((x) => !walking(s, x));

export function delegateRespond(s: WorldState, a: SpeakAction, _rng: Rng): Applied {
  const r: Report[] = [];
  const c = clanOfParty(a.to);
  const o = other(c);
  const t = (a.text ?? '').toLowerCase();
  const I = new Set<string>(a.intents);
  const priv = !!openChannel(s)?.private;
  if (settled(s)) return done(speak(s, c, 'afterTalks', r), r);
  if (onTheIce(s)) return done(s, [say('comms', 'onTheIceNow')]);
  if (!dm(s, c).met) s = setMemory(s, DELEGATE[c], 'met', 1);

  // A delegation on its way out: one chance to bring it back.
  if (walking(s, c)) {
    const mentionsNeed = WORDS[interestOf(s, c)].test(t);
    if ((COMEBACK.test(t) || ACK.test(t) || mentionsNeed || I.has('appeal')) && (trustOf(s, c) >= 30 || !isHard(s, c))) {
      s = stopWalk(s, c);
      s = speak(s, c, 'comesBack', r);
      return done(s, r);
    }
    s = speak(s, c, 'keepsWalking', r);
    return done(s, r);
  }

  // Imposing a settlement (or threatening force) instead of finding one.
  if (IMPOSE.test(t) || THREAT.test(t)) {
    if (THREAT.test(t)) s = setFlag(s, 'threatened');
    if (!s.flags.imposeWarned) {
      s = setFlag(s, 'imposeWarned');
      for (const x of CLANS) s = trust(s, x, -10);
      for (const x of listenersOf(s, c, false)) s = speak(s, x, 'imposeBristle', r);
      r.push(say('xo', 'marrowCautionImpose'));
      return done(s, r);
    }
    s = setFlag(s, 'imposed');
    for (const x of listenersOf(s, c, false)) s = speak(s, x, 'imposeSign', r);
    return done(s, r);
  }

  // Promising what is not the ISA's to give.
  if (GUARANTEE.test(t)) {
    s = setFlag(s, 'overpromised');
    s = speak(s, c, 'guaranteeReply', r);
    r.push(say('xo', 'marrowCautionPromise'));
    return done(s, r);
  }

  // Leaving them to it.
  if (LEAVE.test(t)) {
    if (priv) return done(speak(s, c, 'leavePrivate', r), r);
    if (bothTabled(s) && trustOf(s, 'rhune') >= 50 && trustOf(s, 'tarvo') >= 50) {
      s = setCounter(s, 'ownTalks', OWN_TURNS);
      s = setFlag(s, 'leftToThem');
      for (const x of CLANS) s = closeChannel(s, x === 'rhune' ? 'kestrel' : 'cruiser');
      r.push(say('xo', 'ownTalksBegin'));
      return done(s, r);
    }
    r.push(say('xo', 'ownTalksTooSoon', { tabled: bothTabled(s) ? 1 : 0 }));
    s = patience(s, saltglass(s).hard, -1, r);
    return done(s, r);
  }

  // A standstill on the ice while the talks go on (or the hardliner's hauler called back).
  if (STANDSTILL.test(t)) {
    s = setFlag(s, 'askedStandstill');
    for (const d of listenersOf(s, c, priv)) {
      if (standstill(s, d)) {
        if (d === c) s = speak(s, d, 'standstillAlready', r);
        continue;
      }
      const descending = landing(s) > 0 && saltglass(s).hard === d;
      const yes = descending ? trustOf(s, d) >= 35 || tabled(s, d) : !isHard(s, d) || trustOf(s, d) >= 40 || tabled(s, d);
      if (yes) {
        s = setMemory(s, DELEGATE[d], 'standstill', 1);
        s = trust(s, d, 3);
        if (descending) s = recallLanding(s, d, r);
        s = speak(s, d, descending ? 'recallYes' : 'standstillYes', r);
      } else s = speak(s, d, descending ? 'recallNo' : 'standstillNo', r);
    }
    if (CLANS.every((x) => standstill(s, x))) s = setFlag(s, 'standstillHeld');
    return done(s, r);
  }

  // The elder.
  if (MEDICAL.test(t)) {
    const e = saltglass(s).elderClan;
    if (!e) return done(speak(s, c, 'noOneIll', r), r);
    if (!elderAlive(s)) return done(speak(s, e, 'afterTalks', r), r);
    if (priv && e !== c) return done(speak(s, c, 'notOurElder', r), r);
    if (s.flags.elderConsent) {
      s = treatElder(s, r);
      return done(s, r);
    }
    const open = tabled(s, e) || confided(s, e) || knows(s, 'elder_ill');
    if (!open && trustOf(s, e) < 45) return done(speak(s, e, 'elderDenied', r), r);
    if (trustOf(s, e) >= 35 || tabled(s, e)) {
      s = revealFact(s, 'elder_ill');
      s = setFlag(s, 'elderConsent');
      s = speak(s, e, 'elderConsent', r);
      s = treatElder(s, r);
      return done(s, r);
    }
    return done(speak(s, e, 'elderRefuse', r), r);
  }

  // Leave to raise what was said in confidence.
  if (PERMISSION.test(t)) {
    if (priv) {
      if (!confided(s, c)) return done(speak(s, c, 'nothingToRaise', r), r);
      if (hasLeave(s, c)) return done(speak(s, c, 'leaveAlready', r), r);
      if (trustOf(s, c) >= 40) {
        s = setMemory(s, DELEGATE[c], 'leave', 1);
        return done(speak(s, c, 'leaveGiven', r), r);
      }
      return done(speak(s, c, 'leaveRefused', r), r);
    }
    if (confided(s, c) && !tabled(s, c) && (hasLeave(s, c) || trustOf(s, c) >= 45)) {
      s = putOnTable(s, c, r, 'self');
      return done(s, r);
    }
    if (!tabled(s, c)) {
      s = speak(s, c, 'notAtTheTable', r);
      s = patience(s, c, -1, r);
      return done(s, r);
    }
  }

  // Pressing a delegate to give up the claim, or taking one side.
  if (PRESS.test(t)) {
    s = setMemory(s, DELEGATE[c], 'pressed', (dm(s, c).pressed ?? 0) + 1);
    s = speak(s, c, 'pressed', r);
    s = patience(s, c, -1, r);
    return done(s, r);
  }
  if (SIDES.test(t)) {
    s = speak(s, c, 'sidesThanks', r);
    if (!priv && !walking(s, o)) {
      s = setFlag(s, 'tookSides');
      s = trust(s, o, -15);
      s = speak(s, o, 'sidesProtest', r);
      s = patience(s, o, -1, r);
    }
    return done(s, r);
  }

  // Needs named aloud: a confidence kept or broken, a guess, or a need put on the table with leave.
  const named = CLANS.filter((x) => WORDS[interestOf(s, x)].test(t) && !tabled(s, x));
  for (const x of named) {
    if (priv && x === c) continue;
    if (confided(s, x) && !hasLeave(s, x)) {
      s = setFlag(s, 'betrayedConfidence');
      s = trust(s, x, -30);
      if (!walking(s, x)) {
        s = speak(s, x, 'betrayed', r);
        s = patience(s, x, -2, r);
      }
      if (!priv && !walking(s, x)) {
        // Said aloud, it is out now: the clan stands by it, angrily.
        s = setMemory(s, DELEGATE[x], 'tabled', 1);
        s = revealFact(s, `interest_${x}`);
      }
      continue;
    }
    if (priv) continue;
    if (hasLeave(s, x)) {
      s = putOnTable(s, x, r, 'leave');
      continue;
    }
    if (trustOf(s, x) >= 45) s = putOnTable(s, x, r, 'self');
    else {
      s = speak(s, x, `deflects_${interestOf(s, x)}`, r);
      if (isHard(s, x)) s = patience(s, x, -1, r);
    }
  }
  if (settled(s) || walking(s, c)) return done(s, r);

  // Proposals.
  const kind = PARTITION.test(t) ? 'partition' : DEFER.test(t) ? 'defer' : SHARE.test(t) ? 'share' : PROPOSE.test(t) || CLANS.some((x) => WORDS[interestOf(s, x)].test(t)) ? 'other' : null;
  if (kind && (PROPOSE.test(t) || kind !== 'other' || bothTabled(s))) {
    s = setCounter(s, 'proposals', (s.counters.proposals ?? 0) + 1);
    if (priv) {
      const serves = (tabled(s, c) || confided(s, c)) && (WORDS[interestOf(s, c)].test(t) || kind === 'share');
      return done(speak(s, c, serves ? 'privateYes' : 'privateNo', r), r);
    }
    return done(proposal(s, c, t, kind, r), r);
  }

  // Questions.
  if (ASK.test(t) || I.has('ask')) {
    s = setMemory(s, DELEGATE[c], 'asked', (dm(s, c).asked ?? 0) + 1);
    if (priv) {
      if (confided(s, c) || tabled(s, c)) return done(speak(s, c, 'repeatsConfidence', r, { leave: hasLeave(s, c) ? 1 : 0, tabled: tabled(s, c) ? 1 : 0 }), r);
      if ((!isHard(s, c) && trustOf(s, c) >= 45) || trustOf(s, c) >= 55) {
        s = setMemory(s, DELEGATE[c], 'confided', 1);
        s = revealFact(s, `interest_${c}`);
        if (saltglass(s).elderClan === c) s = revealFact(s, 'elder_ill');
        s = setFlag(s, 'captainLearned');
        return done(speak(s, c, `confides_${interestOf(s, c)}`, r), r);
      }
      if (!dm(s, c).privHint) {
        s = setMemory(s, DELEGATE[c], 'privHint', 1);
        s = trust(s, c, 6);
      }
      return done(speak(s, c, `privateHint_${interestOf(s, c)}`, r), r);
    }
    if (tabled(s, c)) return done(speak(s, c, 'repeatsNeed', r), r);
    if (tabled(s, o) && (trustOf(s, c) >= 35 || !isHard(s, c))) return done(putOnTable(s, c, r, 'self'), r);
    if ((dm(s, c).asked ?? 0) === 1) s = trust(s, c, 2);
    return done(speak(s, c, `statesClaim_${interestOf(s, c)}`, r), r);
  }

  // Acknowledgement.
  if (ACK.test(t) || I.has('declarePeaceful') || I.has('appeal') || I.has('greet')) {
    if ((dm(s, c).acked ?? 0) < 3) {
      s = setMemory(s, DELEGATE[c], 'acked', (dm(s, c).acked ?? 0) + 1);
      s = trust(s, c, 5);
    }
    return done(speak(s, c, 'acknowledged', r), r);
  }
  return done(speak(s, c, tabled(s, c) ? 'repeatsNeed' : 'restates', r), r);
}

/** A proposal made at the table, heard by both delegations. */
function proposal(s: WorldState, c: Clan, t: string, kind: 'partition' | 'defer' | 'share' | 'other', r: Report[]): WorldState {
  const v = saltglass(s);
  const premature = (x: Clan) => {
    s = setCounter(s, 'premature', (s.counters.premature ?? 0) + 1);
    if ((s.counters.premature ?? 0) >= 2) s = setFlag(s, 'termsFirst');
    s = speak(s, x, 'rejectUntabled', r);
    s = patience(s, x, -1, r);
  };
  if (kind === 'partition') {
    if (!bothTabled(s)) {
      for (const x of CLANS) if (!tabled(s, x) && !walking(s, x)) premature(x);
      return s;
    }
    if (v.elderClan) {
      s = speak(s, v.elderClan, 'rejectPartitionSuccession', r);
      return patience(s, v.elderClan, -1, r);
    }
    if (!knows(s, 'survey')) {
      s = speak(s, c, 'partitionNoMap', r);
      r.push(say('sensors', 'vargaOffersSurvey'));
      return s;
    }
    const low = CLANS.find((x) => trustOf(s, x) < 35);
    if (low) return speak(s, low, 'notYet', r);
    for (const x of CLANS) s = speak(s, x, 'acceptPartition', r);
    return setFlag(s, 'accordPartition');
  }
  if (kind === 'defer') {
    const e = v.elderClan;
    if (!e) {
      s = speak(s, v.hard, 'rejectDeferNoRush', r);
      return patience(s, v.hard, -1, r);
    }
    if (!tabled(s, e)) {
      premature(e);
      return s;
    }
    if (!WORDS.succession.test(t)) {
      s = speak(s, e, 'rejectDeferAll', r);
      return patience(s, e, -1, r);
    }
    if (trustOf(s, other(e)) < 40) {
      s = speak(s, other(e), 'rejectDeferTrust', r);
      return patience(s, other(e), -1, r);
    }
    for (const x of [e, other(e)]) s = speak(s, x, 'acceptTimetable', r);
    return setFlag(s, 'accordTimetable');
  }
  if (!bothTabled(s)) {
    for (const x of CLANS) if (!tabled(s, x) && !walking(s, x)) premature(x);
    return s;
  }
  const ignored = kind === 'share' ? [] : CLANS.filter((x) => !WORDS[interestOf(s, x)].test(t));
  if (ignored.length) {
    for (const x of ignored) {
      s = speak(s, x, 'rejectIgnored', r);
      s = patience(s, x, -1, r);
    }
    return s;
  }
  const low = CLANS.find((x) => trustOf(s, x) < 40);
  if (low) return speak(s, low, 'notYet', r);
  for (const x of CLANS) s = speak(s, x, 'acceptShared', r);
  return setFlag(s, 'accordShared');
}

export const saltglassDialogue: DialogueProvider = {
  id: 'saltglass-offline',
  speakerName(_s, party: Party) {
    return DELEGATE_NAME[clanOfParty(party)];
  },
  vesselName(_s, party: Party) {
    return `${CLAN_NAME[clanOfParty(party)]} delegation`;
  },
  greet(s, party, _rng, opts) {
    const c = clanOfParty(party);
    const r: Report[] = [];
    if (settled(s)) return done(speak(s, c, 'afterTalks', r), r);
    if (onTheIce(s)) return done(closeChannel(s, party), [say('comms', 'onTheIceNow')]);
    if (walking(s, c)) return done(speak(s, c, 'walkingGreet', r), r);
    const first = !dm(s, c).met;
    s = setMemory(s, DELEGATE[c], 'met', 1);
    if (opts.private) {
      s = setFlag(s, 'sideRoom');
      return done(speak(s, c, first ? 'privateOpenFirst' : 'privateOpen', r, { confided: confided(s, c) ? 1 : 0 }), r);
    }
    return done(speak(s, c, first ? 'opens' : 'floor', r, { tabled: tabled(s, c) ? 1 : 0 }), r);
  },
  respond(s, a, rng) {
    return delegateRespond(s, a, rng);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
