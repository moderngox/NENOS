import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { BackButton } from '../components/BackButton';
import { useLanguage } from '../context/LanguageContext';

interface StoryBeat {
  page: number;
  scene: string;
  text: string;
}

interface BookStatus {
  bookId: string;
  paymentStatus: string;
  paymentUnlocked: boolean;
  story: { pages: StoryBeat[]; frontCover: { title: string; subtitle: string }; backCover: { synopsis: string } } | null;
  fullStatus: string;
  fullUnitsDone: number;
  fullUnitsTotal: number;
  fullAssets: { coverFrontUrl: string; coverBackUrl: string; pageUrls: string[] } | null;
  pdfReady: boolean;
}

function Spinner() {
  return (
    <span
      className="spinner"
      style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--ink)', display: 'inline-block' }}
    />
  );
}

const PAYMENT_CONFIRM_POLL_MS = 3000;
const PAYMENT_CONFIRM_MAX_ATTEMPTS = 20; // ~1 minute — covers the Stripe webhook's usual async lag

export function BookReader() {
  const { t } = useLanguage();
  const { bookId } = useParams();
  const [status, setStatus] = useState<BookStatus | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const cancelled = useRef(false);

  const fetchStatus = useCallback(async (): Promise<BookStatus | null> => {
    if (!bookId) return null;
    const response = await fetch(`/api/books/${bookId}`);
    const body = (await response.json().catch(() => null)) as (BookStatus & { error?: string }) | null;
    if (!response.ok || !body) throw new Error(body?.error ?? `Request failed with status ${response.status}`);
    return body;
  }, [bookId]);

  // Poll briefly for payment confirmation (the Stripe webhook can land a
  // few seconds after the customer is redirected here from checkout),
  // then fall back to a real gating message if it never arrives.
  useEffect(() => {
    cancelled.current = false;
    (async () => {
      for (let attempt = 0; attempt < PAYMENT_CONFIRM_MAX_ATTEMPTS; attempt++) {
        try {
          const body = await fetchStatus();
          if (cancelled.current) return;
          if (body) setStatus(body);
          if (body?.paymentUnlocked) {
            setConfirmingPayment(false);
            return;
          }
        } catch (err) {
          if (cancelled.current) return;
          setError(err instanceof Error ? err.message : String(err));
          setConfirmingPayment(false);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, PAYMENT_CONFIRM_POLL_MS));
      }
      setConfirmingPayment(false);
    })();
    return () => {
      cancelled.current = true;
    };
  }, [fetchStatus]);

  // Once paid, drive generate-next in a loop until the full book is ready.
  useEffect(() => {
    if (confirmingPayment || !status || !status.paymentUnlocked || status.fullStatus === 'ready') return;
    let stop = false;
    (async () => {
      while (!stop) {
        try {
          const response = await fetch(`/api/books/${bookId}/generate-next`, { method: 'POST' });
          const body = (await response.json().catch(() => null)) as
            | { fullStatus?: string; done?: number; total?: number; error?: string }
            | null;
          if (!response.ok && response.status !== 202) {
            throw new Error(body?.error ?? `Request failed with status ${response.status}`);
          }
          if (stop) return;
          setStatus((prev) =>
            prev ? { ...prev, fullStatus: body?.fullStatus ?? prev.fullStatus, fullUnitsDone: body?.done ?? prev.fullUnitsDone } : prev
          );
          if (body?.fullStatus === 'ready') {
            const fresh = await fetchStatus();
            if (!stop && fresh) setStatus(fresh);
            return;
          }
          if (response.status === 202) {
            await new Promise((resolve) => setTimeout(resolve, 4000));
          }
        } catch (err) {
          if (stop) return;
          setError(err instanceof Error ? err.message : String(err));
          return;
        }
      }
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmingPayment, status?.paymentUnlocked, status?.fullStatus === 'ready', bookId, retryTick]);

  // Once the book's images are done, drive PDF assembly the same way —
  // the cron path alone has a known reliability gap for this kind of
  // sustained work, so a page with the book open nudges it forward too.
  useEffect(() => {
    if (status?.fullStatus !== 'ready' || status.pdfReady) return;
    let stop = false;
    (async () => {
      while (!stop) {
        try {
          const response = await fetch(`/api/books/${bookId}/build-pdf-next`, { method: 'POST' });
          const body = (await response.json().catch(() => null)) as { pdfStatus?: string; error?: string } | null;
          if (!response.ok && response.status !== 202) return;
          if (stop) return;
          if (body?.pdfStatus === 'ready') {
            setStatus((prev) => (prev ? { ...prev, pdfReady: true } : prev));
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 4000));
        } catch {
          return;
        }
      }
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.fullStatus === 'ready', status?.pdfReady, bookId]);

  const totalSlides = status?.story ? status.story.pages.length + 2 : 0;

  useEffect(() => {
    if (status?.fullStatus !== 'ready') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSlide((s) => Math.min(s + 1, totalSlides - 1));
      if (e.key === 'ArrowLeft') setSlide((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status?.fullStatus, totalSlides]);

  if (!bookId) return null;

  if (confirmingPayment) {
    return (
      <div className="screen">
        <Header variant="light" />
        <div style={{ padding: '80px 22px', textAlign: 'center' }}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="screen">
        <Header variant="light" />
        <div className="container" style={{ padding: '60px 22px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <p style={{ font: '600 14px/1.6 Geist', color: 'var(--ink-soft)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!status || !status.paymentUnlocked) {
    return (
      <div className="screen">
        <Header variant="light" />
        <div className="container" style={{ padding: '60px 22px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--ink)', marginBottom: 14 }}>
            {t.reader.notPaidTitle}
          </div>
          <p style={{ font: '600 14px/1.6 Geist', color: 'var(--ink-soft)', marginBottom: 24 }}>{t.reader.notPaidMessage}</p>
          <Link to="/paiement" className="cta" style={{ display: 'inline-block' }}>
            {t.reader.goToPayment}
          </Link>
        </div>
      </div>
    );
  }

  if (status.fullStatus !== 'ready') {
    const done = status.fullUnitsDone;
    const total = status.fullUnitsTotal;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
      <div className="screen">
        <Header variant="light" />
        <div className="container" style={{ padding: '60px 22px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--ink)', marginBottom: 20 }}>
            {t.reader.generatingTitle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <Spinner />
            <span style={{ font: '700 14px Geist', color: 'var(--ink)' }}>{t.reader.generatingProgress(done, total)}</span>
            <div style={{ width: '100%', maxWidth: 320, height: 8, borderRadius: 4, background: 'var(--gray-bg)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--ink)', transition: 'width .4s ease' }} />
            </div>
          </div>
          <p style={{ font: '600 13px Geist', color: 'var(--muted)' }}>{t.reader.generatingHelper}</p>
          {error && (
            <p style={{ font: '600 13px Geist', color: 'var(--red, #d33)', marginTop: 16 }}>
              {t.reader.errorMessage}
              <br />
              <button
                type="button"
                className="cta-secondary"
                style={{ marginTop: 10, display: 'inline-block', width: 'auto', padding: '8px 18px' }}
                onClick={() => {
                  setError(null);
                  setRetryTick((t) => t + 1);
                }}
              >
                {t.reader.retry}
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  // fullStatus === 'ready'
  const story = status.story!;
  const assets = status.fullAssets!;
  const isFront = slide === 0;
  const isBack = slide === totalSlides - 1;
  const pageIndex = slide - 1; // 0-based story page index when neither cover

  return (
    <div className="screen">
      <Header variant="light" />
      <div className="container" style={{ padding: '24px 22px 40px', maxWidth: 720, margin: '0 auto' }}>
        <BackButton fallback="/mon-compte?tab=books" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ font: '700 13px Geist', color: 'var(--muted)' }}>
            {isFront ? t.reader.frontCoverLabel : isBack ? t.reader.backCoverLabel : t.reader.pageLabel(pageIndex + 1, story.pages.length)}
          </span>
          {status.pdfReady ? (
            <a href={`/api/books/${bookId}/pdf`} className="cta-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}>
              {t.reader.downloadPdf}
            </a>
          ) : (
            <span style={{ font: '600 12px Geist', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="spinner" style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--muted)', display: 'inline-block' }} />
              {t.account.pdfPreparing}
            </span>
          )}
        </div>

        <div
          style={{
            position: 'relative',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0,0,0,.16)',
            background: '#fff',
          }}
        >
          <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3', backgroundColor: '#f4f4f4' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${isFront ? assets.coverFrontUrl : isBack ? assets.coverBackUrl : assets.pageUrls[pageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            {isFront && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,0) 55%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 22,
                    left: 20,
                    right: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      color: '#fff',
                      fontFamily: '"Baloo 2", Geist, sans-serif',
                      fontWeight: 800,
                      fontSize: 28,
                      lineHeight: 1.15,
                      textShadow: '0 2px 8px rgba(0,0,0,.55)',
                    }}
                  >
                    {story.frontCover.title}
                  </div>
                  {story.frontCover.subtitle && (
                    <div
                      style={{
                        color: '#fff',
                        font: '600 15px Geist',
                        textShadow: '0 1px 5px rgba(0,0,0,.5)',
                      }}
                    >
                      {story.frontCover.subtitle}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {isBack && (
            <div style={{ padding: 24, background: 'var(--panel-bg)' }}>
              <p style={{ font: '600 15px/1.6 Geist', color: 'var(--ink)', margin: 0 }}>{story.backCover.synopsis}</p>
            </div>
          )}
          {!isFront && !isBack && (
            <div style={{ padding: 20, background: 'var(--panel-bg)' }}>
              <p style={{ font: '600 16px/1.6 Geist', color: 'var(--ink)', margin: 0 }}>{story.pages[pageIndex].text}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <button
            type="button"
            className="cta-secondary"
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => setSlide((s) => Math.max(s - 1, 0))}
            disabled={slide === 0}
          >
            {t.reader.prev}
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: totalSlides }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setSlide(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: 'none',
                  padding: 0,
                  background: i === slide ? 'var(--ink)' : 'var(--border)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            className="cta-secondary"
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => setSlide((s) => Math.min(s + 1, totalSlides - 1))}
            disabled={slide === totalSlides - 1}
          >
            {t.reader.next}
          </button>
        </div>
      </div>
    </div>
  );
}
