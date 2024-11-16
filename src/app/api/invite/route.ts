import { NextResponse } from 'next/server'
import { Resend } from 'resend'

import { JoinTemplate } from '~/apps/email/join-template'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const data = await resend.emails.send({
      from: 'Artisanal Futures <team@artisanalfutures.org>',
      to: email,
      subject: 'You are invited to join Artisanal Futures!',
      react: JoinTemplate(),
    })

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json(error, { status: 400 })
  }
}
