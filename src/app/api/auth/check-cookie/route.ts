import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function GET(req: NextRequest) {
  try {
    const loginCookie = req.cookies.get('login')
    const codeCookie = req.cookies.get('code')

    if (!loginCookie || !codeCookie) {
      return NextResponse.json(
        { error: 'Missing required cookies' },
        { status: 401 },
      )
    }

    const isValidCode =
      codeCookie.value === process.env.NEXT_PUBLIC_PASSWORD_PROTECT

    if (!isValidCode) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 403 })
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
