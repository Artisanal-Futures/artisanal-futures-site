import { notFound, redirect } from 'next/navigation'

import { Button } from '~/components/ui/button'
import { getServerAuthSession } from '~/server/auth'
import { db } from '~/server/db'
import { api } from '~/trpc/server'
import { EditorGeneric } from '../_components/editor-generic'
import CreateLayout from './_components/create-layout'

interface CreatePostPageProps {
  searchParams: { slug?: string }
}

const CreatePostPage = async ({ searchParams }: CreatePostPageProps) => {
  const session = await getServerAuthSession()

  if (!session) {
    redirect('/auth/sign-in?callbackUrl=/forums/create')
  }

  // Fetch all available subreddits
  const subreddits = await db.subreddit.findMany({
    where: {
      subscribers: {
        some: {
          userId: session?.user?.id,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
    },
  })

  const personalSubreddit =
    await api.forumSubreddit.findOrCreatePersonalSubreddit()

  if (!subreddits.length && !personalSubreddit) return notFound()

  return (
    <CreateLayout slug={searchParams?.slug}>
      <div className="flex flex-col items-start gap-6 p-6">
        {/* heading */}
        <div className="w-full border-b border-border pb-4">
          <div className="flex flex-wrap items-baseline">
            <h3 className="text-2xl font-semibold text-foreground dark:text-white">
              Create Post
            </h3>
            <p className="ml-2 text-sm text-muted-foreground dark:text-gray-400">
              Share your thoughts with the community
            </p>
          </div>
        </div>

        {/* form */}
        <div className="w-full rounded-lg bg-card p-6 shadow-sm dark:bg-gray-800/50">
          <EditorGeneric subreddits={[personalSubreddit, ...subreddits]} />

          <div className="mt-6 flex w-full justify-end">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              form="subreddit-post-form"
            >
              Post
            </Button>
          </div>
        </div>
      </div>{' '}
    </CreateLayout>
  )
}

export default CreatePostPage
