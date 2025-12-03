import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('access_token')?.value;

    // Call backend logout (best effort)
    if (accessToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      }).catch((error) => {
        console.error('Backend logout error:', error);
        // Continue even if backend fails
      });
    }

    // Clear cookies regardless of backend response
    const response = NextResponse.json({ success: true });

    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout API error:', error);

    // Always clear cookies on error
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');

    return response;
  }
}