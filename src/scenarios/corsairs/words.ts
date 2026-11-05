/**
 * Corsairs of the Veyl Shoals — the captain's words. Shared by the interpreter rule (which only
 * decides "an order" versus "a question for an officer") and the scenario (which decides what it
 * means). Intent is read from general vocabulary, not fixed phrases. No imports: the parser depends
 * on this file.
 */

/** The corsairs and the captain who speaks for them. */
export const CORSAIR_WORD = /\b(draycott|ione|hagfish|corsairs?|raiders?|pirates?|flagship|gudgeon|snipe|escorts?)\b/;
/** The Syndicate's collector and his gunship. */
export const SKERRIT_WORD = /\b(skerrit|amos|gavel|gunship|collector|syndicate|grist)\b/;

// ---- where the ship goes
export const NEEDLE_WORD = /\b(needle|narrow (channel|passage|gap|way)|the channel|the passage|the narrows?)\b/;
export const SHADOW_WORD = /\b(anvil|behind (the|that) (big )?(rock|asteroid|anvil)|in (the|its) (lee|shadow)|the (rock'?s|anvil'?s) (lee|shadow)|shadow of (the|that) (rock|anvil|asteroid)|the lee)\b/;
export const POCKET_WORD = /\b(back to (the )?(beacon|pocket|start|where we were)|the beacon|the pocket|hold (our )?position|stay (where we are|put|here)|stay at the beacon)\b/;
export const GAP_WORD = /\b(the gap|the opening|the open (way|side|end)|the clear (way|lane|passage)|the obvious way|the wide (gap|way|lane))\b/;
export const SUMP_WORD = /\b(sump|dead[- ]end)\b/;
/** Going straight at the corsairs' flagship. */
export const CHARGE = /\b(charge|ram|close (on|with|in on) (her|them|the (flagship|hagfish|corsairs?|raider))|close the (distance|range)|go (straight )?(at|for) (her|them|the (flagship|hagfish|corsairs?|raider))|run (straight )?at (her|them|the (flagship|hagfish))|head (straight )?for (her|the (flagship|hagfish|raider))|press (the attack|them|her)|take the fight to (her|them)|go after (her|them|the (flagship|hagfish))|get (in )?close to (her|the (flagship|hagfish))|right on top of (her|them|the flagship|the hagfish)|attack (the )?(flagship|hagfish|raider))\b/;
/** Getting out of the shoal. */
export const EXIT = /\b(get us out( of (here|the shoals?|the rocks|the dust))?|out of (here|the shoals?|the rocks|the dust)|leave (the )?(shoals?|rocks|area|system|here)|withdraw|break out|run for it|make a run|make for open space|head for open space|retreat|clear (of )?the shoals?|we'?re leaving|we are leaving|ease (us )?out|slip (us )?out|back out|pull (us )?out)\b/;
/** Going quiet. */
export const DARK = /\b(go dark|run dark|running dark|silent running|rig for (silent|dark)|kill (all |our )?(emissions|power)|cut (our |all )?emissions|go quiet|cold and quiet|run cold|go cold|play dead|emissions? (silence|control)|power down (everything|the ship)|dark ship)\b/;
export const UNDARK = /\b(light (us |her |the ship )?up|end (silent running|the silence)|bring (everything|power|systems) back( up)?|power (us |everything )?(back )?up|stop running dark)\b/;
/** A sensor ghost or decoy, from the Chief. */
export const GHOST = /\b(sensor (ghost|image|echo|decoy)|ghost|decoy|false (echo|contact|image|target|signature|halcyon)|phantom|fake (signature|echo|contact|ship|halcyon)|second halcyon|double of (us|the ship))\b/;
/** Lighting the shoal up with an active sweep. */
export const PING = /\b(active (ping|scan|sweep|sensors)|ping|full (active )?sweep|light up the (shoals?|rocks|dust)|sweep the shoals?|go active)\b/;
/** A probe into the dust. */
export const PROBE = /\b(probe|drone|sensor (pod|buoy)|buoy)\b/;
/** The old survey beacon's charts. */
export const CHARTS = /\b(charts?|survey (data|records|logs|maps?)|the beacon'?s? (data|records|logs|memory|maps?|charts?)|beacon (data|records|logs|charts?)|maps? of the (shoals?|rocks))\b/;
/** Listening to the corsairs' own traffic. */
export const LISTEN = /\b(listen|monitor|intercept|eavesdrop|tap|decrypt|crack)\w*\b.*\b(traffic|chatter|comms?|signals?|channels?|talk|transmissions?|frequenc\w+)\b|\b(their (traffic|chatter|talk|transmissions)|what (are )?they('?re)? saying)\b/;
/** Shifting the rubble out of the Needle. */
export const CLEAR = /\b(clear|shift|push|move|tractor|drag|pull|blast)\b.*\b(rubble|debris|boulders?|rocks? (out of|from|in) the (needle|channel|passage)|the (needle|channel|passage) (clear|open))\b|\bclear the (needle|channel|passage)\b/;
/** Staging traffic from ISA ships that are not there (a ruse about the ship's own strength). */
export const STAGE = /\b(fake|stage|forge|spoof|simulate|invent|make up|counterfeit|mock up|put out|broadcast)\b.*\b((frigate|fleet|warship|squadron|patrol|escort|cruiser|isa) (traffic|chatter|signals?|transmissions?|calls?|ships?)|reinforcements|company|a frigate|a squadron|a patrol|the fleet)\b/;
/** A false surrender, false distress, or a false humanitarian purpose (never a lawful ruse). */
export const FEIGN = /\b(mayday|sos|medical emergency|plague|contagion|quarantine|hospital ship|mercy ship|white flag|false (surrender|distress\w*|flag|mayday|colou?rs)|pretend (to|we|that we) (surrender|strike|are (crippled|dying|disabled|in distress\w*|helpless|sick))|feign\w* (surrender|distress\w*|a (breakdown|breach|wreck)|being (crippled|disabled))|(fake|false|bogus|phoney|phony|forged) (distress\w*|mayday|surrender|emergency|sickness|outbreak|plague)|(signal|send|broadcast|transmit|put out|raise)\b.*\b(distress\w*|mayday|surrender|white flag|medical emergency))\b/;
/** "We surrender", said over the channel. */
export const YIELD = /\b(we (surrender|strike|yield|give up)|we'?re (surrendering|striking)|i (surrender|yield))\b/;
/** Telling the corsairs about strength the Halcyon (claims to) have. */
export const BLUFF = /\b(frigates?|warships?|squadron|fleet|reinforcements?|(more|other|isa) ships|patrol|our (escort|friends|sister ship)|already (signalled|called)|called (it )?in|help is coming|on (their|its) way|right behind us|outgun\w*|out-?gun\w*|outrange\w*|torpedoes (are )?(armed|ready|aimed)|we have (you|your ships) (targeted|locked|bracketed|in our sights)|bracketed|we know (where|exactly where) (you|your)|we can see (all of )?you|you can'?t win|you won'?t win|you'?ll lose|you will lose|last warning|final warning|i will (destroy|end) you|we will (destroy|end) you)\b/;
/** Naming the corsairs' play to Draycott. */
export const NAME_PLAY = /\b(pincer|crossfire|herd\w*|drive us|driving us|bleed\w*|wear us down|pick at us|nibble|pattern|we('?ve| have) read (you|your)|we know your (plan|play|game|trick|pattern)|your (plan|play|trap|ambush|little game) (won'?t|will not|isn'?t|is not)|we see your (plan|play|game|trap))\b/;
/** About Draycott's debt. */
export const DEBT = /\b(debt|owe|owes|owing|creditor|syndicate|grist|skerrit|collector|who (sent|is making|pays|is paying|are you working for) you|why (are you|do you|this)|what do you (really )?(need|want)|what'?s (this|it) really about|in trouble|desperate|who are you running from|what are you afraid of)\b/;
/** Offering Draycott protection. */
export const PROTECT = /\b(protect\w*|asylum|safe ?conduct|isa custody|our custody|shelter|safe passage|keep you safe|witness|testify|testimony|evidence against|come with us|come aboard|under our flag|we can help you|let us help)\b/;
/** Giving the corsairs the cargo. */
export const CARGO = /\b(take|have|give|hand( over)?|drop|jettison|release|surrender|eject|dump|open)\b.*\b(cargo|lattices?|the hold|our hold|consignment|shipment|cargo lock)\b|\b(the )?(cargo|lattices?) (is|are) yours\b/;
/** Handing Draycott to the collector. */
export const HANDOVER = /\b(hand (her|draycott|captain draycott|the prisoner|them) (over|to)|give (her|draycott|captain draycott) (to|up)|she'?s yours|take her|release (her|draycott|captain draycott) to|turn (her|draycott|captain draycott) over|you can have her|she'?s all yours|let (him|skerrit|the collector|the syndicate) have her)\b/;
/** Refusing the collector. */
export const REFUSE = /\b(no\b|refuse|not (handing|giving|releasing)|won'?t (hand|give|release)|she stays|under (isa |our )?protection|in (isa |our )?custody|not yours|forget it|not happening|leave (now|the shoals?|us)|go home|be on your way|stand off|back off|denied|request denied|never)\b/;
/** Demanding Draycott strike. */
export const STRIKE = /\b(strike (your|her) colou?rs|surrender|stand (your ships )?down|power down (your|her) weapons|heave to|yield|give (yourself|yourselves) up|lay down (your )?(arms|weapons)|prepare to be boarded|give up|it'?s over|you'?re finished|call off (your|the) (ships|attack|escorts))\b/;
/** Questions. */
export const PATTERN_Q = /\b(pattern|formation|what are they (doing|up to|planning|trying)|their (plan|play|moves?|intentions?|tactics?|game)|how (are they|do they mean to|will they) (going to )?(take|come at|attack|hit) us|read (them|their|the corsairs)|what'?s their (plan|play|game)|ambush)\b/;
export const TERRAIN_Q = /\b(terrain|ground|rocks?|anvil|needle|dust|shoals?|iron|ice|channel|passage|gap|sump|cover|map)\b/;
export const NEG = /\b(not|never|no|won'?t|will not|don'?t|do not|can'?t|cannot|nothing)\b/;
/** "tell her", "say to", "let them know". */
export const TELL = /\b(tell|say to|let (her|him|them|draycott|skerrit|the corsairs?|the collector) know|inform|warn|remind|assure|explain to|put it to|make (it )?clear to|offer|ask|order|demand|signal|hail)\b/;

export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|status|how many|how far|eta|situation|sitrep)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation|read|thoughts|plan|idea|take)|what would you do|what should (we|i) do|recommend|any (ideas|thoughts)|talk me through|options)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will)\b/;
/** Orders for the shared engine (hail, channel, weapons, shields, alert, jump, wait) that this file must leave alone. */
const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock|target|arm|raise|lower (the )?shields|shields|red alert|yellow alert|stand down alert|jump|engage the jump|charge the jump|wait|status|help|options|objectives|evasive|computer,? (begin|start|run|end|list|stop))\b/;

const ORDERS = [NEEDLE_WORD, SHADOW_WORD, SUMP_WORD, CHARGE, EXIT, DARK, UNDARK, GHOST, PING, CHARTS, LISTEN, CLEAR, STAGE, FEIGN, HANDOVER];

/** An order in this simulation (the scenario decides what it means). */
export function corsairsOrder(t: string, addressee?: string | null): boolean {
  if (NOT_OURS.test(t)) return false;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q) return false;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (PROBE.test(t) && /\b(launch|send|drop|fire|deploy|put|release)\b/.test(t)) return true;
  if ((POCKET_WORD.test(t) || GAP_WORD.test(t)) && /\b(take|move|bring|get|head|go|steer|make|fly|back|hold|stay|ease|slip)\b/.test(t)) return true;
  if (CARGO.test(t) && /\b(jettison|release|eject|dump|drop|open|give|hand)\b/.test(t)) return true;
  if (TELL.test(t) && (CORSAIR_WORD.test(t) || SKERRIT_WORD.test(t))) return true;
  if (addressee === 'helm' && /\b(take|move|bring|get|head|steer|fly)\b/.test(t)) return true;
  return false;
}

/** A question for an officer about the situation. */
export function corsairsAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  return CASE.test(t) || COUNSEL.test(t) || PATTERN_Q.test(t) || (IS_QUESTION.test(t) && (TERRAIN_Q.test(t) || CORSAIR_WORD.test(t) || SKERRIT_WORD.test(t) || /\b(bryony|skiff|distress|call|recording|cargo|lattices?|hull|shields?|dark|ghost|probe|beacon)\b/.test(t)));
}

/** The simulation's names, for the interpreter's vocabulary (so the spell-corrector leaves them alone). */
export const CORSAIRS_NAMES = /\b(corsairs?|veyl|shoals?|bryony|hagfish|gudgeon|snipe|gavel|grist|draycott|ione|skerrit|amos|needle|anvil|sump|lattices?|pincer|herd|bleed)\b/;

/** An order addressed to one of the Halcyon's own crew. */
export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

/** On an open channel, a statement rather than an order ("strike your colours", "who sent you?"). */
export const SPEECHY = /^\s*(the|our|your|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?ll|it|it'?s|there|there'?s|they|they'?re|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|captain|collector|draycott|skerrit|ione|amos|nobody|no one|every|everyone|all|some|she|he|one|in|with|if|then|very well|agreed|fine|ok(ay)?|nothing|hold|keep|stay|get|bring|start|send|stop|come|drop|take|go|leave|don'?t|do not|help|how|what|who|why|when|where|are|is|can|could|will|would|do|does|anyone|anybody|tell|strike|surrender|stand|power|lay|give|hand|call|turn|back|mayday|you'?re|you)\b|\b(you|your|yours)\b/i;
