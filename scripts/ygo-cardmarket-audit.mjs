// Diagnostic for official downloads only. Do not redistribute the catalogue or
// infer a crosswalk from names. Run in CI where network access is available.
const base = 'https://downloads.s3.cardmarket.com/productCatalog/';
for (const [label, path, key] of [
  ['products','productList/products_singles_3.json','products'],
  ['prices','priceGuide/price_guide_3.json','priceGuides'],
]) {
  try {
    const response = await fetch(base + path, {signal: AbortSignal.timeout(60000)});
    if (!response.ok) throw Error('HTTP ' + response.status);
    const json = await response.json();
    const rows = json[key];
    if (!Array.isArray(rows) || rows.length === 0) throw Error('missing or empty ' + key);
    const fields = [...new Set(rows.slice(0, 1000).flatMap(row => Object.keys(row)))].sort();
    console.log(JSON.stringify({label, count: rows.length, createdAt: json.createdAt || null, fields}));
  } catch (err) {
    console.error(label + ': ' + err.message);
    process.exitCode = 1;
  }
}
