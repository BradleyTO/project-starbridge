/**
 * The Seventh Bell — the captain's words. Shared by the interpreter rule (which only decides "an
 * order" versus "a question for an officer") and the scenario (which decides what it means).
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

export const STAVELY_WORD = /\b(stavely|jonah|tamber|the cutter|cutter'?s captain|her captain)\b/;
export const VORY_WORD = /\b(vory|ilsabet|examiner|seraphine|the courier|the directorate)\b/;
export const FLEET_WORD = /\b(fleet( command)?|the admiral|admiral|calderon|rear admiral|directive|fleet'?s (signal|order|request))\b/;

/** "tell her", "say to", "let them know". */
export const TELL = /\b(tell|say to|let (her|him|them|the examiner|stavely|fleet) know|inform|assure|explain to|put it to|make (it )?clear to|signal|reply to|answer|send (word|a message|a reply) to|ask)\b/;

// ---- the finding
/** Declaring a finding, to anyone. */
export const FINDING = /\b(my finding|the finding (is|of this inquiry)|this inquiry finds|the inquiry finds|i find that|i have found|i find the|i('?ve| have)? conclude[ds]?|my conclusion|i rule|i'?m ruling|i am ruling|i determine|i have determined|our finding|we find that|for the record,? (the|it|he|she|stavely|the tamber)|log (the|my) finding|record (the|my) finding|enter (the|my) finding|finding:)\b/;
/** The kind of finding (priority: unlawful, then mistake, then lawful). */
export const SAYS_UNLAWFUL = /\b(unlawful(ly)?|not lawful|not justified|unjustified|excessive|second volley|fired again|turned away|after (she|the courier) turned|after the threat (ended|was over|had passed)|should not have fired again|not self-defen[cs]e|no longer a threat|criminal|a crime|wrongful(ly)?|breach(ed)? of (the )?rules)\b/;
export const SAYS_MISTAKE = /\b(mistake|mistaken|error|misread|misidentif\w*|mistook|navigation (pulse|sweep|lidar)|lidar|good faith|honest(ly)? mistaken|in good faith|took (it|a \w+) for a lock|was not a (weapons )?lock|wasn'?t a lock|no lock)\b/;
export const SAYS_LAWFUL = /\b(self-defen[cs]e|lawful(ly)?|justified|acted (correctly|properly|within)|by the book|within (the|his|her) rules|she locked|locked (on|first)|had a (real )?lock|a real lock|fired in defen[cs]e|the courier (locked|fired) first)\b/;

/** Blaming Stavely (before he is heard, it is an accusation without a hearing). */
export const BLAME = /\b(you fired (unlawfully|on a|without)|you (killed|murdered)|it was your fault|your fault|you('?re| are) (responsible|to blame|guilty)|stavely is (responsible|to blame|guilty)|he('?s| is) (responsible|to blame|guilty)|reckless|trigger-?happy|you panicked|he panicked|murder\w*|you broke|he broke)\b/;
/** Admitting fault to the Directorate. */
export const ADMIT = /\b(our fault|we were wrong|the tamber was wrong|the tamber was at fault|we('?re| are) (responsible|to blame|at fault)|the isa is (responsible|to blame|at fault)|we fired (unlawfully|without cause|wrongly)|we accept (the )?blame|we take (full )?responsibility|it was our fault)\b/;
/** Regret for the dead, without a finding. */
export const REGRET = /\b(sorry|regret|condolences|grief|mourn\w*|their families|your dead|your (two )?crew who died|two (of your )?(people|crew) (died|are dead|were killed)|they did not deserve|honou?r (them|your dead)|my sympathy|deeply sorry)\b/;
/** Hostility to the examiner. */
export const HOSTILE = /\b(back off|or else|you'?ll regret|get out|shut up|liars?|spy|spies|don'?t (lecture|threaten) me|your (people|government) (started|asked for) (it|this)|you deserved|you had it coming|we owe you nothing|go to hell|watch your tone)\b/;
/** Sharing the evidence or inviting a joint examination. */
export const SHARE = /\b(share|send (you|her|the examiner)|copy (of|you)|transmit (the|our|everything)|see (it )?for yourself|examine (it|the record|the evidence) (with us|together|yourself)|joint (examination|inquiry|finding|review)|together|your own (engineer|officer|people|tactical)|(come|send someone) aboard|nothing (held|kept) back|full record|everything we have|open (the|our) (record|evidence))\b/;
/** Asking someone for their account. */
export const ACCOUNT = /\b(what happened|report (what|how|why|your|everything|the|in)|tell me (what|how|why|your)|your (account|side|version|story)|in your own words|walk me through|explain (what|why|how)|why did you fire|what did you see|take (your|a) statement|give (me )?(your|a) statement|i want to hear|i'?m listening|go on|from the beginning)\b/;
/** Telling the grounds and inviting him to explain (also counts as a hearing). */
export const HEAR_INVITE = /\b(you('?ll| will) be heard|i want your (account|side)|before (i|any) (find|finding|decide)|inquiry into|you have the right|tell me in your own words)\b/;
/** Telling Stavely what the evidence shows. */
export const TELL_EVIDENCE = /\b(the record shows|the (fire-control )?record|your (own )?board|the bell('?s)? (record|shows)|the debris|the evidence|we have (it|the record|proof)|lidar|navigation pulse|second volley|she (had )?turned away|turned away|the lock dropped|stern)\b/;
/** Offering the courier help. */
export const AID = /\b(medical (help|team|aid|assistance)|our doctor|a doctor|help (you|your crew)|aid|assistance|a tow|tow you|tractor you|supplies|repair (help|team|crews?)|anything you need|do you need)\b/;
/** Asking the examiner's leave for Osei to examine the dead. */
export const LEAVE = /\b(leave|permission|may (our|my) doctor|with your (leave|permission)|examine (your|the) dead|see (your|the) dead|examine the bodies|post[- ]?mortem|autopsy)\b/;

// ---- Fleet Command
export const REFUSE = /\b(refuse|refusing|decline|declining|will not (comply|do (it|that|so))|won'?t (comply|do (it|that|so))|cannot comply|can'?t comply|reject|rejecting|will not (find|make|sign)|won'?t (find|make|sign))\b/;
export const OBJECT = /\b(formal objection|formally object|object formally|enter an objection|lodge (an|a formal) objection|register (an|a formal) objection|i object)\b/;
export const REASON = /\b(because|reason|grounds|breach|unlawful|false|untrue|not true|falsif\w*|§|section|article|the code|isa-com|regulation|the evidence|the record|before the evidence|it would (require|mean))\b/;
export const REFER = /\b(office of independent review|independent review|refer\w*|appeal)\b/;
export const COMPLY = /\b(comply|complying|will do|understood,? (admiral|fleet)|as (you|fleet) (wish|direct)|aye,? admiral|we'?ll find (it|self))\b/;

// ---- officers' work
export const READ_FIRING = /\b(read|pull|check|review|go through|look at|examine|analy[sz]e|get|bring up|download|request)\b.*\b(fire[- ]?control|firing (record|logs?|data|solution)|targeting (record|logs?|data)|weapons (record|logs?|data)|tamber'?s (record|logs?|board|data)|her board|combat (record|logs?)|the cutter'?s (record|logs?|data))\b/;
export const COLD_READ = /\b(read it cold|cold read|by the book|set (that|it|your friendship|the friendship|your history|it) aside|as if you (didn'?t|did not) know (him|stavely)|without (fear or favou?r|the friendship|bias)|straight read|read it straight|again,? (straight|cold|clean)|do you know (him|(captain |commander |lt\.? cmdr\.? )?(jonah )?stavely|jonah|the cutter'?s captain|her captain)|how do you know (him|(captain )?stavely)|you know (him|(captain )?stavely)\b|history with (him|(captain )?stavely)|served with (him|(captain )?stavely)|conflict of interest|any connection|connection to (him|stavely)|are you (friends|close))\b/;
export const RASK_TALK = /\b(rask|tactical)\b.*\b(talk|speak|reason) (to|with) (him|stavely|jonah|the cutter)\b|\b(talk|speak) to (him|stavely|jonah),? rask\b|^tactical: .*\b(talk|speak) (to|with) (him|stavely|jonah)\b/;
export const DEBRIS = /\b(scan|examine|analy[sz]e|study|read|survey|look (at|over)|inspect|check)\b.*\b(debris|wreck\w*|damage|hull|emitters?|hits?|scoring|impact|the courier'?s (hull|damage|emitters?)|seraphine'?s (hull|damage|emitters?)|courier (closely|in detail))\b/;
export const BELL_READ = /\b(pull|read|get|check|download|query|interrogate|access|retrieve|play back|review)\b.*\b(bell|beacon|seventh bell|the bell'?s|passive record|beacon'?s (record|log|recorder))\b/;
export const RECOVER = /\b(recover|retrieve|salvage|collect|fetch|bring (in|back|aboard)|pick up|get)\b.*\b(recorder|memory core|black box|bell'?s (core|recorder|memory)|beacon'?s (core|recorder|memory))\b|\b(shuttle|team|eva)\b.*\b(bell|beacon)\b/;
export const EXAMINE_DEAD = /\b(examine|look at|autopsy|post[- ]?mortem|see to|check)\b.*\b(dead|bodies|the two|casualties|remains)\b|\bhow did (they|the two|her crew) die\b|\bcause of death\b/;

export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|deadline|status|evidence)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will|have)\b/;
/** Orders for the shared engine (hail, channel, alert, wait, weapons) that this file must leave alone. */
const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock|target|arm|raise|lower|shields|red alert|yellow alert|stand down alert|jump|engage the jump|wait|status|help|options|objectives|computer,? (begin|start|run|end|list|stop))\b/;

const ORDERS = [FINDING, READ_FIRING, COLD_READ, RASK_TALK, DEBRIS, BELL_READ, RECOVER, EXAMINE_DEAD, REFER, OBJECT];

/** An order or a line of speech in this simulation (the scenario decides what it means). */
export function bellOrder(t: string, addressee?: string | null): boolean {
  // "Rask, talk to Stavely": the old tie, put to use (not a hail).
  if (addressee === 'tactical' && /^(go |please )?(talk|speak|reason) (to|with) (him|stavely|jonah|captain stavely|the cutter'?s captain)\b/.test(t)) return true;
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q && !READ_FIRING.test(t) && !DEBRIS.test(t) && !BELL_READ.test(t) && !COLD_READ.test(t)) return false;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (TELL.test(t) && (STAVELY_WORD.test(t) || VORY_WORD.test(t) || FLEET_WORD.test(t))) return true;
  if (REFUSE.test(t) && FLEET_WORD.test(t)) return true;
  if (BLAME.test(t) || ADMIT.test(t) || REGRET.test(t) || SHARE.test(t) || (FLEET_WORD.test(t) && (REFUSE.test(t) || COMPLY.test(t)))) return true;
  return false;
}

/** A reply to Fleet Command's signal (refusal, objection, referral, compliance or the finding), which the scenario answers in place of exercise control. */
export function bellFleetReply(t: string): boolean {
  return REFUSE.test(t) || OBJECT.test(t) || REFER.test(t) || COMPLY.test(t) || FINDING.test(t) || /\b(directive|finding|self-defen[cs]e|the evidence)\b/.test(t);
}

/** A question for an officer about the situation. */
export function bellAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || COLD_READ.test(t) || (IS_QUESTION.test(t) && /\b(stavely|tamber|cutter|vory|examiner|courier|seraphine|bell|beacon|fleet|admiral|directive|frigate|record|volley|lock|fired|dead|died|rask|debris|happened|evidence)\b/.test(t));
}

/** The simulation's names, for the interpreter's vocabulary (so the spell-corrector leaves them alone). */
export const BELL_NAMES = /\b(tamber|stavely|jonah|seraphine|vory|ilsabet|calderon|harrow|bell|beacon|examiner|lidar|volley|volleys|directive|frigate|mercy|finding|findings|inquiry|unlawful|unlawfully|misread|misidentified|wreckage|debris|emitter|emitters|recorder|stern|flank|condolences|autopsy|objection|referral|independent|self-defence|self-defense|fire-control|teodor|godfather|accusation|excessive|unjustified)\b/;

/** An order addressed to one of the Halcyon's own crew. */
export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

/** On an open channel, a statement rather than an order ("we will", "your crew", "my finding"). */
export const SPEECHY = /^\s*(report (?=what|how|why|your|everything|in )|go to hell|you|you'?re|you'?ve|you'?ll|the|our|your|my|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?d|i'?ll|it|it'?s|there|they|they'?re|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|captain|examiner|stavely|jonah|ilsabet|vory|nobody|no one|every|everyone|all|some|she|he|one|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing|send|for the record|tell me|walk me|why|what|how|explain|go on|from the beginning|can you|could you|will you|may)\b|\b(you|your|yours)\b/i;
