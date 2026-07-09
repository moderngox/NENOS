import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';

export function StepName() {
  const { t } = useLanguage();
  const { draft, update } = useBookDraft();

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <div
        style={{
          fontFamily: 'Geist, sans-serif',
          fontWeight: 800,
          fontSize: 26,
          color: 'var(--ink)',
          marginBottom: 12,
        }}
      >
        {t.wizard.step1.title}
      </div>
      <input
        type="text"
        value={draft.name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder={t.wizard.step1.placeholder}
        autoFocus
        style={{
          width: '100%',
          font: '700 22px Geist',
          color: 'var(--ink)',
          padding: '16px 18px',
          borderRadius: 14,
          border: '1.5px solid var(--border)',
          background: '#fff',
          outline: 'none',
          marginBottom: 12,
        }}
      />
      <p style={{ font: '600 13px/1.5 Geist', color: 'var(--ink-soft)', margin: 0 }}>{t.wizard.step1.helper}</p>
    </div>
  );
}
