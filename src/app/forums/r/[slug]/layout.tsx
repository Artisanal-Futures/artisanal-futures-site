import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

import { SubscribeLeaveToggle } from '~/app/forums/_components/subscribe-leave-toggle'
import { ToFeedButton } from '~/app/forums/_components/to-feed-button'
import { buttonVariants } from '~/components/ui/button'
import { getServerAuthSession } from '~/server/auth'
import { db } from '~/server/db'
import { SubredditEditButton } from '../../_components/subreddit-edit-button'

export const metadata: Metadata = {
  title: 'Artisanal Futures Forums',
}

const Layout = async ({
  children,
  params: { slug },
}: {
  children: ReactNode
  params: { slug: string }
}) => {
  const session = await getServerAuthSession()

  const subreddit = await db.subreddit.findFirst({
    where: {
      name: slug,
    },
    include: {
      posts: {
        include: {
          author: true,
          votes: true,
        },
      },
    },
  })

  const subscription = !session?.user
    ? undefined
    : await db.subscription.findFirst({
        where: {
          subreddit: {
            name: slug,
          },
          user: {
            id: session.user.id,
          },
        },
      })

  const isSubscribed = !!subscription

  if (!subreddit) return notFound()

  const memberCount = await db.subscription.count({
    where: {
      subreddit: {
        name: slug,
      },
    },
  })

  return (
    <div className="mx-auto h-full max-w-7xl sm:container">
      <div>
        <ToFeedButton />

        <div className="grid grid-cols-1 gap-y-4 py-6 md:grid-cols-3 md:gap-x-4">
          <ul className="col-span-2 flex flex-col space-y-6">{children}</ul>

          {/* info sidebar */}
          <div className="order-first h-fit overflow-hidden rounded-lg border border-border md:order-last">
            <div className="flex items-center justify-between bg-secondary px-6 py-4">
              <p className="py-3 font-semibold text-foreground">
                About r/{subreddit.name}
              </p>

              {(subreddit.creatorId === session?.user?.id ||
                session?.user?.role === 'ADMIN') && (
                <SubredditEditButton
                  subredditId={subreddit.id}
                  name={subreddit.name}
                  description={subreddit?.description ?? undefined}
                  isPublic={subreddit?.isPublic ?? true}
                />
              )}
            </div>
            <div className="divide-y divide-border bg-background px-6 text-sm leading-6">
              {subreddit.description && (
                <div className="py-3">
                  <p className="text-foreground">{subreddit.description}</p>
                </div>
              )}
              <div className="flex justify-between gap-x-4 py-3">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">
                  <time dateTime={subreddit.createdAt.toDateString()}>
                    {format(subreddit.createdAt, 'MMMM d, yyyy')}
                  </time>
                </span>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <span className="text-muted-foreground">Members</span>
                <span className="flex items-start gap-x-2">
                  <div className="text-foreground">{memberCount}</div>
                </span>
              </div>
              {subreddit.creatorId === session?.user?.id ? (
                <div className="flex justify-between gap-x-4 py-3">
                  <span className="text-muted-foreground">
                    You created this community
                  </span>
                </div>
              ) : null}

              {subreddit.creatorId !== session?.user?.id ? (
                <SubscribeLeaveToggle
                  isSubscribed={isSubscribed}
                  subredditId={subreddit.id}
                  subredditName={subreddit.name}
                />
              ) : null}
              {(subreddit.creatorId === session?.user?.id || isSubscribed) && (
                <div className="py-4">
                  <Link
                    className={buttonVariants({
                      variant: 'outline',
                      className: 'w-full',
                    })}
                    href={`/forums/r/${slug}/submit`}
                  >
                    Create Post
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout
