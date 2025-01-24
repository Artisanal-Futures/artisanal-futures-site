import { useSession } from 'next-auth/react'

export const usePermissions = () => {
  const { data: session } = useSession()
  const userRole = session?.user.role ?? 'ARTISAN'
  const isElevated = userRole !== 'ARTISAN'

  return { isElevated, userRole, session }
}
