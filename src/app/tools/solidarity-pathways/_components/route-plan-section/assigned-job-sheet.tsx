import type { FC } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

import type {
  OptimizedRoutePath,
  OptimizedStop,
} from '~/app/tools/solidarity-pathways/_validators/types.wip'
import { AssignedJobHeaderCard } from '~/app/tools/solidarity-pathways/_components/route-plan-section/assigned-job-header-card'
import RouteBreakdown from '~/app/tools/solidarity-pathways/_components/route-plan-section/route-breakdown'
import { useDepot } from '~/app/tools/solidarity-pathways/_hooks/depot/use-depot'
import { useDriverVehicleBundles } from '~/app/tools/solidarity-pathways/_hooks/drivers/use-driver-vehicle-bundles'
import { useSolidarityState } from '~/app/tools/solidarity-pathways/_hooks/optimized-data/use-solidarity-state'
import { getColor } from '~/app/tools/solidarity-pathways/_utils/generic/color-handling'
import { cuidToIndex } from '~/app/tools/solidarity-pathways/_utils/generic/format-utils.wip'
import { generatePassCode } from '~/app/tools/solidarity-pathways/_utils/generic/generate-passcode'
import { generateDriverPassCode } from '~/app/tools/solidarity-pathways/_utils/server/auth-driver-passcode'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from '~/components/ui/map-sheet'
import { cn } from '~/utils/styles'
import { useSolidarityMessaging } from '../../_hooks/use-solidarity-messaging'

type Props = {
  data: OptimizedRoutePath
} & React.ComponentProps<typeof Card>

export const AssignedJobSheet: FC<Props> = ({ data }) => {
  const [open, setOpen] = useState(false)
  const { currentDepot } = useDepot()
  const driverBundles = useDriverVehicleBundles()
  const solidarityMessaging = useSolidarityMessaging()
  const { depotId } = useSolidarityState()

  const color = useMemo(() => getColor(cuidToIndex(data.vehicleId)), [data])

  const headerData = {
    vehicleId: data.vehicleId,
    startTime: data.startTime,
    routeStatus: data.status,
    endTime: data.endTime,
    distance: data.distance,
    textColor: color?.text ?? 'text-black',
    isOnline: false,
    isTracking: false,
  }
  const driver = driverBundles.getVehicleById(data?.vehicleId ?? data.vehicleId)

  const onRouteSheetOpenChange = (state: boolean) => {
    if (!state) driverBundles.setActive(null)
    else driverBundles.setActive(data.vehicleId)
    setOpen(state)
  }

  const passcode = driver?.driver?.email
    ? generateDriverPassCode({
        pathId: data.id,
        depotCode: currentDepot!.magicCode,
        email: driver?.driver.email,
      })
    : ''

  return (
    <>
      <Sheet onOpenChange={onRouteSheetOpenChange} open={open}>
        <SheetTrigger asChild>
          <Button
            variant={'ghost'}
            className="my-2 ml-auto  flex h-auto  w-full p-0 text-left"
          >
            <Card className={cn('w-full hover:bg-slate-50', '')}>
              <AssignedJobHeaderCard {...headerData} />
            </Card>
          </Button>
        </SheetTrigger>

        {data && (
          <SheetContent className="radix-dialog-content flex w-full max-w-full flex-col sm:w-full sm:max-w-full md:max-w-md lg:max-w-lg">
            <SheetHeader className="text-left">
              <AssignedJobHeaderCard {...headerData} className="shadow-none" />
            </SheetHeader>
            <RouteBreakdown
              steps={data.stops as OptimizedStop[]}
              color={color.background}
              driver={driver}
            />
            <SheetFooter className="flex flex-row gap-2">
              <Button
                className="flex flex-1 gap-2"
                variant={'outline'}
                disabled={!driver?.driver?.email}
                onClick={() => {
                  if (!driver?.driver?.email) return
                  solidarityMessaging.messageDriver(driver?.driver?.email)
                }}
              >
                <MessageCircle /> Send Message to {driver?.driver?.name}
              </Button>

              <Link
                href={`/tools/solidarity-pathways/${depotId}/route/${data.routeId}/path/${data.id}?driverId=${data.vehicleId}&pc=${passcode}`}
                target="_blank"
              >
                <Button className="">View Route</Button>
              </Link>
            </SheetFooter>
          </SheetContent>
        )}
      </Sheet>
    </>
  )
}
