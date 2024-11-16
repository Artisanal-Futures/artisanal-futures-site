import { NextRequest, NextResponse } from 'next/server'

import { emailService } from '~/services/email'

export async function POST(req: NextRequest) {
  try {
    const { emailBundles } = await req.json()

    if (!emailBundles || emailBundles.length === 0) {
      return NextResponse.json('Invalid email bundles', { status: 400 })
    }

    const data = await Promise.all(
      emailBundles.map(
        async (bundle: { email: string; url: string; passcode: string }) => {
          const emailData = await emailService.sendRoute({
            data: {
              email: bundle.email,
              loginCode: bundle.passcode,
              url: bundle.url,
            },
          })

          return emailData
        },
      ),
    )

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(error, { status: 400 })
  }
}
