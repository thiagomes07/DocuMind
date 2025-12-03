import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = loginSchema.parse(body);

    // Forward to backend
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validated),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || 'Login failed' },
        { status: response.status }
      );
    }

    // Create response with cookies
    const nextResponse = NextResponse.json(data);

    // Extract and forward cookies from backend
    const setCookieHeaders = response.headers.getSetCookie();
    
    for (const cookie of setCookieHeaders) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }

    return nextResponse;
  } catch (error: any) {
    console.error('Login API error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid input data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}