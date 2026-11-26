import test from 'node:test';
import assert from 'node:assert/strict';
import { readYgoCode, exactYgoRows, referenceCode } from './ygoScanOcr.js';

test('extracts one printed code without correcting uncertain characters', () => {
  assert.equal(readYgoCode('RA01 – DE001 ATK 1000'), 'RA01-DE001');
  assert.equal(readYgoCode('LOB-EN001 LOB-EN002'), null);
  assert.equal(readYgoCode('LOB-ENO01'), null);
  assert.equal(readYgoCode('LOB-EN001 LOB-EN001'), 'LOB-EN001');
});
test('exact number lookup keeps distinct rarities and removes duplicate rows only', () => {
  const common = {id:'a', number:'RA01-EN001', rarity:'Common'};
  const secret = {id:'b', number:'RA01-EN001', rarity:'Secret Rare'};
  assert.deepEqual(exactYgoRows([common,secret,common,{id:'c',number:'RA01-EN002'}],'RA01-EN001'),[common,secret]);
  assert.deepEqual(exactYgoRows([common], 'RA01-DE001'), []);
  assert.equal(referenceCode('RA01-DE001'), 'RA01-EN001');
  assert.equal(referenceCode('LOB-G001'), 'LOB-G001');
});
