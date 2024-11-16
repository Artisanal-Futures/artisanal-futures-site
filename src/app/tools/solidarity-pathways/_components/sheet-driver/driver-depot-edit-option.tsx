import type { DriverVehicleBundle } from '~/app/tools/solidarity-pathways/_validators/types.wip'
import { useDriverVehicleBundles } from '~/app/tools/solidarity-pathways/_hooks/drivers/use-driver-vehicle-bundles'

type Props = { row: DriverVehicleBundle }
export const DriverDepotEditOption = ({ row }: Props) => {
  const { edit } = useDriverVehicleBundles()

  const editDriver = (id: string) => edit(id)

  return <p onClick={() => editDriver(row.vehicle.id)}>Edit</p>
}
