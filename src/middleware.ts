import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth/sign-')
  if (isAuthRoute) {
    const codeCookie = request.cookies.get('code')
    const loginCookie = request.cookies.get('login')
    const urlCode = request.nextUrl.searchParams.get('code')

    // If code is in URL params, set it as a cookie and redirect
    if (urlCode) {
      const twoMinutes = 60 * 2000
      const response = NextResponse.redirect(
        new URL('/auth/sign-up', request.url),
      )
      response.cookies.set('code', urlCode, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now() + twoMinutes),
      })
      return response
    }

    // If no code cookie and not already logged in, redirect to password protect
    if (!codeCookie && !loginCookie) {
      return NextResponse.redirect(
        new URL('/auth/password-protect', request.url),
      )
    }
  }

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
    '/((?!_next/static|_next/image|favicon.ico|auth/password-protect).*)',
  ],
}
