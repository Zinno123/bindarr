'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { indexPriceGuide, priceForVerifiedProduct, parseSetCode, extractSetCodes } = require('../src/utils/ygoCardmarket');

test('price guide uses exact product IDs and preserves EUR trend, low and averages', () => {
  const guide = indexPriceGuide({createdAt:'2026-11-26', priceGuides:[
    {idProduct: 101, trend: 0.15, low: 0.02, avg: 0.19, avg1: 0.12, avg7: 0.16, avg30: 0.20},
    {idProduct: 102, trend: 85, low: 70}
  ]});
  assert.equal(guide.createdAt, '2026-11-26');
  assert.deepEqual(priceForVerifiedProduct(guide,101), {currency:'EUR',source:'cardmarket',trend:0.15,low:0.02,average:0.19,average1d:0.12,average7d:0.16,average30d:0.20});
  assert.equal(priceForVerifiedProduct(guide,102).trend,85);
  assert.equal(priceForVerifiedProduct(guide,103),null);
  assert.equal(priceForVerifiedProduct(guide,'101'),null);
});
test('missing quotes and duplicate product IDs never produce guessed prices', () => {
  const guide = indexPriceGuide({priceGuides:[
    {idProduct: 101, trend: 10}, {idProduct: 101, trend: 5},
    {idProduct: 102, trend: 0, low: -1, avg: null}, {idProduct: 101, trend: 7}
  ]});
  assert.equal(priceForVerifiedProduct(guide,101),null);
  assert.equal(priceForVerifiedProduct(guide,102).trend,null);
  assert.equal(priceForVerifiedProduct(guide,102).low,null);
  assert.throws(() => indexPriceGuide({products:[]}));
});
test('extracts modern German and English codes and preserves legacy numbers', () => {
  assert.deepEqual(parseSetCode('Karte RA01 – DE001 ATK'),{code:'RA01-DE001',set:'RA01',region:'DE',number:'001',language:'German'});
  assert.equal(parseSetCode('LOB-EN001').language,'English');
  assert.equal(parseSetCode('LOB-G001').language,'German');
  assert.equal(parseSetCode('LOB-001').language,null);
  assert.equal(parseSetCode('LOB-E001').language,null);
});
test('rejects multiple set codes and does not repair uncertain characters', () => {
  assert.equal(parseSetCode('LOB-EN001 RA01-DE001'),null);
  assert.equal(parseSetCode('LOB-ENO01'),null);
  assert.deepEqual(extractSetCodes('RA01-DE001 RA01-DE001'),['RA01-DE001']);
});
