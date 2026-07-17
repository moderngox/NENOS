import { useState } from 'react';
import { Link } from 'react-router-dom';
import logoMark from '../assets/logo-mark.png';
import unknownAvatar from '../assets/unknownAvatar.svg';
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

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
  const { user, profile } = useAuth();
  const avatarSrc = user ? profile?.avatarUrl || unknownAvatar : null;
  const dark = variant === 'dark';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const showMarketingNav = showNav && !activeNav;

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

      {showMarketingNav && (
        <nav
          className="desktop-nav"
          style={{
            alignItems: 'center',
            gap: 28,
            font: '600 14px Geist',
            color: dark ? '#c7c7d6' : '#4a4a55',
          }}
        >
          <Link to="/comment-ca-marche" style={{ color: 'inherit' }}>
            {t.nav.how}
          </Link>
          <Link to="/exemples" style={{ color: 'inherit' }}>
            {t.nav.examples}
          </Link>
          <span>{t.nav.pricing}</span>
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <LanguageToggle dark={dark} />
        {showMarketingNav && (
          <button
            type="button"
            className="mobile-only"
            aria-label="Menu"
            onClick={() => setDrawerOpen(true)}
            style={{ display: 'flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: dark ? 'var(--cream)' : 'var(--ink)' }}
          >
            <HamburgerIcon />
          </button>
        )}
        <Link
          to={user ? '/mon-compte' : '/connexion'}
          aria-label={t.nav.account}
          title={t.nav.account}
          style={{ display: 'flex', color: activeNav === 'account' ? 'var(--cyan)' : dark ? 'var(--cream)' : 'var(--ink)' }}
        >
          {avatarSrc ? (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundImage: `url(${avatarSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: activeNav === 'account' ? '2px solid var(--cyan)' : '1.5px solid rgba(0,0,0,.08)',
              }}
            />
          ) : (
            <AccountIcon />
          )}
        </Link>
        {cta && (
          <Link to={cta.to} className="cta desktop-only" style={{ fontSize: 14, padding: '10px 20px', width: 'auto' }}>
            {cta.label}
          </Link>
        )}
      </div>

      {showMarketingNav && drawerOpen && (
        <div className="mobile-only" style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '78%',
              maxWidth: 300,
              background: '#fff',
              boxShadow: '-8px 0 24px rgba(0,0,0,.18)',
              padding: '14px 22px 22px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fermer"
                style={{ background: 'none', border: 'none', padding: 6, color: 'var(--ink)', cursor: 'pointer' }}
              >
                <CloseIcon />
              </button>
            </div>
            <Link
              to="/comment-ca-marche"
              onClick={() => setDrawerOpen(false)}
              style={{ font: '700 17px Geist', color: 'var(--ink)', padding: '14px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
            >
              {t.nav.how}
            </Link>
            <Link
              to="/exemples"
              onClick={() => setDrawerOpen(false)}
              style={{ font: '700 17px Geist', color: 'var(--ink)', padding: '14px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
            >
              {t.nav.examples}
            </Link>
            <span style={{ font: '700 17px Geist', color: 'var(--ink)', padding: '14px 0' }}>{t.nav.pricing}</span>
          </div>
        </div>
      )}
    </header>
  );
}
