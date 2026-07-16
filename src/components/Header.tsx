import { Link } from 'react-router-dom';
import logoMark from '../assets/logo-mark.png';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

interface HeaderProps {
  variant?: 'light' | 'dark';
  showNav?: boolean;
  activeNav?: 'account';
  cta?: { label: string; to: string };
}

export function Header({ variant = 'light', showNav = false, activeNav, cta }: HeaderProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const dark = variant === 'dark';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        background: dark ? 'var(--ink)' : '#FFFFFF',
        borderBottom: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundImage: `url(${logoMark})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <span
          style={{
            fontFamily: 'Geist, sans-serif',
            fontWeight: 800,
            fontSize: 19,
            letterSpacing: 0.5,
            color: dark ? 'var(--cream)' : 'var(--ink)',
          }}
        >
          NENOS
        </span>
      </Link>

      {showNav && !activeNav && (
        <nav
          className="desktop-nav"
          style={{
            alignItems: 'center',
            gap: 28,
            font: '600 14px Geist',
            color: dark ? '#c7c7d6' : '#4a4a55',
          }}
        >
          <span>{t.nav.how}</span>
          <Link to="/exemples" style={{ color: 'inherit' }}>
            {t.nav.examples}
          </Link>
          <span>{t.nav.pricing}</span>
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <LanguageToggle dark={dark} />
        <Link
          to={user ? '/mon-compte' : '/connexion'}
          aria-label={t.nav.account}
          title={t.nav.account}
          style={{ display: 'flex', color: activeNav === 'account' ? 'var(--cyan)' : dark ? 'var(--cream)' : 'var(--ink)' }}
        >
          <AccountIcon />
        </Link>
        {cta && (
          <Link to={cta.to} className="cta desktop-only" style={{ fontSize: 14, padding: '10px 20px', width: 'auto' }}>
            {cta.label}
          </Link>
        )}
      </div>
    </header>
  );
}
