import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';

function ColorSwatchRow({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { id: string; label: string; swatch: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--ink)', marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          const isOther = opt.id === 'autre';
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              aria-pressed={isSelected}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                width: 56,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: isOther ? '#fff' : opt.swatch,
                  border: isSelected ? '3px solid var(--cyan)' : isOther ? '1.5px dashed #C7C7CC' : '1px solid rgba(0,0,0,.08)',
                  boxShadow: isSelected ? '0 2px 8px rgba(10,102,255,.25)' : '0 1px 3px rgba(0,0,0,.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '700 16px Geist',
                  color: 'var(--muted)',
                }}
              >
                {isOther ? '+' : null}
              </div>
              <span style={{ font: '600 11px Geist', color: isSelected ? 'var(--ink)' : 'var(--ink-soft)', textAlign: 'center' }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StepAppearance() {
  const { t } = useLanguage();
  const { draft, update } = useBookDraft();

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--ink)', marginBottom: 10 }}>
        {t.wizard.step6.title}
      </div>
      <p style={{ font: '600 13px/1.5 Geist', color: 'var(--ink-soft)', margin: '0 0 22px' }}>{t.wizard.step6.helper}</p>

      <ColorSwatchRow
        title={t.wizard.step6.hairTitle}
        options={t.wizard.step6.hairColors}
        selected={draft.hairColor}
        onSelect={(id) => update({ hairColor: id })}
      />
      <ColorSwatchRow
        title={t.wizard.step6.eyeTitle}
        options={t.wizard.step6.eyeColors}
        selected={draft.eyeColor}
        onSelect={(id) => update({ eyeColor: id })}
      />

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>
          {t.wizard.step6.otherLabel}
        </span>
        <span style={{ font: '600 12px Geist', color: 'var(--muted)' }}>{t.wizard.step6.otherOptional}</span>
      </div>
      <textarea
        value={draft.appearanceDetails}
        onChange={(e) => update({ appearanceDetails: e.target.value })}
        placeholder={t.wizard.step6.placeholder}
        rows={3}
        style={{
          width: '100%',
          font: '500 15px/1.6 Geist',
          color: 'var(--ink)',
          padding: '14px 16px',
          borderRadius: 14,
          border: '1.5px solid var(--border)',
          background: '#fff',
          outline: 'none',
          resize: 'vertical',
          minHeight: 90,
        }}
      />
    </div>
  );
}
