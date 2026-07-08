import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';

export function LivePreview() {
  const { t } = useLanguage();
  const { draft } = useBookDraft();

  const universeLabel = t.wizard.step3.universes.find((u) => u.id === draft.universe)?.label ?? '';

  return (
    <div
      className="desktop-only"
      style={{
        width: 280,
        flex: 'none',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 22,
        background: 'var(--panel-bg)',
        position: 'sticky',
        top: 90,
        height: 'fit-content',
      }}
    >
      <div style={{ font: '700 12px Geist', color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 14 }}>
        {t.wizard.livePreview}
      </div>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          margin: '0 auto 14px',
          background: '#F0F0F2',
          border: '4px solid #fff',
          boxShadow: '0 6px 20px rgba(0,0,0,.1)',
        }}
      />
      <div style={{ font: '600 13px/1.5 Geist', color: 'var(--ink-soft)', textAlign: 'center' }}>
        {draft.name || '—'}
        {draft.age ? ` · ${draft.age} ${t.wizard.yearsOld}` : ''}
        <br />
        {draft.traits.length > 0 ? draft.traits.join(', ') : '—'}
        <br />
        {universeLabel && `${t.wizard.step3.universeTitle.split(' ')[0]} : ${universeLabel}`}
      </div>
    </div>
  );
}
