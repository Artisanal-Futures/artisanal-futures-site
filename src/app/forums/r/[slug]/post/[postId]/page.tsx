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
import { UserAvatar } from "~/app/forums/_components/user-avatar";

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

        <div className="bg-card w-full flex-1 rounded-2xl border p-5 shadow-sm sm:w-0 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <UserAvatar
                user={{
                  name: post?.author.username ?? null,
                  image: post?.author.image ?? null,
                }}
                className="h-6 w-6 shrink-0"
              />
              <span>
                Posted by u/{post?.author.username}{" "}
                {formatTimeToNow(new Date(post?.createdAt))}
              </span>
            </div>

            {post?.authorId === session?.user.id && (
              <PostEditButton
                postId={post?.id}
                title={post?.title}
                content={post?.content}
              />
            )}
          </div>

          <h1 className="text-foreground mt-3 text-2xl leading-tight font-bold text-balance">
            {post?.title}
          </h1>
          <div className="bg-border my-4 h-px w-full" />
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
