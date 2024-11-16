'use client'

import { UserPlus } from 'lucide-react'

import { AddNewDataPopover } from '~/app/tools/solidarity-pathways/_components/layout/add-new-data-popover'
import RouteLayout from '~/app/tools/solidarity-pathways/_components/layout/route-layout'
import { CreateRouteButton } from '~/app/tools/solidarity-pathways/_components/overview/create-route-button'
import { HomePageOnboardingCard } from '~/app/tools/solidarity-pathways/_components/overview/homepage-onboarding-card.wip'
import { HomePageOverviewCard } from '~/app/tools/solidarity-pathways/_components/overview/homepage-overview-card.wip'
import { ImportDriversButton } from '~/app/tools/solidarity-pathways/_components/overview/import-drivers-button'
import { PathwaySettingsButton } from '~/app/tools/solidarity-pathways/_components/overview/pathways-settings-button'
import { RouteCalendar } from '~/app/tools/solidarity-pathways/_components/overview/route-calendar.wip'
import { DriverVehicleSheet } from '~/app/tools/solidarity-pathways/_components/sheet-driver'
import { useDriverVehicleBundles } from '~/app/tools/solidarity-pathways/_hooks/drivers/use-driver-vehicle-bundles'
import { useSolidarityState } from '~/app/tools/solidarity-pathways/_hooks/optimized-data/use-solidarity-state'
import { AbsolutePageLoader } from '~/components/absolute-page-loader'
import { Button } from '~/components/ui/button'
import { useMediaQuery } from '~/hooks/use-media-query'

export default function PathwaysDepotOverviewPage() {
  const { sessionStatus } = useSolidarityState()

  const { onSheetOpenChange } = useDriverVehicleBundles()

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const addSingleDriver = () => onSheetOpenChange(true)

  if (sessionStatus === 'loading') return <AbsolutePageLoader />

  return (
    <>
      <DriverVehicleSheet standalone={true} />

      <>
        <section className="flex flex-col-reverse  justify-end border-2 max-md:h-full max-md:p-2 md:flex-1 md:justify-center lg:flex-row">
          <section className="flex w-full max-w-sm flex-col gap-4 max-lg:hidden">
            <div className="flex h-full flex-col items-center space-y-4 bg-white px-4 pt-4">
              <CreateRouteButton />
              <RouteCalendar />
            </div>
            <div className=" flex flex-col items-start bg-white p-4 text-left">
              <Button
                className="mx-0 flex gap-2 px-0 "
                variant={'link'}
                onClick={addSingleDriver}
              >
                <UserPlus />
                Add Drivers
              </Button>
              <ImportDriversButton />

              <PathwaySettingsButton />
            </div>
          </section>
          <div className="relative flex w-full flex-col items-center justify-center space-y-10">
            {!isDesktop && <RouteCalendar />}

            <HomePageOnboardingCard />
            <HomePageOverviewCard />
          </div>
          <AddNewDataPopover />
        </section>{' '}
      </>
    </>
  )
}
