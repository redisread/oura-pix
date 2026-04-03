/**
 * Next.js Middleware (Simplified for local dev)
 * Handles basic routing and security headers
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Main middleware function
 */
export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Continue to page
  return NextResponse.next();
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
