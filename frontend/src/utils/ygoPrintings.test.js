import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchYgoPrintings, mergePrintings, sameYgoName } from './ygoPrintings.js';
test('all pages and all rarity variants retained even with same number',async()=>{
  const rows=Array.from({length:251},(_,i)=>({id:String(i),number:'RA01-EN001',rarity:i%2?'Ultra Rare':'Secret Rare'}));
  const result=await fetchYgoPrintings({number:'RA01-EN001'},async url=>{
    const page=Number(new URL(url,'https://example.test').searchParams.get('page'));
    return {ok:true,headers:{get:k=>k==='X-Total-Count'?'251':null},json:async()=>rows.slice((page-1)*250,page*250)};
  });
  assert.equal(result.rows.length,251);
  assert.equal(mergePrintings([result.rows,[rows[0]]]).length,251);
  assert.equal(sameYgoName([{name:'Ash Blossom'},{name:'Ash Blossom & Joyous Spring'}],'Ash Blossom').length,1);
});
