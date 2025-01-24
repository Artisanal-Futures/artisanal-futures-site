import { api } from '~/trpc/server'
import { AdminClientLayout } from '../_components/client-layout'
import { GuestSurveysClient } from './_components/guest-surveys-client'

export default async function AdminGuestSurveysPage() {
  const guests = await api.guest.getAll()

  return (
    <AdminClientLayout
      title={`Guest Surveys (${guests?.length ?? 0})`}
      currentPage="Guest Surveys"
    >
      <GuestSurveysClient guests={guests ?? []} />
    </AdminClientLayout>
  )
}
