import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

export function OrderConfirmed() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('bookId');

  return (
    <div className="screen">
      <Header variant="light" />
      <div className="container" style={{ padding: '60px 22px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 16 }}>
          {t.orderConfirmed.title}
        </div>
        <p style={{ font: '600 14px/1.6 Geist', color: 'var(--ink-soft)', marginBottom: 28 }}>{t.orderConfirmed.message}</p>
        {bookId && (
          <>
            <Link to={`/livre/${bookId}`} className="cta" style={{ display: 'inline-block', marginBottom: 14 }}>
              {t.orderConfirmed.viewBook}
            </Link>
            <p style={{ font: '600 11px Geist', color: 'var(--muted)', marginBottom: 20 }}>
              {'ID: '}
              {bookId}
            </p>
          </>
        )}
        <Link to="/" className="cta-secondary" style={{ display: 'inline-block' }}>
          {t.orderConfirmed.backHome}
        </Link>
      </div>
    </div>
  );
}
