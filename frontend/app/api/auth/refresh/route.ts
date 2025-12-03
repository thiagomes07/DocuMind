import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token' },
        { status: 401 }
      );
    }

    // Forward refresh request to backend with cookie
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
    });

    if (!response.ok) {
      // Refresh failed - clear cookies
      const nextResponse = NextResponse.json(
        { success: false, error: 'Token refresh failed' },
        { status: 401 }
      );

      nextResponse.cookies.delete('access_token');
      nextResponse.cookies.delete('refresh_token');

      return nextResponse;
    }

    const data = await response.json();

    // Create response with new access token cookie
    const nextResponse = NextResponse.json(data);

    // Extract and forward cookies from backend
    const setCookieHeaders = response.headers.getSetCookie();
    
    for (const cookie of setCookieHeaders) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('Refresh API error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}