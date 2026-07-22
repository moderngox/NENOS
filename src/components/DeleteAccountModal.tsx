import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface DeleteAccountModalProps {
  email: string;
  onClose: () => void;
  onDeleted: () => void;
}

// Two separate typed confirmations (literal "DELETE" + the account's own
// email) rather than one — the email one in particular makes sure whoever
// is clicking really is looking at, and means, THIS specific account, not
// just reflexively confirming a dialog. The "DELETE" check is re-verified
// server-side too (worker/routes/auth.ts's handleDeleteAccount); the email
// check is UX-only since the session already scopes the deletion.
export function DeleteAccountModal({ email, onClose, onDeleted }: DeleteAccountModalProps) {
  const { t } = useLanguage();
  const { deleteAccount } = useAuth();
  const [deleteText, setDeleteText] = useState('');
  const [emailText, setEmailText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = deleteText.trim().toUpperCase() === 'DELETE' && emailText.trim().toLowerCase() === email.toLowerCase();

  const handleConfirm = async () => {
    if (!canConfirm || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(deleteText.trim());
      onDeleted();
    } catch {
      setError(t.account.deleteAccountError);
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,12,8,.72)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.35)' }}>
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 19, color: 'var(--ink)', marginBottom: 10 }}>
          {t.account.deleteAccountModalTitle}
        </div>
        <p style={{ font: '600 13px/1.5 Geist', color: 'var(--muted)', margin: '0 0 20px' }}>{t.account.deleteAccountModalWarning}</p>

        <label style={{ display: 'block', font: '700 12px Geist', color: 'var(--ink)', marginBottom: 6 }}>
          {t.account.deleteAccountTypeDeleteLabel}
        </label>
        <input
          type="text"
          value={deleteText}
          onChange={(e) => setDeleteText(e.target.value)}
          placeholder="DELETE"
          autoCapitalize="off"
          autoCorrect="off"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, font: '600 14px Geist', marginBottom: 16, boxSizing: 'border-box' }}
        />

        <label style={{ display: 'block', font: '700 12px Geist', color: 'var(--ink)', marginBottom: 6 }}>
          {t.account.deleteAccountTypeEmailLabel(email)}
        </label>
        <input
          type="text"
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder={email}
          autoCapitalize="off"
          autoCorrect="off"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, font: '600 14px Geist', marginBottom: 16, boxSizing: 'border-box' }}
        />

        {error && <p style={{ font: '600 12px Geist', color: '#b3261e', margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} disabled={busy} className="cta-secondary" style={{ flex: 1 }}>
            {t.account.deleteAccountCancelCta}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || busy}
            style={{
              flex: 1,
              font: '700 14px Geist',
              color: '#fff',
              background: canConfirm && !busy ? '#b3261e' : '#d9d9dc',
              border: 'none',
              borderRadius: 12,
              padding: '13px 0',
              cursor: canConfirm && !busy ? 'pointer' : 'not-allowed',
            }}
          >
            {t.account.deleteAccountConfirmCta}
          </button>
        </div>
      </div>
    </div>
  );
}
