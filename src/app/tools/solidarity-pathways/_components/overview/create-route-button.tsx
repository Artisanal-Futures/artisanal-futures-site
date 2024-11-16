import { useMemo } from 'react'
import { FilePlus } from 'lucide-react'

import type { ClientJobBundle } from '~/app/tools/solidarity-pathways/_validators/types.wip'
import { FileUploadModal } from '~/app/tools/solidarity-pathways/_components/shared/file-upload-modal.wip'
import { useClientJobBundles } from '~/app/tools/solidarity-pathways/_hooks/jobs/use-client-job-bundles'
import { Button } from '~/components/ui/button'
import { clientJobUploadOptions } from '../../_data/stop-data'

export const CreateRouteButton = () => {
  const { data, createMany } = useClientJobBundles()

  const clientJobImportOptions = useMemo(() => {
    return clientJobUploadOptions({
      jobs: data,
      setJobs: createMany,
    })
  }, [data, createMany])

  return (
    <FileUploadModal<ClientJobBundle> {...clientJobImportOptions}>
      <Button
        variant="outline"
        className="flex w-full flex-1 items-center gap-2"
      >
        <FilePlus className="h-5 w-5" /> Create a route using a spreadsheet
      </Button>
    </FileUploadModal>
  )
}
