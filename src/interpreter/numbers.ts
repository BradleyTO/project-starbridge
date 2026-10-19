/** Converts spelled-out and abbreviated numbers ("ten thousand", "10k", "10,000") to digits. */
const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = { hundred: 100, thousand: 1000 };

export function wordsToDigits(text: string): string {
  // "10,000" -> "10000"
  let t = text.replace(/(\d),(?=\d{3}\b)/g, '$1');
  // "10k" / "1.5k" -> digits
  t = t.replace(/\b(\d+(?:\.\d+)?)\s*k\b(?!m)/g, (_m, n: string) => String(Math.round(parseFloat(n) * 1000)));
  // "half" -> 50 (only in "half power"); leave other uses alone
  const words = t.split(/(\s+|-)/);
  const out: string[] = [];
  let acc: number | null = null;
  let cur = 0;
  const flush = () => {
    if (acc !== null) {
      out.push(String(acc + cur));
      acc = null;
      cur = 0;
    }
  };
  for (const w of words) {
    const lw = w.toLowerCase();
    if (/^\s+$|^-$/.test(w)) {
      if (acc === null) out.push(w);
      continue;
    }
    if (lw in UNITS) {
      acc = acc ?? 0;
      cur += UNITS[lw];
    } else if (lw in SCALES && acc !== null) {
      if (SCALES[lw] === 100) cur = (cur || 1) * 100;
      else {
        acc += (cur || 1) * SCALES[lw];
        cur = 0;
      }
    } else {
      if (acc !== null) {
        flush();
        out.push(' ');
      }
      out.push(w);
    }
  }
  flush();
  return out.join('').replace(/\s{2,}/g, ' ');
}
