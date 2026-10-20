// import { CachedPost } from '@/types/redis'
import type { Post, User, Vote } from "generated/prisma";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowBigDown, ArrowBigUp, Loader2 } from "lucide-react";

import { discussionPostSchema } from "~/lib/seo/schema";
import { buildMetadata, truncate } from "~/lib/seo/site";
import { formatTimeToNow } from "~/lib/utils";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { buttonVariants } from "~/components/ui/button";
import { JsonLd } from "~/components/seo/json-ld";
import { CommentsSection } from "~/app/forums/_components/comments-section";
import { EditorOutput } from "~/app/forums/_components/editor-output";
import { PostEditButton } from "~/app/forums/_components/post-edit-button";
import { PostVoteServer } from "~/app/forums/_components/post-vote/post-vote-server";
import { UserAvatar } from "~/app/forums/_components/user-avatar";

interface SubRedditPostPageProps {
  params: Promise<{
    slug: string;
    postId: string;
  }>;
}

/**
 * Posts are stored as Editor.js JSON (a string). Flatten the text-bearing
 * blocks into plain text for the meta description; anything unparseable just
 * yields an empty string.
 */
function postContentToText(content: unknown) {
  try {
    const data = (
      typeof content === "string" ? JSON.parse(content) : content
    ) as { blocks?: { data?: { text?: unknown; items?: unknown } }[] } | null;

    return (data?.blocks ?? [])
      .flatMap((block) => {
        if (typeof block.data?.text === "string") return [block.data.text];
        if (Array.isArray(block.data?.items)) {
          return block.data.items.filter(
            (item): item is string => typeof item === "string",
          );
        }
        return [];
      })
      .join(" ");
  } catch {
    return "";
  }
}

export async function generateMetadata({
  params,
}: SubRedditPostPageProps): Promise<Metadata> {
  const { slug, postId } = await params;

  const post = await db.post.findFirst({
    where: { id: postId },
    select: {
      title: true,
      content: true,
      subreddit: { select: { name: true, isPublic: true } },
    },
  });

  if (!post) {
    return { title: "Post", robots: { index: false, follow: false } };
  }

  return buildMetadata({
    title: post.title,
    description:
      truncate(postContentToText(post.content)) ||
      `A discussion in r/${post.subreddit.name} on the Artisanal Futures forums.`,
    path: `/forums/r/${slug}/post/${postId}`,
    type: "article",
    noIndex: !post.subreddit.isPublic,
  });
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const SubRedditPostPage = async ({ params }: SubRedditPostPageProps) => {
  const { slug, postId } = await params;
  const session = await getSession();

  let post:
    | (Post & {
        votes: Vote[];
        author: User;
        subreddit: { isPublic: boolean };
        _count: { comments: number };
      })
    | null = null;

  post = await db.post.findFirst({
    where: {
      id: postId,
    },
    include: {
      votes: true,
      author: true,
      subreddit: { select: { isPublic: true } },
      _count: { select: { comments: { where: { deletedAt: null } } } },
    },
  });

  if (!post) return notFound();
  return (
    <div>
      {/* Posts in private communities stay out of structured data, like the
          noindex in generateMetadata. */}
      {post.subreddit.isPublic && (
        <JsonLd
          data={discussionPostSchema({
            title: post.title,
            text: postContentToText(post.content),
            authorName: post.author.username ?? "Anonymous",
            datePublished: post.createdAt,
            dateModified: post.updatedAt,
            path: `/forums/r/${slug}/post/${postId}`,
            commentCount: post._count.comments,
            upvoteCount: post.votes.filter((vote) => vote.type === "UP").length,
          })}
        />
      )}
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
