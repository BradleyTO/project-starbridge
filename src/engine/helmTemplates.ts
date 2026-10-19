/**
 * Scenario-independent narration for helm order lifecycles, posture and
 * comms routing. Scenarios merge these into their template table and may
 * override any key.
 */
import type { TemplateFn } from './scenario';

const T: Record<string, TemplateFn> = {
  // ---- acknowledgements (order received; course plotted)
  helmAck_interpose: (v) => `Aye, Captain. Plotting an interpose course between ${v.target} and ${v.second} — coming to ${v.course}, ETA ${v.eta}.`,
  helmAck_approach: (v) => `Aye. Setting course for ${v.target}${v.km ? `, closing to ${v.km}` : ''} — currently ${v.now}. Heading ${v.course}, ETA ${v.eta}.`,
  helmAck_standoff: (v) => `Aye. Adjusting to hold ${v.km || 'our distance'} from ${v.target} (currently ${v.now}). ETA ${v.eta}.`,
  helmAck_intercept: (v) => `Aye. Intercept course on ${v.target}, leading her track — heading ${v.course}, ETA ${v.eta}.`,
  helmAck_follow: (v) => `Aye. Falling in behind ${v.target}${v.km ? ` at ${v.km}` : ''}. ETA ${v.eta}.`,
  helmAck_escort: (v) => `Aye. Taking escort station off ${v.target}'s starboard side. ETA ${v.eta}.`,
  helmAck_block: (v) => `Aye. Putting us across ${v.target}'s path — heading ${v.course}, ETA ${v.eta}.`,
  helmAck_retreat: (v) => `Aye. Opening the range from ${v.target}${v.km ? ` to ${v.km}` : ''}, full impulse away.`,
  helmAck_flee: (v) => `Aye. Making for the Concord border — heading ${v.course}, ETA ${v.eta}.`,
  helmAck_orbit: (v) => `Aye. Entering a ${v.km || '3,000 km'} orbit around ${v.target}. ETA ${v.eta}.`,
  helmAck_holdStation: (v) => (v.target && v.target !== 'position' ? `Aye. Holding station on ${v.target} at ${v.now}.` : 'Aye. Holding position.'),
  helmAck_allStop: () => 'All stop. Bleeding off our velocity.',
  helmAck_face: (v) => (v.target && v.target !== 'position' ? `Coming about to face ${v.target}, Captain — ETA ${v.eta}.` : `Coming about to ${v.course}. ETA ${v.eta}.`),
  helmAck_evasive: () => 'Evasive pattern, Captain — harder to hit, harder to aim.',
  // ---- progress
  helmUnderway: (v) => `Underway. Heading ${v.course}, ${v.speed} km/s.`,
  helmDrilledReal: (v) => `We've run this manoeuvre ${v.n} times in the simulator, Captain. This time it's for real.`,
  helmDrilledSim: (v) => `Same drill as before, Captain; that's ${v.n} times in the simulator now.`,
  helmPersistent: () => "And we'll hold it no matter what, Captain; nothing automatic will pull us off it.",
  // ---- standing orders and prohibitions (v0.4)
  standingAck: (v) => `Understood. When ${v.when}: ${v.what}. Not before.`,
  standingFired: (v) => `Standing order: ${v.when}. Executing.`,
  standingCancelled: (v) => `Standing order cancelled: it can no longer happen that ${v.when}.`,
  standingNoShip: (v) => `We can't set a standing order on the ${v.ship}, Captain; they're not on our sensors.`,
  standingNoHelm: () => 'There is no helm order to wait for, Captain.',
  restrictAck: (v) => `Aye, ${v.what}${v.until ? ` until ${v.until}` : ' until you say otherwise'}.`,
  restrictionLifted: (v) => `Lifting your earlier hold (${v.what}) on your order.`,
  restrictionHolds: (v) => `Holding off: your standing instruction is that ${v.what}.`,
  redAlertShieldsHeld: () => 'Red alert. Shields held down per your order, Captain.',
  learnAck: (v) => `Understood. When you say "${v.phrase}", we'll take it as: ${v.meaning}.`,
  cannotComply: () => 'Unable to comply, Captain.',
  helmSuperseded: (v) => `Belaying the previous order (${v.label}).`,
  helmLost: (v) => `Lost the reference for "${v.label}" — all stop until you give me a new course.`,
  helmEnginesLost: () => "Impulse is down, Captain! We're drifting — I can't hold the course.",
  cannotCatch: (v) => `Captain, ${v.target} is making ${v.theirs} km/s and our best is ${v.ours}; we won't catch her while she runs. Trying anyway.`,
  // ---- completions
  helmDone_interpose: () => "We're in position between them, Captain. Holding station on the line.",
  helmDone_approach: (v) => `We're at ${v.km} km from ${v.target}, Captain. Matching her motion.`,
  helmDone_standoff: (v) => `Holding at ${v.km} km from ${v.target}.`,
  helmDone_intercept: (v) => `Intercept complete — ${v.target} is ${v.km} km off our bow.`,
  helmDone_follow: (v) => `On ${v.target}'s tail, ${v.km} km back. Keeping pace.`,
  helmDone_escort: (v) => `In escort position off ${v.target}. Keeping station.`,
  helmDone_block: (v) => `We're across ${v.target}'s path, Captain. She'll have to go through us or around.`,
  helmDone_retreat: (v) => `We've opened the range — ${v.km} km from ${v.target}.`,
  helmDone_flee: () => "We've crossed into Concord space, Captain.",
  helmDone_orbit: (v) => `In orbit around ${v.target}, ${v.km} km.`,
  helmDone_holdStation: () => 'Holding station.',
  helmDone_allStop: () => 'All stop, Captain. Relative velocity zero.',
  helmDone_face: (v) => (v.target && v.target !== 'position' ? `Bow on ${v.target}, Captain.` : 'We have come about, Captain.'),
  helmDone_evasive: () => 'Evasive pattern complete.',
  // ---- posture, comms routing, validation
  posture_nonHostile: () => "Understood — we'll keep everything non-threatening. Helm will keep our approach slow near the warship.",
  posture_assertive: () => "Understood. We'll make sure they see we mean business.",
  posture_neutral: () => 'Understood. Normal posture.',
  postureConflict: () => "Captain, that will look aggressive — it cuts against the non-hostile posture you ordered. Proceeding.",
  onScreen: () => 'Channel open — on screen.',
  onScreenSplit: () => 'Hailing both ships. Putting them on screen, split view.',
  nobodyToHail: () => "There's no one in range to hail, Captain.",
  noBorder: () => 'There is no border to run for here, Captain.',
};

export const HELM_TEMPLATES = T;
