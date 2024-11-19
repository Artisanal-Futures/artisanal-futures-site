import { NextRequest, NextResponse } from 'next/server'
import { serialize } from 'cookie'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (process.env.NEXT_PUBLIC_PASSWORD_PROTECT === password) {
    const twoMinutes = 60 * 2000

    const cookie = serialize('login', 'true', {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + twoMinutes),
    })

    const cookieAlt = serialize('code', `${password}`, {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + twoMinutes),
    })

    const response = NextResponse.json({ success: true }, { status: 302 })
    response.headers.append('Set-Cookie', cookie)
    response.headers.append('Set-Cookie', cookieAlt)

    return response
  } else {
    return NextResponse.json(
      { success: false, error: 'Incorrect Password' },
      { status: 400 },
    )
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
