import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatPriceCents, formatDateTime, paymentStatusPill, generationStatusPill, PillBadge } from './adminUtils';

interface KidProfile {
  hasBooks: boolean;
  name: string | null;
  age: number | null;
  avatarUrl: string | null;
  favoriteUniverses: string[];
  traits: string[];
  skinColor: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  appearanceDetails: string;
  points: number;
  booksGenerated: number;
  secondaryCharacters: { name: string; role: string }[];
}

interface Order {
  bookId: string;
  title: string;
  coverUrl: string | null;
  paymentStatus: string;
  format: string | null;
  priceCents: number | null;
  createdAt: string;
  fullStatus: string;
  fullUnitsDone: number;
  fullUnitsTotal: number;
  pdfReady: boolean;
}

interface CustomerDetail {
  id: string;
  email: string;
  name: string | null;
  profile: KidProfile;
  orders: Order[];
}

const thStyle: React.CSSProperties = { textAlign: 'left', font: '700 11px Geist', color: 'var(--muted)', padding: '10px 14px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { font: '600 13px Geist', color: 'var(--ink)', padding: '12px 14px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };

export function AdminCustomerDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/admin/customers/${userId}`);
      if (!response.ok) {
        setNotFound(true);
        return;
      }
      setCustomer((await response.json()) as CustomerDetail);
    })();
  }, [userId]);

  return (
    <div style={{ maxWidth: 720 }}>
      <Link to="/admin/customers" style={{ font: '700 13px Geist', color: 'var(--muted)', display: 'inline-block', marginBottom: 20 }}>
        ← Back to customers
      </Link>

      {notFound && <p style={{ font: '600 14px Geist', color: 'var(--muted)' }}>Customer not found.</p>}

      {customer && (
        <>
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--ink)', marginBottom: 2 }}>
            {customer.name ?? customer.email}
          </div>
          <div style={{ font: '600 13px Geist', color: 'var(--muted)', marginBottom: 24 }}>{customer.email}</div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 20, background: '#fff', marginBottom: 28, display: 'flex', gap: 18 }}>
            <div
              style={{
                width: 84,
                height: 84,
                flex: 'none',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: customer.profile.avatarUrl ? undefined : 'var(--gray-bg)',
                backgroundImage: customer.profile.avatarUrl ? `url(${customer.profile.avatarUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            {customer.profile.hasBooks ? (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>
                  {customer.profile.name}
                  {customer.profile.age != null ? `, ${customer.profile.age} yo` : ''}
                </div>
                <div style={{ font: '600 12px Geist', color: 'var(--muted)', marginTop: 4 }}>
                  {customer.profile.booksGenerated} book{customer.profile.booksGenerated === 1 ? '' : 's'} generated · {customer.profile.points} pts
                </div>
                {customer.profile.traits.length > 0 && (
                  <div style={{ font: '600 12px Geist', color: 'var(--muted)', marginTop: 4 }}>Traits: {customer.profile.traits.join(', ')}</div>
                )}
                {customer.profile.favoriteUniverses.length > 0 && (
                  <div style={{ font: '600 12px Geist', color: 'var(--muted)', marginTop: 4 }}>Universes: {customer.profile.favoriteUniverses.join(', ')}</div>
                )}
                {customer.profile.secondaryCharacters.length > 0 && (
                  <div style={{ font: '600 12px Geist', color: 'var(--muted)', marginTop: 4 }}>
                    Companions: {customer.profile.secondaryCharacters.map((c) => `${c.name} (${c.role})`).join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ font: '600 13px Geist', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                No kid avatar yet — no book or free avatar created.
              </div>
            )}
          </div>

          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 12 }}>Order history</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Format</th>
                    <th style={thStyle}>Price</th>
                    <th style={thStyle}>Payment</th>
                    <th style={thStyle}>Generation</th>
                    <th style={thStyle}>Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.length === 0 ? (
                    <tr>
                      <td style={tdStyle} colSpan={6}>
                        No orders yet.
                      </td>
                    </tr>
                  ) : (
                    customer.orders.map((o) => (
                      <tr key={o.bookId} onClick={() => navigate(`/admin/orders/${o.bookId}`)} style={{ cursor: 'pointer' }}>
                        <td style={tdStyle}>{o.title}</td>
                        <td style={tdStyle}>{o.format ?? '—'}</td>
                        <td style={tdStyle}>{o.priceCents != null ? formatPriceCents(o.priceCents) : '—'}</td>
                        <td style={tdStyle}>
                          <PillBadge pill={paymentStatusPill(o.paymentStatus)} />
                        </td>
                        <td style={tdStyle}>
                          <PillBadge pill={generationStatusPill(o.fullStatus, o.pdfReady ? 'ready' : 'none')} />
                        </td>
                        <td style={tdStyle}>{formatDateTime(o.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
