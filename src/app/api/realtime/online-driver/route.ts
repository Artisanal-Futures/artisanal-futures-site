import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import type { PusherMessage } from '~/app/tools/solidarity-pathways/_validators/types'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { pusherServer } from '~/server/soketi/server'

const messages: PusherMessage[] = []

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No user id' }, { status: 401 })
  }

  const { depotId, driverId, vehicleId } = await request.json()

  const vehicle = await db.vehicle.findFirst({
    where: { id: vehicleId },
    include: { driver: true },
  })

  if (!vehicle) {
    return NextResponse.json({ message: 'Driver not found' }, { status: 200 })
  }

  const message = `${vehicle?.driver?.name} is online`

  // Create notification in database?

  // Trigger a Pusher event with the updated locations
  await pusherServer.trigger('map', `evt::notify-dispatch`, message)

  return NextResponse.json({ message: 'Location updated' }, { status: 200 })
}
