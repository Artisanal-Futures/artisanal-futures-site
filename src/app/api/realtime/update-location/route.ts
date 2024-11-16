import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import type { RouteData } from '~/app/tools/solidarity-pathways/_validators/types'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { pusherServer } from '~/server/soketi/server'

type UserLocation = {
  userId: string
  latitude: number
  longitude: number
  accuracy: number
  removeUser?: boolean
  fileId?: string
  route: RouteData
}

export async function POST(req: NextRequest) {
  const { latitude, longitude, pathId } = await req.json()

  if (!latitude || !longitude || !pathId) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const optimizedPath = await db.optimizedRoutePath.findUnique({
    where: {
      id: pathId,
    },
  })

  if (!optimizedPath) {
    return NextResponse.json(
      { error: 'Invalid optimized path' },
      { status: 400 },
    )
  }

  const driver = await db.vehicle.findFirst({
    where: {
      id: optimizedPath?.vehicleId,
    },
    include: {
      driver: true,
    },
  })

  if (!driver) {
    return NextResponse.json({ error: 'No driver found' }, { status: 400 })
  }

  // Trigger a Pusher event with the updated locations
  await pusherServer.trigger('map', 'evt::update-location', {
    vehicleId: optimizedPath?.vehicleId,
    latitude,
    longitude,
  })

  return NextResponse.json({ message: 'Location updated' }, { status: 200 })
}

export function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
