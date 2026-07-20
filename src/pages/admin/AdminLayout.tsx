import { NavLink, Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/orders', label: 'Orders', end: false },
  { to: '/admin/customers', label: 'Customers', end: false },
  { to: '/admin/generation', label: 'Generation health', end: false },
];

// Client-side gating here is UX only (avoids a flash of admin UI for a
// non-admin session) — every /api/admin/* route enforces isAdmin itself,
// server-side, on every request via worker/routes/admin/guard.ts.
export function AdminLayout() {
  const { user, loading, logout } = useAuth();

  if (loading) return null;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg, #fff)' }}>
      <aside
        style={{
          width: 220,
          flex: 'none',
          borderRight: '1px solid var(--border)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--ink)', padding: '0 10px 20px' }}>
          Nenos Admin
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              font: isActive ? '800 13px Geist' : '600 13px Geist',
              color: isActive ? 'var(--ink)' : 'var(--muted)',
              background: isActive ? 'var(--gray-bg)' : 'transparent',
              padding: '10px 10px',
              borderRadius: 8,
              textDecoration: 'none',
            })}
          >
            {item.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 20 }}>
          <Link to="/" style={{ font: '600 12px Geist', color: 'var(--muted)', padding: '8px 10px', textDecoration: 'none' }}>
            ← Back to site
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              font: '600 12px Geist',
              color: 'var(--muted)',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '32px 36px', maxWidth: 1200 }}>
        <Outlet />
      </main>
    </div>
  );
}
