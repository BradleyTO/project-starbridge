/** Words for Gravity's Edge: orders to the helm, the Chief, Varga and Szabo, and lines to the observatory. */

/** Helm: deeper into the tide. */
export const DEEPER = /\b(deeper|go (in )?closer|take us (in )?closer|move (us )?closer|closer to (the )?(star|vagrant)|descend|take us down|go down|lower (our )?orbit|tighten (the |our )?orbit|dive|in we go|further in|farther in)\b/;
/** Helm: one band back out. */
export const SHALLOWER = /\b(pull (us )?back|ease (us )?(off|back|out)|back (us )?off|climb|shallower|raise (our )?orbit|widen (the |our )?orbit|further out|farther out|move (us )?(back|away) from (the )?(star|vagrant)|up a level|one band out|not so deep)\b/;
/** Helm: out of the well altogether. */
export const WITHDRAW = /\b(take us out|get us out|withdraw|break orbit|pull (us )?out|abort (the |our )?(run|pass|survey|recording)|leave (the )?(well|star|pass|tide)|end the (run|pass|survey|recording)|out of the (well|tide)|clear of the (star|vagrant|tide|well)|that'?s enough|we'?re done here|call it)\b/;
/** Chief Okafor: brace the frame. */
export const REINFORCE = /\b(reinforce|brace|bracing|structural integrity|integrity field|shore up|strengthen) ?(the )?(frame|hull|ship|her|field)?|\b(divert|route|put|send) (more )?power (in)?to (the )?(frame|hull|structural|integrity)/;
/** Helm: present the smallest profile to the tide. */
export const END_ON = /\b(end[- ]on|bow (at|toward|towards|to) (the )?(star|vagrant)|point (the |our )?(bow|nose) (at|toward|towards|to)|smallest profile|edge[- ]on|nose (in|first)|stern (at|to)|turn (her|the ship|us) (side|end|edge)|align (with|along) the (tide|gradient|field lines)|streamline)\b/;
/** Cut the probe loose to ride the pass alone. */
export const RELEASE = /\b(release|cut|drop|let go|cast off|unhook|detach|launch|let (the )?(lodestar|probe) (go|fall|dive))\b.{0,20}\b(lodestar|probe|tether)\b|\b(lodestar|probe)\b.{0,20}\b(go in alone|dive|fall|loose|free|on its own|alone)\b/;
/** Szabo: send the data to the observatory. */
export const RELAY = /\b(relay|patch|send|stream|copy|back up|beam|transmit|forward|mirror|downlink)\b.{0,40}\b(data|telemetry|readings|recording|dataset|signal|feed)\b.{0,40}\b(observatory|lisle|fennick|aalto|director|dish|moon)\b|\b(observatory|lisle|aalto|dish)\b.{0,40}\b(receive|take|record|catch|copy|track)\b.{0,30}\b(data|telemetry|readings|probe|feed|lodestar)\b|\bback ?up (the |our )?(data|recording|dataset)\b|\b(relay|patch|stream) (it|the (data|telemetry|feed)) to\b/;
/** Okafor's own read, beyond the gauges. */
export const FEEL = /\b(gut|feel|feeling|instinct|hunch|honest (read|opinion)|your (read|sense|judgement|judgment|instinct|ears)|how does she (feel|sound)|how'?s she (feel|holding|sound)|what is she telling you|what'?s she telling you|is she (holding|telling)|can she take (it|more)|how much more can she take|how much can she take|trust (the )?gauges|believe (the )?gauges|gauges (right|wrong|lying))\b/;
/** Okafor: listen to the frame. */
export const LISTEN = /\b(listen to (the |her )?(frame|hull|ship|her)|keep (an )?ear on|listen (for|out)|put (a |your )?(stethoscope|ear) on|(monitor|watch) (the )?frame (by ear|closely)|tell me (when|if) she|sound(s)? of the frame)\b/;
/** Rask: crew out of the outer sections. */
export const CLEAR = /\b(clear|evacuate|empty|seal)\b.{0,30}\b(outer|exposed)\b.{0,20}\b(sections?|decks?|hull|ring|compartments?)\b|\b(crew|everyone|personnel|people)\b.{0,20}\b(inboard|to the core|in from the outer|out of the outer|away from the hull)\b/;
/** Bridge questions. */
export const GAUGE = /\b(hull (stress|strain|status|report)|strain|stress|gauges?|frame|how is (she|the hull|the ship) holding|holding together|damage report)\b/;
export const DATA = /\b(data|dataset|recording|readings|how much (have we|do we have)|how much of the pass|science)\b/;
export const GLITCH = /\b(glitch\w*|starquake|quake|stutter\w*|predict|forecast|when (will|does) (it|the star))\b/;

export const HAIL = /\b(hail|call|contact|raise|reach|get|speak (to|with)|talk (to|with)|open a (channel|line) to)\b/;
export const TELL = /\b(tell|say to|let (him|them) know|inform|assure|explain to|ask|offer|warn)\b/;
export const AALTO_WORD = /\b(aalto|director|lisle|observatory|fennick)\b/;
export const CASE = /\b(what do we (have|know)|where are we|summar\w*|recap|how long|how much time|time left|status)\b/;
export const COUNSEL = /\b(what do you (think|recommend|suggest|advise)|your (advice|view|opinion|recommendation)|what would you do|what should (we|i) do|recommend)\b/;
export const IS_QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will|have)\b/;

/** Lines to the director. */
export const DISH = /\b(dish|antenna|receive|relay|telemetry|track (the )?(probe|lodestar)|catch|record (it|our|the)|back ?up|take (the |our )?data|downlink)\b/;
export const PROMISE_FULL = /\b(we'?ll|we will|i'?ll|i will|you'?ll|you will)\b.{0,30}\b(get|have|bring|record)\b.{0,20}\b(the )?(whole|full|entire|complete) (pass|dataset|record|run)\b/;
export const NO_PROMISE = /\b(no promises|can'?t promise|cannot promise|won'?t promise|as (far|long) as (it'?s|it is) safe|the ship comes first|my crew comes first|not at any cost|not at the cost)\b/;
export const PUSH_BACK = /\b(no|not|won'?t|will not|can'?t|cannot)\b.{0,20}\b(deeper|closer|risk (my|the) (ship|crew))\b/;

const NOT_OURS = /^\s*(?:\w+,\s*)?(hail|open (a )?channel|close (the )?channel|end (the )?(channel|call)|fire|lock\b|target|arm|raise (the )?shields|lower (the )?shields|shields|red alert|yellow alert|stand down alert|jump|engage the jump|charge the jump|wait|status|help|options|objectives|computer,? (begin|start|run|end|list|stop))\b/;
const NOT_WEAPONS = /\b(weapons?|phasers?|torpedo(es)?|target|fire)\b/;

/** "Do it anyway": confirming an order an officer has just warned about. */
export const CONFIRM = /^\s*(do it|go ahead|proceed|carry on|take her in|take us in|that'?s an order|you have your orders|i said do it|i insist|understood,? do it)( anyway| now| regardless|,? that'?s an order)?\s*$/;

const ORDERS = [CONFIRM, WITHDRAW, DEEPER, SHALLOWER, REINFORCE, END_ON, RELEASE, RELAY, LISTEN, CLEAR];

/** An order in this simulation. */
export function gravityOrder(t: string, addressee?: string | null): boolean {
  if (NOT_OURS.test(t)) return false;
  if (NOT_WEAPONS.test(t)) return false;
  if (CONFIRM.test(t)) return true;
  const q = IS_QUESTION.test(t) && !/\b(can you|could you|would you|will you)\b/.test(t);
  if (q) return false;
  if (ORDERS.some((re) => re.test(t))) return true;
  if (TELL.test(t) && AALTO_WORD.test(t)) return true;
  if (addressee === 'engineering' && /\b(frame|hull|power|field|listen|brace)\b/.test(t)) return true;
  if (addressee === 'helm' && /\b(deeper|closer|back|out|orbit|band|profile|turn)\b/.test(t)) return true;
  if (addressee === 'comms' && /\b(data|telemetry|observatory|relay|lisle|dish)\b/.test(t)) return true;
  return false;
}

export function gravityAsk(t: string): boolean {
  if (NOT_OURS.test(t)) return false;
  if (FEEL.test(t)) return true;
  return CASE.test(t) || COUNSEL.test(t) || (IS_QUESTION.test(t) && /\b(star|vagrant|tide|frame|hull|gauges?|strain|stress|data|probe|lodestar|glitch\w*|quake|stutter|observatory|aalto|deep|deeper|safe|limit|sections?|crew)\b/.test(t));
}

export const GRAVITY_NAMES = /\b(vagrant|corriden|lisle|fennick|aalto|benedikt|lodestar|probe|tide|frame|gauges|glitch|starquake|stutter|deeper|withdraw|reinforce|telemetry|observatory)\b/;

export const ADDRESSED = /^\s*(dr\.?\s+|doctor|doc\b|chief|lieutenant|lt\.?\s|commander|cmdr\.?|number one|helm|ensign|computer|varga|osei|okafor|szabo|rask|marrow|adeyemi|tactical|sensors|science|engineering|medical|comms|xo)\b/i;

export const SPEECHY = /^\s*(you|you'?re|you'?ve|you'?ll|the|our|your|my|we|we'?re|we'?ve|we'?ll|i|i'?m|i'?ve|i'?d|i'?ll|it|it'?s|there|they|this|that|here|not|no|yes|please|thank|thanks|sorry|listen|look|understood|director|benedikt|every|all|if|then|very well|agreed|fine|ok(ay)?|nothing|tell me|why|what|how|who|explain|can you|could you|will you|may|did|does|do|turn|send|track|get|keep|stand)\b|\b(you|your|yours)\b/i;
