import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import heroChild from '../assets/hero-child.png';
import coverFr from '../assets/cover-fr.png';

// Cross-fades the default hero shot with two real customers' hero portraits
// (shown with their explicit consent) — "Ced" (the founder's own account)
// and "Yaiza" (a beta tester). Real book/avatar IDs, not static assets, so
// this breaks if either record is ever deleted from D1/R2.
const HERO_IMAGES = [
  heroChild,
  '/api/books/74dfb5b0-84e1-43d7-b620-8a4703f53db5/assets/portrait.png',
  '/api/books/2ffca42e-1cc8-4710-b450-94fc21629357/full-assets/portrait.png',
];
const HERO_FADE_INTERVAL_MS = 4500;

function HeroFader() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % HERO_IMAGES.length), HERO_FADE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === index ? 1 : 0,
            transition: 'opacity 1.5s ease',
          }}
        />
      ))}
    </>
  );
}

export function Landing() {
  const { t } = useLanguage();

  return (
    <div className="screen">
      <Header variant="light" showNav cta={{ label: t.landing.cta, to: '/creer' }} />

      <div
        style={{
          position: 'relative',
          minHeight: '70svh',
          display: 'flex',
          alignItems: 'flex-end',
          overflow: 'hidden',
        }}
      >
        <HeroFader />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(0deg, #0F0C08EB, rgba(0,0,0,.28) 45%, rgba(0,0,0,0) 75%)',
          }}
        />
        <div className="container" style={{ position: 'relative', padding: '40px 22px 40px' }}>
          <div
            style={{
              fontFamily: 'Geist, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(30px, 5vw, 48px)',
              lineHeight: 1.15,
              color: '#FFFFFF',
              maxWidth: 620,
            }}
          >
            {t.landing.headline}
          </div>
          <p
            style={{
              font: '500 16px/1.6 Geist',
              color: '#F0F0F2',
              margin: '18px 0 26px',
              maxWidth: 420,
            }}
          >
            {t.landing.subtitle}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to="/creer"
              className="cta"
              style={{ fontSize: 18, padding: '15px 28px', width: 'auto', display: 'inline-block' }}
            >
              {t.landing.cta}
            </Link>
            <Link
              to="/creer-avatar"
              className="cta-secondary"
              style={{
                fontSize: 15,
                padding: '15px 24px',
                width: 'auto',
                display: 'inline-block',
                background: 'rgba(255,255,255,.1)',
                borderColor: 'rgba(255,255,255,.35)',
                color: '#fff',
              }}
            >
              {t.landing.ctaAvatar}
            </Link>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--ink)',
          padding: '36px 22px',
        }}
      >
        <Link
          to="/exemples/lea-dragon-etoiles"
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 24,
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              fontFamily: 'Geist, sans-serif',
              fontWeight: 800,
              color: 'var(--cream)',
              fontSize: 20,
              flex: 'none',
            }}
          >
            {t.landing.exampleTitle}
          </div>
          <div
            style={{
              width: 120,
              flex: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,.35)',
              background: '#fff',
            }}
          >
            <div
              style={{
                height: 150,
                backgroundImage: `url(${coverFr})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ font: '700 13px/1.5 Geist', color: 'var(--cream)', margin: '0 0 8px' }}>
              {t.landing.exampleQuote}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  font: '600 10px Geist',
                  background: 'rgba(255,255,255,0.14)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                {t.landing.badgeIllustrated}
              </span>
              <span
                style={{
                  font: '600 10px Geist',
                  background: 'rgba(255,255,255,0.14)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                {t.landing.badgeRealName}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
