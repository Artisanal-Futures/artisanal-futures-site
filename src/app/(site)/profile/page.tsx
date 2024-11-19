import DevelopmentChangeRole from '~/app/(site)/profile/_components/development-change-role'
import { Separator } from '~/components/ui/separator'
import { env } from '~/env'

const isDev = env.NODE_ENV === 'development'

export default function ProfilePage() {
  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground">
            This is how others will see you on the site.
          </p>
        </div>
        <Separator />
        <p>
          Welcome! We are still a work in progress, so more settings will be
          available soon.
        </p>
        {isDev && <DevelopmentChangeRole />}
      </div>
    </>
  )
}
