import type { CSSProperties } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Lang } from '../i18n/strings';

export function LanguageToggle({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLanguage();

  const optionStyle = (value: Lang): CSSProperties => ({
    padding: '5px 10px',
    font: '800 11px "Geist"',
    borderRadius: 999,
    color: lang === value ? 'var(--ink)' : '#9a9aa2',
    background: lang === value ? '#fff' : 'transparent',
    boxShadow: lang === value ? '0 1px 3px rgba(0,0,0,.15)' : 'none',
    cursor: 'pointer',
    border: 'none',
  });

  return (
    <div
      style={{
        display: 'flex',
        background: dark ? 'rgba(255,255,255,0.1)' : '#F0F0F2',
        borderRadius: 999,
        padding: 3,
      }}
      role="group"
      aria-label="Language"
    >
      <button type="button" style={optionStyle('fr')} onClick={() => setLang('fr')}>
        FR
      </button>
      <button type="button" style={optionStyle('en')} onClick={() => setLang('en')}>
        EN
      </button>
    </div>
  );
}
