import { NextRequest, NextResponse } from 'next/server'

import { db } from '~/server/db'
import { pusherServer } from '~/server/soketi/server'

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
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
