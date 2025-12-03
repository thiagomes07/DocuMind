import { cookies } from 'next/headers';

/**
 * Token cookie names
 */
export const TOKEN_NAMES = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;

/**
 * Get access token from cookies (server-side only)
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAMES.ACCESS)?.value;
}

/**
 * Get refresh token from cookies (server-side only)
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAMES.REFRESH)?.value;
}

/**
 * Check if user has valid tokens (server-side only)
 */
export async function hasValidTokens(): Promise<{
  hasAccess: boolean;
  hasRefresh: boolean;
}> {
  const cookieStore = await cookies();
  
  return {
    hasAccess: !!cookieStore.get(TOKEN_NAMES.ACCESS),
    hasRefresh: !!cookieStore.get(TOKEN_NAMES.REFRESH),
  };
}

/**
 * Clear all auth tokens (server-side only)
 */
export async function clearTokens(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.delete(TOKEN_NAMES.ACCESS);
  cookieStore.delete(TOKEN_NAMES.REFRESH);
}

/**
 * Parse JWT payload without verification (for client-side info display only)
 * WARNING: Never trust this data for security decisions
 */
export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired (client-side helper)
 * WARNING: This is not secure, use only for UX improvements
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}