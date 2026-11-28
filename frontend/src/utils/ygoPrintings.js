// The local catalogue may contain several products for one set number. Always
// request every page and preserve every distinct ID, even with identical art.
export async function fetchYgoPrintings(filters, request = fetch) {
  const results = new Map();
  let pending = false;
  let total = null;
  for (let page=1;page<=100;page++) {
    const params=new URLSearchParams({game:'yugioh',lang:'en',scope:'database',prints:'1',...filters,limit:'250',page:String(page)});
    const response=await request('/api/search?'+params);
    if(!response.ok)throw new Error('Card catalogue HTTP '+response.status);
    const rows=await response.json();
    if(!Array.isArray(rows))throw new Error('Invalid card catalogue response');
    const header=response.headers.get('X-Total-Count');
    if(header!==null&&/^\d+$/.test(header))total=Number(header);
    pending=pending||response.headers.get('X-Catalogue-Pending')==='1';
    for(const card of rows)if(card?.id)results.set(card.id,card);
    if(rows.length<250||(total!==null&&page*250>=total))return {rows:[...results.values()],pending};
  }
  throw new Error('Card catalogue returned too many pages; refine search');
}
export function mergePrintings(groups) {
  const rows=new Map();
  for(const group of groups)for(const row of group||[])if(row?.id&&!rows.has(row.id))rows.set(row.id,row);
  return [...rows.values()];
}
export function sameYgoName(rows,name) {
  const normalize=v=>String(v||'').normalize('NFKC').trim().toLowerCase();
  return rows.filter(r=>normalize(r.name)===normalize(name)||normalize(r.printed_name)===normalize(name));
}
