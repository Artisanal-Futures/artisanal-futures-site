import type {
  ClientJobBundle,
  FileUploadHandler,
  VersionOneClientCSV,
} from '~/app/tools/solidarity-pathways/_validators/types.wip'
import geocodingService from '~/app/tools/solidarity-pathways/_services/autocomplete'
import { formatClientSheetRowToBundle } from '~/app/tools/solidarity-pathways/_utils/client-job/format-clients.wip'
import { parseSpreadSheet } from '~/app/tools/solidarity-pathways/_utils/generic/parse-csv.wip'

export const handleClientSheetUpload: FileUploadHandler<ClientJobBundle> = ({
  event,
  setIsLoading,
  callback,
}) => {
  setIsLoading(true)

  parseSpreadSheet<VersionOneClientCSV, ClientJobBundle>({
    file: event.target.files![0]!,
    parser: formatClientSheetRowToBundle,
    onComplete: async (data: ClientJobBundle[]) => {
      const revisedClients = await Promise.all(
        data.map(async (clientJobBundle) => {
          const address = await geocodingService.geocodeByAddress(
            clientJobBundle.job.address.formatted,
          )

          const client = clientJobBundle.client
            ? {
                ...clientJobBundle.client,
                address: {
                  ...address,
                },
              }
            : undefined

          return {
            client: client,
            job: {
              ...clientJobBundle.job,
              address: {
                ...address,
              },
            },
          }
        }),
      ).catch((err) => {
        console.log(err)
      })
      setIsLoading(false)
      const tableData =
        revisedClients?.map((bundle) => {
          return {
            name: bundle?.client?.name ?? `Job #${bundle.job.id}`,
            address: bundle.job.address.formatted,
            email: bundle?.client?.email ?? '',
          }
        }) ?? []
      callback({ data: revisedClients ?? [], tableData })
    },
  })
}
