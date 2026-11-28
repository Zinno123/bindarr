'use strict';

// Daily prices are downloaded directly from Cardmarket, not CardNexus.
// The latter is used only once to obtain explicit cross-market product links.
const db = require('./db');
const axios = require('axios');
const { PRICE_GUIDE_URL, indexPriceGuide, buildCrosswalk } = require('./utils/ygoCardmarket');
const { recordPrice, priceRefreshDays } = require('./utils/priceHelpers');
const DAY = 86400000;
let busy = false;
let lastError = null;

async function ensureTables() {
  await db.run('CREATE TABLE IF NOT EXISTS ygo_cm_map (tcg_id INTEGER PRIMARY KEY, cm_id INTEGER NOT NULL UNIQUE, trend REAL, low REAL, avg1 REAL, avg7 REAL, avg30 REAL)');
  await db.run('CREATE TABLE IF NOT EXISTS ygo_cm_state (id INTEGER PRIMARY KEY, guide_date TEXT, fetched_at INTEGER)');
}

async function status() {
  await ensureTables();
  const [state, map, cache, owned] = await Promise.all([
    db.get('SELECT * FROM ygo_cm_state WHERE id=1'),
    db.get('SELECT COUNT(*) AS total FROM ygo_cm_map'),
    db.get("SELECT COUNT(*) AS total, SUM(CASE WHEN price_source='cardmarket' AND price_trend>0 THEN 1 ELSE 0 END) AS priced FROM card_cache WHERE game='yugioh'"),
    db.get("SELECT COALESCE(SUM(c.quantity),0) AS total, COALESCE(SUM(CASE WHEN cc.price_source='cardmarket' AND cc.price_trend>0 THEN c.quantity ELSE 0 END),0) AS priced FROM collection c JOIN card_cache cc ON cc.id=c.card_id WHERE cc.game='yugioh' AND c.list_type='collection'"),
  ]);
  return { busy, error: lastError, mappings: map.total, catalogue: cache.total, priced: cache.priced || 0,
    owned: owned.total, ownedPriced: owned.priced, guideDate: state?.guide_date || null, fetchedAt: state?.fetched_at || null };
}

// Only update YGO rows mapped to exact provider IDs. Clear every old
// USD finish column so that USD cannot leak into an EUR aggregate.
async function applyStored() {
  await ensureTables();
  const fields = ['price_trend','price_avg1','price_avg7','price_avg30'];
  const columns = ['trend','avg1','avg7','avg30'];
  const mapped = 'm.tcg_id = card_cache.tcgplayer_product_id';
  const sets = fields.map((field,i) => field + '=(SELECT m.' + columns[i] + ' FROM ygo_cm_map m WHERE ' + mapped + ')');
  await db.run("UPDATE card_cache SET " + sets.join(',') +
    ", price_normal=NULL, price_holofoil=NULL, price_reverse_holofoil=NULL, price_1st_edition=NULL, price_source='cardmarket', price_currency='EUR'" +
    " WHERE game='yugioh' AND EXISTS (SELECT 1 FROM ygo_cm_map m WHERE " + mapped + ")");
}

async function downloadGuide() {
  const { data } = await axios.get(PRICE_GUIDE_URL, { timeout: 90000, responseType: 'json' });
  const guide = indexPriceGuide(data);
  if (!guide.createdAt || !Number.isFinite(Date.parse(guide.createdAt)) || guide.index.size < 1000) {
    throw new Error('Cardmarket price guide incomplete or missing date');
  }
  const old = await db.get('SELECT guide_date FROM ygo_cm_state WHERE id=1');
  if (old?.guide_date && Date.parse(guide.createdAt) < Date.parse(old.guide_date)) throw new Error('Cardmarket returned an older guide; previous prices retained');
  return guide;
}

async function writeSnapshot(pairs, guide) {
  const rows = pairs.map(({tcg,cm}) => {
    const q = guide.index.get(cm);
    return [tcg,cm,q?.trend ?? null,q?.low ?? null,q?.average1d ?? null,q?.average7d ?? null,q?.average30d ?? null];
  });
  if (!rows.some(r=>r[2]>0)) throw new Error('No mapped prices found; previous prices retained');
  await db.withTransaction(async () => {
    await db.run('DELETE FROM ygo_cm_map');
    for (let i=0; i<rows.length; i+=100) {
      const chunk=rows.slice(i,i+100);
      await db.run('INSERT INTO ygo_cm_map (tcg_id,cm_id,trend,low,avg1,avg7,avg30) VALUES '+chunk.map(()=>'(?,?,?,?,?,?,?)').join(','),chunk.flat());
    }
    // A removed mapping must not continue to masquerade as a verified price.
    await db.run("UPDATE card_cache SET price_trend=NULL,price_avg1=NULL,price_avg7=NULL,price_avg30=NULL,price_normal=NULL,price_holofoil=NULL,price_reverse_holofoil=NULL,price_1st_edition=NULL,price_source='cardmarket-unmapped' WHERE game='yugioh' AND price_source='cardmarket' AND NOT EXISTS (SELECT 1 FROM ygo_cm_map m WHERE m.tcg_id=card_cache.tcgplayer_product_id)");
    await applyStored();
    await db.run('INSERT OR REPLACE INTO ygo_cm_state(id,guide_date,fetched_at) VALUES(1,?,?)',[guide.createdAt,Date.now()]);
  });
  const owned = await db.all("SELECT DISTINCT cc.id,cc.price_trend FROM card_cache cc WHERE cc.game='yugioh' AND cc.price_source='cardmarket' AND cc.price_trend>0 AND cc.id IN (SELECT card_id FROM collection UNION SELECT card_id FROM deck_cards)");
  for (const c of owned) await recordPrice(c.id,c.price_trend);
}

async function run(force, records) {
  if (busy) throw new Error('Cardmarket refresh already running');
  busy=true; lastError=null;
  try {
    await ensureTables();
    let pairs;
    if (records !== undefined) {
      pairs=buildCrosswalk(records);
      if (!pairs.length) throw new Error('No unambiguous product links returned by CardNexus');
    } else {
      pairs=await db.all('SELECT tcg_id AS tcg, cm_id AS cm FROM ygo_cm_map');
      if (!pairs.length) return {skipped:'no mapping'};
      if (!force) {
        const days=await priceRefreshDays();
        const state=await db.get('SELECT fetched_at FROM ygo_cm_state WHERE id=1');
        if (!days || Date.now()-(state?.fetched_at||0)<days*DAY) return {skipped:'not due'};
      }
    }
    const guide=await downloadGuide();
    await writeSnapshot(pairs,guide);
    return { mappings:pairs.length, guideDate:guide.createdAt };
  } catch(e) {
    // Axios errors can contain credentials on other providers; report only a
    // generic HTTP status here, never a request config.
    lastError=e.response?.status ? 'Cardmarket HTTP '+e.response.status : String(e.message||'Refresh failed').slice(0,180);
    throw new Error(lastError);
  } finally { busy=false; }
}
module.exports={ status, applyStored, refresh:(force=false)=>run(force), importLinks:records=>run(true,records) };
