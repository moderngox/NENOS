import { Link } from 'react-router-dom';
import logoMark from '../assets/logo-mark.png';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  variant?: 'light' | 'dark';
  showNav?: boolean;
  activeNav?: 'library' | 'account';
  cta?: { label: string; to: string };
}

export function Header({ variant = 'light', showNav = false, activeNav, cta }: HeaderProps) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
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

      {showNav && (
        <nav
          className="desktop-nav"
          style={{
            alignItems: 'center',
            gap: 28,
            font: '600 14px Geist',
            color: dark ? '#c7c7d6' : '#4a4a55',
          }}
        >
          {activeNav ? (
            <>
              <Link
                to="/mes-livres"
                style={{ color: activeNav === 'library' ? 'var(--ink)' : undefined, fontWeight: activeNav === 'library' ? 800 : 600 }}
              >
                {t.nav.myBooks}
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={() => logout()}
                  style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0 }}
                >
                  {t.auth.logout}
                </button>
              ) : (
                <Link to="/connexion">{t.auth.login}</Link>
              )}
            </>
          ) : (
            <>
              <span>{t.nav.how}</span>
              <span>{t.nav.examples}</span>
              <span>{t.nav.pricing}</span>
            </>
          )}
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <LanguageToggle dark={dark} />
        {cta && (
          <Link to={cta.to} className="cta desktop-only" style={{ fontSize: 14, padding: '10px 20px', width: 'auto' }}>
            {cta.label}
          </Link>
        )}
      </div>
    </header>
  );
}
