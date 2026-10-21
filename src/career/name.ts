/**
 * v0.7: the captain's name, the ONLY customizable name in the game.
 *
 * Ships, crew, NPCs, planets, factions and ISA departments are never renamed (there is no UI
 * or command for it; the crew politely decline). The captain's name is validated, stored as
 * plain text, always rendered as text (React escapes it), and never passed to the order
 * interpreter, so a name cannot smuggle markup or commands.
 */
import { rankOf, type RankId } from './ranks';

export const NAME_MIN = 2;
export const NAME_MAX = 32;
/** Used when the captain dismisses the naming prompt; editable later in the Service Record. */
export const DEFAULT_CAPTAIN_NAME = 'Rowan Ashby';

/** Letters (any script, incl. accented), combining marks, spaces, hyphen, apostrophes and period. */
const ALLOWED = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;
const CONTROL = /[\p{Cc}\p{Cf}\u2028\u2029]/u;

export type NameCheck = { ok: true; name: string } | { ok: false; reason: string };

/** Normalise and validate a captain's name. */
export function validateCaptainName(raw: unknown): NameCheck {
  if (typeof raw !== 'string') return { ok: false, reason: 'Enter a name.' };
  if (CONTROL.test(raw)) return { ok: false, reason: 'The name contains control or invisible characters.' };
  const name = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (name.length < NAME_MIN) return { ok: false, reason: `Use at least ${NAME_MIN} characters.` };
  if ([...name].length > NAME_MAX) return { ok: false, reason: `Use at most ${NAME_MAX} characters.` };
  if (!ALLOWED.test(name)) return { ok: false, reason: "Use letters, spaces, hyphens, apostrophes and periods only (it must start with a letter)." };
  if (!/\p{L}.*\p{L}/u.test(name)) return { ok: false, reason: 'Use at least two letters.' };
  if (/([.'’-])\1\1/.test(name)) return { ok: false, reason: 'Too many punctuation marks in a row.' };
  return { ok: true, name };
}

/** The surname used in formal address: the last word, unless it is a lone initial. */
export function surnameOf(name: string): string {
  const words = name.split(' ').filter(Boolean);
  for (let i = words.length - 1; i >= 0; i--) if (words[i].replace(/[.'’-]/g, '').length > 1) return words[i];
  return words[words.length - 1] ?? name;
}

/** "Captain Ashby", "Commodore Ashby". */
export function formalAddress(name: string | null | undefined, rank: RankId = 'captain'): string {
  const title = rankOf(rank).title;
  return name ? `${title} ${surnameOf(name)}` : title;
}

/** "Captain Rowan Ashby" (records and correspondence). */
export function fullTitle(name: string | null | undefined, rank: RankId = 'captain'): string {
  const title = rankOf(rank).title;
  return name ? `${title} ${name}` : title;
}
