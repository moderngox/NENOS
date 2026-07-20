import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatPriceCents, formatDateTime, paymentStatusPill, generationStatusPill, PillBadge } from './adminUtils';

interface Order {
  bookId: string;
  title: string;
  customerEmail: string | null;
  customerName: string | null;
  format: string | null;
  priceCents: number | null;
  paymentStatus: string;
  fullStatus: string;
  fullUnitsDone: number;
  fullUnitsTotal: number;
  pdfStatus: string;
  pdfUnitsDone: number;
  pdfUnitsTotal: number;
  createdAt: string;
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'generating', label: 'Generating' },
  { value: 'ready', label: 'Ready' },
  { value: 'error', label: 'Error' },
];

const thStyle: React.CSSProperties = { textAlign: 'left', font: '700 11px Geist', color: 'var(--muted)', padding: '10px 14px', borderBottom: '1px solid var(--border)' };
const tdStyle: React.CSSProperties = { font: '600 13px Geist', color: 'var(--ink)', padding: '12px 14px', borderBottom: '1px solid var(--border)' };

export function AdminOrders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    setOrders(null);
    (async () => {
      const url = status ? `/api/admin/orders?status=${status}&pageSize=200` : '/api/admin/orders?pageSize=200';
      const response = await fetch(url);
      if (!response.ok) return;
      const body = (await response.json()) as { orders: Order[] };
      setOrders(body.orders);
    })();
  }, [status]);

  return (
    <div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 20 }}>Orders</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setSearchParams(f.value ? { status: f.value } : {})}
            style={{
              font: status === f.value ? '800 12px Geist' : '600 12px Geist',
              color: status === f.value ? '#fff' : 'var(--ink)',
              background: status === f.value ? 'var(--ink)' : '#fff',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '7px 16px',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Format</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Payment</th>
                <th style={thStyle}>Generation</th>
                <th style={thStyle}>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={7}>
                    No orders match this filter.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.bookId}
                    onClick={() => navigate(`/admin/orders/${o.bookId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={tdStyle}>{o.title}</td>
                    <td style={tdStyle}>{o.customerEmail ?? '—'}</td>
                    <td style={tdStyle}>{o.format ?? '—'}</td>
                    <td style={tdStyle}>{o.priceCents != null ? formatPriceCents(o.priceCents) : '—'}</td>
                    <td style={tdStyle}>
                      <PillBadge pill={paymentStatusPill(o.paymentStatus)} />
                    </td>
                    <td style={tdStyle}>
                      <PillBadge pill={generationStatusPill(o.fullStatus, o.pdfStatus)} />
                    </td>
                    <td style={tdStyle}>{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
