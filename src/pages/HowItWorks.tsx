import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import heroChild from '../assets/hero-child.png';
import coverFr from '../assets/cover-fr.png';
import coverEn from '../assets/cover-en.png';

// Steps 1 and 3 get a supporting image (Léa's character portrait, then her
// book cover) so the page reads as "here's what that actually looks like",
// not just a bare numbered list — the other steps stay text-only by design.
const STEP_IMAGES: Record<number, string> = {
  0: heroChild,
};

export function HowItWorks() {
  const { t, lang } = useLanguage();
  const cover = lang === 'fr' ? coverFr : coverEn;
  const stepImages: Record<number, string> = { ...STEP_IMAGES, 2: cover };

  return (
    <div className="screen">
      <Header variant="light" showNav />
      <div className="container" style={{ padding: '32px 22px 56px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--ink)', marginBottom: 8 }}>
          {t.howItWorks.title}
        </div>
        <p style={{ font: '600 14px Geist', color: 'var(--muted)', marginBottom: 32 }}>{t.howItWorks.intro}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {t.howItWorks.steps.map((step, i) => (
            <div
              key={step.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: 18,
                border: '1px solid var(--border)',
                borderRadius: 14,
                background: '#fff',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  flex: 'none',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--ink)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Geist, sans-serif',
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {i + 1}
              </div>

              {stepImages[i] && (
                <div
                  style={{
                    flex: 'none',
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    backgroundImage: `url(${stepImages[i]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>
                  {step.title}
                </div>
                <p style={{ font: '500 13px/1.5 Geist', color: 'var(--muted)', margin: 0 }}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 28,
            padding: 24,
            border: '1px solid var(--border)',
            borderRadius: 14,
            background: 'var(--panel-bg)',
          }}
        >
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 8 }}>
            {t.howItWorks.disclaimerTitle}
          </div>
          <p style={{ font: '500 13px/1.5 Geist', color: 'var(--muted)', margin: '0 0 20px' }}>{t.howItWorks.disclaimer}</p>
          <Link to="/creer" className="cta" style={{ fontSize: 16, padding: '13px 0', width: '100%', display: 'block', textAlign: 'center' }}>
            {t.howItWorks.cta}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
