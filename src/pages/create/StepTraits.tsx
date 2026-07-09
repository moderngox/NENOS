import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';
import { Chip } from '../../components/Chip';
import universePirates from '../../assets/universe-pirates.png';
import universeSpace from '../../assets/universe-space.png';
import universeForest from '../../assets/universe-forest.png';

const UNIVERSE_IMAGES: Record<string, string> = {
  pirates: universePirates,
  space: universeSpace,
  forest: universeForest,
};

export function StepTraits() {
  const { t } = useLanguage();
  const { draft, toggleTrait, update } = useBookDraft();

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 12 }}>
        {t.wizard.step3.traitsTitle}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 26 }}>
        {t.wizard.step3.traits.map((trait) => (
          <Chip key={trait} label={trait} selected={draft.traits.includes(trait)} onClick={() => toggleTrait(trait)} />
        ))}
      </div>

      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 12 }}>
        {t.wizard.step3.universeTitle}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {t.wizard.step3.universes.map((u) => {
          const selected = draft.universe === u.id;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => update({ universe: u.id })}
              style={{
                width: 110,
                border: selected ? '2px solid var(--ink)' : '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: selected ? '0 2px 8px rgba(0,0,0,.12)' : '0 1px 3px rgba(0,0,0,.06)',
                background: '#fff',
                padding: 0,
                flex: 'none',
              }}
            >
              <div
                style={{
                  height: 72,
                  backgroundImage: `url(${UNIVERSE_IMAGES[u.id]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div
                style={{
                  padding: 7,
                  font: '600 12px Geist',
                  textAlign: 'center',
                  background: selected ? 'var(--ink)' : 'transparent',
                  color: selected ? '#fff' : 'var(--ink)',
                }}
              >
                {u.label}
                {selected ? ' ★' : ''}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
