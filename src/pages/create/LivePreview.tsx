import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';
import { useObjectUrl } from '../../hooks/useObjectUrl';

export function LivePreview() {
  const { t } = useLanguage();
  const { draft } = useBookDraft();
  const photoUrl = useObjectUrl(draft.photo);

  const universeLabel = t.wizard.step3.universes.find((u) => u.id === draft.universe)?.label ?? '';
  const skin = t.wizard.step6.skinColors.find((s) => s.id === draft.skinColor);
  const hair = t.wizard.step6.hairColors.find((h) => h.id === draft.hairColor);
  const eye = t.wizard.step6.eyeColors.find((e) => e.id === draft.eyeColor);

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
          position: 'relative',
          width: 96,
          height: 96,
          borderRadius: '50%',
          margin: '0 auto 14px',
          background: photoUrl
            ? `url(${photoUrl}) center / cover no-repeat`
            : hair && hair.swatch
              ? hair.swatch
              : '#F0F0F2',
          border: '4px solid #fff',
          boxShadow: '0 6px 20px rgba(0,0,0,.1)',
        }}
      >
        {!photoUrl && eye && eye.swatch && (
          <div
            style={{
              position: 'absolute',
              bottom: 22,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: eye.swatch,
              border: '2px solid #fff',
            }}
          />
        )}
      </div>
      <div style={{ font: '600 13px/1.5 Geist', color: 'var(--ink-soft)', textAlign: 'center' }}>
        {draft.name || '—'}
        {draft.age ? ` · ${draft.age} ${t.wizard.yearsOld}` : ''}
        <br />
        {draft.traits.length > 0 ? draft.traits.join(', ') : '—'}
        <br />
        {universeLabel && `${t.wizard.step3.universeTitle.split(' ')[0]} : ${universeLabel}`}
        {(skin || hair || eye) && (
          <>
            <br />
            {[skin?.label, hair?.label, eye?.label].filter(Boolean).join(' · ')}
          </>
        )}
        {draft.secondaryCharacters.length > 0 && (
          <>
            <br />+ {draft.secondaryCharacters.map((c) => c.name).join(', ')}
          </>
        )}
      </div>
    </div>
  );
}
