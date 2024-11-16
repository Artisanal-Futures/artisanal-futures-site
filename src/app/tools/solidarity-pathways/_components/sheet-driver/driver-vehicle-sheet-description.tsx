import { Home, Mail, Phone } from 'lucide-react'

import type { DriverVehicleBundle } from '~/app/tools/solidarity-pathways/_validators/types.wip'
import { numberStringToPhoneFormat } from '~/app/tools/solidarity-pathways/_utils/generic/format-utils.wip'
import { SheetDescription } from '~/components/ui/map-sheet'

type Props = {
  activeVehicle: DriverVehicleBundle | null
}
export const DriverSheetDescription = ({ activeVehicle }: Props) => (
  <SheetDescription className="text-center md:text-left">
    {activeVehicle ? (
      <span className="flex w-full flex-1 flex-col border-b border-t py-4 text-sm">
        <p className="flex items-center gap-2 font-light text-muted-foreground ">
          <Home size={15} /> {activeVehicle.driver.address?.formatted}
        </p>
        <p className="flex items-center gap-2 font-light text-muted-foreground ">
          <Phone size={15} />{' '}
          {numberStringToPhoneFormat(activeVehicle.driver.phone)}
        </p>
        <p className="flex items-center gap-2 font-light text-muted-foreground ">
          <Mail size={15} /> {activeVehicle.driver.email}
        </p>
      </span>
    ) : (
      <p>Add drivers to your route plan from existing, or create a new one.</p>
    )}
  </SheetDescription>
)
