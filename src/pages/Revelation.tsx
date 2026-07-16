import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { useBookDraft } from '../context/BookDraftContext';

function Spinner() {
  return (
    <span
      className="spinner"
      style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--ink)', display: 'inline-block' }}
    />
  );
}

export function Revelation() {
  const { t, lang } = useLanguage();
  const { story, preview, generatePreview } = useBookDraft();

  useEffect(() => {
    if (story && preview.status === 'idle') {
      generatePreview().catch(() => {
        // failure is already captured in preview.status/preview.error
      });
    }
  }, [story, preview.status, generatePreview]);

  if (!story) {
    return (
      <div className="screen">
        <Header variant="light" />
        <div className="container" style={{ padding: '60px 22px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, marginBottom: 20 }}>
            {lang === 'fr' ? 'Créons d’abord ton histoire !' : "Let's create your story first!"}
          </p>
          <Link to="/creer" className="cta">
            {lang === 'fr' ? 'Créer mon livre →' : 'Create my book →'}
          </Link>
        </div>
      </div>
    );
  }

  const price = lang === 'fr' ? '24,90€' : '$24.90';
  const { title, subtitle } = story.frontCover;
  const page1Text = story.pages[0]?.text ?? '';
  const isGenerating = preview.status === 'generating' || preview.status === 'idle';

  return (
    <div className="screen">
      <Header variant="light" />

      <div className="container" style={{ padding: '32px 22px 40px' }}>
        <div className="revelation-layout" style={{ display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 'none', width: '100%', maxWidth: 300, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--ink)', marginBottom: 24 }}>
              {t.revelation.heroReady}
            </div>

            <div
              style={{
                width: 200,
                margin: '0 auto',
                border: '1px solid var(--border)',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(0,0,0,.16)',
                background: '#fff',
              }}
            >
              <div style={{ position: 'relative', height: 260 }}>
                {preview.status === 'ready' && preview.assets ? (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${preview.assets.coverFrontUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,.5), rgba(0,0,0,0) 55%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        left: 12,
                        right: 12,
                        color: '#fff',
                        fontFamily: '"Baloo 2", Geist, sans-serif',
                        fontWeight: 800,
                        fontSize: 16,
                        lineHeight: 1.15,
                        textShadow: '0 2px 6px rgba(0,0,0,.55)',
                      }}
                    >
                      {title}
                    </div>
                    {subtitle && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 62,
                          left: 12,
                          right: 12,
                          color: '#fff',
                          font: '600 11px Geist',
                          textShadow: '0 1px 4px rgba(0,0,0,.5)',
                        }}
                      >
                        {subtitle}
                      </div>
                    )}
                  </>
                ) : preview.status === 'error' ? (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 14,
                      textAlign: 'center',
                      font: '600 11px Geist',
                      color: 'var(--muted)',
                    }}
                  >
                    {preview.error}
                  </div>
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Spinner />
                    <span style={{ font: '600 11px Geist', color: 'var(--muted)' }}>{t.wizard.generating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 16 }}>
              {t.revelation.previewTitle}
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, position: 'relative', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 180,
                  height: 132,
                  backgroundImage: preview.assets ? `url(${preview.assets.page1Url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  boxShadow: '0 4px 14px rgba(0,0,0,.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isGenerating && <Spinner />}
                {preview.status === 'error' && <span style={{ font: '600 10px Geist', color: 'var(--muted)' }}>—</span>}
              </div>
              <div
                style={{
                  width: 180,
                  height: 132,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  boxShadow: '0 4px 14px rgba(0,0,0,.10)',
                  background: '#fff',
                  padding: 12,
                  overflow: 'hidden',
                  font: '500 11px Geist',
                  color: 'var(--ink)',
                  lineHeight: 1.4,
                }}
              >
                {page1Text}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: -10,
                  right: 6,
                  background: 'var(--ink)',
                  color: '#fff',
                  font: '600 10px Geist',
                  padding: '4px 10px',
                  borderRadius: 6,
                  boxShadow: '0 2px 6px rgba(0,0,0,.16)',
                }}
              >
                {t.revelation.previewBadge}
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 24, background: 'var(--panel-bg)', maxWidth: 540 }}>
              <Link to="/paiement" className="cta" style={{ fontSize: 18, padding: '15px 0', width: '100%', marginBottom: 8 }}>
                {t.revelation.unlockCta(price)}
              </Link>
              <p style={{ textAlign: 'center', font: '700 11px Geist', color: 'var(--muted)', margin: '0 0 10px' }}>
                {t.revelation.pagesCaption}
              </p>
              <p style={{ textAlign: 'center', font: '600 11px Geist', color: 'var(--muted)', margin: 0 }}>
                {t.revelation.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
