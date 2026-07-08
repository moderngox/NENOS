import { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';

export function StepPhoto() {
  const { t } = useLanguage();
  const { draft, update } = useBookDraft();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) update({ photo: files[0] });
  };

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <div
        style={{
          fontFamily: 'Geist, sans-serif',
          fontWeight: 800,
          fontSize: 26,
          color: 'var(--ink)',
          lineHeight: 1.2,
          marginBottom: 8,
        }}
      >
        {t.wizard.step5.title}
      </div>
      <p style={{ font: '600 13px/1.5 Geist', color: 'var(--ink-soft)', margin: '0 auto 26px', maxWidth: 320 }}>
        {t.wizard.step5.helper}
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          position: 'relative',
          width: 220,
          height: 220,
          margin: '0 auto 22px',
          borderRadius: '50%',
          border: '1.5px dashed #C7C7CC',
          background: draft.photo ? undefined : '#FFFFFF',
          backgroundImage: draft.photo ? `url(${URL.createObjectURL(draft.photo)})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
      >
        {!draft.photo && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--ink)' }} />
            <span style={{ font: '800 13px Geist', color: 'var(--ink)' }}>{t.wizard.step5.dropTitle}</span>
            <span style={{ font: '700 11px Geist', color: 'var(--muted)' }}>{t.wizard.step5.dropHelper}</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        {t.wizard.step5.formats.map((f) => (
          <span
            key={f}
            style={{
              font: '600 10.5px Geist',
              color: 'var(--ink)',
              background: 'var(--gray-bg)',
              borderRadius: 999,
              padding: '5px 10px',
            }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
