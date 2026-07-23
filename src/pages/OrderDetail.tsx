import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface OrderDetailData {
  bookId: string;
  title: string;
  coverUrl: string | null;
  createdAt: string;
  format: string | null;
  priceCents: number | null;
  paymentStatus: string;
  paymentUnlocked: boolean;
  paymentProvider: string;
  card: { brand: string; last4: string } | null;
  fullStatus: string;
  fullUnitsDone: number;
  fullUnitsTotal: number;
  pdfReady: boolean;
}

function formatPrice(cents: number, lang: 'fr' | 'en'): string {
  const amount = (cents / 100).toFixed(2).replace('.', lang === 'fr' ? ',' : '.');
  return lang === 'fr' ? `${amount}€` : `$${amount}`;
}

function formatDate(iso: string, lang: 'fr' | 'en'): string {
  try {
    return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ font: '600 13px Geist', color: 'var(--muted)' }}>{label}</span>
      <span style={{ font: '700 13px Geist', color: 'var(--ink)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export function OrderDetail() {
  const { t, lang } = useLanguage();
  const { bookId } = useParams();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/me/orders/${bookId}`);
      if (!response.ok) {
        setNotFound(true);
        return;
      }
      const body = (await response.json()) as OrderDetailData;
      setOrder(body);
    })();
  }, [bookId]);

  const statusLabel = (status: string) =>
    status === 'captured' || status === 'paid'
      ? t.account.orderStatusPaid
      : status === 'capture_failed'
        ? t.account.orderStatusFailed
        : t.account.orderStatusPending;

  return (
    <div className="screen">
      <Header variant="light" showNav activeNav="account" />
      <div className="container" style={{ padding: '32px 22px 40px', maxWidth: 560, margin: '0 auto' }}>
        <Link to="/mon-compte" style={{ font: '700 13px Geist', color: 'var(--muted)', display: 'inline-block', marginBottom: 20 }}>
          {t.orderDetail.back}
        </Link>

        {notFound && <p style={{ font: '600 14px Geist', color: 'var(--muted)' }}>{t.orderDetail.notFound}</p>}

        {order && (
          <>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28 }}>
              <div
                style={{
                  width: 64,
                  height: 82,
                  flex: 'none',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: order.coverUrl ? undefined : 'var(--gray-bg)',
                  backgroundImage: order.coverUrl ? `url(${order.coverUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{order.title}</div>
                <div style={{ font: '600 12px Geist', color: 'var(--muted)', marginTop: 4 }}>{t.orderDetail.title}</div>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '4px 20px', background: '#fff', marginBottom: 24 }}>
              <Row label={t.orderDetail.dateLabel} value={formatDate(order.createdAt, lang)} />
              {order.format && (
                <Row label={t.orderDetail.formatLabel} value={order.format === 'print' ? t.account.formatPrint : t.account.formatDigital} />
              )}
              {order.priceCents != null && <Row label={t.orderDetail.priceLabel} value={formatPrice(order.priceCents, lang)} />}
              <Row label={t.orderDetail.paymentStatusLabel} value={statusLabel(order.paymentStatus)} />
              <Row
                label={t.orderDetail.cardLabel}
                value={
                  order.paymentProvider === 'paypal'
                    ? t.orderDetail.paypalValue
                    : order.card
                      ? t.orderDetail.cardValue(capitalize(order.card.brand), order.card.last4)
                      : t.orderDetail.noCardInfo
                }
              />
              <Row
                label={t.orderDetail.bookStatusLabel}
                value={order.fullStatus === 'ready' ? t.orderDetail.bookStatusReady : t.orderDetail.bookStatusInProgress(order.fullUnitsDone, order.fullUnitsTotal)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ font: '600 13px Geist', color: 'var(--muted)' }}>{t.orderDetail.orderIdLabel}</span>
                <span style={{ font: '600 12px Geist', color: 'var(--muted)' }}>{order.bookId}</span>
              </div>
            </div>

            {order.fullStatus === 'ready' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {order.pdfReady ? (
                  <a
                    href={`/api/books/${order.bookId}/pdf`}
                    className="cta"
                    style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                  >
                    {t.account.downloadPdf}
                  </a>
                ) : (
                  <div
                    className="cta-secondary"
                    style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--muted)' }}
                  >
                    <span className="spinner" style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--muted)', display: 'inline-block' }} />
                    {t.account.pdfPreparing}
                  </div>
                )}
                <Link to={`/livre/${order.bookId}`} className="cta-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                  {t.account.readOnline}
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
