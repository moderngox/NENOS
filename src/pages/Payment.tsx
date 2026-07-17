import { useState } from 'react';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { useBookDraft } from '../context/BookDraftContext';
import { useAuth } from '../context/AuthContext';
import { AuthForm } from '../components/AuthForm';

const UNIVERSE_LABELS: Record<string, { fr: string; en: string }> = {
  space: { fr: 'Espace', en: 'Space' },
  pirates: { fr: 'Pirates', en: 'Pirates' },
  forest: { fr: 'Forêt magique', en: 'Magic forest' },
};

export function Payment() {
  const { t, lang } = useLanguage();
  const { draft, story, preview } = useBookDraft();
  const { user } = useAuth();
  // Carries the plan picked on the pricing page (/tarifs) through the
  // wizard, which doesn't otherwise thread a format preference — read once
  // and cleared so a later, unrelated visit here doesn't inherit it.
  const [format, setFormat] = useState<'print' | 'digital'>(() => {
    const preferred = sessionStorage.getItem('nenos_preferred_format');
    sessionStorage.removeItem('nenos_preferred_format');
    return preferred === 'digital' ? 'digital' : 'print';
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!story) {
      setError(t.payment.error);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`/api/books/${story.bookId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      const body = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !body?.url) {
        throw new Error(body?.error ?? `Request failed with status ${response.status}`);
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  const name = draft.name || (lang === 'fr' ? 'Ton héros' : 'Your hero');
  const title = story?.frontCover.title ?? name;
  const universeLabel = UNIVERSE_LABELS[draft.universe]?.[lang] ?? UNIVERSE_LABELS.space[lang];
  const cover = preview.assets?.coverFrontUrl ?? null;

  const prices = { print: lang === 'fr' ? '29,90€' : '$29.90', digital: lang === 'fr' ? '12,90€' : '$12.90' };
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
            <div
              style={{
                width: 72,
                height: 92,
                flex: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: cover ? undefined : 'var(--gray-bg)',
                backgroundImage: cover ? `url(${cover})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
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
          {user ? (
            <>
              <p style={{ font: '600 12px Geist', color: 'var(--muted)', marginBottom: 10 }}>{t.auth.loggedInAs(user.email)}</p>
              <button type="button" className="cta" style={{ marginBottom: 10 }} onClick={handlePay} disabled={submitting}>
                {submitting ? t.payment.redirecting : t.payment.cta}
              </button>
              {error && (
                <p style={{ textAlign: 'center', font: '600 12px Geist', color: 'var(--red, #d33)', margin: '0 0 10px' }}>{error}</p>
              )}
              <p style={{ textAlign: 'center', font: '600 12px Geist', color: 'var(--muted)', margin: 0 }}>{t.payment.security}</p>
            </>
          ) : (
            <AuthForm returnTo="/paiement" />
          )}
        </div>
      </div>
    </div>
  );
}
