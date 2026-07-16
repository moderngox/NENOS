import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

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
          style={{ font: '600 13px Geist' }}
        >
          {t.auth.continueWithGoogle}
        </button>
        <button
          type="button"
          className="cta-secondary"
          onClick={() => loginWithFacebook(returnTo)}
          style={{ font: '600 13px Geist' }}
        >
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
