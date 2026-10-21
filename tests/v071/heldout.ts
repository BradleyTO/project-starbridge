/**
 * v0.7.1 held-out paraphrases. Written BEFORE the Fleet / career / station routing was
 * implemented and never used for tuning. The first-run results are reported in CHANGELOG 0.7.1.
 */
export const HELDOUT_FLEET = [
  'get me Fleet Command',
  'Szabo, raise ISA headquarters',
  'patch me through to Fleet',
  'open a secure line to Command',
  'can you connect me with the ISA?',
  'I need to speak to Fleet Command',
  'comms, put me through to Training Command',
  'send a message to HQ',
  'call headquarters',
  'establish a link with ISA Fleet Command please',
  'contact the Agency',
  'hail command',
];
export const HELDOUT_CAREER = [
  'what should I work on?',
  'where am I weakest?',
  'which simulation would you recommend next?',
  'how are my evaluations looking?',
  "what's my strongest competency?",
  'any suggestions for my next training exercise?',
  'Number one, how is my training going?',
  'what does my record say about me?',
  'what skills do I need to improve?',
  'suggest a sim for me',
];
/** Must NOT be captured by the Fleet / career routing. */
export const HELDOUT_NEGATIVE = [
  'hail the liner',
  'command, hold position',
  'scan for vessels',
  'tactical, report',
  'what simulations are available?',
  'begin the Kestrel Incident simulation',
  'tell me about the nearby systems',
];
