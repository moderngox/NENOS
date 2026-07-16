import { useState } from 'react';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const BASE = '/exemples/lea-dragon-etoiles';
const PAGE_COUNT = 10;
const TOTAL_SLIDES = PAGE_COUNT + 2; // front cover + pages + back cover

// Most pages were compressed to .jpg; the two reused pre-existing marketing
// assets (cover, page 2) failed to re-encode and were kept as their
// original .png — see poc-imagegen/compress-lea-images.mjs.
function slideUrl(slide: number): string {
  if (slide === 0) return `${BASE}/00-cover-front.png`;
  if (slide === 2) return `${BASE}/02.png`;
  if (slide === TOTAL_SLIDES - 1) return `${BASE}/${PAGE_COUNT + 1}-cover-back.jpg`;
  return `${BASE}/${String(slide).padStart(2, '0')}.jpg`;
}

export function Examples() {
  const { t } = useLanguage();
  const [slide, setSlide] = useState(0);
  const isFront = slide === 0;
  const isBack = slide === TOTAL_SLIDES - 1;

  return (
    <div className="screen">
      <Header variant="light" showNav />
      <div className="container" style={{ padding: '32px 22px 40px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--ink)', marginBottom: 8 }}>
          {t.examplesPage.title}
        </div>
        <p style={{ font: '600 14px Geist', color: 'var(--muted)', marginBottom: 24 }}>{t.examplesPage.intro}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ font: '700 13px Geist', color: 'var(--muted)' }}>
            {isFront ? t.reader.frontCoverLabel : isBack ? t.reader.backCoverLabel : t.reader.pageLabel(slide, PAGE_COUNT)}
          </span>
          <a
            href={`${BASE}/lea-et-le-dragon-des-etoiles.pdf`}
            className="cta-secondary"
            style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
          >
            {t.account.downloadPdf}
          </a>
        </div>

        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0,0,0,.16)',
            background: '#fff',
          }}
        >
          <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3', backgroundColor: '#f4f4f4' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${slideUrl(slide)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <button
            type="button"
            className="cta-secondary"
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => setSlide((s) => Math.max(s - 1, 0))}
            disabled={slide === 0}
          >
            {t.reader.prev}
          </button>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setSlide(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: 'none',
                  padding: 0,
                  background: i === slide ? 'var(--ink)' : 'var(--border)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            className="cta-secondary"
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => setSlide((s) => Math.min(s + 1, TOTAL_SLIDES - 1))}
            disabled={slide === TOTAL_SLIDES - 1}
          >
            {t.reader.next}
          </button>
        </div>
      </div>
    </div>
  );
}
