// A badge describes a catalogue variant, not a measured foil classification.
const entries=[
 ['C','Common','#aeb9c7','c'],
 ['R','Rare','#b3d2f0','r'],
 ['SR','Super Rare','#68c2ec','sr'],
 ['UR','Ultra Rare','#f8ce65','ur'],
 ['ScR','Secret Rare','#e8a5ee','sec'],
 ['UmR','Ultimate Rare','#ef9c5b','utr'],
 ['PScR','Platinum Secret Rare','#d2dff8','psr'],
 ['PCR',"Prismatic Collector's Rare",'#a3d5c3','prismatic collectors rare'],
 ['PUR','Prismatic Ultimate Rare','#e5ab79','pur'],
 ['QScR','Quarter Century Secret Rare','#f3d78d','qcsr'],
 ['CR',"Collector's Rare",'#9bc6e9','collectors rare'],
 ['GR','Ghost Rare','#e2f0f9','ghr'],
 ['StR','Starlight Rare','#eec8ff','slr'],
 ['PrScR','Prismatic Secret Rare','#c3cbff','prscr'],
 ['GoR','Gold Rare','#e0be54','gold'],
 ['GScR','Gold Secret Rare','#e7b766','gscr'],
 ['GGR','Ghost/Gold Rare','#e3d2a3','ghost gold rare'],
 ['PGoR','Premium Gold Rare','#e8c17c','pgr'],
 ['ShR','Shatterfoil Rare','#b5d8e5','shatterfoil'],
 ['MoR','Mosaic Rare','#b8d5ed','mosaic'],
 ['StfR','Starfoil Rare','#b7cee7','starfoil'],
 ['DT','Duel Terminal','#92d5d9','duel terminal common'],
 ['PR','Parallel Rare','#b7d6bd','pr'],
 ['NPR','Normal Parallel Rare','#b7d6bd','npr'],
 ['SPR','Super Parallel Rare','#99cced','spr'],
 ['UPR','Ultra Parallel Rare','#edd17f','upr'],
 ['PhR',"Pharaoh's Rare",'#ead38e','pharaohs rare']
];
const normalize=s=>String(s||'').normalize('NFKC').replace(/[’‘]/g,"'").trim().toLowerCase().replace(/\s+/g,' ');
const map=new Map();
for(const [code,label,color,alias] of entries)for(const key of [code,label,alias])map.set(normalize(key),{code,label,color});
export function ygoRarity(value){
 return map.get(normalize(value))||{code:'?',label:String(value||'Unknown rarity'),color:'#aeb9c7'};
}
const suffix=/^(?:alternate art(?:work)?(?: \d+)?|alt art(?: \d+)?|artwork \d+|variant \d+|v(?:ersion)?\.?\s*\d+|promo(?: variant)?|reprint)$/i;
export function ygoBaseName(value){
 let name=String(value||'').trim();
 for(;;){
  const m=name.match(/\s+\(([^()]*)\)$/);
  if(!m||(!map.has(normalize(m[1]))&&!suffix.test(m[1].trim())))break;
  name=name.slice(0,m.index).trim();
 }
 return name;
}
