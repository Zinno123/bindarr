'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {buildCrosswalk,indexPriceGuide}=require('../src/utils/ygoCardmarket');
test('keeps only bidirectionally unambiguous product ids',()=>{
  assert.deepEqual(buildCrosswalk([
    {tcgplayer:[1,1],cardmarket:[10]},
    {tcgplayer:[2],cardmarket:[20,21]},
    {tcgplayer:[3,4],cardmarket:[30]},
    {tcgplayer:[5],cardmarket:[50]},
    {tcgplayer:[5],cardmarket:[51]},
    {tcgplayer:[6],cardmarket:[60]},
    {tcgplayer:[7],cardmarket:[60]},
    {tcgplayer:['8'],cardmarket:[80]},
  ]),[{tcg:1,cm:10}]);
});
test('only official product quotes are used, no missing prices inferred',()=>{
  const guide=indexPriceGuide({createdAt:'2026-11-28',priceGuides:[{idProduct:10,trend:2.5,low:1.5},{idProduct:20,trend:0}]});
  assert.equal(guide.index.get(10).trend,2.5);
  assert.equal(guide.index.get(20).trend,null);
  assert.equal(guide.index.get(99),undefined);
});
