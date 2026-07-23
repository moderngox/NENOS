import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Row } from '../OrderDetail';
import { formatPriceCents, formatDateTime, paymentStatusPill, PillBadge } from './adminUtils';

interface AdminOrder {
  bookId: string;
  title: string;
  childName: string;
  customerEmail: string | null;
  customerName: string | null;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
  format: string | null;
  priceCents: number | null;
  paymentStatus: string;
  paymentProvider: string;
  stripeStatus: string | null;
  stripePaymentIntentId: string | null;
  paypalAuthorizationId: string | null;
  card: { brand: string; last4: string } | null;
  previewStatus: string;
  avatarStatus: string | null;
  fullStatus: string;
  fullUnitsDone: number;
  fullUnitsTotal: number;
  pdfStatus: string;
  pdfUnitsDone: number;
  pdfUnitsTotal: number;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AdminOrderDetail() {
  const { bookId } = useParams();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = async () => {
    const response = await fetch(`/api/admin/orders/${bookId}`);
    if (!response.ok) {
      setNotFound(true);
      return;
    }
    setOrder((await response.json()) as AdminOrder);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const runAction = async (path: string) => {
    setActionBusy(true);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/admin/books/${bookId}/${path}`, { method: 'POST' });
      const body = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      setActionMessage(response.ok ? body.message ?? 'Done.' : body.error ?? 'Action failed.');
      if (response.ok) await load();
    } catch {
      setActionMessage('Action failed — network error.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRegenerate = () => {
    if (
      !window.confirm(
        'Regenerate the entire book? This rewrites the story and every image from scratch (real OpenAI cost) and overwrites what the customer currently has. This cannot be undone.'
      )
    ) {
      return;
    }
    runAction('regenerate');
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <Link to="/admin/orders" style={{ font: '700 13px Geist', color: 'var(--muted)', display: 'inline-block', marginBottom: 20 }}>
        ← Back to orders
      </Link>

      {notFound && <p style={{ font: '600 14px Geist', color: 'var(--muted)' }}>Order not found.</p>}

      {order && (
        <>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 56,
                height: 72,
                flex: 'none',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: order.coverUrl ? undefined : 'var(--gray-bg)',
                backgroundImage: order.coverUrl ? `url(${order.coverUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div>
              <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{order.title}</div>
              <div style={{ font: '600 12px Geist', color: 'var(--muted)', marginTop: 4 }}>For {order.childName}</div>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '4px 20px', background: '#fff', marginBottom: 20 }}>
            <Row label="Customer" value={order.customerName ? `${order.customerName} (${order.customerEmail})` : order.customerEmail ?? '—'} />
            <Row label="Placed" value={formatDateTime(order.createdAt)} />
            <Row label="Last updated" value={formatDateTime(order.updatedAt)} />
            {order.format && <Row label="Format" value={order.format} />}
            {order.priceCents != null && <Row label="Price" value={formatPriceCents(order.priceCents)} />}
            <Row label="Payment" value={<PillBadge pill={paymentStatusPill(order.paymentStatus)} />} />
            <Row label="Payment method" value={order.paymentProvider === 'paypal' ? 'PayPal' : 'Stripe'} />
            {order.stripeStatus && <Row label="Stripe status" value={order.stripeStatus} />}
            <Row
              label="Card"
              value={order.paymentProvider === 'paypal' ? 'N/A (PayPal)' : order.card ? `${capitalize(order.card.brand)} •••• ${order.card.last4}` : '—'}
            />
            <Row label="Preview" value={order.previewStatus} />
            {order.avatarStatus && <Row label="Avatar" value={order.avatarStatus} />}
            <Row label="Full generation" value={order.fullStatus === 'ready' ? 'Ready' : `${order.fullStatus} (${order.fullUnitsDone}/${order.fullUnitsTotal})`} />
            <Row label="PDF build" value={order.pdfStatus === 'ready' ? 'Ready' : `${order.pdfStatus} (${order.pdfUnitsDone}/${order.pdfUnitsTotal})`} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ font: '600 13px Geist', color: 'var(--muted)' }}>Book ID</span>
              <span style={{ font: '600 12px Geist', color: 'var(--muted)' }}>{order.bookId}</span>
            </div>
          </div>

          {(order.fullStatus === 'ready' || order.pdfStatus === 'ready') && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {order.fullStatus === 'ready' && (
                <Link to={`/livre/${order.bookId}`} target="_blank" rel="noreferrer" className="cta-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                  Read book
                </Link>
              )}
              {order.pdfStatus === 'ready' && (
                <a href={`/api/books/${order.bookId}/pdf`} className="cta-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                  Download PDF
                </a>
              )}
            </div>
          )}

          {order.fullStatus !== 'generating' && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={handleRegenerate}
              style={{
                width: '100%',
                font: '700 13px Geist',
                color: '#b3261e',
                background: '#fff',
                border: '1px solid #f3b9b4',
                borderRadius: 12,
                padding: '13px 0',
                marginBottom: 16,
                cursor: actionBusy ? 'not-allowed' : 'pointer',
              }}
            >
              Regenerate entire book (new story + all images)
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {(order.fullStatus === 'error' || order.fullStatus === 'generating') && (
              <button type="button" disabled={actionBusy} onClick={() => runAction('retry-generation')} className="cta-secondary">
                Retry full-book generation
              </button>
            )}
            {(order.pdfStatus === 'error' || order.pdfStatus === 'generating') && (
              <button type="button" disabled={actionBusy} onClick={() => runAction('retry-pdf')} className="cta-secondary">
                Retry PDF build
              </button>
            )}
            {order.fullStatus === 'ready' && (
              <button type="button" disabled={actionBusy} onClick={() => runAction('resend-ready-email')} className="cta-secondary">
                Resend "book ready" email
              </button>
            )}
          </div>

          {actionMessage && <p style={{ font: '600 13px Geist', color: 'var(--ink)' }}>{actionMessage}</p>}
        </>
      )}
    </div>
  );
}
