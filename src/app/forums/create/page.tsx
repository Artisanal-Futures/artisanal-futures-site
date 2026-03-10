import { notFound, redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";

import { EditorGeneric } from "../_components/editor-generic";
import CreateLayout from "./_components/create-layout";

interface CreatePostPageProps {
  searchParams: Promise<{ slug?: string }>;
}

const CreatePostPage = async ({ searchParams }: CreatePostPageProps) => {
  const { slug } = await searchParams;
  const session = await getSession();

  if (!session) {
    redirect("/auth/sign-in?callbackUrl=/forums/create");
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
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const personalSubreddit =
    await api.forumSubreddit.findOrCreatePersonalSubreddit();

  if (!subreddits.length && !personalSubreddit) return notFound();

  return (
    <CreateLayout slug={slug}>
      <div className="flex flex-col items-start gap-6 p-6">
        {/* heading */}
        <div className="border-border w-full border-b pb-4">
          <div className="flex flex-wrap items-baseline">
            <h3 className="text-foreground text-2xl font-semibold dark:text-white">
              Create Post
            </h3>
            <p className="text-muted-foreground ml-2 text-sm dark:text-gray-400">
              Share your thoughts with the community
            </p>
          </div>
        </div>

        {/* form */}
        <div className="bg-card w-full rounded-lg p-6 shadow-sm dark:bg-gray-800/50">
          <EditorGeneric subreddits={[personalSubreddit, ...subreddits]} />

          <div className="mt-6 flex w-full justify-end">
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 w-full"
              form="subreddit-post-form"
            >
              Post
            </Button>
          </div>
        </div>
      </div>{" "}
    </CreateLayout>
  );
};

export default CreatePostPage;
