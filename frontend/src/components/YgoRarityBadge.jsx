import { ygoRarity } from '../utils/ygoRarity.js';
export default function YgoRarityBadge({card,offset=6}) {
 if(!(card?.game==='yugioh'||String(card?.card_id||card?.id||'').startsWith('yugioh-')))return null;
 const {code,label,color}=ygoRarity(card.rarity);
 return <span aria-label={label} title={label} style={{position:'absolute',top:6,right:offset,zIndex:12,pointerEvents:'none',display:'inline-flex',alignItems:'center',gap:3,padding:'3px 6px',fontSize:'0.75rem',fontWeight:900,lineHeight:1.1,color,background:'#111827ed',border:'1px solid '+color,borderRadius:5,boxShadow:'0 1px 5px #0009',whiteSpace:'nowrap'}}><span aria-hidden="true" style={{width:7,height:7,transform:'rotate(45deg)',background:color,borderRadius:1}}/>{code}</span>;
}
