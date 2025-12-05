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

const SESSION_API_ENDPOINT = '/api/auth/session';
const SESSION_CACHE_TTL = 15000; // 15s cache to avoid hammering the backend

let inFlightSessionRequest: Promise<SessionData | null> | null = null;
let sessionCache: SessionData | null = null;
let lastSessionFetch = 0;

const primeSessionCache = (data: SessionData | null) => {
  sessionCache = data;
  lastSessionFetch = Date.now();
};

const requestSession = async () => {
  try {
    const response = await fetch(SESSION_API_ENDPOINT, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      primeSessionCache(null);
      return null;
    }

    const data: SessionData = await response.json();
    primeSessionCache(data);
    return data;
  } catch (error) {
    console.error('Session fetch error:', error);
    return sessionCache;
  } finally {
    inFlightSessionRequest = null;
  }
};

async function fetchSession(force = false): Promise<SessionData | null> {
  const now = Date.now();

  if (!force && sessionCache && now - lastSessionFetch < SESSION_CACHE_TTL) {
    return sessionCache;
  }

  if (!inFlightSessionRequest || force) {
    inFlightSessionRequest = requestSession();
  }

  return inFlightSessionRequest;
}

type AuthProviderProps = {
  children: ReactNode;
  initialUser?: SessionData | null;
};

type LoadSessionOptions = {
  force?: boolean;
  silent?: boolean;
};

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<SessionData | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(initialUser === undefined);
  const router = useRouter();
  const toast = useToast();

  const loadSession = useCallback(async ({ force = false, silent = false }: LoadSessionOptions = {}) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      const sessionData = await fetchSession(force);
      setUser(sessionData);
    } catch (error) {
      console.error('Failed to load session:', error);
      setUser(null);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof initialUser === 'undefined') {
      loadSession({ force: true });
    } else {
      primeSessionCache(initialUser ?? null);
      setIsLoading(false);
    }
  }, [initialUser, loadSession]);

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        setIsLoading(true);
        const result = await loginAction(data);

        if (result.success) {
          // Reload session to get user data
          await loadSession({ force: true });
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
      primeSessionCache(null);
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
    await loadSession({ force: true, silent: true });
  }, [loadSession]);

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