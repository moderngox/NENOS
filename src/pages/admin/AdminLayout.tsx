import { useState } from 'react';
import { NavLink, Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/orders', label: 'Orders', end: false },
  { to: '/admin/customers', label: 'Customers', end: false },
  { to: '/admin/generation', label: 'Generation health', end: false },
];

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
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
    </>
  );
}

// Client-side gating here is UX only (avoids a flash of admin UI for a
// non-admin session) — every /api/admin/* route enforces isAdmin itself,
// server-side, on every request via worker/routes/admin/guard.ts.
export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading) return null;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #fff)', overflowX: 'hidden' }}>
      <div
        className="mobile-only"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: '#fff',
        }}
      >
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Nenos Admin</div>
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setDrawerOpen(true)}
          style={{ display: 'flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink)' }}
        >
          <HamburgerIcon />
        </button>
      </div>

      <div style={{ display: 'flex' }}>
        <aside
          className="admin-sidebar"
          style={{
            width: 220,
            flex: 'none',
            borderRight: '1px solid var(--border)',
            padding: '24px 16px',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--ink)', padding: '0 10px 20px' }}>
            Nenos Admin
          </div>
          <NavLinks />
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
        {/* minWidth: 0 stops this flex child from refusing to shrink below
            its content's intrinsic width (e.g. a wide table) — without it,
            the table's own overflow-x:auto never kicks in and the whole
            page scrolls horizontally instead. */}
        <main style={{ flex: 1, minWidth: 0, padding: 'clamp(16px, 4vw, 32px) clamp(16px, 4vw, 36px)', maxWidth: 1200 }}>
          <Outlet />
        </main>
      </div>

      {drawerOpen && (
        <div className="mobile-only" style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '78%',
              maxWidth: 280,
              background: '#fff',
              boxShadow: '-8px 0 24px rgba(0,0,0,.18)',
              padding: '14px 16px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', padding: 6, color: 'var(--ink)', cursor: 'pointer' }}
              >
                <CloseIcon />
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <Link to="/" onClick={() => setDrawerOpen(false)} style={{ font: '600 12px Geist', color: 'var(--muted)', padding: '8px 10px', textDecoration: 'none' }}>
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
          </div>
        </div>
      )}
    </div>
  );
}
