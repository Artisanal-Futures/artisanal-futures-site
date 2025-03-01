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

export const metadata: Metadata = {
  title: 'Artisanal Futures Forums',
}

export default async function CreateLayout({
  children,
  slug,
}: {
  children: ReactNode
  slug?: string
}) {
  const session = await getServerAuthSession()

  // Return default state when no slug is present
  if (!slug) {
    return (
      <div className="mx-auto h-full max-w-7xl sm:container">
        <div>
          <ToFeedButton />
          <div className="grid grid-cols-1 gap-y-4 py-6 md:grid-cols-3 md:gap-x-4">
            <ul className="col-span-2 flex flex-col space-y-6">{children}</ul>
          </div>
        </div>
      </div>
    )
  }

  const subreddit = await db.subreddit.findFirst({
    where: { name: slug },
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
          <div className="order-first h-fit overflow-hidden rounded-lg border border-gray-200 md:order-last">
            <div className="px-6 py-4">
              <p className="py-3 font-semibold">About r/{subreddit.name}</p>
            </div>
            <div className="divide-y divide-gray-100 bg-background px-6 py-4 text-sm leading-6">
              <div className="flex justify-between gap-x-4 py-3">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">
                  <time dateTime={subreddit.createdAt.toDateString()}>
                    {format(subreddit.createdAt, 'MMMM d, yyyy')}
                  </time>
                </span>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <span className="text-gray-500">Members</span>
                <span className="flex items-start gap-x-2">
                  <div className="text-gray-900">{memberCount}</div>
                </span>
              </div>
              {subreddit.creatorId === session?.user?.id ? (
                <div className="flex justify-between gap-x-4 py-3">
                  <span className="text-gray-500">
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
              <Link
                className={buttonVariants({
                  variant: 'outline',
                  className: 'mb-6 w-full',
                })}
                href={`/forums/r/${slug}/submit`}
              >
                Create Post
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
