import { useCallback, useMemo } from 'react'
import { FilePlus } from 'lucide-react'

import { useCreateDriver } from '~/app/tools/solidarity-pathways/_hooks/drivers/CRUD/use-create-driver'
import { useReadDriver } from '~/app/tools/solidarity-pathways/_hooks/drivers/CRUD/use-read-driver'
import { Button } from '~/components/ui/button'
import { driverVehicleUploadOptions } from '../../_data/driver-data'
import { DriverVehicleBundle } from '../../_validators/types.wip'
import { FileUploadModal } from '../shared'

export const ImportDriversButton = () => {
  const { depotDrivers } = useReadDriver()
  const { createNewDrivers } = useCreateDriver()

  const fileUploadOptions = useMemo(() => {
    return driverVehicleUploadOptions({
      drivers: depotDrivers,
      setDrivers: createNewDrivers,
    })
  }, [depotDrivers, createNewDrivers])

  return (
    <FileUploadModal<DriverVehicleBundle> {...fileUploadOptions}>
      <Button className="mx-0 flex gap-2 px-0 " variant={'link'}>
        <FilePlus />
        Import Drivers
      </Button>{' '}
    </FileUploadModal>
  )
}
