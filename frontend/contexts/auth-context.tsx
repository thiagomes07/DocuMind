'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { SessionData, LoginRequest, RegisterRequest } from '@/types/auth';
import { AppError } from '@/types/api';
import {
  loginAction,
  registerAction,
  logoutAction,
  getSessionAction,
} from '@/lib/actions/auth';
import { useToast } from './toast-context';

interface AuthContextValue {
  user: SessionData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: AppError }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: AppError }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const sessionData = await getSessionAction();
      setUser(sessionData);
    } catch (error) {
      console.error('Failed to load session:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        setIsLoading(true);
        const result = await loginAction(data);

        if (result.success) {
          // Reload session to get user data
          await loadSession();
          toast.success('Login realizado com sucesso!');
          router.push('/documentos');
          return { success: true };
        }

        return result;
      } catch (error: any) {
        console.error('Login error:', error);
        return {
          success: false,
          error: {
            type: 'network' as const,
            message: 'Erro ao realizar login',
          },
        };
      } finally {
        setIsLoading(false);
      }
    },
    [router, toast]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        setIsLoading(true);
        const result = await registerAction(data);

        if (result.success) {
          toast.success('Conta criada com sucesso! Faça login para continuar.');
          router.push('/login');
          return { success: true };
        }

        return result;
      } catch (error: any) {
        console.error('Register error:', error);
        return {
          success: false,
          error: {
            type: 'network' as const,
            message: 'Erro ao criar conta',
          },
        };
      } finally {
        setIsLoading(false);
      }
    },
    [router, toast]
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await logoutAction();
      setUser(null);
      toast.info('Você foi desconectado');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if backend fails, clear local state
      setUser(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  const refreshSession = useCallback(async () => {
    await loadSession();
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}