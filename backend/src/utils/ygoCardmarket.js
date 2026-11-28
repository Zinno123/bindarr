'use strict';

// Initial Yu-Gi-Oh! Cardmarket adapter. The public price guide identifies
// products by Cardmarket ID, not TCGplayer ID. Never guess the crosswalk.
const PRICE_GUIDE_URL = 'https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_3.json';
const PRODUCT_LIST_URL = 'https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_3.json';

const positiveId = value => Number.isSafeInteger(value) && value > 0;
const quote = value => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

function indexPriceGuide(payload) {
  if (!payload || !Array.isArray(payload.priceGuides)) throw new Error('Invalid Cardmarket price guide');
  const index = new Map();
  const ambiguous = new Set();
  for (const row of payload.priceGuides) {
    if (!row || !positiveId(row.idProduct) || ambiguous.has(row.idProduct)) continue;
    if (index.has(row.idProduct)) {
      index.delete(row.idProduct);
      ambiguous.add(row.idProduct);
      continue;
    }
    index.set(row.idProduct, {
      currency: 'EUR', source: 'cardmarket',
      trend: quote(row.trend), low: quote(row.low), average: quote(row.avg),
      average1d: quote(row.avg1), average7d: quote(row.avg7), average30d: quote(row.avg30),
    });
  }
  return { createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : null, index };
}

// Only a separately verified exact product ID may be passed here. A missing
// or ambiguous mapping remains unpriced instead of taking a cheap reprint.
function priceForVerifiedProduct(priceGuide, cardmarketProductId) {
  if (!positiveId(cardmarketProductId)) return null;
  return priceGuide.index.get(cardmarketProductId) || null;
}

// Parse likely printed set codes from OCR output, not the image itself.
// Do not silently correct O/0, I/1 or infer a rarity from the number.
function extractSetCodes(text) {
  const normalized = String(text || '').toUpperCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s*-\s*/g, '-');
  const pattern = /\b[A-Z0-9]{2,8}-(?:[A-Z]{1,2})?\d{2,4}[A-Z]?\b/g;
  return [...new Set(normalized.match(pattern) || [])];
}

function parseSetCode(text) {
  const codes = extractSetCodes(text);
  if (codes.length !== 1) return null;
  const code = codes[0];
  const match = /^([A-Z0-9]{2,8})-([A-Z]{1,2})?(\d{2,4}[A-Z]?)$/.exec(code);
  const languages = { EN:'English', DE:'German', FR:'French', IT:'Italian', SP:'Spanish', PT:'Portuguese', JP:'Japanese', KR:'Korean', G:'German' };
  return { code, set: match[1], region: match[2] || null, number: match[3], language: languages[match[2]] || null };
}

module.exports = { PRICE_GUIDE_URL, PRODUCT_LIST_URL, indexPriceGuide, priceForVerifiedProduct, extractSetCodes, parseSetCode };


// CardNexus catalog external IDs are exact provider links, not a name match.
// Reject both directions of one-to-many mappings, including regional reprints.
// We deliberately don't infer an edition-specific quote from a product-level guide.
function buildCrosswalk(records) {
  if (!Array.isArray(records)) throw new Error('Invalid catalogue links');
  const forward = new Map(), reverse = new Map();
  const link = (map, a, b) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a).add(b);
  };
  for (const row of records) {
    const a = Array.isArray(row?.tcgplayer) ? [...new Set(row.tcgplayer.filter(positiveId))] : [];
    const b = Array.isArray(row?.cardmarket) ? [...new Set(row.cardmarket.filter(positiveId))] : [];
    for (const x of a) for (const y of b) {
      link(forward, x, y);
      link(reverse, y, x);
    }
  }
  const pairs = [];
  for (const [tcg, ids] of forward) {
    if (ids.size !== 1) continue;
    const cm = [...ids][0];
    if (reverse.get(cm).size === 1) pairs.push({tcg, cm});
  }
  return pairs;
}

module.exports.buildCrosswalk = buildCrosswalk;
