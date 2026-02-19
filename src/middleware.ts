import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Middleware is no longer needed for sign-up code protection
// The sign-up page handles validation client-side with server-side hooks as backup
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
