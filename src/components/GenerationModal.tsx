import { useEffect, useState } from 'react';

interface GenerationModalProps {
  open: boolean;
  title: string;
  waitMessage: string;
  steps: string[];
  tips: string[];
}

// We don't have real per-step progress from the backend for these flows —
// generation happens in one shot server-side (see worker/routes/avatar.ts
// and worker/routes/preview.ts). So the step list and progress bar are
// paced on a client-side timer, calibrated to roughly how long each image
// takes at "low" quality — a reassuring approximation, not a precise
// measurement. It settles on the last step and holds there (never claims
// 100%) until the parent flips `open` to false once the real result lands.
const STEP_DURATION_MS = 9000;
const TIP_ROTATE_MS = 6000;
const MAX_PCT = 92;

export function GenerationModal({ open, title, waitMessage, steps, tips }: GenerationModalProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!open) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => setElapsedMs(Date.now() - start), 500);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const stepIndex = Math.min(steps.length - 1, Math.floor(elapsedMs / STEP_DURATION_MS));
  const tipIndex = tips.length > 0 ? Math.floor(elapsedMs / TIP_ROTATE_MS) % tips.length : 0;
  const pct = Math.min(((stepIndex + 1) / steps.length) * MAX_PCT, MAX_PCT);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,12,8,.72)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '32px 28px',
          maxWidth: 380,
          width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,.35)',
          textAlign: 'center',
        }}
      >
        <span
          className="spinner"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--ink)',
            display: 'inline-block',
          }}
        />
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 19, color: 'var(--ink)', margin: '14px 0 6px' }}>
          {title}
        </div>
        <p style={{ font: '600 13px Geist', color: 'var(--muted)', margin: '0 0 20px' }}>{waitMessage}</p>

        <div style={{ height: 8, borderRadius: 999, background: 'var(--border)', overflow: 'hidden', marginBottom: 18 }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'var(--ink)',
              borderRadius: 999,
              transition: 'width 0.6s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, textAlign: 'left', marginBottom: 20 }}>
          {steps.map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i <= stepIndex ? 1 : 0.4 }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: i < stepIndex ? 'var(--ink)' : 'transparent',
                  border: i === stepIndex ? '2px solid var(--ink)' : i < stepIndex ? 'none' : '2px solid var(--border)',
                  color: '#fff',
                  font: '700 11px Geist',
                }}
                aria-hidden="true"
              >
                {i < stepIndex ? '✓' : ''}
              </span>
              <span style={{ font: `${i === stepIndex ? '700' : '600'} 13px Geist`, color: i === stepIndex ? 'var(--ink)' : 'var(--muted)' }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {tips.length > 0 && (
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 14 }}>
            <p style={{ font: '600 12px/1.5 Geist', color: 'var(--muted)', margin: 0 }} aria-live="polite">
              💡 {tips[tipIndex]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
