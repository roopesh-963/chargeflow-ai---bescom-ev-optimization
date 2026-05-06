import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '@/lib/api';

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  role: AuthUser['role'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const TOKEN_KEY = 'chargeflow_token';
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEMO_USER: AuthUser = {
  username: 'admin',
  email: 'admin@chargeflow.ai',
  role: 'admin',
  zone_access: ['All Zones'],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user] = useState<AuthUser>(DEMO_USER);
  const [token] = useState<string>('demo-access');
  const isLoading = false;

  const logout = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const login = useCallback(
    async (_username: string, _password: string) => {
      localStorage.setItem(TOKEN_KEY, 'demo-access');
      navigate('/dashboard/overview', { replace: true });
    },
    [navigate],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      role: user.role,
      isAuthenticated: true,
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
