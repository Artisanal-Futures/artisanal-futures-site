import Link from 'next/link'
import { Home as HomeIcon } from 'lucide-react'

import { GeneralFeed } from '~/app/forums/_components/homepage/general-feed'
import { buttonVariants } from '~/components/ui/button'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export const metadata = {
  title: 'New Subreddits',
}

export default function NewSubredditsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-foreground md:text-4xl">
        Latest and Greatest
      </h1>
      <div className="grid grid-cols-1 gap-y-4 py-6 md:grid-cols-3 md:gap-x-4">
        <GeneralFeed />

        {/* subreddit info */}
        <div className="order-first h-fit overflow-hidden rounded-lg border border-border bg-background md:order-last">
          <div className="bg-secondary px-6 py-4">
            <p className="flex items-center gap-1.5 py-3 font-semibold text-foreground">
              <HomeIcon className="h-4 w-4" />
              Home
            </p>
          </div>
          <div className="-my-3 divide-y divide-border px-6 py-4 text-sm leading-6">
            <div className="flex justify-between gap-x-4 py-3">
              <p className="text-muted-foreground">
                Homepage for all the latest and greatest posts.
              </p>
            </div>

            <Link
              className={buttonVariants({
                className: 'mb-6 mt-4 w-full',
              })}
              href={`/forums/r/create`}
            >
              Create Community
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
