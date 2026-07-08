import { useLanguage } from '../context/LanguageContext';

export function Stepper({ step, total, title }: { step: number; total: number; title: string }) {
  const { t } = useLanguage();
  return (
    <div style={{ padding: '18px 22px 6px', maxWidth: 520, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 6,
              background: i < step ? 'var(--ink)' : 'var(--border)',
            }}
          />
        ))}
      </div>
      <div style={{ textAlign: 'center', font: '800 11px Geist', color: 'var(--muted)', letterSpacing: 0.5 }}>
        {t.wizard.stepLabel(step, total, title)}
      </div>
    </div>
  );
}
