/**
 * v0.7 Fleet Command request foundation (deterministic, offline; not yet reachable in play).
 *
 * Lifecycle: submitted → under-review → approved | deferred | denied; withdrawn at any open
 * stage; completed only after the captain confirms. Rules:
 *  - The engine decides. Every decision carries a reason; a deferral names the conditions that
 *    would change it; impossible requests are denied honestly, with alternatives where they exist.
 *  - Supply grants are capped by what the engine says is available (never more than asked).
 *  - Deferred requests are reconsidered whenever in-game conditions change (events, operational
 *    changes, in-game time); the captain does not have to ask again. Nothing advances offline.
 *  - When a deferred request is approved, Fleet Command contacts the captain and asks for
 *    confirmation. Nothing executes without it, and an old approval never executes by itself.
 *  - Amend, query, withdraw, or decline an approval at any time before completion.
 * Wording goes through a FleetVoice (templates here); a later AI voice may rephrase only.
 */
import type { Band, CompetencyId } from '../evaluation/types';

export type Department = 'personnel' | 'logistics' | 'operations' | 'training' | 'legal';
export type RequestCategory = 'supply' | 'transfer' | 'mission' | 'career' | 'discipline';
export type RequestState = 'submitted' | 'under-review' | 'deferred' | 'approved' | 'denied' | 'withdrawn' | 'completed';

export const DEPARTMENT_OF: Record<RequestCategory, Department> = {
  supply: 'logistics',
  transfer: 'personnel',
  mission: 'operations',
  career: 'training',
  discipline: 'legal',
};

/** What the engine knows when it decides (built from canon and the records by the caller). */
export interface FleetFacts {
  /** Canonical minute. */
  clock: number;
  hull: number;
  /** Items Fleet can supply now, and the most per request. */
  stock: Record<string, { available: number; perRequest: number }>;
  /** Postings that exist and are open, with what they require. */
  positions: Record<string, { open: boolean; requires: string[] }>;
  qualifications: string[];
  competencies: Partial<Record<CompetencyId, Band>>;
  /** Restrictions in force ('promotion-review', 'assignment:<scope>'). */
  restrictions: string[];
  /** In-game events that have happened (ids). */
  events: string[];
}

export type Condition =
  | { kind: 'clockAtLeast'; at: number; text: string }
  | { kind: 'hullAtLeast'; value: number; text: string }
  | { kind: 'stock'; item: string; text: string }
  | { kind: 'qualification'; id: string; text: string }
  | { kind: 'positionOpen'; id: string; text: string }
  | { kind: 'noRestriction'; id: string; text: string }
  | { kind: 'event'; id: string; text: string };

export interface RequestInput {
  category: RequestCategory;
  /** What is asked for, in plain words ("six torpedoes", "transfer to the ISV Meridian science post"). */
  subject: string;
  item?: string;
  amount?: number;
  position?: string;
  /** The captain's stated reason (kept on the record). */
  reason?: string;
}

export interface FleetNotice {
  at: number;
  requestId: string;
  kind: 'decision' | 'reconsidered' | 'confirmation-needed' | 'completed' | 'withdrawn';
  text: string;
  read: boolean;
}

export interface FleetRequest {
  id: string;
  department: Department;
  category: RequestCategory;
  input: RequestInput;
  state: RequestState;
  history: { at: number; state: RequestState; reason: string }[];
  deferral: { reason: string; conditions: Condition[] } | null;
  decision: { reason: string; granted?: number; alternatives: string[] } | null;
  /** Approved requests wait here for the captain's confirmation before anything happens. */
  confirmation: 'not-needed' | 'awaiting' | 'confirmed' | 'declined';
}

export interface FleetDesk {
  requests: FleetRequest[];
  notices: FleetNotice[];
  nextSeq: number;
}

export const emptyDesk = (): FleetDesk => ({ requests: [], notices: [], nextSeq: 1 });

/** What the engine must do once the captain confirms (the caller applies it through the commit gate). */
export type Execution = { kind: 'supply'; item: string; amount: number } | { kind: 'transfer'; position: string } | { kind: 'mission'; subject: string } | { kind: 'career'; subject: string } | { kind: 'discipline'; subject: string };

export type Result = { ok: true; desk: FleetDesk; request: FleetRequest; execute?: Execution } | { ok: false; desk: FleetDesk; reason: string };

const OPEN: RequestState[] = ['submitted', 'under-review', 'deferred', 'approved'];
export const isOpen = (r: FleetRequest) => OPEN.includes(r.state) && !(r.state === 'approved' && r.confirmation !== 'awaiting');

const TRANSITIONS: Record<RequestState, RequestState[]> = {
  submitted: ['under-review', 'withdrawn'],
  'under-review': ['approved', 'deferred', 'denied', 'withdrawn'],
  deferred: ['under-review', 'withdrawn'],
  approved: ['completed', 'withdrawn', 'under-review'],
  denied: [],
  withdrawn: [],
  completed: [],
};

export function canMove(from: RequestState, to: RequestState): boolean {
  return TRANSITIONS[from].includes(to);
}

function move(r: FleetRequest, to: RequestState, at: number, reason: string): FleetRequest {
  if (!canMove(r.state, to)) throw new Error(`A ${r.state} request cannot become ${to}.`);
  return { ...r, state: to, history: [...r.history, { at, state: to, reason }] };
}

function holds(c: Condition, f: FleetFacts): boolean {
  switch (c.kind) {
    case 'clockAtLeast':
      return f.clock >= c.at;
    case 'hullAtLeast':
      return f.hull >= c.value;
    case 'stock':
      return (f.stock[c.item]?.available ?? 0) > 0;
    case 'qualification':
      return f.qualifications.includes(c.id);
    case 'positionOpen':
      return !!f.positions[c.id]?.open;
    case 'noRestriction':
      return !f.restrictions.includes(c.id);
    case 'event':
      return f.events.includes(c.id);
  }
}

export const conditionsMet = (conds: Condition[], f: FleetFacts) => conds.every((c) => holds(c, f));

type Verdict = { to: 'approved'; reason: string; granted?: number; alternatives?: string[] } | { to: 'deferred'; reason: string; conditions: Condition[]; alternatives?: string[] } | { to: 'denied'; reason: string; alternatives?: string[] };

/** The deterministic policy: the only place a request is decided. */
export function decide(input: RequestInput, f: FleetFacts): Verdict {
  switch (input.category) {
    case 'supply': {
      const item = input.item ?? '';
      const want = Math.max(0, Math.floor(input.amount ?? 0));
      const s = f.stock[item];
      if (!s) return { to: 'denied', reason: `Logistics does not supply ${item || 'that item'} to ISA ships.`, alternatives: Object.keys(f.stock).slice(0, 4).map((k) => `request ${k}`) };
      if (want <= 0) return { to: 'denied', reason: 'The request does not say how many are needed.', alternatives: [`request up to ${s.perRequest} ${item}`] };
      if (s.available <= 0) return { to: 'deferred', reason: `No ${item} are available to send until the depot is restocked.`, conditions: [{ kind: 'stock', item, text: `${item} back in stock` }], alternatives: [] };
      const granted = Math.min(want, s.available, s.perRequest);
      return granted < want
        ? { to: 'approved', reason: `Logistics can send ${granted} of the ${want} ${item} requested: ${granted === s.perRequest ? `${s.perRequest} is the most issued per request` : 'that is all the depot holds'}.`, granted, alternatives: [`submit a further request for the remaining ${want - granted} later`] }
        : { to: 'approved', reason: `Logistics approves ${granted} ${item}.`, granted };
    }
    case 'transfer': {
      const id = input.position ?? '';
      const p = f.positions[id];
      if (!p) return { to: 'denied', reason: `There is no ISA posting called "${input.subject}". Personnel cannot create one.`, alternatives: Object.entries(f.positions).filter(([, x]) => x.open).slice(0, 3).map(([k]) => `apply for ${k}`) };
      if (f.restrictions.includes(`assignment:${id}`) || f.restrictions.includes('assignment:all')) return { to: 'deferred', reason: 'A disciplinary restriction on postings is in force.', conditions: [{ kind: 'noRestriction', id: `assignment:${id}`, text: 'the restriction lapses or is overturned on appeal' }, { kind: 'noRestriction', id: 'assignment:all', text: 'no general posting restriction' }] };
      const missing = p.requires.filter((q) => !f.qualifications.includes(q));
      const conds: Condition[] = [...(p.open ? [] : [{ kind: 'positionOpen' as const, id, text: 'the posting falls vacant' }]), ...missing.map((q) => ({ kind: 'qualification' as const, id: q, text: `the ${q} qualification` }))];
      if (conds.length) return { to: 'deferred', reason: `Personnel will reconsider when ${conds.map((c) => c.text).join(' and ')}.`, conditions: conds, alternatives: missing.length ? ['complete the recommended training first'] : [] };
      return { to: 'approved', reason: `Personnel approves the transfer to ${input.subject}. You keep your record and qualifications.` };
    }
    case 'mission':
    case 'career':
    case 'discipline':
      // v0.7 foundation: these categories are routed and recorded; their policies arrive with Phase C.
      return { to: 'deferred', reason: `${DEPARTMENT_OF[input.category][0].toUpperCase()}${DEPARTMENT_OF[input.category].slice(1)} has recorded the request. It will be decided when the department's procedures come online.`, conditions: [{ kind: 'event', id: `policy:${input.category}`, text: 'the department is ready to decide' }] };
  }
}

function notify(desk: FleetDesk, n: Omit<FleetNotice, 'read'>): FleetDesk {
  return { ...desk, notices: [...desk.notices, { ...n, read: false }].slice(-100) };
}

function replace(desk: FleetDesk, r: FleetRequest): FleetDesk {
  return { ...desk, requests: desk.requests.map((x) => (x.id === r.id ? r : x)) };
}

/** Apply a verdict to a request under review. */
function apply(desk: FleetDesk, r0: FleetRequest, v: Verdict, at: number, kind: FleetNotice['kind']): { desk: FleetDesk; request: FleetRequest } {
  let r = move(r0, v.to, at, v.reason);
  if (v.to === 'approved') r = { ...r, deferral: null, decision: { reason: v.reason, granted: v.granted, alternatives: v.alternatives ?? [] }, confirmation: 'awaiting' };
  else if (v.to === 'deferred') r = { ...r, deferral: { reason: v.reason, conditions: v.conditions }, decision: { reason: v.reason, alternatives: v.alternatives ?? [] } };
  else r = { ...r, decision: { reason: v.reason, alternatives: v.alternatives ?? [] } };
  let d = replace(desk, r);
  const text = v.to === 'approved' ? `${v.reason} Confirm to proceed, or decline.` : v.to === 'deferred' ? `Deferred: ${v.reason}` : `Denied: ${v.reason}`;
  d = notify(d, { at, requestId: r.id, kind: v.to === 'approved' ? (kind === 'reconsidered' ? 'reconsidered' : 'confirmation-needed') : 'decision', text });
  return { desk: d, request: r };
}

/** Submit a request. It is reviewed at once, deterministically. */
export function submit(desk: FleetDesk, input: RequestInput, f: FleetFacts): Result {
  if (!input.subject?.trim()) return { ok: false, desk, reason: 'The request is empty.' };
  const dup = desk.requests.find((r) => isOpen(r) && r.input.category === input.category && r.input.subject.toLowerCase() === input.subject.toLowerCase());
  if (dup) return { ok: false, desk, reason: `Request ${dup.id} for that is already ${dup.state === 'deferred' ? 'deferred' : dup.state}. Amend or withdraw it instead.` };
  const id = `FR-${String(desk.nextSeq).padStart(4, '0')}`;
  const base: FleetRequest = { id, department: DEPARTMENT_OF[input.category], category: input.category, input: { ...input, subject: input.subject.trim().slice(0, 120), reason: input.reason?.slice(0, 400) }, state: 'submitted', history: [{ at: f.clock, state: 'submitted', reason: 'Submitted by the captain.' }], deferral: null, decision: null, confirmation: 'not-needed' };
  let d: FleetDesk = { ...desk, nextSeq: desk.nextSeq + 1, requests: [...desk.requests, base] };
  const reviewing = move(base, 'under-review', f.clock, `Routed to ${base.department}.`);
  d = replace(d, reviewing);
  const out = apply(d, reviewing, decide(base.input, f), f.clock, 'decision');
  return { ok: true, ...out };
}

/**
 * Reconsider every deferred request against the current facts (call on any in-game change:
 * events, repairs, training results, in-game time). Approvals ask the captain to confirm.
 */
export function reconsider(desk: FleetDesk, f: FleetFacts): { desk: FleetDesk; changed: FleetRequest[] } {
  let d = desk;
  const changed: FleetRequest[] = [];
  for (const r of desk.requests) {
    if (r.state !== 'deferred' || !r.deferral || !conditionsMet(r.deferral.conditions, f)) continue;
    const reviewing = move(r, 'under-review', f.clock, 'Conditions changed; reconsidered.');
    d = replace(d, reviewing);
    const v = decide(r.input, f);
    const out = apply(d, reviewing, v, f.clock, 'reconsidered');
    d = out.desk;
    changed.push(out.request);
  }
  return { desk: d, changed };
}

function find(desk: FleetDesk, id: string): FleetRequest | undefined {
  return desk.requests.find((r) => r.id === id);
}

/** The captain confirms an approved request: only now does it execute (the caller applies the effect). */
export function confirm(desk: FleetDesk, id: string, f: FleetFacts): Result {
  const r = find(desk, id);
  if (!r) return { ok: false, desk, reason: `There is no request ${id}.` };
  if (r.state !== 'approved' || r.confirmation !== 'awaiting') return { ok: false, desk, reason: `Request ${id} is ${r.state}; there is nothing to confirm.` };
  // An approval is checked again before it executes: old approvals never execute on stale facts.
  const v = decide(r.input, f);
  if (v.to !== 'approved' || (v.granted ?? 0) !== (r.decision?.granted ?? 0)) {
    const reviewing = move(r, 'under-review', f.clock, 'Circumstances changed since the approval.');
    const out = apply(replace(desk, reviewing), reviewing, v, f.clock, 'reconsidered');
    return { ok: false, desk: out.desk, reason: `Circumstances changed since the approval: ${v.reason}` };
  }
  let done = move({ ...r, confirmation: 'confirmed' }, 'completed', f.clock, 'Confirmed by the captain.');
  done = { ...done };
  const execute: Execution =
    r.category === 'supply' ? { kind: 'supply', item: r.input.item ?? '', amount: r.decision?.granted ?? 0 } : r.category === 'transfer' ? { kind: 'transfer', position: r.input.position ?? '' } : { kind: r.category, subject: r.input.subject };
  const d = notify(replace(desk, done), { at: f.clock, requestId: id, kind: 'completed', text: `Request ${id} confirmed and carried out.` });
  return { ok: true, desk: d, request: done, execute };
}

/** The captain declines an approval (it is withdrawn; nothing happens). */
export function declineApproval(desk: FleetDesk, id: string, at: number): Result {
  const r = find(desk, id);
  if (!r || r.state !== 'approved' || r.confirmation !== 'awaiting') return { ok: false, desk, reason: `Request ${id} has no approval awaiting your answer.` };
  const out = move({ ...r, confirmation: 'declined' }, 'withdrawn', at, 'The captain declined the approval.');
  return { ok: true, desk: notify(replace(desk, out), { at, requestId: id, kind: 'withdrawn', text: `Request ${id} withdrawn at your word.` }), request: out };
}

/** Withdraw an open request. */
export function withdraw(desk: FleetDesk, id: string, at: number): Result {
  const r = find(desk, id);
  if (!r) return { ok: false, desk, reason: `There is no request ${id}.` };
  if (!canMove(r.state, 'withdrawn')) return { ok: false, desk, reason: `Request ${id} is already ${r.state}.` };
  const out = move({ ...r, confirmation: r.confirmation === 'awaiting' ? 'declined' : r.confirmation }, 'withdrawn', at, 'Withdrawn by the captain.');
  return { ok: true, desk: notify(replace(desk, out), { at, requestId: id, kind: 'withdrawn', text: `Request ${id} withdrawn.` }), request: out };
}

/** Amend an open request (new amount, posting or reason): it is reviewed again. */
export function amend(desk: FleetDesk, id: string, change: Partial<Pick<RequestInput, 'amount' | 'position' | 'reason' | 'subject'>>, f: FleetFacts): Result {
  const r = find(desk, id);
  if (!r) return { ok: false, desk, reason: `There is no request ${id}.` };
  if (!['deferred', 'approved'].includes(r.state)) return { ok: false, desk, reason: `Request ${id} is ${r.state} and cannot be amended.` };
  const input = { ...r.input, ...change };
  const reviewing = move({ ...r, input, confirmation: 'not-needed' }, 'under-review', f.clock, 'Amended by the captain.');
  const out = apply(replace(desk, reviewing), reviewing, decide(input, f), f.clock, 'decision');
  return { ok: true, ...out };
}

/** A follow-up query on an existing request: an honest status from the record. */
export function status(desk: FleetDesk, id: string): string {
  const r = find(desk, id);
  if (!r) return `Fleet Command has no request ${id} on file.`;
  switch (r.state) {
    case 'deferred':
      return `${r.id} (${r.input.subject}) is deferred: ${r.deferral?.reason ?? ''} It will be reconsidered automatically when ${r.deferral?.conditions.map((c) => c.text).join(' and ') ?? 'conditions change'}; you do not need to ask again.`;
    case 'approved':
      return `${r.id} (${r.input.subject}) is approved and waiting for your confirmation: ${r.decision?.reason ?? ''}`;
    case 'denied':
      return `${r.id} (${r.input.subject}) was denied: ${r.decision?.reason ?? ''}${r.decision?.alternatives.length ? ` Alternatives: ${r.decision.alternatives.join('; ')}.` : ''}`;
    case 'withdrawn':
      return `${r.id} (${r.input.subject}) was withdrawn.`;
    case 'completed':
      return `${r.id} (${r.input.subject}) was confirmed and carried out.`;
    default:
      return `${r.id} (${r.input.subject}) is ${r.state.replace('-', ' ')}.`;
  }
}

/** The pending requests Fleet Command keeps in mind when the channel opens. */
export const pending = (desk: FleetDesk) => desk.requests.filter(isOpen);

// ------------------------------------------------------------- provider seam --

/**
 * How Fleet Command words its replies. The default is templates. A later, optional AI voice may
 * implement this to rephrase the SAME decision; it receives the decided text and the request and
 * can change neither. Decisions never come from a voice.
 */
export interface FleetVoice {
  phrase(text: string, request: FleetRequest | null): string;
}
export const templateVoice: FleetVoice = { phrase: (text) => text };

/**
 * Interpreting the captain's words. Offline parsing handles routine requests; an AI interpreter
 * may later propose ONE intent for free text, which is validated exactly like this one's output.
 */
export type FleetIntent =
  | { kind: 'submit'; input: RequestInput }
  | { kind: 'status'; id: string | null }
  | { kind: 'withdraw'; id: string | null }
  | { kind: 'confirm'; id: string | null }
  | { kind: 'decline'; id: string | null }
  | { kind: 'unsupported'; reply: string };

export interface FleetInterpreter {
  parse(text: string): FleetIntent | null;
}

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, twenty: 20 };
const ITEMS: [RegExp, string][] = [
  [/torpedo(e?s)?/, 'torpedoes'],
  [/medical (supplies|stores|kits?)/, 'medical supplies'],
  [/spare parts|parts|components/, 'spare parts'],
  [/fuel|deuterium/, 'fuel'],
  [/food|rations|provisions/, 'provisions'],
];

export const offlineFleetInterpreter: FleetInterpreter = {
  parse(text: string): FleetIntent | null {
    const t = text.toLowerCase().replace(/[^a-z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim();
    const id = /\bfr ?-? ?(\d{1,4})\b/.exec(t);
    const ref = id ? `FR-${id[1].padStart(4, '0')}` : null;
    if (/\b(approve|authori[sz]e|promote|grant) (my|me|myself|this|the)\b/.test(t) || /\b(admiral|fleet command) (said|says|told|already approved)\b/.test(t))
      return { kind: 'unsupported', reply: 'Fleet Command decides requests on the record, not on assertions. Submit the request and it will be reviewed.' };
    if (/\b(status|update|news|what happened|where is|any word)\b.*\brequest\b|\brequest\b.*\b(status|update)\b/.test(t)) return { kind: 'status', id: ref };
    if (/\b(withdraw|cancel|retract)\b.*\brequest\b/.test(t)) return { kind: 'withdraw', id: ref };
    if (/\b(confirm|proceed|go ahead)\b/.test(t)) return { kind: 'confirm', id: ref };
    if (/\b(decline|turn down|refuse) (the |that )?(approval|offer|transfer)\b/.test(t)) return { kind: 'decline', id: ref };
    const req = /\b(request|requesting|need|send us|resupply( of)?|requisition)\b/.test(t);
    if (req) {
      for (const [re, item] of ITEMS) {
        if (!re.test(t)) continue;
        const n = /\b(\d{1,3})\b/.exec(t)?.[1];
        const w = Object.keys(NUMBER_WORDS).find((k) => new RegExp(`\\b${k}\\b`).test(t));
        const amount = n ? Number(n) : w ? NUMBER_WORDS[w] : 0;
        return { kind: 'submit', input: { category: 'supply', subject: `${amount || 'some'} ${item}`, item, amount } };
      }
      const tr = /\b(?:transfer|posting|reassignment) (?:to|as) (?:the )?([a-z0-9 -]{3,60})/.exec(t);
      if (tr) return { kind: 'submit', input: { category: 'transfer', subject: tr[1].trim(), position: tr[1].trim() } };
    }
    return null;
  },
};
