import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import {
  createDriverVerificationCookie,
  generateDriverPassCode,
} from '../_utils/server/auth-driver-passcode'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  const { depotId, driverId, email, magicCode, pathId } = await req.json()

  const depot = await db.depot.findUnique({
    where: { id: depotId },
  })

  if (!depot)
    return NextResponse.json({ error: 'Depot not found' }, { status: 400 })

  if (
    session?.user.id === depot.ownerId ||
    session?.user?.role === 'ADMIN' ||
    session?.user?.role === 'DRIVER'
  )
    return NextResponse.json({ message: 'Access Granted' }, { status: 200 })

  if (!depotId || !driverId || !email || !magicCode)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const vehicle = await db.vehicle.findUnique({
    where: { id: driverId },
    include: { driver: true },
  })

  if (!vehicle)
    return NextResponse.json({ error: 'Driver not found' }, { status: 400 })

  const expectedPasscode = generateDriverPassCode({
    pathId: pathId as string,
    depotCode: depot.magicCode,
    email: vehicle?.driver!.email,
  })

  const userPasscode = generateDriverPassCode({
    pathId: pathId as string,
    depotCode: magicCode as string,
    email: email as string,
  })

  if (expectedPasscode !== userPasscode)
    return NextResponse.json({ error: 'Invalid magic code' }, { status: 400 })

  const cookie = createDriverVerificationCookie({
    passcode: userPasscode,
    minuteDuration: 720,
  })

  const response = NextResponse.json(
    { message: 'Access Granted' },
    { status: 200 },
  )
  response.headers.set('Set-Cookie', cookie)
  return response
}

export function GET(req: NextRequest) {
  const cookie = req.cookies.get('verifiedDriver')

  if (cookie) {
    return NextResponse.json({ error: null, pathId: cookie.value })
  } else {
    return NextResponse.json({ error: 'Driver not verified', pathId: null })
  }
}
