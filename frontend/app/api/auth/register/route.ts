import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = registerSchema.parse(body);

    // Forward to backend (exclude confirmPassword)
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

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || 'Registration failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Register API error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}