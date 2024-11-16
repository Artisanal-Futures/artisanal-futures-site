import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import type { PusherMessage } from '~/app/tools/solidarity-pathways/_validators/types'
import { authOptions } from '~/server/auth'
// import { pusher } from "~/server/pusher/client";
import { pusherServer } from '~/server/soketi/server'

const messages: PusherMessage[] = []

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No user id' }, { status: 401 })
  }

  const { role, routeId, message } = await request.json()

  messages.push({
    userId: session.user.id,
    role,
    routeId,
    message,
  })

  // Trigger a Pusher event with the updated locations
  await pusherServer.trigger('map', `evt::contact-dispatch`, messages)

  return NextResponse.json({ message: 'Location updated' }, { status: 200 })
}
