/**
 * v0.7 captain profile (starbridge.profile.v1): the captain's chosen name. Shared by the Training
 * Record and the Service Record so the name stays with every record across sessions, promotions
 * and transfers. Records are tied to the profile, not to the name, so renaming never resets or
 * corrupts progress.
 */
export interface CaptainProfile {
  schema: 'starbridge.profile';
  version: 1;
  /** The captain's name; null until chosen (or defaulted when the prompt is dismissed). */
  name: string | null;
  /** The one-time naming prompt has been answered or dismissed. */
  prompted: boolean;
  /** Name changes, oldest first (the personnel file keeps them). */
  history: { from: string | null; to: string; atIso: string }[];
}

export const defaultProfile = (): CaptainProfile => ({ schema: 'starbridge.profile', version: 1, name: null, prompted: false, history: [] });

export function isProfile(v: unknown): boolean {
  const p = v as Partial<CaptainProfile>;
  return !!p && (p.name === null || typeof p.name === 'string') && typeof p.prompted === 'boolean' && Array.isArray(p.history);
}
