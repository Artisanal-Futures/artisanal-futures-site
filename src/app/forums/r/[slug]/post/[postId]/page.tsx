// import { CachedPost } from '@/types/redis'
import type { Post, User, Vote } from "generated/prisma";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowBigDown, ArrowBigUp, Loader2 } from "lucide-react";

import { formatTimeToNow } from "~/lib/utils";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { buttonVariants } from "~/components/ui/button";
import { CommentsSection } from "~/app/forums/_components/comments-section";
import { EditorOutput } from "~/app/forums/_components/editor-output";
import { PostEditButton } from "~/app/forums/_components/post-edit-button";
import { PostVoteServer } from "~/app/forums/_components/post-vote/post-vote-server";

interface SubRedditPostPageProps {
  params: Promise<{
    postId: string;
  }>;
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  const { postId } = await params;
  const session = await getSession();

  let post: (Post & { votes: Vote[]; author: User }) | null = null;

  post = await db.post.findFirst({
    where: {
      id: postId,
    },
    include: {
      votes: true,
      author: true,
    },
  });

  if (!post) return notFound();
  return (
    <div>
      <div className="flex h-full flex-col items-center justify-between sm:flex-row sm:items-start">
        <Suspense fallback={<PostVoteShell />}>
          <PostVoteServer
            postId={post?.id}
            getData={async () => {
              return await db.post.findUnique({
                where: {
                  id: postId,
                },
                include: {
                  votes: true,
                },
              });
            }}
          />
        </Suspense>

        <div className="bg-background w-full flex-1 rounded-sm p-4 sm:w-0">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground mt-1 max-h-40 truncate text-xs">
              Posted by u/{post?.author.username}{" "}
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

          <h1 className="text-foreground py-2 text-xl leading-6 font-semibold">
            {post?.title}
          </h1>
          <EditorOutput content={post?.content} />
          <Suspense
            fallback={
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            }
          >
            {/* @ts-expect-error Server Component */}
            <CommentsSection postId={post?.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

function PostVoteShell() {
  return (
    <div className="flex w-20 flex-col items-center pr-6">
      {/* upvote */}
      <div className={buttonVariants({ variant: "ghost" })}>
        <ArrowBigUp className="text-muted-foreground h-5 w-5" />
      </div>

      {/* score */}
      <div className="text-foreground py-2 text-center text-sm font-medium">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>

      {/* downvote */}
      <div className={buttonVariants({ variant: "ghost" })}>
        <ArrowBigDown className="text-muted-foreground h-5 w-5" />
      </div>
    </div>
  );
}

export default SubRedditPostPage;
