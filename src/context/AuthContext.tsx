import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface KidProfile {
  hasBooks: boolean;
  name: string | null;
  age: number | null;
  avatarUrl: string | null;
  favoriteUniverses: string[];
  traits: string[];
  skinColor: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  appearanceDetails: string;
  points: number;
  booksGenerated: number;
  secondaryCharacters: { name: string; role: string }[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  profile: KidProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (returnTo?: string) => void;
  loginWithFacebook: (returnTo?: string) => void;
  refresh: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseJsonError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `Request failed with status ${response.status}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<KidProfile | null>(null);

  const refreshProfile = async () => {
    try {
      const response = await fetch('/api/me/profile');
      if (!response.ok) {
        setProfile(null);
        return;
      }
      const body = (await response.json()) as KidProfile;
      setProfile(body);
    } catch {
      setProfile(null);
    }
  };

  // Auth state lives in an HttpOnly session cookie, invisible to JS — the
  // only way to know if we're logged in is to ask the server.
  const refresh = async () => {
    try {
      const response = await fetch('/api/me');
      if (!response.ok) {
        setUser(null);
        setProfile(null);
        return;
      }
      const body = (await response.json()) as { user: AuthUser };
      setUser(body.user);
      await refreshProfile();
    } catch {
      setUser(null);
      setProfile(null);
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
      profile,
      login: async (email, password) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) throw new Error(await parseJsonError(response));
        const body = (await response.json()) as { user: AuthUser };
        setUser(body.user);
        await refreshProfile();
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
        await refreshProfile();
      },
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setProfile(null);
      },
      loginWithGoogle: (returnTo) => {
        window.location.href = `/api/auth/google/start?returnTo=${encodeURIComponent(returnTo ?? window.location.pathname)}`;
      },
      loginWithFacebook: (returnTo) => {
        window.location.href = `/api/auth/facebook/start?returnTo=${encodeURIComponent(returnTo ?? window.location.pathname)}`;
      },
      refresh,
      refreshProfile,
    }),
    [user, loading, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
