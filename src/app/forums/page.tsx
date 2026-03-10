import Link from "next/link";
import { HomeIcon } from "lucide-react";

import { getSession } from "~/server/better-auth/server";
import { buttonVariants } from "~/components/ui/button";
import { CustomFeed } from "~/app/forums/_components/homepage/custom-feed";
import { GeneralFeed } from "~/app/forums/_components/homepage/general-feed";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Forum Home",
};
export default async function ForumHome() {
  const session = await getSession();

  return (
    <>
      <h1 className="text-foreground text-3xl font-bold md:text-4xl">
        Your feed
      </h1>
      <div className="grid grid-cols-1 gap-y-4 py-6 md:grid-cols-3 md:gap-x-4">
        {session ? <CustomFeed /> : <GeneralFeed />}

        {/* subreddit info */}
        <div className="border-border bg-background order-first h-fit overflow-hidden rounded-lg border md:order-last">
          <div className="bg-secondary px-6 py-4">
            <p className="text-foreground flex items-center gap-1.5 py-3 font-semibold">
              <HomeIcon className="h-4 w-4" />
              Home
            </p>
          </div>
          <dl className="divide-border -my-3 divide-y px-6 py-4 text-sm leading-6">
            <div className="flex justify-between gap-x-4 py-3">
              <p className="text-muted-foreground">
                Your personal forum homepage. Come here to check in with your
                favorite communities.
              </p>
            </div>

            <Link
              className={buttonVariants({
                className: "mt-4 mb-6 w-full",
              })}
              href={`/forums/r/create`}
            >
              Create Community
            </Link>
          </dl>
        </div>
      </div>
    </>
  );
}
