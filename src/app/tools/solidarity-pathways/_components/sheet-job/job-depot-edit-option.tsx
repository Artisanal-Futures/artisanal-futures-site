import type { ClientJobBundle } from '~/app/tools/solidarity-pathways/_validators/types.wip'
import { useClientJobBundles } from '~/app/tools/solidarity-pathways/_hooks/jobs/use-client-job-bundles'

type Props = { row: ClientJobBundle }
export const JobDepotEditOption = ({ row }: Props) => {
  const jobs = useClientJobBundles()

  const editPost = (id: string) => {
    jobs.edit(id)
  }

  return <p onClick={() => editPost(row.job.id)}>Edit</p>
}
