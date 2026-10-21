/**
 * Naming migrations for stored display text.
 *
 * v0.7.0: the fleet service is the Intergalactic SPACE Agency (ISA); v0.5.1–v0.6.1 said
 * "Intergalactic Star Agency". The abbreviation (ISA) and ship prefix (ISV) are unchanged.
 *
 * v0.5.1 naming migration. The player's faction was "the Concord" and its fleet
 * the "Concord Exploration Service" (ship prefix CSV); they are now "the Agency",
 * the "Intergalactic Star Agency" (ISA), ships prefixed ISV. Stored saves, the
 * canonical record and simulation history may hold the old display text, so it
 * is rewritten when they are read. Internal ids (the faction id 'concord', field
 * names) are unchanged, so nothing else about a save changes. The Tessarine
 * Directorate is not touched.
 */
const RULES: [RegExp, string][] = [
  [/Intergalactic Star Agency/g, 'Intergalactic Space Agency'],
  [/INTERGALACTIC STAR AGENCY/g, 'INTERGALACTIC SPACE AGENCY'],
  [/Concord Exploration Service/g, 'Intergalactic Space Agency'],
  [/CONCORD EXPLORATION SERVICE/g, 'INTERGALACTIC SPACE AGENCY'],
  [/Concord Fleet Command/g, 'ISA Fleet Command'],
  [/CONCORD FLEET COMMAND/g, 'ISA FLEET COMMAND'],
  [/the Concord Fleet\b/g, 'the Intergalactic Space Agency'],
  [/\bCES-(\d+)/g, 'ISA-$1'],
  [/\bCES\b/g, 'ISA'],
  [/\bCSV(?= [A-Z])/g, 'ISV'],
  [/\ba Concord\b/g, 'an Agency'],
  [/\bA Concord\b/g, 'An Agency'],
  [/\bConcord\b/g, 'Agency'],
  [/\bCONCORD\b/g, 'AGENCY'],
];

/** Rewrite one string's legacy faction names. */
export function renameLegacyText(s: string): string {
  if (!/Concord|CONCORD|CSV|CES|Star Agency|STAR AGENCY/.test(s)) return s;
  let out = s;
  for (const [re, to] of RULES) out = out.replace(re, to);
  return out;
}

/** Deep copy of a JSON value with every string (not keys) renamed. Objects without legacy names come back unchanged in content. */
export function renameLegacyNames<T>(v: T): T {
  if (typeof v === 'string') return renameLegacyText(v) as T;
  if (Array.isArray(v)) return v.map((x) => renameLegacyNames(x)) as T;
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = renameLegacyNames(x);
    return o as T;
  }
  return v;
}
