// import { CachedPost } from '@/types/redis'
import type { Post, User, Vote } from '@prisma/client'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ArrowBigDown, ArrowBigUp, Loader2 } from 'lucide-react'

// import { redis } from "~/server/redis";
import { CommentsSection } from '~/app/forums/_components/comments-section'
import { EditorOutput } from '~/app/forums/_components/editor-output'
import { PostEditButton } from '~/app/forums/_components/post-edit-button'
import { PostVoteServer } from '~/app/forums/_components/post-vote/post-vote-server'
import { buttonVariants } from '~/components/ui/button'
import { formatTimeToNow } from '~/lib/utils'
import { getServerAuthSession } from '~/server/auth'
import { db } from '~/server/db'

interface SubRedditPostPageProps {
  params: {
    postId: string
  }
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  const session = await getServerAuthSession()
  // const cachedPost = (await redis.hgetall(
  //   `post:${params.postId}`
  // )) as CachedPost

  let post: (Post & { votes: Vote[]; author: User }) | null = null

  // if (!cachedPost) {
  post = await db.post.findFirst({
    where: {
      id: params.postId,
    },
    include: {
      votes: true,
      author: true,
    },
  })
  // }

  // if (!post && !cachedPost) return notFound()
  if (!post) return notFound()
  return (
    <div>
      <div className="flex h-full flex-col items-center justify-between sm:flex-row sm:items-start">
        <Suspense fallback={<PostVoteShell />}>
          {/* ?? cachedPost.id */}
          <PostVoteServer
            postId={post?.id}
            getData={async () => {
              return await db.post.findUnique({
                where: {
                  id: params.postId,
                },
                include: {
                  votes: true,
                },
              })
            }}
          />
        </Suspense>

        <div className="w-full flex-1 rounded-sm bg-background p-4 sm:w-0">
          <div className="flex items-center justify-between">
            <p className="mt-1 max-h-40 truncate text-xs text-muted-foreground">
              Posted by u/{post?.author.username}{' '}
              {formatTimeToNow(new Date(post?.createdAt))}
            </p>

            {post?.authorId === session?.user.id && (
              <PostEditButton
                postId={post?.id}
                title={post?.title}
                content={post?.content}
              />
            )}
          </div>

          <h1 className="py-2 text-xl font-semibold leading-6 text-foreground">
            {post?.title}
          </h1>
          <EditorOutput content={post?.content} />
          <Suspense
            fallback={
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            }
          >
            {/* @ts-expect-error Server Component */}
            <CommentsSection postId={post?.id} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function PostVoteShell() {
  return (
    <div className="flex w-20 flex-col items-center pr-6">
      {/* upvote */}
      <div className={buttonVariants({ variant: 'ghost' })}>
        <ArrowBigUp className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* score */}
      <div className="py-2 text-center text-sm font-medium text-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>

      {/* downvote */}
      <div className={buttonVariants({ variant: 'ghost' })}>
        <ArrowBigDown className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  )
}

export default SubRedditPostPage
