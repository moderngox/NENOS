import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="var(--success-bg, #e3f6e8)" />
      <path d="M7 12.5l3 3 7-7" stroke="var(--success-text, #1a7a3c)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function OrderConfirmed() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('bookId');

  const steps = [
    { label: t.orderConfirmed.stepPaid, done: true },
    { label: t.orderConfirmed.stepPreparing, done: false },
    { label: t.orderConfirmed.stepEmail, done: false },
  ];

  return (
    <div className="screen">
      <Header variant="light" />
      <div className="container" style={{ padding: '60px 22px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <CheckIcon />
        </div>
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 10 }}>
          {t.orderConfirmed.title}
        </div>
        <p style={{ font: '600 14px/1.6 Geist', color: 'var(--ink-soft)', marginBottom: 28 }}>{t.orderConfirmed.subtitle}</p>

        <div style={{ textAlign: 'left', border: '1px solid var(--border)', borderRadius: 14, padding: 20, background: 'var(--panel-bg)', marginBottom: 28 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < steps.length - 1 ? 16 : 0 }}>
              <div
                style={{
                  flex: 'none',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                  background: step.done ? 'var(--success-bg, #e3f6e8)' : 'var(--gray-bg)',
                  color: step.done ? 'var(--success-text, #1a7a3c)' : 'var(--muted)',
                  font: '800 12px Geist',
                }}
              >
                {step.done ? '✓' : i + 1}
              </div>
              <span style={{ font: step.done ? '700 13px Geist' : '600 13px Geist', color: step.done ? 'var(--ink)' : 'var(--ink-soft)', lineHeight: 1.5 }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {bookId && (
          <Link to={`/livre/${bookId}`} className="cta-secondary" style={{ display: 'inline-block', marginBottom: 14 }}>
            {t.orderConfirmed.trackProgress}
          </Link>
        )}
        <div>
          <Link to="/" className="cta-secondary" style={{ display: 'inline-block' }}>
            {t.orderConfirmed.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
