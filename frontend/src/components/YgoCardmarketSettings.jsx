import { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

const native = registerPlugin('NativeDetector');
async function request(path, records) {
  const response = await fetch('/api/settings/ygo-cardmarket'+path,records===undefined
    ? (path ? {method:'POST'} : {})
    : {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({records})});
  const data=await response.json();
  if (!response.ok) throw new Error(data.error || 'Cardmarket request failed');
  return data;
}
export default function YgoCardmarketSettings({ onChanged }) {
  const [key,setKey]=useState('');
  const [state,setState]=useState(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [days,setDays]=useState(1);
  useEffect(()=>{fetch('/api/settings').then(r=>r.json()).then(s=>{if(Number.isInteger(s.price_refresh_days))setDays(s.price_refresh_days);}).catch(()=>{});},[]);
  const changeInterval=async(value)=>{
    try {const r=await fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({price_refresh_days:value})});if(!r.ok)throw new Error('Could not save interval');setDays(value);}catch(e){setMessage(e.message);}
  };
  useEffect(()=>{request('').then(setState).catch(e=>setMessage(e.message));},[]);
  const sync=async (setup)=>{
    setBusy(true);setMessage(setup?'Downloading product links…':'Downloading official Cardmarket prices…');
    try {
      if(setup){
        const result=await native.downloadYgoMappings({apiKey:key.trim()});
        setKey('');
        setMessage('Applying product links and official prices…');
        await request('/import',result.records);
      }else{
        await request('/refresh');
      }
      setMessage('Cardmarket prices updated.');
      onChanged?.();
    }catch(e){setMessage(e.message||'Update failed');}
    finally{
      setKey('');
      try{setState(await request(''));}catch{/* keep previous status */}
      setBusy(false);
    }
  };
  const disabled=busy||state?.busy;
  return <div className="glass-panel" style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
    <h3 style={{fontSize:'1.1rem'}}>Yu-Gi-Oh! · Cardmarket prices (EUR)</h3>
    <label htmlFor="ygo-refresh">Automatic price refresh (while the app is open)</label>
    <select id="ygo-refresh" className="select-control" value={days} onChange={e=>changeInterval(Number(e.target.value))}><option value={1}>Every day</option><option value={7}>Every week</option><option value={0}>Manual only</option></select>
    <p style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Cardmarket provides daily market trends. First connect the card catalogue below. Until linked, prices are TCGplayer estimates, not Cardmarket. Individual language, condition and edition prices may differ.</p>
    <p style={{fontSize:'0.85rem'}}>Last guide: {state?.guideDate ? new Date(state.guideDate).toLocaleString() : 'Not installed'}</p>
    <p style={{fontSize:'0.85rem'}}>Linked products: {state?.mappings ?? '—'} · priced catalogue cards: {state?.priced ?? '—'} / {state?.catalogue ?? '—'}</p>
    <p style={{fontSize:'0.85rem'}}>Your copies with Cardmarket prices: {state?.ownedPriced ?? '—'} / {state?.owned ?? '—'}</p>
    {Capacitor.getPlatform()==='android' && <>
      <label htmlFor="ygo-cm-key">Step 1: CardNexus catalogue key (only needed to link card variants)</label>
      <input id="ygo-cm-key" type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="cnk_live_…" disabled={disabled}/>
      <p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Use a key without account permissions. It is sent only to CardNexus to obtain product IDs, not stored by this app. <a href="https://docs.cardnexus.com/guides/authentication" target="_blank" rel="noreferrer">API key instructions</a></p>
      <button type="button" className="btn btn-primary" disabled={disabled||!key.trim()} onClick={()=>sync(true)}>Step 2: Link Yu-Gi-Oh! catalogue and download prices</button>
    </>}
    <button type="button" className="btn btn-secondary" disabled={disabled||!state?.mappings} onClick={()=>sync(false)}>Update linked prices now</button>
    {message && <p role="status" style={{fontSize:'0.85rem'}}>{message}</p>}
    {state?.error && <p style={{color:'var(--accent-yellow)',fontSize:'0.8rem'}}>{state.error}</p>}
  </div>;
}
