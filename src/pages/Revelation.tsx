import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { useBookDraft } from '../context/BookDraftContext';
import heroChild from '../assets/hero-child.png';
import avatarAlt from '../assets/avatar-alt.png';
import coverFr from '../assets/cover-fr.png';
import coverEn from '../assets/cover-en.png';
import page1Fr from '../assets/page-1-fr.png';
import page2Fr from '../assets/page-2-fr.png';
import page1En from '../assets/page-1-en.png';
import page2En from '../assets/page-2-en.png';

const TITLE_TEMPLATES: Record<string, { fr: (name: string) => string; en: (name: string) => string }> = {
  space: {
    fr: (name) => `${name} et le Dragon des Étoiles`,
    en: (name) => `${name} and the Dragon of a Thousand Stars`,
  },
  pirates: {
    fr: (name) => `${name}, Capitaine des Mers`,
    en: (name) => `${name}, Captain of the Seas`,
  },
  forest: {
    fr: (name) => `${name} et la Forêt Enchantée`,
    en: (name) => `${name} and the Enchanted Forest`,
  },
};

export function Revelation() {
  const { t, lang } = useLanguage();
  const { draft } = useBookDraft();

  const name = draft.name || (lang === 'fr' ? 'ton héros' : 'your hero');
  const template = TITLE_TEMPLATES[draft.universe] ?? TITLE_TEMPLATES.space;
  const title = lang === 'fr' ? template.fr(name) : template.en(name);
  const price = lang === 'fr' ? '24,90€' : '$24.90';

  const avatarImg = lang === 'fr' ? heroChild : avatarAlt;
  const coverImg = lang === 'fr' ? coverFr : coverEn;
  const page1 = lang === 'fr' ? page1Fr : page1En;
  const page2 = lang === 'fr' ? page2Fr : page2En;

  return (
    <div className="screen">
      <Header variant="light" />

      <div className="container" style={{ padding: '32px 22px 40px' }}>
        <div className="revelation-layout" style={{ display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 'none', width: '100%', maxWidth: 300, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--ink)', marginBottom: 24 }}>
              {t.revelation.heroReady}
            </div>
            <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto 24px' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '4px solid #FFFFFF',
                  boxShadow: '0 6px 20px rgba(0,0,0,.18)',
                  backgroundImage: `url(${avatarImg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div style={{ position: 'absolute', top: -10, left: -14, width: 10, height: 10, borderRadius: '50%', background: 'var(--cyan)' }} />
              <div style={{ position: 'absolute', bottom: -6, right: -16, width: 12, height: 12, transform: 'rotate(45deg)', background: 'var(--ink)', borderRadius: 2 }} />
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
              <div style={{ height: 220, backgroundImage: `url(${coverImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--ink)', marginTop: 16 }}>
              {title}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 16 }}>
              {t.revelation.previewTitle}
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, position: 'relative', flexWrap: 'wrap' }}>
              <div style={{ width: 180, height: 132, backgroundImage: `url(${page1})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 14px rgba(0,0,0,.10)' }} />
              <div style={{ width: 180, height: 132, backgroundImage: `url(${page2})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 14px rgba(0,0,0,.10)' }} />
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
              <p style={{ textAlign: 'center', font: '700 11px Geist', color: 'var(--muted)', margin: 0 }}>
                {t.revelation.pagesCaption}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
