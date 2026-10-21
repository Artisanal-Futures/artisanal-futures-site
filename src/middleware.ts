import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { isUpcyUrl, UPCY_RETURN_COOKIE } from '~/lib/upcy'

// Remember where a member came from when they arrive at the join flow from UPCY.
// The flow spans several pages, so a cookie survives the hops; the value is
// allowlisted to the UPCY host so it can't be used as an open redirect.
export function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const { pathname, searchParams } = request.nextUrl
  if (pathname === '/join' || pathname.startsWith('/auth/join')) {
    const returnTo = searchParams.get('returnTo')
    if (isUpcyUrl(returnTo)) {
      res.cookies.set(UPCY_RETURN_COOKIE, returnTo, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60,
        path: '/',
      })
    }
  }
  return res
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
