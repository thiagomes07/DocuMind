import { NextRequest, NextResponse } from 'next/server';
import { SessionData } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SESSION_CACHE_TTL = 15_000; // 15s memoization layer to avoid backend throttling

type CachedSession = {
  data: SessionData;
  expiresAt: number;
};

const sessionCache = new Map<string, CachedSession>();

const unwrapApiResponse = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const cacheKey = accessToken;
    const cached = sessionCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.data);
    }

    const response = await fetch(`${API_URL}/auth/session`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      sessionCache.delete(cacheKey);
      return NextResponse.json(
        {
          success: false,
          error: payload?.message || 'Failed to load session',
        },
        { status: response.status }
      );
    }

    const sessionData = unwrapApiResponse<SessionData | null>(payload);

    if (!sessionData) {
      sessionCache.delete(cacheKey);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid session response',
        },
        { status: 500 }
      );
    }

    sessionCache.set(cacheKey, {
      data: sessionData,
      expiresAt: now + SESSION_CACHE_TTL,
    });

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
