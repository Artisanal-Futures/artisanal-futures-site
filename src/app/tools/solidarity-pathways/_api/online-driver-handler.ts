import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { pusherServer } from '~/server/soketi/server'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('verifiedDriver')

  if (!token) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No user id' }, { status: 401 })
    }
  }

  const { vehicleId } = await req.json()

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

export function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
