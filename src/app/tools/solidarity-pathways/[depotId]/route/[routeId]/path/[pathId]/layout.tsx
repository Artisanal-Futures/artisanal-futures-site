import type { GetServerSidePropsContext } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  createDriverVerificationCookie,
  generateDriverPassCode,
} from '~/app/tools/solidarity-pathways/_utils/server/auth-driver-passcode'
import { db } from '~/server/db'

type Props = {
  children: React.ReactNode
  params: {
    depotId: string
    routeId: string
    pathId: string
    driverId?: string
  }
  searchParams: {
    pc?: string
    driverId?: string
  }
}

export default async function PathLayout({
  children,
  params,
  searchParams,
}: Props) {
  const cookieStore = cookies()
  const verifiedDriverCookie = cookieStore.get('verifiedDriver')
  const passcode = searchParams.pc

  if (!passcode && !verifiedDriverCookie?.value) {
    return redirect('/tools/solidarity-pathways/sandbox')
  }

  try {
    const driver = await db.vehicle.findUnique({
      where: { id: searchParams.driverId },
      include: { driver: true },
    })

    const depot = await db.depot.findUnique({
      where: { id: params.depotId },
    })

    if (!driver || !depot) {
      throw new Error('Driver or Depot not found')
    }

    const expectedPasscode = generateDriverPassCode({
      pathId: params.pathId,
      depotCode: depot.magicCode,
      email: driver.driver!.email,
    })

    if (verifiedDriverCookie?.value === expectedPasscode) {
      return <>{children}</>
    }

    if (expectedPasscode !== passcode) {
      throw new Error('Invalid Passcode')
    }

    // Set cookie for future requests
    const cookie = createDriverVerificationCookie({
      passcode: passcode,
      minuteDuration: 720,
    })

    // Set cookie header
    cookies().set({
      name: 'verifiedDriver',
      value: passcode,
      maxAge: 720 * 60, // Convert minutes to seconds
      path: '/',
    })

    return <>{children}</>
  } catch (e) {
    console.error(e)
    return redirect('/tools/solidarity-pathways/sandbox')
  }
}
