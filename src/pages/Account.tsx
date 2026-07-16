import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { BackButton } from '../components/BackButton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface MyBook {
  bookId: string;
  title: string;
  coverUrl: string | null;
  paymentStatus: string;
  paymentUnlocked: boolean;
  format: string | null;
  priceCents: number | null;
  createdAt: string;
  fullStatus: string;
  fullUnitsDone: number;
  fullUnitsTotal: number;
}

type Tab = 'orders' | 'books';

function formatPrice(cents: number, lang: 'fr' | 'en'): string {
  const amount = (cents / 100).toFixed(2).replace('.', lang === 'fr' ? ',' : '.');
  return lang === 'fr' ? `${amount}€` : `$${amount}`;
}

function formatDate(iso: string, lang: 'fr' | 'en'): string {
  try {
    return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function Account() {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'books' ? 'books' : 'orders';
  const [books, setBooks] = useState<MyBook[] | null>(null);

  useEffect(() => {
    if (!user) {
      setBooks(null);
      return;
    }
    (async () => {
      const response = await fetch('/api/me/books');
      if (!response.ok) {
        setBooks([]);
        return;
      }
      const body = (await response.json()) as { books: MyBook[] };
      setBooks(body.books);
    })();
  }, [user]);

  const setTab = (next: Tab) => setSearchParams(next === 'orders' ? {} : { tab: next });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!authLoading && !user) {
    return (
      <div className="screen">
        <Header variant="light" />
        <div className="container" style={{ padding: '60px 22px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <p style={{ font: '600 14px Geist', color: 'var(--muted)', marginBottom: 20 }}>
            {t.library.signedOutMessage}
          </p>
          <Link to="/connexion" className="cta" style={{ display: 'inline-block' }}>
            {t.auth.login}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <Header variant="light" showNav activeNav="account" />
      <div className="container" style={{ padding: '32px 22px 40px' }}>
        <BackButton fallback="/" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--ink)' }}>{t.account.title}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="cta-secondary"
            style={{ width: 'auto', padding: '10px 20px', fontSize: 13 }}
          >
            {t.account.logout}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {(['orders', 'books'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: tab === id ? '2px solid var(--ink)' : '2px solid transparent',
                padding: '10px 4px',
                marginRight: 20,
                font: tab === id ? '800 14px Geist' : '600 14px Geist',
                color: tab === id ? 'var(--ink)' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              {id === 'orders' ? t.account.ordersTab : t.account.booksTab}
            </button>
          ))}
        </div>

        {books === null ? null : tab === 'orders' ? (
          books.length === 0 ? (
            <p style={{ font: '600 14px Geist', color: 'var(--muted)' }}>{t.account.noOrders}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {books.map((book) => {
                const statusLabel =
                  book.paymentStatus === 'captured' || book.paymentStatus === 'paid'
                    ? t.account.orderStatusPaid
                    : book.paymentStatus === 'capture_failed'
                      ? t.account.orderStatusFailed
                      : t.account.orderStatusPending;
                const statusColor =
                  book.paymentStatus === 'captured' || book.paymentStatus === 'paid'
                    ? { background: 'var(--success-bg)', color: 'var(--success-text)' }
                    : book.paymentStatus === 'capture_failed'
                      ? { background: '#fde2e2', color: '#b3261e' }
                      : { background: 'var(--gray-bg)', color: 'var(--muted)' };
                return (
                  <Link
                    key={book.bookId}
                    to={`/mon-compte/commandes/${book.bookId}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      padding: 16,
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      background: '#fff',
                      textDecoration: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ font: '700 14px Geist', color: 'var(--ink)', marginBottom: 4 }}>{book.title}</div>
                      <div style={{ font: '600 12px Geist', color: 'var(--muted)' }}>
                        {formatDate(book.createdAt, lang)}
                        {book.format && ` · ${book.format === 'print' ? t.account.formatPrint : t.account.formatDigital}`}
                        {book.priceCents != null && ` · ${formatPrice(book.priceCents, lang)}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          font: '700 11px Geist',
                          padding: '5px 12px',
                          borderRadius: 999,
                          ...statusColor,
                        }}
                      >
                        {statusLabel}
                      </span>
                      <span style={{ color: 'var(--muted)', fontSize: 16 }} aria-hidden="true">
                        ›
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        ) : books.length === 0 ? (
          <p style={{ font: '600 14px Geist', color: 'var(--muted)' }}>{t.account.noBooks}</p>
        ) : (
          <div className="library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {books.map((book) => (
              <div
                key={book.bookId}
                style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 18, background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}
              >
                <div
                  style={{
                    height: 150,
                    borderRadius: 8,
                    marginBottom: 14,
                    background: book.coverUrl ? undefined : 'var(--gray-bg)',
                    backgroundImage: book.coverUrl ? `url(${book.coverUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>
                  {book.title}
                </div>

                {book.fullStatus === 'ready' ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={`/api/books/${book.bookId}/pdf`}
                      style={{ flex: 1, textAlign: 'center', font: '600 12px Geist', color: '#fff', background: 'var(--ink)', border: 'none', borderRadius: 8, padding: '9px 0', textDecoration: 'none' }}
                    >
                      {t.account.downloadPdf}
                    </a>
                    <Link
                      to={`/livre/${book.bookId}`}
                      style={{ flex: 1, textAlign: 'center', font: '600 12px Geist', color: 'var(--ink)', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 0', textDecoration: 'none' }}
                    >
                      {t.account.readOnline}
                    </Link>
                  </div>
                ) : book.paymentUnlocked ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', font: '600 12px Geist', background: 'var(--gray-bg)', color: 'var(--muted)', border: 'none', borderRadius: 8, padding: '9px 0' }}>
                    <span className="spinner" style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--muted)', display: 'inline-block' }} />
                    {t.account.preparing(book.fullUnitsDone, book.fullUnitsTotal)}
                  </div>
                ) : (
                  <button type="button" disabled style={{ width: '100%', font: '600 12px Geist', background: 'var(--gray-bg)', color: '#aaa', border: 'none', borderRadius: 8, padding: '9px 0' }}>
                    {t.account.comingSoon}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
