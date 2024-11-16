import { NextRequest, NextResponse } from 'next/server'

import type { RouteData } from '~/app/tools/solidarity-pathways/_validators/types'
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

let userLocations: UserLocation[] = []

export async function POST(request: NextRequest) {
  const { userId, latitude, longitude, accuracy, removeUser, fileId, route } =
    await request.json()

  // Update the location of the user
  userLocations = userLocations.filter((user) => user.userId !== userId)
  if (!removeUser) {
    userLocations.push({
      userId,
      latitude,
      longitude,
      accuracy,
      fileId,
      route,
    })
  }

  // Trigger a Pusher event with the updated locations
  await pusherServer.trigger('map', 'update-locations', userLocations)

  return NextResponse.json({ message: 'Location updated' }, { status: 200 })
}

export function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
