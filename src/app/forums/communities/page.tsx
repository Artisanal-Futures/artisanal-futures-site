import Link from 'next/link'
import { Home as HomeIcon } from 'lucide-react'

import { buttonVariants } from '~/components/ui/button'
import { GeneralSubredditFeed } from '../_components/subreddits/general-subreddit-feed'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function AllSubredditPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-foreground md:text-4xl">
        All Communities
      </h1>
      <div className="grid grid-cols-1 gap-y-4 py-6 md:grid-cols-3 md:gap-x-4">
        <GeneralSubredditFeed />

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
              <span className="sr-only">Description</span>

              <span className="text-muted-foreground">
                See all the communities available on Artisanal Futures, maybe
                even join a few!
              </span>
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
