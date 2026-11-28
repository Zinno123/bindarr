// Set-code OCR only identifies a printing's number, not its foil rarity.
export function ygoCodes(text) {
  const normalized = String(text || '').toUpperCase().normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\bRD\s*\/\s*/g, 'RD-').replace(/\s*-\s*/g, '-');
  // Rush Duel has an additional RD- prefix. Do not truncate it to a TCG code.
  return [...new Set(normalized.match(/\b(?:RD-)?[A-Z0-9]{2,8}-(?:[A-Z]{1,2})?\d{2,4}[A-Z]?\b/g) || [])];
}
export function readYgoCode(text) {
  const codes = ygoCodes(text);
  return codes.length === 1 ? codes[0] : null;
}

// Multiple OCR regions of the SAME capture reduce small-text misses. They are
// not independent photos and are never treated as proof of foil rarity.
export function combineYgoEvidence(texts) {
  const usable = texts.filter(t => typeof t === 'string' && t.trim());
  const codes = [...new Set(usable.flatMap(ygoCodes))];
  const code = codes.length === 1 ? codes[0] : null;
  const firstEdition = usable.some(t => /\b1\s*(?:ST\s+EDITION|[.\s]+AUFLAGE)\b/i.test(t.normalize('NFKC')));
  const limited = usable.some(t => /\b(?:LIMITED\s+EDITION|LIMITIERTE\s+AUFLAGE)\b/i.test(t));
  return { code, conflict: codes.length > 1, firstEdition: firstEdition && !limited,
    limited, rush: codes.some(c => c.startsWith('RD-')),
    japanese: codes.some(c => /-JP\d/i.test(c)) };
}
export function exactYgoRows(rows, code) {
  if (!code || !Array.isArray(rows)) return [];
  const matches = rows.filter(c => c?.id && String(c.number || '').trim().toUpperCase() === code);
  return [...new Map(matches.map(c => [c.id, c])).values()];
}
// An English catalogue can be used as a reference for modern German codes,
// but never silently count the reference as an exact printing.
export function referenceCode(code) {
  return typeof code === 'string' ? code.replace(/-DE(?=\d)/, '-EN').replace(/-G(?=\d)/, '-E') : null;
}

// The printed language tag is evidence for this physical copy, not a new catalogue row.
export function ygoCopyLanguage(code) {
  if (typeof code !== 'string') return null;
  if (/-(?:DE|G)\d/i.test(code)) return 'German';
  if (/-(?:EN|E)\d/i.test(code)) return 'English';
  return null;
}
