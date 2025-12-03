import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to protect routes and handle authentication redirects
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // Define route types
  const isAuthPage = pathname === '/login' || pathname === '/registro';
  const isProtectedRoute = pathname.startsWith('/documentos');
  const isPublicRoute = pathname === '/' || pathname.startsWith('/api/auth');

  // Allow public routes and API routes
  if (isPublicRoute && !isAuthPage) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL('/documentos', request.url));
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !accessToken && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    // Add return URL for redirect after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user has refresh token but no access token, let them through
  // The app will attempt to refresh automatically
  if (isProtectedRoute && !accessToken && refreshToken) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

/**
 * Configure which routes to run middleware on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};