import type { FC } from 'react'
import { Truck } from 'lucide-react'

import type {
  DriverVehicleBundle,
  UploadOptions,
} from '../../_validators/types.wip'
import type { HomePageImportBtnProps } from '../shared/homepage-overview-import-btn'
import { driverVehicleUploadOptions } from '~/app/tools/solidarity-pathways/_data/driver-data'
import { useCreateDriver } from '~/app/tools/solidarity-pathways/_hooks/drivers/CRUD/use-create-driver'
import { useReadDriver } from '~/app/tools/solidarity-pathways/_hooks/drivers/CRUD/use-read-driver'
import { FileUploadModal } from '../shared/file-upload-modal.wip'
import { HomePageOverviewImportBtn } from '../shared/homepage-overview-import-btn'

type UploadButtonOptions<T> = {
  button: HomePageImportBtnProps
  fileUpload: UploadOptions<T> | null
}

export const HomepageDriverImportCard: FC = () => {
  const { routeDrivers, depotDrivers } = useReadDriver()
  const { createNewDrivers } = useCreateDriver()

  const driverImportButtonProps = {
    button: {
      Icon: Truck,
      caption: 'Add your drivers from spreadsheet',
      isProcessed: depotDrivers.length > 0,
    },
    fileUpload: driverVehicleUploadOptions({
      drivers: routeDrivers,
      setDrivers: createNewDrivers,
    }),
  } as UploadButtonOptions<DriverVehicleBundle>

  return (
    <FileUploadModal<DriverVehicleBundle>
      {...driverImportButtonProps.fileUpload!}
    >
      <span>
        <HomePageOverviewImportBtn {...driverImportButtonProps.button} />
      </span>
    </FileUploadModal>
  )
}
