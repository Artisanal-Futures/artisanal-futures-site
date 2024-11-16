'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { Beforeunload } from 'react-beforeunload'

import type { OptimizedStop } from '~/app/tools/solidarity-pathways/_validators/types.wip'
import { DriverVerificationDialog } from '~/app/tools/solidarity-pathways/_components/driver-verification-dialog.wip'
import RouteLayout from '~/app/tools/solidarity-pathways/_components/layout/route-layout'
import { MessageSheet } from '~/app/tools/solidarity-pathways/_components/messaging/message-sheet'
import { MobileDrawer } from '~/app/tools/solidarity-pathways/_components/mobile/mobile-drawer.wip'
import RouteBreakdown from '~/app/tools/solidarity-pathways/_components/route-plan-section/route-breakdown'
import FieldJobSheet from '~/app/tools/solidarity-pathways/_components/tracking/field-job-sheet.wip'
import { useDriverVehicleBundles } from '~/app/tools/solidarity-pathways/_hooks/drivers/use-driver-vehicle-bundles'
import { useOptimizedRoutePlan } from '~/app/tools/solidarity-pathways/_hooks/optimized-data/use-optimized-route-plan'
import { useSolidarityState } from '~/app/tools/solidarity-pathways/_hooks/optimized-data/use-solidarity-state'
import { getColor } from '~/app/tools/solidarity-pathways/_utils/generic/color-handling'
import { cuidToIndex } from '~/app/tools/solidarity-pathways/_utils/generic/format-utils.wip'
import PageLoader from '~/components/ui/page-loader'

type Props = {
  verifiedDriver: string | null
}

const LazyRoutingMap = dynamic(
  () => import('~/app/tools/solidarity-pathways/_components/map/routing-map'),
  {
    ssr: false,
    loading: () => <PageLoader />,
  },
)

export default function OptimizedPathPage({ verifiedDriver }: Props) {
  const { data: session } = useSession()
  const { driverId } = useSolidarityState()

  const [approval, setApproval] = useState(verifiedDriver !== null)

  const optimizedRoutePlan = useOptimizedRoutePlan()
  const driverRoute = useDriverVehicleBundles()

  const driver = driverRoute.getVehicleById(optimizedRoutePlan?.data?.vehicleId)

  const routeColor = getColor(
    cuidToIndex(optimizedRoutePlan?.data?.vehicleId ?? ''),
  )

  useEffect(() => {
    if (approval && driverId)
      axios
        .post('/api/routing/online-driver', {
          vehicleId: driverId,
        })

        .catch((err) => {
          console.error(err)
        })
  }, [approval, driverId])

  if (!approval && !session?.user)
    return (
      <DriverVerificationDialog approval={approval} setApproval={setApproval} />
    )

  if (approval || session?.user)
    return (
      <>
        <FieldJobSheet />
        <MessageSheet />
        <RouteLayout>
          {optimizedRoutePlan.isLoading ? (
            <PageLoader />
          ) : (
            <>
              {optimizedRoutePlan.data && (
                <section className="flex flex-1  flex-col-reverse border-2 max-md:h-full lg:flex-row">
                  <div className="flex w-full flex-col gap-4 max-lg:hidden max-lg:h-4/6 lg:w-5/12 xl:w-3/12">
                    <>
                      <Beforeunload
                        onBeforeunload={(event) => {
                          event.preventDefault()
                        }}
                      />

                      <RouteBreakdown
                        steps={optimizedRoutePlan.data.stops as OptimizedStop[]}
                        driver={driver}
                        color={routeColor.background}
                      />
                    </>
                  </div>

                  <MobileDrawer />

                  <LazyRoutingMap className="max-md:aspect-square lg:w-7/12 xl:w-9/12" />
                </section>
              )}
            </>
          )}
        </RouteLayout>
      </>
    )
}
