import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { UserProfile } from '@/types/database';

const API_BASE_URL = 'https://demo.qestas.ir/api'; // دامنه خود را جایگزین کنید

interface AuthContextValue {
  session: any;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  login: async () => {},
  register: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth.php?action=me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setSession({ user: data.user, access_token: token });
      } else {
        localStorage.removeItem('auth_token');
        setSession(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('auth_token', data.token);
      setSession({ user: data.user, access_token: data.token });
      setProfile(data.user);
    }
    return data;
  }, []);

  const register = useCallback(async (payload: any) => {
    const res = await fetch(`${API_BASE_URL}/auth.php?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('auth_token', data.token);
      await fetchProfile(data.token);
    }
    return data;
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await fetchProfile(token);
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('auth_token');
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, refreshProfile, login, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}