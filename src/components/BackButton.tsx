import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface BackButtonProps {
  fallback: string;
}

export function BackButton({ fallback }: BackButtonProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleClick = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        padding: 0,
        marginBottom: 16,
        font: '700 13px Geist',
        color: 'var(--muted)',
        cursor: 'pointer',
      }}
    >
      {t.nav.back}
    </button>
  );
}
