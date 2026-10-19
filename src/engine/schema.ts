/**
 * ProposedAction schema — the ONLY thing an interpreter may hand the engine.
 *
 * The deterministic offline parser (src/interpreter/parser.ts) produces these today.
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

export const ManeuverIntentSchema = z.enum([
  'approach', // close to a (default or given) range
  'standoff', // hold a given distance (closer or further)
  'interpose', // sit between two references, continuously updated
  'intercept', // pursuit with lead
  'follow', // shadow from behind
  'escort', // formation alongside
  'block', // sit in the target's path
  'retreat', // open the range from a threat
  'flee', // run for the Concord border
  'orbit',
  'holdStation', // keep the current offset from a target (or hold position)
  'allStop',
  'face', // come about to face a target (or reverse heading)
  'evasive',
]);
export const NavRefSchema = z.enum(['kestrel', 'cruiser', 'border']);
export const StanceSchema = z.enum(['neutral', 'nonHostile', 'assertive']);

const base = { note: z.string().max(200).optional() };

/** Events a standing (conditional / sequenced) order can wait for. */
export const TriggerSchema = z.discriminatedUnion('kind', [
  /** A ship's weapons reach a state: armed (or more), locked on, or fired. */
  z.object({ kind: z.literal('weapons'), ship: ContactSchema, state: z.enum(['armed', 'locked', 'fired']) }),
  /** A ship comes within / goes beyond a range of the Halcyon. */
  z.object({ kind: z.literal('range'), ship: ContactSchema, op: z.enum(['within', 'beyond']), km: z.number().min(100).max(500000) }),
  /** The helm order issued earlier in the same command completes (sequencing: "…, then …"). */
  z.object({ kind: z.literal('helmDone') }),
]);
export type Trigger = z.infer<typeof TriggerSchema>;

/** Things a captain can forbid until further notice (or until a trigger). */
export const RestrictSubjectSchema = z.enum(['armWeapons', 'fireWeapons', 'raiseShields', 'lowerShields']);
export type RestrictSubject = z.infer<typeof RestrictSubjectSchema>;

const BASE_ACTIONS = [
  z.object({ type: z.literal('query'), topic: z.enum(['status', 'systems', 'contacts', 'objectives', 'options', 'help']), ...base }),
  z.object({ type: z.literal('setAlert'), level: z.enum(['green', 'yellow', 'red']), ...base }),
  z.object({ type: z.literal('shields'), raise: z.boolean(), ...base }),
  z.object({ type: z.literal('scan'), target: z.enum(['kestrel', 'cruiser', 'compartment', 'area', 'halcyon']), ...base }),
  z.object({
    type: z.literal('communicate'),
    /** 'all' hails every contact in view. */
    target: z.enum(['kestrel', 'cruiser', 'passenger', 'all']),
    /** Put the channel on the main viewscreen. */
    onScreen: z.boolean().default(false),
    intent: CommIntentSchema,
    offer: TradeOfferSchema.optional(),
    topic: z.enum(['cargo', 'passenger', 'intentions', 'crew', 'general']).optional(),
    ...base,
  }),
  z.object({
    type: z.literal('maneuver'),
    intent: ManeuverIntentSchema,
    target: NavRefSchema.optional(),
    /** Other end of an interposition. */
    second: NavRefSchema.optional(),
    rangeKm: z.number().min(0).max(500000).optional(),
    speed: z.enum(['slow', 'half', 'full']).default('full'),
    /** "No matter what": keep at it indefinitely; automatic fallbacks never displace it. */
    persistent: z.boolean().default(false),
    ...base,
  }),
  /** Declared posture/intent; perceivable by NPCs and biases other orders. */
  z.object({ type: z.literal('posture'), stance: StanceSchema, ...base }),
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
] as const;

/** Actions that can be executed directly (and the only kind a standing order may carry). */
export const BaseActionSchema = z.discriminatedUnion('type', [...BASE_ACTIONS]);
export type BaseAction = z.infer<typeof BaseActionSchema>;

export const ProposedActionSchema = z.discriminatedUnion('type', [
  ...BASE_ACTIONS,
  /** "If the Kestrel arms its weapons, raise our shields": runs `actions` when `trigger` is met. */
  z.object({ type: z.literal('standing'), trigger: TriggerSchema, actions: z.array(BaseActionSchema).min(1).max(4), ...base }),
  /** "Do not power up weapons" / "not until then": a prohibition, optionally lifted by a trigger. */
  z.object({ type: z.literal('restrict'), subject: RestrictSubjectSchema, until: TriggerSchema.optional(), ...base }),
  /** "When I say 'go dark', I mean …": teach the crew a phrase (stored as familiarity, not world state). */
  z.object({ type: z.literal('learn'), phrase: z.string().min(2).max(60), meaning: z.string().min(2).max(300), ...base }),
]);

export type ProposedAction = z.infer<typeof ProposedActionSchema>;
export type ProposedActionInput = z.input<typeof ProposedActionSchema>;
export type ActionType = ProposedAction['type'];
export type ManeuverIntentT = z.infer<typeof ManeuverIntentSchema>;
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
  z.object({ kind: z.literal('actions'), actions: z.array(ProposedActionSchema).min(1).max(8), unparsed: z.array(z.string()), notes: z.array(z.string()).default([]), source: z.string() }),
  z.object({ kind: z.literal('clarify'), clarification: ClarificationSchema, actions: z.array(ProposedActionSchema).max(8), unparsed: z.array(z.string()), notes: z.array(z.string()).default([]), source: z.string() }),
  z.object({ kind: z.literal('unrecognised'), unparsed: z.array(z.string()), notes: z.array(z.string()).default([]), source: z.string() }),
]);
/**
 * `unparsed` holds clause fragments the interpreter could not map to any action:
 * the hook for a future AI fallback interpreter. `notes` holds rationale it
 * understood but that needs no action ("we have no quarrel with them").
 */
export type Interpretation = z.infer<typeof InterpretationSchema>;
export type InterpretationInput = z.input<typeof InterpretationSchema>;

/** Parse untrusted interpreter output; returns null (never throws) if invalid. */
export function parseInterpretation(raw: unknown): Interpretation | null {
  const r = InterpretationSchema.safeParse(raw);
  return r.success ? r.data : null;
}
