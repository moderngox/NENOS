import { useState } from 'react';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { useBookDraft } from '../context/BookDraftContext';
import coverFr from '../assets/cover-fr.png';
import coverEn from '../assets/cover-en.png';

const TITLES: Record<string, { fr: string; en: string }> = {
  space: { fr: 'et le Dragon des Étoiles', en: 'and the Dragon of a Thousand Stars' },
  pirates: { fr: ', Capitaine des Mers', en: ', Captain of the Seas' },
  forest: { fr: 'et la Forêt Enchantée', en: 'and the Enchanted Forest' },
};

const UNIVERSE_LABELS: Record<string, { fr: string; en: string }> = {
  space: { fr: 'Espace', en: 'Space' },
  pirates: { fr: 'Pirates', en: 'Pirates' },
  forest: { fr: 'Forêt magique', en: 'Magic forest' },
};

export function Payment() {
  const { t, lang } = useLanguage();
  const { draft } = useBookDraft();
  const [format, setFormat] = useState<'print' | 'digital'>('print');

  const name = draft.name || (lang === 'fr' ? 'Ton héros' : 'Your hero');
  const suffix = TITLES[draft.universe]?.[lang] ?? TITLES.space[lang];
  const title = `${name} ${suffix}`;
  const universeLabel = UNIVERSE_LABELS[draft.universe]?.[lang] ?? UNIVERSE_LABELS.space[lang];
  const cover = lang === 'fr' ? coverFr : coverEn;

  const prices = { print: lang === 'fr' ? '24,90€' : '$24.90', digital: lang === 'fr' ? '12,90€' : '$12.90' };
  const total = prices[format];

  return (
    <div className="screen">
      <Header variant="light" />
      <div className="container payment-layout" style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px', padding: '32px 22px' }}>
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--ink)', marginBottom: 20 }}>
            {t.payment.title}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              padding: 16,
              background: 'var(--panel-bg)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 1px 4px rgba(0,0,0,.06)',
              marginBottom: 28,
            }}
          >
            <div style={{ width: 72, height: 92, flex: 'none', border: '1px solid var(--border)', borderRadius: 6, backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>{title}</div>
              <div style={{ font: '600 12px Geist', color: 'var(--muted)', marginTop: 6 }}>
                32 {lang === 'fr' ? 'pages' : 'pages'} · {lang === 'fr' ? 'thème' : 'theme'} {universeLabel} · {lang === 'fr' ? 'héroïne' : 'hero'} : {name}
              </div>
            </div>
          </div>

          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 12 }}>
            {t.payment.chooseFormat}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['print', 'digital'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  border: format === f ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                  borderRadius: 10,
                  background: format === f ? 'var(--gray-bg)' : '#fff',
                  textAlign: 'left',
                }}
              >
                <span style={{ font: '700 14px Geist', color: 'var(--ink)' }}>
                  {f === 'print' ? t.payment.formatPrint : t.payment.formatDigital}
                </span>
                <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
                  {prices[f]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: '1 1 340px', padding: '32px 22px', background: 'var(--panel-bg)' }}>
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 16 }}>
            {t.payment.summary}
          </div>
          <div style={{ font: '600 14px/2.1 Geist', color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{format === 'print' ? t.payment.formatPrint : t.payment.formatDigital}</span>
            <span>{total}</span>
          </div>
          <div style={{ font: '600 14px/2.1 Geist', color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t.payment.delivery}</span>
            <span>{t.payment.deliveryValue}</span>
          </div>
          <div
            style={{
              borderTop: '1px solid var(--border)',
              marginTop: 10,
              paddingTop: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 26,
            }}
          >
            <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>{t.payment.total}</span>
            <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)' }}>{total}</span>
          </div>
          <button type="button" className="cta" style={{ marginBottom: 10 }}>
            {t.payment.cta}
          </button>
          <p style={{ textAlign: 'center', font: '600 12px Geist', color: 'var(--muted)', margin: 0 }}>{t.payment.security}</p>
        </div>
      </div>
    </div>
  );
}
