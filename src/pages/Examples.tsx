import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { BackButton } from '../components/BackButton';
import { useLanguage } from '../context/LanguageContext';
import { getExampleBooks } from '../data/exampleBooks';

export function Examples() {
  const { t, lang } = useLanguage();
  const exampleBooks = getExampleBooks(lang);

  return (
    <div className="screen">
      <Header variant="light" showNav />
      <div className="container" style={{ padding: '32px 22px 40px', maxWidth: 720, margin: '0 auto' }}>
        <BackButton fallback="/" />
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--ink)', marginBottom: 8 }}>
          {t.examplesPage.title}
        </div>
        <p style={{ font: '600 14px Geist', color: 'var(--muted)', marginBottom: 24 }}>{t.examplesPage.intro}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {exampleBooks.map((book) => (
            <div
              key={book.slug}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                border: '1px solid var(--border)',
                borderRadius: 14,
                background: '#fff',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 96,
                  flex: 'none',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  backgroundImage: `url(${book.coverUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />

              <div style={{ flex: '1 1 220px', minWidth: 180 }}>
                <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>
                  {book.title}
                </div>
                <div style={{ font: '600 12px Geist', color: 'var(--muted)' }}>{book.subtitle}</div>
              </div>

              <div style={{ flex: '1 1 140px', minWidth: 120 }}>
                <div style={{ font: '700 10px Geist', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                  {t.examplesPage.styleLabel}
                </div>
                <div style={{ font: '600 13px Geist', color: 'var(--ink)' }}>{book.styleLabel}</div>
              </div>

              <div style={{ flex: '1 1 140px', minWidth: 120 }}>
                <div style={{ font: '700 10px Geist', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                  {t.examplesPage.universeLabel}
                </div>
                <div style={{ font: '600 13px Geist', color: 'var(--ink)' }}>{book.universeLabel}</div>
              </div>

              <Link
                to={book.bookId ? `/livre/${book.bookId}` : `/exemples/${book.slug}`}
                className="cta"
                style={{ width: 'auto', padding: '10px 22px', flex: 'none' }}
              >
                {t.examplesPage.readCta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
