import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { getCachedAuth, setCachedAuth, clearCachedAuth } from '../offline/db';
import { isOnline } from '../offline/api-client';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  empresaId: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Try cached auth first (works offline)
      const cached = await getCachedAuth();
      if (cached?.token && cached?.user) {
        setUser(cached.user);
        // If online, verify token is still valid
        if (isOnline()) {
          try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            await setCachedAuth(cached.token, res.data);
          } catch {
            // Token invalid — but stay logged in if offline data exists
          }
        }
        setLoading(false);
        return;
      }

      // Fallback to localStorage
      const token = localStorage.getItem('token');
      if (token) {
        if (isOnline()) {
          api
            .get('/auth/me')
            .then(async (res) => {
              setUser(res.data);
              await setCachedAuth(token, res.data);
            })
            .catch(() => {
              localStorage.removeItem('token');
            })
            .finally(() => setLoading(false));
        } else {
          // Offline, no cached auth — can't verify
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    await setCachedAuth(access_token, userData);
    setUser(userData);
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    await clearCachedAuth();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
