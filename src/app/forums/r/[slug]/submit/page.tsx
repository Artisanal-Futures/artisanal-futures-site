import { notFound } from "next/navigation";

import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import { Editor } from "~/app/forums/_components/default-editor";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const page = async ({ params }: Props) => {
  const { slug } = await params;
  const subreddit = await db.subreddit.findFirst({
    where: {
      name: slug,
    },
  });

  if (!subreddit) return notFound();

  return (
    <div className="flex flex-col items-start gap-6">
      {/* heading */}
      <div className="border-border border-b pb-5">
        <div className="-mt-2 -ml-2 flex flex-wrap items-baseline">
          <h3 className="text-foreground mt-2 ml-2 text-base leading-6 font-semibold">
            Create Post
          </h3>
          <p className="text-muted-foreground mt-1 ml-2 truncate text-sm">
            in r/{slug}
          </p>
        </div>
      </div>

      {/* form */}
      <Editor subredditId={subreddit.id} />

      <div className="flex w-full justify-end">
        <Button type="submit" className="w-full" form="subreddit-post-form">
          Post
        </Button>
      </div>
    </div>
  );
};

export default page;
