/**
 * Daily canonical-start allowance.
 *
 * Starting a NEW canonical mission costs one credit. Viewing, declining or
 * ignoring an offer, saving, resuming or finishing a started mission, and any
 * simulation, cost nothing. Charging is idempotent per mission id.
 *
 * LOCAL DEVELOPMENT ONLY: this ledger lives in the browser's storage, so a
 * determined user can edit it. Server-side enforcement (tied to an account and
 * subscription) is a later milestone; the shape of the ledger is meant to move
 * there unchanged.
 */
import type { CreditLedger, ResetPolicy } from './types';
import { UNIVERSE_SCHEMA_VERSION } from './types';

export const DEFAULT_DAILY_LIMIT = 10;
export const DEFAULT_POLICY: ResetPolicy = { kind: 'local-midnight', hour: 0 };
const DAY_MS = 24 * 3600 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

/** The allowance period that `now` falls in. */
export function periodFor(now: Date, policy: ResetPolicy, current?: Pick<CreditLedger, 'periodKey' | 'periodStartIso'>): { key: string; startIso: string } {
  if (policy.kind === 'rolling-24h') {
    if (current && current.periodKey.startsWith('rolling:')) {
      const start = Date.parse(current.periodStartIso);
      if (Number.isFinite(start) && now.getTime() - start < DAY_MS && now.getTime() >= start) return { key: current.periodKey, startIso: current.periodStartIso };
    }
    return { key: `rolling:${now.toISOString()}`, startIso: now.toISOString() };
  }
  // Local calendar day, shifted so the day starts at `hour` local time.
  const shifted = new Date(now.getTime() - policy.hour * 3600 * 1000);
  const key = `day:${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}@${policy.hour}`;
  const start = new Date(shifted.getFullYear(), shifted.getMonth(), shifted.getDate(), policy.hour, 0, 0, 0);
  return { key, startIso: start.toISOString() };
}

export function defaultLedger(now = new Date()): CreditLedger {
  const p = periodFor(now, DEFAULT_POLICY);
  return { schema: 'starbridge.credits', version: UNIVERSE_SCHEMA_VERSION, dailyLimit: DEFAULT_DAILY_LIMIT, policy: DEFAULT_POLICY, periodKey: p.key, periodStartIso: p.startIso, used: 0, charged: [] };
}

/** Roll the ledger into the current period (resetting usage when the period changed). */
export function refresh(l: CreditLedger, now = new Date()): CreditLedger {
  const p = periodFor(now, l.policy, l);
  if (p.key === l.periodKey) return l;
  return { ...l, periodKey: p.key, periodStartIso: p.startIso, used: 0 };
}

export function remaining(l: CreditLedger, now = new Date()): number {
  const r = refresh(l, now);
  return Math.max(0, r.dailyLimit - r.used);
}

export function isCharged(l: CreditLedger, missionKey: string): boolean {
  return l.charged.some((c) => c.missionId === missionKey);
}

export type ChargeResult = { ok: true; ledger: CreditLedger; charged: boolean } | { ok: false; ledger: CreditLedger; reason: 'exhausted' };

/** Charge one credit for starting `missionKey`, unless it was already charged. */
export function charge(l: CreditLedger, missionKey: string, now = new Date()): ChargeResult {
  const r = refresh(l, now);
  if (isCharged(r, missionKey)) return { ok: true, ledger: r, charged: false };
  if (r.used >= r.dailyLimit) return { ok: false, ledger: r, reason: 'exhausted' };
  return { ok: true, charged: true, ledger: { ...r, used: r.used + 1, charged: [...r.charged, { missionId: missionKey, atIso: now.toISOString() }] } };
}

/** Milliseconds until the allowance next resets. */
export function msUntilReset(l: CreditLedger, now = new Date()): number {
  const r = refresh(l, now);
  if (r.policy.kind === 'rolling-24h') return Math.max(0, Date.parse(r.periodStartIso) + DAY_MS - now.getTime());
  const start = Date.parse(r.periodStartIso);
  // Next local start-of-period (handles DST by recomputing from the calendar).
  const s = new Date(start);
  const next = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1, r.policy.hour, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

export function configure(l: CreditLedger, opts: { dailyLimit?: number; policy?: ResetPolicy }, now = new Date()): CreditLedger {
  const dailyLimit = opts.dailyLimit === undefined ? l.dailyLimit : Math.max(0, Math.min(1000, Math.round(opts.dailyLimit)));
  const policy = opts.policy ?? l.policy;
  const samePolicy = JSON.stringify(policy) === JSON.stringify(l.policy);
  const base = samePolicy ? l : { ...l, policy, periodKey: '', periodStartIso: '' };
  return refresh({ ...base, dailyLimit }, now);
}

/** Developer action: start a fresh period now (usage back to zero). Charged missions stay charged. */
export function resetNow(l: CreditLedger, now = new Date()): CreditLedger {
  if (l.policy.kind === 'rolling-24h') return { ...l, periodKey: `rolling:${now.toISOString()}`, periodStartIso: now.toISOString(), used: 0 };
  return { ...refresh(l, now), used: 0 };
}

export function formatDuration(ms: number): string {
  const m = Math.ceil(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}
