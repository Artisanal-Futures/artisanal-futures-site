import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import type { PusherMessage } from '~/app/tools/solidarity-pathways/_validators/types'
import { authOptions } from '~/server/auth'
import { pusherServer } from '~/server/soketi/server'

const messages: PusherMessage[] = []

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const { deliveryNotes, status, route, address, routeId, stopId } =
    await req.json()
  const { name } = JSON.parse((route.description as string) ?? '{}')

  messages.push({
    userId: session?.user?.id ?? '0',
    name,
    deliveryNotes,
    status,
    address,
    routeId,
    stopId,
  })

  // Trigger a Pusher event with the updated locations
  await pusherServer.trigger('map', 'update-messages', messages)
  return NextResponse.json({ message: 'Location updated' }, { status: 200 })
}

export function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
