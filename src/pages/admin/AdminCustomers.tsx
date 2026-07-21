import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatPriceCents, formatDateTime, customerTypePill, PillBadge, type CustomerType } from './adminUtils';

interface Customer {
  id: string;
  type: CustomerType;
  email: string;
  name: string | null;
  createdAt: string;
  orderCount: number;
  lifetimeSpendCents: number;
  lastOrderAt: string | null;
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'lead', label: 'Lead' },
  { value: 'registered', label: 'Registered' },
  { value: 'customer', label: 'Customer' },
];

const thStyle: React.CSSProperties = { textAlign: 'left', font: '700 11px Geist', color: 'var(--muted)', padding: '10px 14px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { font: '600 13px Geist', color: 'var(--ink)', padding: '12px 14px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };

export function AdminCustomers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') ?? '';
  const [customers, setCustomers] = useState<Customer[] | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/admin/customers?pageSize=200');
      if (!response.ok) return;
      const body = (await response.json()) as { customers: Customer[] };
      setCustomers(body.customers);
    })();
  }, []);

  // All customers/leads are already fetched in one request above (this app
  // has, at most, low hundreds of them) — filtering here avoids a network
  // round-trip per tab click, unlike Orders' server-side status filter.
  const filtered = customers ? (type ? customers.filter((c) => c.type === type) : customers) : null;

  return (
    <div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 20 }}>Customers</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setSearchParams(f.value ? { type: f.value } : {})}
            style={{
              font: type === f.value ? '800 12px Geist' : '600 12px Geist',
              color: type === f.value ? '#fff' : 'var(--ink)',
              background: type === f.value ? 'var(--ink)' : '#fff',
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

      {filtered && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Orders</th>
                  <th style={thStyle}>Lifetime spend</th>
                  <th style={thStyle}>Last order</th>
                  <th style={thStyle}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={7}>
                      No customers match this filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const clickable = c.type !== 'lead';
                    return (
                      <tr
                        key={c.id}
                        onClick={clickable ? () => navigate(`/admin/customers/${c.id}`) : undefined}
                        style={{ cursor: clickable ? 'pointer' : 'default' }}
                      >
                        <td style={tdStyle}>
                          <PillBadge pill={customerTypePill(c.type)} />
                        </td>
                        <td style={tdStyle}>{c.name ?? '—'}</td>
                        <td style={tdStyle}>{c.email}</td>
                        <td style={tdStyle}>{c.orderCount}</td>
                        <td style={tdStyle}>{formatPriceCents(c.lifetimeSpendCents)}</td>
                        <td style={tdStyle}>{c.lastOrderAt ? formatDateTime(c.lastOrderAt) : '—'}</td>
                        <td style={tdStyle}>{formatDateTime(c.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
