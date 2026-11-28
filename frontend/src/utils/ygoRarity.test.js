import test from 'node:test';
import assert from 'node:assert/strict';
import {ygoRarity,ygoBaseName} from './ygoRarity.js';
test('requested rarity abbreviations and safe name normalization',()=>{
 for(const [name,code] of [['Common','C'],['Rare','R'],['Super Rare','SR'],['Ultra Rare','UR'],['Secret Rare','ScR'],['Ultimate Rare','UmR'],['Platinum Secret Rare','PScR'],["Prismatic Collector's Rare",'PCR'],['Quarter Century Secret Rare','QScR']])assert.equal(ygoRarity(name).code,code);
 assert.equal(ygoRarity('Unknown foil').code,'?');
 assert.equal(ygoBaseName('Dogmatika Ecclesia, the Virtuous (PCR)'),'Dogmatika Ecclesia, the Virtuous');
 assert.equal(ygoBaseName('Example (Alternate Art) (UR)'),'Example');
 assert.equal(ygoBaseName('Example (Real Title)'),'Example (Real Title)');
});
