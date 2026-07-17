import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  comingSoonFeature?: string;
  comingSoonBadge: string;
  highlighted?: boolean;
  badge?: string;
  children: React.ReactNode;
}

function PlanCard({ name, price, period, description, features, comingSoonFeature, comingSoonBadge, highlighted, badge, children }: PlanCardProps) {
  return (
    <div
      style={{
        flex: '1 1 300px',
        maxWidth: 360,
        position: 'relative',
        background: highlighted ? 'var(--ink)' : '#fff',
        color: highlighted ? '#fff' : 'var(--ink)',
        border: highlighted ? 'none' : '1px solid var(--border)',
        borderRadius: 20,
        padding: '32px 28px',
        boxShadow: highlighted ? '0 20px 48px rgba(28,28,46,.28)' : '0 2px 10px rgba(0,0,0,.05)',
        transform: highlighted ? 'scale(1.03)' : undefined,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--yellow)',
            color: 'var(--ink)',
            font: '800 11px Geist',
            letterSpacing: 0.4,
            padding: '6px 16px',
            borderRadius: 999,
            boxShadow: '0 4px 10px rgba(0,0,0,.18)',
            whiteSpace: 'nowrap',
          }}
        >
          {badge}
        </div>
      )}

      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{name}</div>
      <p style={{ font: '600 13px/1.5 Geist', color: highlighted ? 'rgba(255,255,255,.7)' : 'var(--muted)', margin: '0 0 20px', minHeight: 40 }}>
        {description}
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
        <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 40, lineHeight: 1 }}>{price}</span>
        <span style={{ font: '600 13px Geist', color: highlighted ? 'rgba(255,255,255,.6)' : 'var(--muted)' }}>{period}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, flex: 1 }}>
        {features.map((feature) => (
          <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span
              style={{
                flex: 'none',
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: highlighted ? 'rgba(255,255,255,.16)' : 'var(--success-bg)',
                color: highlighted ? '#fff' : 'var(--success-text)',
                marginTop: 1,
              }}
            >
              <CheckIcon />
            </span>
            <span style={{ font: '600 13.5px/1.5 Geist' }}>{feature}</span>
          </div>
        ))}
        {comingSoonFeature && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                flex: 'none',
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: highlighted ? 'rgba(255,255,255,.16)' : 'var(--success-bg)',
                color: highlighted ? '#fff' : 'var(--success-text)',
                marginTop: 1,
              }}
            >
              <CheckIcon />
            </span>
            <span style={{ font: '600 13.5px/1.5 Geist' }}>{comingSoonFeature}</span>
            <span
              style={{
                font: '700 9px Geist',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                padding: '3px 8px',
                borderRadius: 999,
                background: highlighted ? 'rgba(255,255,255,.16)' : 'var(--gray-bg)',
                color: highlighted ? '#fff' : 'var(--muted)',
              }}
            >
              {comingSoonBadge}
            </span>
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

export function Pricing() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const startWizard = (format: 'print' | 'digital') => {
    sessionStorage.setItem('nenos_preferred_format', format);
    navigate('/creer');
  };

  const submitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const response = await fetch('/api/subscription-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('failed');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const p = t.pricing;

  return (
    <div className="screen">
      <Header variant="light" showNav cta={{ label: t.landing.cta, to: '/creer' }} />

      <div className="container" style={{ padding: '48px 22px 64px' }}>
        <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 44px' }}>
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 36px)', color: 'var(--ink)', marginBottom: 14 }}>
            {p.title}
          </div>
          <p style={{ font: '600 15px/1.6 Geist', color: 'var(--muted)', margin: 0 }}>{p.subtitle}</p>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
          <PlanCard
            name={p.digital.name}
            price={p.digital.price}
            period={p.oneTime}
            description={p.digital.description}
            features={p.digital.features}
            comingSoonBadge={p.comingSoonBadge}
          >
            <button type="button" className="cta-secondary" style={{ width: '100%' }} onClick={() => startWizard('digital')}>
              {p.digital.cta}
            </button>
          </PlanCard>

          <PlanCard
            name={p.hardcover.name}
            price={p.hardcover.price}
            period={p.oneTime}
            description={p.hardcover.description}
            features={p.hardcover.features}
            comingSoonBadge={p.comingSoonBadge}
          >
            <button type="button" className="cta-secondary" style={{ width: '100%' }} onClick={() => startWizard('print')}>
              {p.hardcover.cta}
            </button>
          </PlanCard>

          <PlanCard
            name={p.subscription.name}
            price={p.subscription.price}
            period={p.perMonth}
            description={p.subscription.description}
            features={p.subscription.features.slice(0, -1)}
            comingSoonFeature={p.subscription.features[p.subscription.features.length - 1]}
            comingSoonBadge={p.comingSoonBadge}
            highlighted
            badge={p.subscription.badge}
          >
            {status === 'done' ? (
              <p style={{ font: '700 13px/1.5 Geist', color: '#fff', margin: 0, textAlign: 'center' }}>{p.subscription.successMessage}</p>
            ) : (
              <form onSubmit={submitInterest} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={p.subscription.emailPlaceholder}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,.25)',
                    background: 'rgba(255,255,255,.08)',
                    color: '#fff',
                    font: '600 14px Geist',
                  }}
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    font: '700 15px Geist',
                    color: 'var(--ink)',
                    background: 'var(--yellow)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '13px 0',
                    cursor: 'pointer',
                  }}
                >
                  {status === 'submitting' ? p.subscription.submitting : p.subscription.submitCta}
                </button>
                {status === 'error' && (
                  <p style={{ font: '600 12px Geist', color: '#ffb4b4', margin: 0, textAlign: 'center' }}>{p.subscription.errorMessage}</p>
                )}
              </form>
            )}
          </PlanCard>
        </div>
      </div>
    </div>
  );
}
