import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPriceCents, formatDateTime } from './adminUtils';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  orderCount: number;
  lifetimeSpendCents: number;
  lastOrderAt: string | null;
}

const thStyle: React.CSSProperties = { textAlign: 'left', font: '700 11px Geist', color: 'var(--muted)', padding: '10px 14px', borderBottom: '1px solid var(--border)' };
const tdStyle: React.CSSProperties = { font: '600 13px Geist', color: 'var(--ink)', padding: '12px 14px', borderBottom: '1px solid var(--border)' };

export function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[] | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/admin/customers?pageSize=200');
      if (!response.ok) return;
      const body = (await response.json()) as { customers: Customer[] };
      setCustomers(body.customers);
    })();
  }, []);

  return (
    <div>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 24 }}>Customers</div>
      {customers && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Orders</th>
                <th style={thStyle}>Lifetime spend</th>
                <th style={thStyle}>Last order</th>
                <th style={thStyle}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={6}>
                    No customers yet.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/admin/customers/${c.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={tdStyle}>{c.name ?? '—'}</td>
                    <td style={tdStyle}>{c.email}</td>
                    <td style={tdStyle}>{c.orderCount}</td>
                    <td style={tdStyle}>{formatPriceCents(c.lifetimeSpendCents)}</td>
                    <td style={tdStyle}>{c.lastOrderAt ? formatDateTime(c.lastOrderAt) : '—'}</td>
                    <td style={tdStyle}>{formatDateTime(c.createdAt)}</td>
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
