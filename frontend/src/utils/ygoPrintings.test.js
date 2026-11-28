import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchYgoPrintings, mergePrintings, sameYgoName, fetchYgoOtherVersions } from './ygoPrintings.js';
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

test('Rarity Collection suffixes do not hide other versions',async()=>{
  const name='Dogmatika Ecclesia, the Virtuous';
  const rows=[
    {id:'pcr',name:name+' (PCR)',number:'RA01-EN020'},
    {id:'ur',name:name,number:'RA01-EN020'},
    {id:'scr',name:name+' (ScR)',number:'RA01-EN020'},
    {id:'other',name:name,number:'ROTD-EN005'},
    {id:'wrong',name:name+' (Not the same card)',number:'ABC-EN123'}
  ];
  const result=await fetchYgoOtherVersions(rows[0],async url=>{
    assert.equal(new URL(url,'https://example.test').searchParams.get('name'),name);
    return {ok:true,headers:{get:()=>null},json:async()=>rows};
  });
  assert.deepEqual(result.rows.map(c=>c.id),['pcr','ur','scr','other']);
});
