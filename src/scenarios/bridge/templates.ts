import type { TemplateFn } from '../../engine/scenario';

const pick = (v: Record<string, string | number>, xs: string[]) => xs[Number(v.v ?? 0) % xs.length];

export const BRIDGE_SCENARIO_TEMPLATES: Record<string, TemplateFn> = {
  bridgeIntro0: () => 'The CSV Halcyon holds station on the edge of Concord survey space. The bridge hums quietly; the viewscreen shows nothing but stars.',
  bridgeIntro1: () => 'Captain on the bridge. All quiet, all systems green. Nothing on the board — the simulation archive is ready whenever you want a drill.',
  bridgeStatus: (v) => `All quiet, Captain. Hull ${v.hull}%, shields ${v.shields}, weapons ${v.weapons}, ${v.alert} alert. No contacts, no standing mission. The simulation archive is ready if you want a drill.`,
  bridgeNoContacts: () => 'No contacts within sensor range, Captain. Just us and the stars.',
  bridgeNoMission: () => 'No standing mission, Captain. We are on station.',
  bridgeNobodyToHail: () => 'There is no one in range to hail, Captain. The channel is quiet.',
  bridgeNothingToDo: () => 'There is nothing out here to do that with, Captain.',
  bridgeHelp: () =>
    'You are on the bridge. Talk to your crew: "First Officer, give me a status report", "Science, what systems are within exploration range?", "Computer, open the simulation archive", or "Computer, begin the Kestrel Incident simulation". Ordinary orders (helm, shields, scans) work here too.',
  simDebriefNarr: (v) => `SIMULATION ENDED — ${v.title}. ${v.summary} The holographic overlay dissolves; the bridge of the Halcyon returns around you.`,
  simDebriefXo: (v) => `Debrief, Captain: ${v.objectives}. It was a simulation — nothing out there has changed. Say "begin the Kestrel Incident simulation" to run another, or open the archive.`,
  simEndedByOrder: () => 'The simulation ends at your order. The holographic overlay dissolves; the bridge of the Halcyon returns around you.',
  simEndedByOrderXo: () => 'Simulation ended, Captain. Nothing from it was recorded. We are back on station.',
  dutyCommissionComms: () => 'Priority transmission from Fleet Command, Captain. Admiral Kaine has confirmed your commission. We are on active duty.',
  dutyCommissionXo: () => 'Congratulations, Captain. The crew are with you. From here on, it is real.',
  dutyWelcomeBack: () => 'Fleet Command confirms your return to active duty, Captain. Your orders, your ship and your record stand exactly as you left them.',
  dutyReserve: () => 'Fleet Command acknowledges: the Halcyon stands down to reserve status. Your career is preserved and the canonical timeline is frozen until you return. The simulator stays open.',
  dutyNoCommission: () => 'There is no commission awaiting an answer, Captain.',
  surveyReport: (v) => `${v.n} systems within exploration range: ${v.list}.`,
  surveyEmpty: () => 'Nothing charted within exploration range, Captain.',
  ambientEng: (v) => pick(v, ['Coolant flush on the port impulse manifold complete. All green.', 'Running the weekly jump-drive capacitor test. Nothing to worry about.', 'Replaced a tired relay in the transporter buffer. She will thank me later.']),
  ambientSci: (v) => pick(v, ['Long-range array recalibrated. Background radiation within norms.', 'Logging a comet on a long ellipse — nothing to concern us.', 'Passive sensors clear. I am cataloguing stellar spectra while it is quiet.']),
  ambientHelm: (v) => pick(v, ['Station-keeping nominal. Drift corrected by two metres per second.', 'Navigational beacons all reporting. Holding position.', 'Plotted a few practice courses, Captain. Just keeping my hand in.']),
  ambientTac: (v) => pick(v, ['Weapons safe, magazine full. Shield emitters tested.', 'Running a targeting-sensor diagnostic. No faults.', 'Quiet watch at tactical.']),
  ambientComms: (v) => pick(v, ['Routine traffic from Fleet Command — nothing addressed to us.', 'Subspace relay chatter only. I will flag anything for us.', 'Picked up a civilian music broadcast from the Ilyria colonies. Shall I pipe it to the mess?']),
  ambientXo: (v) => pick(v, ['Watch rotation posted. All departments report ready.', 'Crew evaluations are on your desk when you have a moment, Captain.', 'A quiet watch. I will take it.']),
  ambientMed: (v) => pick(v, ['Sickbay reports two sprained wrists from the gym and nothing else.', 'Routine physicals complete for gamma shift.', 'All crew fit for duty.']),
};
