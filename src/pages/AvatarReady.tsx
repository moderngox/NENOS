import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { AuthForm } from '../components/AuthForm';
import { GenerationModal } from '../components/GenerationModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <span
      className="spinner"
      style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--ink)', display: 'inline-block' }}
    />
  );
}

const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 60; // ~4 minutes — free/low-quality generation, comfortably generous

type Status = 'loading' | 'generating' | 'ready' | 'error';

export function AvatarReady() {
  const { t } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const { bookId } = useParams();
  const [status, setStatus] = useState<Status>('loading');
  const [name, setName] = useState('');
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    if (!bookId) return;

    (async () => {
      try {
        const statusResponse = await fetch(`/api/avatars/${bookId}`);
        const statusBody = (await statusResponse.json().catch(() => null)) as
          | { name?: string; avatarStatus?: string; portraitUrl?: string | null }
          | null;
        if (cancelled.current) return;
        if (!statusResponse.ok) {
          setStatus('error');
          return;
        }
        setName(statusBody?.name ?? '');
        if (statusBody?.avatarStatus === 'ready') {
          setPortraitUrl(statusBody.portraitUrl ?? null);
          setStatus('ready');
          return;
        }
      } catch {
        if (!cancelled.current) setStatus('error');
        return;
      }

      setStatus('generating');
      for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
        try {
          const response = await fetch(`/api/avatars/${bookId}/generate`, { method: 'POST' });
          const body = (await response.json().catch(() => null)) as { avatarStatus?: string; error?: string } | null;
          if (cancelled.current) return;
          if (!response.ok && response.status !== 202) {
            setStatus('error');
            return;
          }
          if (body?.avatarStatus === 'ready') {
            const finalResponse = await fetch(`/api/avatars/${bookId}`);
            const finalBody = (await finalResponse.json().catch(() => null)) as { portraitUrl?: string | null } | null;
            if (cancelled.current) return;
            setPortraitUrl(finalBody?.portraitUrl ?? null);
            setStatus('ready');
            return;
          }
        } catch {
          if (!cancelled.current) setStatus('error');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      if (!cancelled.current) setStatus('error');
    })();

    return () => {
      cancelled.current = true;
    };
  }, [bookId]);

  // The login-at-the-end moment: as soon as the user is signed in (whether
  // via the form below or an OAuth redirect back to this same page) and the
  // avatar is ready, link it to their profile.
  useEffect(() => {
    if (status !== 'ready' || !user || claimed || claiming || !bookId) return;
    setClaiming(true);
    fetch(`/api/avatars/${bookId}/claim`, { method: 'POST' })
      .then(async (response) => {
        if (response.ok) {
          setClaimed(true);
          await refreshProfile();
        }
      })
      .finally(() => setClaiming(false));
  }, [status, user, claimed, claiming, bookId, refreshProfile]);

  return (
    <div className="screen">
      <Header variant="light" />
      <GenerationModal
        open={status === 'loading' || status === 'generating'}
        title={t.avatarReady.generatingTitle}
        waitMessage={t.generationModal.waitMessage}
        steps={t.avatarReady.generatingSteps}
        tips={t.generationModal.tips}
      />
      <div className="container" style={{ padding: '60px 22px', textAlign: 'center', maxWidth: 440, margin: '0 auto' }}>
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--ink)', marginBottom: 24 }}>
          {t.avatarReady.title}
        </div>

        {status === 'error' && <p style={{ font: '600 14px/1.6 Geist', color: 'var(--red, #d33)' }}>{t.avatarReady.errorMessage}</p>}

        {status === 'ready' && (
          <>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                margin: '0 auto 18px',
                backgroundImage: portraitUrl ? `url(${portraitUrl})` : undefined,
                backgroundColor: portraitUrl ? undefined : 'var(--gray-bg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '3px solid var(--border)',
                boxShadow: '0 8px 24px rgba(0,0,0,.14)',
              }}
            />
            <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--ink)', marginBottom: 20 }}>
              {t.avatarReady.readyTitle(name)}
            </div>

            {user ? (
              claimed ? (
                <Link to="/mon-compte" className="cta" style={{ display: 'inline-block', width: 'auto', padding: '13px 26px' }}>
                  {t.avatarReady.viewProfileCta}
                </Link>
              ) : (
                <Spinner />
              )
            ) : (
              <>
                <p style={{ font: '600 14px/1.6 Geist', color: 'var(--muted)', marginBottom: 18 }}>{t.avatarReady.readyMessage}</p>
                <AuthForm returnTo={`/avatar-pret/${bookId}`} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
