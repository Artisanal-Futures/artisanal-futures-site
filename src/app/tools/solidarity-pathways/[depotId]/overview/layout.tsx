import { redirect } from 'next/navigation'

export default function DepotOverviewLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { depotId: string; date?: string; welcome?: string }
}) {
  const { depotId, date, welcome } = params

  if (!date)
    redirect(
      `/tools/solidarity-pathways/${
        depotId
      }/overview?date=${new Date().toDateString().replace(/\s/g, '+')}${
        welcome ? `&welcome=${welcome}` : ''
      }`,
    )

  return <>{children}</>
}
