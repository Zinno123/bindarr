// Set-code OCR only identifies a printing's number, not its foil rarity.
export function readYgoCode(text) {
  const normalized = String(text || '').toUpperCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s*-\s*/g, '-');
  const codes = [...new Set(normalized.match(/\b[A-Z0-9]{2,8}-(?:[A-Z]{1,2})?\d{2,4}[A-Z]?\b/g) || [])];
  return codes.length === 1 ? codes[0] : null;
}
export function exactYgoRows(rows, code) {
  if (!code || !Array.isArray(rows)) return [];
  const matches = rows.filter(c => c?.id && String(c.number || '').trim().toUpperCase() === code);
  return [...new Map(matches.map(c => [c.id, c])).values()];
}
// An English catalogue can be used as a reference for modern German codes,
// but never silently count the reference as an exact printing.
export function referenceCode(code) {
  return typeof code === 'string' ? code.replace(/-DE(?=\d)/, '-EN') : null;
}

// The printed language tag is evidence for this physical copy, not a new catalogue row.
export function ygoCopyLanguage(code) {
  if (typeof code !== 'string') return null;
  if (/-(?:DE|G)\d/i.test(code)) return 'German';
  if (/-(?:EN|E)\d/i.test(code)) return 'English';
  return null;
}
