import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';

const MAX_LENGTH = 400;

export function StepStoryPrompt() {
  const { t } = useLanguage();
  const { draft, update } = useBookDraft();

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--ink)', marginBottom: 10 }}>
        {t.wizard.step4.title}
      </div>
      <p style={{ font: '600 13px/1.5 Geist', color: 'var(--ink-soft)', margin: '0 0 16px' }}>{t.wizard.step4.helper}</p>

      <textarea
        value={draft.storyPrompt}
        maxLength={MAX_LENGTH}
        onChange={(e) => update({ storyPrompt: e.target.value })}
        placeholder={t.wizard.step4.placeholder}
        rows={6}
        style={{
          width: '100%',
          font: '500 15px/1.6 Geist',
          color: 'var(--ink)',
          padding: '16px 18px',
          borderRadius: 14,
          border: '1.5px solid var(--border)',
          background: '#fff',
          outline: 'none',
          resize: 'vertical',
          minHeight: 140,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          font: '600 11px Geist',
          color: 'var(--muted)',
          marginTop: 6,
        }}
      >
        {draft.storyPrompt.length} / {MAX_LENGTH} {t.wizard.step4.charHint}
      </div>
    </div>
  );
}
