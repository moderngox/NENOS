import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// Flat, single-color (currentColor) pictograms — not the official multi-color
// brand marks, to match this form's plain black/white button style.
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M21.6 12.23c0-.68-.06-1.36-.18-2H12v3.78h5.4c-.23 1.26-.94 2.36-2 3.08v2.55h3.24c1.9-1.75 3-4.33 3-7.4Z"
        fill="currentColor"
      />
      <path
        d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.24-2.55c-.9.6-2.06.96-3.4.96-2.6 0-4.8-1.76-5.6-4.13H3.05v2.6C4.7 19.68 8.1 22 12 22Z"
        fill="currentColor"
      />
      <path d="M6.4 13.84a5.9 5.9 0 0 1 0-3.68v-2.6H3.05a10 10 0 0 0 0 8.98l3.35-2.6Z" fill="currentColor" />
      <path
        d="M12 6.02c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.96 3.02 14.7 2 12 2 8.1 2 4.7 4.32 3.05 7.66l3.35 2.6C7.2 7.9 9.4 6.02 12 6.02Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M13.5 22v-8.5h2.85l.43-3.31H13.5V8.06c0-.96.27-1.61 1.64-1.61h1.75V3.5C16.56 3.44 15.53 3.34 14.33 3.34c-2.5 0-4.21 1.53-4.21 4.34v2.42H7.26v3.31h2.86V22h3.38Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface AuthFormProps {
  returnTo?: string;
  onSuccess?: () => void;
}

export function AuthForm({ returnTo, onSuccess }: AuthFormProps) {
  const { t } = useLanguage();
  const { login, signup, loginWithGoogle, loginWithFacebook } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, name || undefined);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    font: '500 14px Geist',
    marginBottom: 10,
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 20, background: '#fff' }}>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 14 }}>
        {mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <button
          type="button"
          className="cta-secondary"
          onClick={() => loginWithGoogle(returnTo)}
          style={{ font: '600 13px Geist', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <GoogleIcon />
          {t.auth.continueWithGoogle}
        </button>
        <button
          type="button"
          className="cta-secondary"
          onClick={() => loginWithFacebook(returnTo)}
          style={{ font: '600 13px Geist', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <FacebookIcon />
          {t.auth.continueWithFacebook}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 14px', color: 'var(--muted)', font: '600 11px Geist' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        {t.auth.orDivider}
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <input
            type="text"
            placeholder={`${t.auth.nameLabel} (${t.auth.nameOptional})`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        )}
        <input
          type="email"
          placeholder={t.auth.emailLabel}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder={t.auth.passwordLabel}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />
        <button type="submit" className="cta" disabled={submitting} style={{ marginTop: 4 }}>
          {mode === 'login' ? t.auth.loginCta : t.auth.signupCta}
        </button>
      </form>

      {error && <p style={{ font: '600 12px Geist', color: 'var(--red, #d33)', margin: '10px 0 0' }}>{error}</p>}

      <button
        type="button"
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        style={{ background: 'none', border: 'none', font: '600 12px Geist', color: 'var(--cyan)', textDecoration: 'underline', marginTop: 12, padding: 0 }}
      >
        {mode === 'login' ? t.auth.switchToSignup : t.auth.switchToLogin}
      </button>
    </div>
  );
}
