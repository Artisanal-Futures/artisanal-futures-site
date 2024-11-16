import { NextResponse } from 'next/server'
import { Resend } from 'resend'

import { InquiryTemplate } from '~/apps/email/inquiry-template'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, body } = await request.json()
    const data = await resend.emails.send({
      from: 'Inquiry <team@artisanalfutures.org>',
      to: 'artisanalfutures@gmail.com',
      subject: 'New Inquiry',
      react: InquiryTemplate({ fullName: name, message: body, email }),
    })

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json(error, { status: 400 })
  }
}
