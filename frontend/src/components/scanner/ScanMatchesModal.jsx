import { memo, useState } from 'react';
import YgoRarityBadge from '../YgoRarityBadge';
import { ygoBaseName, ygoRarity } from '../../utils/ygoRarity.js';
import Modal from '../Modal';
import { X, RefreshCw, Search } from 'lucide-react';
import { onActivateKey } from '../../utils/a11y';
import { getCardDisplayName } from '../../utils/langHelper';
import LangFallbackNote from './LangFallbackNote';
import Price from '../Price';
import { useT } from '../../utils/i18n';

// The candidate picker after a scan that was not confident enough to add on
// its own, with a manual search fallback. Moved out of CameraScanner unchanged
// and memoized.
function ScanMatchesModal({
  dismissMatches, setScanMatches, setScanStatus, autoArmed, capturedQuad,
  resolvedDupIdRef, stream, cameraActive, startCamera, handleManualSearch,
  manualSearchText, setManualSearchText, manualSearching, showAllMatches, scanMatches,
  PICKER_PREVIEW, openQuickAdd, addLanguage, setShowAllMatches, setAutoScan,
}) {
  const { t } = useT();
  const [rarityFilter,setRarityFilter]=useState('');
  const ygo=scanMatches.some(c=>c.game==='yugioh');
  const rarityOptions=[...new Set(scanMatches.map(c=>c.rarity||'Unknown rarity'))].sort();
  const visibleMatches=ygo && rarityFilter ? scanMatches.filter(c=>(c.rarity||'Unknown rarity')===rarityFilter) : scanMatches;
  return (
    <Modal onClose={dismissMatches} label={t('scan.identifiedTitle')} closeOnBackdrop={false} overlayClassName="modal-overlay modal-overlay--camera" className="glass-panel scan-suggestions-modal" style={{ maxWidth: '560px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-strong)', margin: 0 }}>{t('scan.identifiedTitle')}</h3>
          <button 
            className="btn btn-secondary btn-icon-only" 
            onClick={() => {
              setScanMatches([]);
              setScanStatus('');
              autoArmed.current = true;
              capturedQuad.current = null;
              resolvedDupIdRef.current = null;
              if (!stream || !cameraActive) startCamera();
            }} 
            style={{ borderRadius: '50%' }}
            title={t('scan.closeRescan')}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            {t('scan.selectCorrect')}
          </p>

          {/* Manual search fallback within the modal */}
          <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="e.g. Dark Magician, RA01-EN020" 
                className="input-control"
                value={manualSearchText}
                onChange={(e) => setManualSearchText(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 2rem 0.4rem 0.6rem', fontSize: '0.8rem' }}
              />
              {manualSearchText && (
                <button
                  type="button"
                  onClick={() => setManualSearchText('')}
                  style={{
                    position: 'absolute',
                    right: '0.4rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              disabled={manualSearching || !manualSearchText.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              {manualSearching ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
              <span>{t('search.submit') || 'Search'}</span>
            </button>
          </form>
        </div>

        {ygo && <><p style={{color:'var(--accent-yellow)',fontSize:'0.8rem',margin:0}}>Choose the exact set and rarity. {scanMatches.length} catalogue entries. Identical artwork does not identify foil rarity.</p><label>Rarity <select className="select-control" value={rarityFilter} onChange={e=>setRarityFilter(e.target.value)}><option value="">All rarities</option>{rarityOptions.map(r=><option key={r} value={r}>{ygoRarity(r).code} — {r}</option>)}</select></label></>}
        {/* Strongest matches first — the same order, and the same cards, as
            the ORB match list. Only the first few are shown: eight cards at
            once is a wall to read while holding the card you are trying to
            identify, and the answer is usually near the top. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', padding: '0.25rem' }}>
          {(ygo || showAllMatches ? visibleMatches : visibleMatches.slice(0, PICKER_PREVIEW)).map(card => (
            <div key={card.id} className="tcg-card" role="button" tabIndex={0} onClick={() => openQuickAdd(card)} onKeyDown={onActivateKey(() => openQuickAdd(card))} style={{ cursor: 'pointer' }}>
              <div className="tcg-card-inner" style={{ position:'relative', border: '1px solid var(--border-glass-hover)' }}>
                {/* Lazy: "Change printing" can fill this with hundreds of printings. */}
                <img src={card.image_url} alt={getCardDisplayName(card.name, addLanguage(card), card.printed_name)} className="tcg-card-image" loading="lazy" decoding="async" />
                <YgoRarityBadge card={card} />
              </div>
              {/* Name and number are what the choice is actually made on —
                  the picture is already on screen above them, and at 0.75/0.65rem
                  the two lines that say WHICH printing this is were the smallest
                  text in the modal. */}
              <div className="tcg-card-info" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <div className="tcg-card-name" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-strong)', lineHeight: 1.2 }}>{getCardDisplayName(ygo ? ygoBaseName(card.name) : card.name, addLanguage(card), card.printed_name)}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>#{card.__ygoPrintedCode || card.number}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{card.set_name}</div>
                {card.game === 'yugioh' && <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-strong)' }}>{card.rarity || 'Unknown rarity'}</div>}
                <LangFallbackNote card={card} />
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-yellow)', marginTop: '0.2rem' }}><Price value={card.price_trend} currency={card.price_currency} />{card.game === 'yugioh' && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}> · {card.price_source === 'cardmarket' ? 'Cardmarket trend' : card.price_source === 'cardmarket-unmapped' ? 'Unlinked' : 'TCGplayer'}</span>}</div>
              </div>
            </div>
          ))}
        </div>

        {!ygo && scanMatches.length > PICKER_PREVIEW && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAllMatches(v => !v)}
            style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {showAllMatches
              ? t('scan.showFewer')
              : t('scan.seeMoreMatches', { n: scanMatches.length - PICKER_PREVIEW })}
          </button>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setScanMatches([]);
              setScanStatus('');
              autoArmed.current = true;
              capturedQuad.current = null;
              resolvedDupIdRef.current = null;
              if (!stream || !cameraActive) startCamera();
            }} 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={14} />
            <span>{t('scan.rescan')}</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setScanMatches([]);
              setScanStatus('');
              setAutoScan(false);
              if (!stream || !cameraActive) startCamera();
            }}
            style={{ flex: 1 }}
          >
            {t('common.cancel')}
          </button>
        </div>
    </Modal>
  );
}

export default memo(ScanMatchesModal);
