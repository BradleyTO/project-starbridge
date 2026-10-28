/**
 * The Long Picket — the captain's words. Shared by the interpreter rule (which only decides "an
 * order" versus "a question for an officer") and the scenario (which decides what it means).
 * Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends on this file.
 */

/** An order or a question addressed to Cmdr. Marrow. */
export const TO_MARROW = /^\s*(marrow|commander marrow|cmdr\.? marrow|commander|cmdr\.?|number one|xo|first officer|ilse)\b/;
/** "tell him", "say to him", "let him know" — something to be passed to the picket. */
export const TELL = /\b(tell|say to|let (him|them|roake|the picket) know|inform|warn|remind|assure|explain to|put it to|make (it )?clear to|convince)\b/;
/** The picket, by any of its names. */
export const PICKET_WORD = /\b(picket|iron psalm|psalm|roake|lucan|blockade|frigate|dahl|directorate ship|him|them)\b/;
export const COLONY_WORD = /\b(wrenmoor|colony|reeve|marchbank)\b/;

/** A lawful ruse about the Halcyon's company: escorts, a squadron, friends just behind. */
export const ESCORT = /\b(escorts?|escorted|squadron|task force|battle ?group|cruisers?|warships?|frigates?|ships? of the line|reinforcements?|backup|company|friends|the fleet|isa ships?|our ships)\b.*\b(behind|following|coming|on (their|its|the) way|inbound|out|away|over the horizon|close by|nearby|in range|minutes|hour|just|waiting|ready|shadowing|with us)\b|\b(we are|we'?re) not (alone|travelling alone|out here alone)\b|\bnot alone\b/;
/** A ruse about the Halcyon's intentions: she will go through whatever he does. */
export const RESOLVE = /\b(we (are|'re) going through|we (will|shall|'ll) (go|pass|come|proceed|be going) (through|past|on)|we'?re coming through|we go through|not stopping|won'?t stop|will not stop|with or without (your|his)|whether (you|he) (like|likes|agree|agrees|allow|allows)|we proceed (at|in)|we (will|'ll) cross (the|your) line|in (\d+|two|three|five|ten) minutes,? we)\b/;
/** A face-saving token: one crate, an observer along, something for his log. */
export const DEAL_TOKEN = /\b(one crate|a crate|single crate|one of the crates|a token|token (inspection|search|look)|sample|spot.?check|observer|ride along|come with us|accompany us|(an?|your|one) (officer|inspector) (with us|along|aboard to wrenmoor)|watch (them|it|the parts|the assemblies) (being )?(installed|fitted)|for your log|in your log|log (it|an inspection)|something for (your|his) (log|report|superiors|record)|save (his |your )?face|face-?saving)\b/;
/** Waiting out his orders: hold until the relief comes. */
export const DEAL_HOLD = /\b(wait|hold|stand off|stay)\b.*\b(relief|relieved|until you are relieved|your replacement)\b|\b(until|till) (your )?(relief|replacement) (arrives|comes|gets here|is here)\b/;
/** A full inspection. */
export const INSPECT_ALL = /\b(submit to|allow|permit|accept|agree to|consent to|go ahead with|we'?ll take|we will take)\b.*\b(inspection|search|inspect|inspectors?|board(ing)?)\b|\b(let|have) (you|him|them|your (people|team|inspectors)|his (people|team|inspectors)) (board|inspect|search|come aboard)\b|\b(you may|you can|they may|they can|he may|he can) (inspect|search|board|come aboard)\b|\b(inspect|search) (us|the ship|our (cargo|hold|ship))\b|\bfull inspection\b|\bcome aboard and (inspect|search|look)\b/;
/** Letting him aboard as a courtesy, without conceding the claim. */
export const COURTESY = /\b(courtesy|without (prejudice|conceding|accepting|admitting)|not (as|because of) (a |your |any )?right|(does|do|will) not concede|doesn'?t concede|without recogni[sz]ing|good ?will|good faith|as a favou?r)\b/;
/** Evidence of what the cargo is: our own scan of the crates, or the true manifest. */
export const EVIDENCE = /\b(scans?|readings?|sensor (data|logs?)|images?|imagery|proof|evidence|data)\b.*\b(cargo|crates?|parts|hold|assemblies)\b|\b(cargo|crates?|parts|hold|assemblies)\b.*\b(scans?|readings?|images?|imagery|proof|evidence|data)\b|\bshow (him|them|you) (the|our) (cargo|crates|parts|hold|assemblies)\b/;
export const MANIFEST = /\b(manifest|bill of lading|cargo list|cargo declaration)\b/;
export const FORGE = /\b(forge|forged|fake|faked|falsif\w*|doctor(ed)?|alter(ed)?|edit(ed)?|rewrite|false|amend(ed)?|cook)\b.*\b(manifest|records?|logs?|papers|cargo list|bill of lading|declaration)\b|\b(manifest|records?|logs?|papers)\b.*\b(say|show|read|list)s? (that )?(we|it|they)?.*\b(medic\w*|medicine|humanitarian|food|nothing|empty)\b/;
/** A ruse the Code forbids: feigning a humanitarian purpose or distress. */
export const FALSE_MERCY = /\b(medic(al|ine|ines)|hospital|mercy (mission|run|flight|ship)|humanitarian|aid mission|vaccines?|surgical|plasma (supplies|reserves)|blood supplies|field hospital|antivirals?)\b/;
export const DISTRESS = /\b(mayday|sos|distress (call|signal|beacon)|we are in distress|we'?re in distress|(we'?re|we are|the halcyon is) (crippled|disabled|sinking|losing (power|containment|life support))|declar\w* (an )?emergency (aboard|on the halcyon))\b/;
/** Truthful denials don't count as the forbidden ruse. */
export const NOT_MERCY = /\b(not|no|isn'?t|aren'?t|never|nothing)\b[^.]*\b(medic\w*|medicine|humanitarian|mercy|hospital)\b/;
/** "People will die": a claim that lives depend on it. */
export const LIVES = /\b(people|they|colonists|children|families|everyone|hundreds|thousands|lives)\b.*\b(will die|are dying|freeze to death|could die|going to die|perish|lose their lives|be killed)\b|\blives (are |will be )?(at stake|depend|on the line|at risk|in danger)\b|\b(life or death|matter of life|lives depend)\b/;
/** The truth about the cargo and the colony. */
export const TRUTH = /\b(reactor|parts|assemblies|wrenmoor|colony|go(es)? dark|cells|winter|power (down|failing)|the truth|honest(ly)?|plainly)\b/;
export const HANDOVER = /\b(hand (over|them over|it over)|give (him|them|you|it to him) (the )?(crates|parts|cargo|assemblies)|surrender (the )?(cargo|crates|parts|assemblies)|transfer (the )?(cargo|crates|parts|assemblies)|beam (the )?(crates|parts|cargo|assemblies) (to|across|over|aboard)|send (the )?(crates|parts|cargo|assemblies) (to|across|over) (him|them|the picket|the iron psalm)|take (the )?(crates|parts|cargo|assemblies) into (your|his) hold)\b/;
/** Running the line. */
export const RUN = /\b(run (the |his |their |that )?(blockade|picket|line|gauntlet)|break (the |his |their )?(blockade|picket|line)|push (us )?(through|past)|force (our way|the line|a passage|the passage|our passage)|go(ing)? (through|past) anyway|take us (through|past|across the line)|punch through|slip (past|through)( the (picket|line|blockade))?|make a run (for|past)|run for wrenmoor|ignore (the |his )?(picket|blockade|demand|order|line)|cross (the|his) line|full (speed|burn|impulse) (ahead|for wrenmoor|past|through)|(set (a )?course|proceed|head|go|make) (for|to|toward|towards) wrenmoor)\b/;
/** Leaving the Narrows. */
export const TURN_BACK = /\b(turn (us )?(back|around)|go back|head back|give up|abort the (run|delivery|mission)|back out of the narrows|leave the narrows)\b/;
/** Szabo listening to the picket's own traffic. */
export const INTERCEPT = /\b(listen (in|to)|monitor|intercept|eavesdrop|their traffic|his traffic|picket'?s traffic|signals traffic|what (are|is) (they|he) (saying|sending|being told)|their (orders|signals)|his orders|read (their|his) (signals|traffic|mail))\b/;
/** Staged traffic: a lawful ruse about the Halcyon's company, for the picket to overhear. */
export const STAGE = /\b(fake|stage|staged|send|broadcast|transmit|fabricate|make up)\b.*\b(signal|traffic|message|transmission|chatter|call|signals)\b.*\b(escorts?|squadron|cruisers?|fleet|ships?|reinforcements?|company)\b|\b(so (that )?(he|they|the picket) (can |will |would )?overhear|for (him|them|the picket) to overhear)\b/;
export const FLEET_COMMAND = /\b(fleet commands?|commands?|headquarters|starbase|our own (service|people)|the log|the logs|our logs?)\b/;
/** Okafor reading the colony's reactor telemetry. */
export const TELEMETRY = /\b(telemetry|reactor (data|readings|telemetry|status|numbers)|their reactor|the colony'?s reactor|wrenmoor'?s (reactor|cells|power|telemetry)|real deadline|true deadline|how long (they|wrenmoor|the colony) (really )?(has|have|can last))\b/;
/** Marrow's read of the man, or her own word with him. */
export const READ = /\b(read on (him|roake|the commander)|read (him|roake)|know him|knew him|what do you make of|what'?s he like|what is he like|tell me about (him|roake|the commander)|how do (we|i) (play|handle|approach|deal with) (him|this|roake)|will he (believe|buy|fall for|take)|your (read|take|view) (on|of)|old (friend|classmate)|academy|calder|history with)\b/;
export const PRIVATE = /\b(talk|speak|reach out|appeal|go|call)\b.*\b(privately|in private|off the record|as (an? )?(old )?(friend|classmate)|personally|one to one|one-to-one|yourself|direct(ly)?)\b|\b(private channel|back channel|call in (the|a|that|your) favou?r|he owes you|cash in)\b/;
export const SCAN_CARGO = /\b(scan|image|read|survey)\b.*\b(cargo|crates?|hold|assemblies|parts)\b/;
export const SEND = /\b(send|transmit|share|show|give|forward|pass|beam over|copy)\b/;
export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|deadline|when is (the|his) relief|when does (the|his) relief)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will)\b/;
/** Orders for the shared engine (fire, lock, shields, hail, jump, helm moves other than running) that this file must leave alone. */
const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock|target|arm|raise|lower|shields|red alert|yellow alert|stand down alert|jump|engage the jump|computer,? (begin|start|run|end|list|stop))\b/;

/** An order in the standoff (the scenario decides what it means). */
export function picketOrder(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q) return false;
  if (RUN.test(t) || TURN_BACK.test(t) || HANDOVER.test(t)) return true;
  if (TO_MARROW.test(t) && (TELL.test(t) || PRIVATE.test(t))) return true;
  if (TELL.test(t) && (PICKET_WORD.test(t) || COLONY_WORD.test(t))) return true;
  if (INTERCEPT.test(t) || STAGE.test(t) || TELEMETRY.test(t) || FORGE.test(t)) return true;
  if (SCAN_CARGO.test(t) || (SEND.test(t) && (MANIFEST.test(t) || EVIDENCE.test(t)))) return true;
  if (INSPECT_ALL.test(t) || DEAL_TOKEN.test(t) || DEAL_HOLD.test(t)) return true;
  if (PRIVATE.test(t)) return true;
  return false;
}

/** A question for an officer about the standoff. */
export function picketAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return READ.test(t) || CASE.test(t) || COUNSEL.test(t) || (IS_QUESTION.test(t) && /\b(picket|roake|psalm|wrenmoor|colony|reeve|relief|sweep|orders|bluff|inspection|cargo|crates|reactor|dahl)\b/.test(t));
}

/** Work for the first officer: something to tell the picket, a private word, her read, her counsel. */
export const forMarrow = (t: string) => TELL.test(t) || PRIVATE.test(t) || READ.test(t) || COUNSEL.test(t) || /\b(what do you make|do you think|is he)\b/.test(t);

/** The simulation's names, for the interpreter's vocabulary (so the spell-corrector leaves them alone). */
export const PICKET_NAMES = /\b(wrenmoor|roake|lucan|marchbank|odile|reeve|dahl|ysara|psalm|picket|calder|narrows|sable|blockade|assemblies|crates|manifest|inspection|inspectors?|relief|telemetry|escorts?|squadron|courtesy)\b/;

/** An order addressed to one of the Halcyon's own crew. */
export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander marrow|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|engineering|medical|comms|xo)\b/i;

/** On an open channel, a statement rather than an order ("we have company", "you may inspect one crate"). */
export const SPEECHY = /^\s*(the|our|your|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?ll|it|it'?s|there|they|they'?re|this|that|these|those|here|not|no|yes|please|may|might|thank|thanks|sorry|listen|look|understood|commander|reeve|lucan|roake|dahl|nobody|no one|every|everyone|all|some|she|he|her|his|one|two|three|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing)\b|\b(you|your|yours)\b/i;
