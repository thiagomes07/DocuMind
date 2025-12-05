'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SessionData,
  LogoutResponse,
} from '@/types/auth';
import { AppError, ErrorCode } from '@/types/api';
import { registerSchema } from '@/lib/validations/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const unwrapApiResponse = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

/**
 * Login action
 */
export async function loginAction(data: LoginRequest): Promise<{
  success: boolean;
  error?: AppError;
}> {
  try {
    // Call backend API
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      return {
        success: false,
        error: {
          type: 'business',
          message: errorData.message || 'Credenciais inválidas',
          code: response.status === 401 ? ErrorCode.UNAUTHORIZED : undefined,
        },
      };
    }

    const result: LoginResponse = await response.json();

    // Extract cookies from response and set them
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Parse and set cookies in Next.js
      const cookieStore = await cookies();
      const cookiePairs = setCookieHeader.split(',').map(c => c.trim());
      
      for (const cookieStr of cookiePairs) {
        const [nameValue] = cookieStr.split(';');
        const [name, value] = nameValue.split('=');
        
        if (name && value) {
          cookieStore.set({
            name: name.trim(),
            value: value.trim(),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: name.includes('refresh') ? '/api/auth/refresh' : '/',
            maxAge: name.includes('refresh') ? 7 * 24 * 60 * 60 : 15 * 60,
          });
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: {
          type: 'validation',
          message: error.errors[0]?.message || 'Dados inválidos',
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'network',
        message: 'Erro ao conectar com o servidor',
        retry: true,
      },
    };
  }
}

/**
 * Register action
 */
export async function registerAction(data: RegisterRequest): Promise<{
  success: boolean;
  error?: AppError;
}> {
  try {
    // Validate input
    const validated = registerSchema.parse(data);

    // Call backend API
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: validated.name,
        email: validated.email,
        password: validated.password,
      }),
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      return {
        success: false,
        error: {
          type: 'business',
          message: errorData.message || 'Erro ao criar conta',
        },
      };
    }

    await response.json();

    return { success: true };
  } catch (error: any) {
    console.error('Register error:', error);
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: {
          type: 'validation',
          message: error.errors[0]?.message || 'Dados inválidos',
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'network',
        message: 'Erro ao conectar com o servidor',
        retry: true,
      },
    };
  }
}

/**
 * Logout action
 */
export async function logoutAction(): Promise<void> {
  try {
    // Call backend logout
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear cookies locally
    const cookieStore = await cookies();
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
    
    // Redirect to login
    redirect('/login');
  }
}

/**
 * Get session data
 */
export async function getSessionAction(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken) {
      return null;
    }

    const response = await fetch(`${API_URL}/auth/session`, {
      headers: {
        Cookie: `access_token=${accessToken.value}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    if (!payload) {
      return null;
    }

    const sessionData = unwrapApiResponse<SessionData | null>(payload);
    return sessionData ?? null;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}