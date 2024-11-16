import { NextRequest, NextResponse } from 'next/server'

import { pusherServer } from '~/server/soketi/server'

type Message = {
  userId: string
  name: string
  address: string
  deliveryNotes: string
  status?: 'success' | 'failed' | 'pending'
}

const messages: Message[] = []

export async function POST(req: NextRequest) {
  const { userId, deliveryNotes, status, route, address } = await req.json()
  const { name } = JSON.parse((route.description as string) ?? '{}')

  messages.push({
    userId,
    name,
    deliveryNotes,
    status,
    address,
  })

  // Trigger a Pusher event with the updated messages
  await pusherServer.trigger('map', 'update-messages', messages)

  return NextResponse.json({ message: 'Location updated' }, { status: 200 })
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
