// Internal admin tooling — English-only by design (no src/i18n entries),
// unlike the rest of this app which is fr/en. Real currency is always EUR
// (see worker/pricing.ts), so this always renders the € symbol regardless
// of any customer-facing language toggle.
export function formatPriceCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export interface Pill {
  label: string;
  background: string;
  color: string;
}

export function paymentStatusPill(status: string): Pill {
  if (status === 'captured') return { label: 'Paid', background: 'var(--success-bg)', color: 'var(--success-text)' };
  if (status === 'authorized') return { label: 'Authorized', background: 'var(--gray-bg)', color: 'var(--muted)' };
  if (status === 'capture_failed') return { label: 'Capture failed', background: '#fde2e2', color: '#b3261e' };
  return { label: 'Unpaid', background: 'var(--gray-bg)', color: 'var(--muted)' };
}

export type CustomerType = 'lead' | 'registered' | 'customer';

export function customerTypePill(type: CustomerType): Pill {
  if (type === 'customer') return { label: 'Customer', background: 'var(--success-bg)', color: 'var(--success-text)' };
  if (type === 'registered') return { label: 'Registered', background: 'var(--gray-bg)', color: 'var(--muted)' };
  return { label: 'Lead', background: '#eef2ff', color: '#3b4ee0' };
}

export function generationStatusPill(fullStatus: string, pdfStatus: string): Pill {
  if (fullStatus === 'error' || pdfStatus === 'error') return { label: 'Error', background: '#fde2e2', color: '#b3261e' };
  if (fullStatus === 'ready' && pdfStatus === 'ready') return { label: 'Ready', background: 'var(--success-bg)', color: 'var(--success-text)' };
  if (fullStatus === 'generating' || pdfStatus === 'generating') return { label: 'Generating', background: '#fff6e0', color: '#8a6400' };
  if (fullStatus === 'ready') return { label: 'Building PDF', background: '#fff6e0', color: '#8a6400' };
  return { label: 'Queued', background: 'var(--gray-bg)', color: 'var(--muted)' };
}

export function PillBadge({ pill }: { pill: Pill }) {
  return (
    <span
      style={{
        font: '700 11px Geist',
        padding: '5px 12px',
        borderRadius: 999,
        background: pill.background,
        color: pill.color,
        whiteSpace: 'nowrap',
      }}
    >
      {pill.label}
    </span>
  );
}
