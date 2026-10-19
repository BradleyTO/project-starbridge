/**
 * ProposedAction schema — the ONLY thing an interpreter may hand the engine.
 *
 * Milestone 2 uses the deterministic offline parser (src/interpreter/parser.ts).
 * Milestone 3 can plug an AI interpreter in behind the same Interpreter
 * interface; its JSON output is validated with these schemas before the
 * engine's validator ever sees it. Interpreters never touch WorldState.
 */
import { z } from 'zod';

export const ShipIdSchema = z.enum(['halcyon', 'kestrel', 'cruiser']);
export const SystemIdSchema = z.enum(['reactor', 'engines', 'shields', 'weapons', 'sensors', 'tractor', 'transporter', 'jumpDrive', 'comms', 'lifeSupport']);
export const ContactSchema = z.enum(['kestrel', 'cruiser']);

export const CommIntentSchema = z.enum([
  'open', // hail / open a channel
  'ask', // question / request information
  'humanitarian',
  'legal', // treaty, border accords, law
  'reassure',
  'warn', // threaten / demand they back off
  'bluff', // false claim, e.g. reinforcements
  'trade', // offer something in exchange
  'appeal', // personal appeal (family, honour)
  'offerAsylum',
]);

export const TradeOfferSchema = z.enum(['passenger', 'kestrel', 'cargo', 'medical', 'data', 'unspecified']);

export const ImproviseMethodSchema = z.enum([
  'tractorShield', // use the tractor beam to deflect fire
  'plasmaVent', // vent drive plasma as a sensor screen
  'sensorGhost', // spoof sensor contacts / transponders
  'shieldExtend', // extend our shields around the Kestrel
  'ejectCore', // eject the Kestrel's failing reactor core
  'other',
]);

const base = { note: z.string().max(200).optional() };

export const ProposedActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('query'), topic: z.enum(['status', 'systems', 'contacts', 'objectives', 'options', 'help']), ...base }),
  z.object({ type: z.literal('setAlert'), level: z.enum(['green', 'yellow', 'red']), ...base }),
  z.object({ type: z.literal('shields'), raise: z.boolean(), ...base }),
  z.object({ type: z.literal('scan'), target: z.enum(['kestrel', 'cruiser', 'compartment', 'area', 'halcyon']), ...base }),
  z.object({
    type: z.literal('communicate'),
    target: z.enum(['kestrel', 'cruiser', 'passenger']),
    intent: CommIntentSchema,
    offer: TradeOfferSchema.optional(),
    topic: z.enum(['cargo', 'passenger', 'intentions', 'crew', 'general']).optional(),
    ...base,
  }),
  z.object({
    type: z.literal('move'),
    mode: z.enum(['approach', 'range', 'away', 'interpose', 'hold', 'evasive']),
    target: ContactSchema.optional(),
    rangeKm: z.number().min(0).max(500000).optional(),
    ...base,
  }),
  z.object({ type: z.literal('power'), to: SystemIdSchema.optional(), from: SystemIdSchema.optional(), amount: z.number().int().min(5).max(150).default(25), ...base }),
  z.object({
    type: z.literal('weapons'),
    mode: z.enum(['arm', 'lock', 'safe', 'fire']),
    target: ContactSchema.optional(),
    weapon: z.enum(['beams', 'torpedoes']).default('beams'),
    warning: z.boolean().default(false),
    ...base,
  }),
  z.object({ type: z.literal('tractor'), engage: z.boolean(), target: ContactSchema.optional(), ...base }),
  z.object({
    type: z.literal('transport'),
    payload: z.enum(['crew', 'passenger', 'cargo', 'rescueTeam', 'medicalTeam']),
    from: ShipIdSchema.default('kestrel'),
    to: ShipIdSchema.default('halcyon'),
    ...base,
  }),
  z.object({ type: z.literal('repair'), ship: z.enum(['halcyon', 'kestrel']), system: SystemIdSchema, ...base }),
  z.object({ type: z.literal('jump'), mode: z.enum(['charge', 'engage', 'withdraw']), ...base }),
  z.object({ type: z.literal('improvise'), method: ImproviseMethodSchema, target: ContactSchema.optional(), description: z.string().max(300), ...base }),
  z.object({ type: z.literal('wait'), ...base }),
]);

export type ProposedAction = z.infer<typeof ProposedActionSchema>;
export type ProposedActionInput = z.input<typeof ProposedActionSchema>;
export type ActionType = ProposedAction['type'];
export type CommIntent = z.infer<typeof CommIntentSchema>;
export type TradeOffer = z.infer<typeof TradeOfferSchema>;
export type ImproviseMethod = z.infer<typeof ImproviseMethodSchema>;

export const ClarificationSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).max(6),
  /** The clause awaiting a missing slot; the reply is appended and re-parsed. */
  clause: z.string(),
});
export type Clarification = z.infer<typeof ClarificationSchema>;

export const InterpretationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('actions'), actions: z.array(ProposedActionSchema).min(1).max(6), unparsed: z.array(z.string()), source: z.string() }),
  z.object({ kind: z.literal('clarify'), clarification: ClarificationSchema, actions: z.array(ProposedActionSchema).max(6), unparsed: z.array(z.string()), source: z.string() }),
  z.object({ kind: z.literal('unrecognised'), unparsed: z.array(z.string()), source: z.string() }),
]);
export type Interpretation = z.infer<typeof InterpretationSchema>;

/** Parse untrusted interpreter output; returns null (never throws) if invalid. */
export function parseInterpretation(raw: unknown): Interpretation | null {
  const r = InterpretationSchema.safeParse(raw);
  return r.success ? r.data : null;
}
