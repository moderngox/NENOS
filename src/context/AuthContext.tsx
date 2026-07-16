import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (returnTo?: string) => void;
  loginWithFacebook: (returnTo?: string) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseJsonError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `Request failed with status ${response.status}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth state lives in an HttpOnly session cookie, invisible to JS — the
  // only way to know if we're logged in is to ask the server.
  const refresh = async () => {
    try {
      const response = await fetch('/api/me');
      if (!response.ok) {
        setUser(null);
        return;
      }
      const body = (await response.json()) as { user: AuthUser };
      setUser(body.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) throw new Error(await parseJsonError(response));
        const body = (await response.json()) as { user: AuthUser };
        setUser(body.user);
      },
      signup: async (email, password, name) => {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        if (!response.ok) throw new Error(await parseJsonError(response));
        const body = (await response.json()) as { user: AuthUser };
        setUser(body.user);
      },
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
      },
      loginWithGoogle: (returnTo) => {
        window.location.href = `/api/auth/google/start?returnTo=${encodeURIComponent(returnTo ?? window.location.pathname)}`;
      },
      loginWithFacebook: (returnTo) => {
        window.location.href = `/api/auth/facebook/start?returnTo=${encodeURIComponent(returnTo ?? window.location.pathname)}`;
      },
      refresh,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
