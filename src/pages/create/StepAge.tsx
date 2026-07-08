import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';

const AGES = [3, 4, 5, 6, 7, 8, 9, 10];

export function StepAge() {
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
        {t.wizard.step2.title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        {AGES.map((age) => (
          <button
            key={age}
            type="button"
            onClick={() => update({ age })}
            aria-pressed={draft.age === age}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: draft.age === age ? '2px solid var(--ink)' : '1px solid var(--border)',
              background: draft.age === age ? 'var(--ink)' : '#fff',
              color: draft.age === age ? '#fff' : 'var(--ink)',
              font: '800 17px Geist',
              boxShadow: draft.age === age ? '0 2px 8px rgba(0,0,0,.16)' : 'none',
            }}
          >
            {age}
          </button>
        ))}
      </div>
      <p style={{ font: '600 13px/1.5 Geist', color: 'var(--ink-soft)', margin: 0 }}>{t.wizard.step2.helper}</p>
    </div>
  );
}
