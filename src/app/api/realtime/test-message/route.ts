import { NextRequest, NextResponse } from 'next/server'

import { pusherServer } from '~/server/soketi/server'

export async function POST(req: NextRequest) {
  console.log('triggering')
  await pusherServer.trigger('map', 'evt::test-message', 'invalidate')
  return NextResponse.json({ message: 'Location updated' }, { status: 200 })
}

export function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
