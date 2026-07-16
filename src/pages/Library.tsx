import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface MyBook {
  bookId: string;
  title: string;
  coverUrl: string | null;
  paymentUnlocked: boolean;
  fullStatus: string;
  fullUnitsDone: number;
  fullUnitsTotal: number;
}

export function Library() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
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

  return (
    <div className="screen">
      <Header variant="light" showNav activeNav="library" />
      <div className="container" style={{ padding: '32px 22px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--ink)' }}>{t.library.title}</div>
          <Link to="/creer" className="cta desktop-only" style={{ fontSize: 14, padding: '11px 20px', width: 'auto' }}>
            {t.library.newBook}
          </Link>
        </div>

        {!authLoading && !user && (
          <p style={{ font: '600 14px Geist', color: 'var(--muted)' }}>
            {t.library.signedOutMessage} <Link to="/connexion">{t.auth.login}</Link>
          </p>
        )}

        {user && books && books.length === 0 && (
          <p style={{ font: '600 14px Geist', color: 'var(--muted)' }}>{t.library.emptyMessage}</p>
        )}

        {user && books && books.length > 0 && (
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
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        marginBottom: 12,
                        font: '600 10px Geist',
                        background: 'var(--success-bg)',
                        color: 'var(--success-text)',
                        padding: '3px 9px',
                        borderRadius: 999,
                      }}
                    >
                      {t.library.ready}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a
                        href={`/api/books/${book.bookId}/pdf`}
                        style={{ flex: 1, textAlign: 'center', font: '600 12px Geist', color: '#fff', background: 'var(--ink)', border: 'none', borderRadius: 8, padding: '9px 0', textDecoration: 'none' }}
                      >
                        {t.library.downloadPdf}
                      </a>
                      <Link
                        to={`/livre/${book.bookId}`}
                        style={{ flex: 1, textAlign: 'center', font: '600 12px Geist', color: 'var(--ink)', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 0', textDecoration: 'none' }}
                      >
                        {t.library.readOnline}
                      </Link>
                    </div>
                  </>
                ) : book.paymentUnlocked ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span className="spinner" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--ink)', display: 'inline-block' }} />
                      <span style={{ font: '600 11px Geist', color: 'var(--muted)' }}>
                        {book.fullUnitsDone}/{book.fullUnitsTotal}
                      </span>
                    </div>
                    <Link
                      to={`/livre/${book.bookId}`}
                      style={{ display: 'block', textAlign: 'center', width: '100%', font: '600 12px Geist', background: 'var(--gray-bg)', color: 'var(--ink)', border: 'none', borderRadius: 8, padding: '9px 0', textDecoration: 'none' }}
                    >
                      {t.library.readOnline}
                    </Link>
                  </>
                ) : (
                  <button type="button" disabled style={{ width: '100%', font: '600 12px Geist', background: 'var(--gray-bg)', color: '#aaa', border: 'none', borderRadius: 8, padding: '9px 0' }}>
                    {t.library.comingSoon}
                  </button>
                )}
              </div>
            ))}

            <Link
              to="/creer"
              style={{
                border: '1.5px dashed var(--border)',
                borderRadius: 14,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                color: 'var(--muted)',
                minHeight: 200,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gray-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 20px Geist', color: 'var(--ink)' }}>
                +
              </div>
              <span style={{ font: '600 13px Geist' }}>{t.library.newBook}</span>
            </Link>
          </div>
        )}

        <Link to="/creer" className="cta mobile-only" style={{ marginTop: 20 }}>
          {t.library.newBook}
        </Link>
      </div>
    </div>
  );
}
