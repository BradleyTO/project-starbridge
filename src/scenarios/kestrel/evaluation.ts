/**
 * v0.7 after-action evaluation descriptor for Training Simulation 001, The Kestrel Incident.
 * Classifies objectives, tiers every ending and names the judgment markers. Endings unchanged.
 * Command challenge (roadmap): reading people and detecting lies; pivotal officer Lt. Szabo.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';
import { factTurn, flagTurn } from '../../evaluation/evaluate';

const NEGOTIATED = ['rescue-corridor', 'negotiated-release', 'standoff-won'];

export const kestrelEvaluation: EvaluationDescriptor = {
  version: 'kestrel-eval-1',
  objectives: { protect: 'primary', escalation: 'primary', assess: 'secondary', intentions: 'secondary', secret: 'secondary', fate: 'secondary' },
  endings: {
    'rescue-withdrawal': { tier: 'success', note: 'The crew were saved and the Halcyon withdrew without a fight.' },
    'partial-withdrawal': { tier: 'partial', note: 'Some of the crew were saved; others were left behind.' },
    'rescue-corridor': { tier: 'success', note: 'Diplomacy opened a rescue corridor; no shot was fired.' },
    'negotiated-release': { tier: 'success', note: 'The Prefect withdrew to argument and evidence.' },
    'standoff-won': { tier: 'success', note: 'The cruiser withdrew without a shot fired in anger.' },
    'driven-off': { tier: 'partial', note: 'The crew were protected, but by force: the border dispute was escalated.' },
    'cruiser-destroyed': { tier: 'partial', note: 'The crew were saved at the cost of a warship, her crew and a border war.' },
    handover: { tier: 'partial', note: 'Peace was bought by handing over a person who sought protection.' },
    'hollow-victory': { tier: 'failure', note: 'The fight was won, but the people it was meant to protect were not saved.' },
    'kestrel-lost': { tier: 'failure', note: 'The Kestrel was lost with people aboard.' },
    abandoned: { tier: 'failure', note: 'The Halcyon left the Kestrel to her fate.' },
    overwhelmed: { tier: 'failure', note: 'Reinforcements arrived while the crisis was unresolved.' },
    stalemate: { tier: 'failure', note: 'Time ran out without a resolution.' },
    'halcyon-lost': { tier: 'failure', note: 'The Halcyon was destroyed.' },
  },
  markers: [
    { id: 'assessed-first', judgment: 'responsible', competencies: ['analysis'], text: 'Assessed the Kestrel before committing the ship.', when: (s) => factTurn(s, 'kestrel_status') !== null },
    { id: 'learned-intent', judgment: 'responsible', competencies: ['analysis', 'communications'], text: "Established the warship's real intentions.", when: (s) => factTurn(s, 'cruiser_intent') !== null },
    { id: 'found-passenger', judgment: 'responsible', competencies: ['analysis'], text: 'Found what the Kestrel was hiding.', when: (s) => factTurn(s, 'passenger_identity') !== null },
    { id: 'negotiated', judgment: 'decisive', competencies: ['diplomacy', 'communications'], text: 'Resolved the standoff by negotiation, without force.', regulation: 'border-accords-4', when: (s) => NEGOTIATED.includes(s.outcome?.id ?? '') },
    { id: 'shielded-kestrel', judgment: 'decisive', competencies: ['emergency', 'resources'], text: 'Used the Halcyon herself to shield or tow the Kestrel clear.', safety: 'civilian', flag: 'interposing', when: (s) => !!s.flags.interposing || !!s.flags.kestrelTowedOut },
    { id: 'handover', judgment: 'reckless', competencies: ['ethics'], text: 'Handed a person who sought the Agency’s protection to the Directorate.', regulation: 'asylum-1', safety: 'civilian', flag: 'passengerHandedOver', when: (s) => !!s.flags.passengerHandedOver },
    { id: 'protected-passenger', judgment: 'responsible', competencies: ['ethics'], text: 'Kept the fugitive under Agency protection.', regulation: 'asylum-1', when: (s) => s.characters.passenger?.ship === 'halcyon' && s.characters.passenger.status !== 'dead' },
    { id: 'abandoned', judgment: 'reckless', competencies: ['ethics', 'emergency'], text: 'Withdrew without attempting a rescue.', regulation: 'care-1', safety: 'civilian', flag: 'jumped', when: (s) => s.outcome?.id === 'abandoned' && (s.counters.rescued ?? 0) === 0 },
    {
      id: 'principled-restraint',
      judgment: 'principled',
      competencies: ['ethics', 'tactical'],
      text: 'Held fire rather than start a border war, under the Rules of Engagement.',
      regulation: 'roe-2',
      when: (s) => ['kestrel-lost', 'overwhelmed', 'stalemate'].includes(s.outcome?.id ?? '') && !s.flags.shotsFired && !s.flags.lockedOnCruiser && (flagTurn(s, 'interposing') !== null || (s.comms?.history?.length ?? 0) > 0),
    },
  ],
  regulations: ['border-accords-4', 'roe-2', 'care-1', 'asylum-1'],
  competencies: ['communications', 'analysis', 'diplomacy'],
  recommend: { diplomacy: 'listening for what the Prefect actually needs, and using the Border Accords' },
};
