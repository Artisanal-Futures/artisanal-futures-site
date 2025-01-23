import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";
import { HomeIcon } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
import { CustomFeed } from "~/app/forums/_components/homepage/custom-feed";
import { GeneralFeed } from "~/app/forums/_components/homepage/general-feed";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Forum Home",
};
export default async function ForumHome() {
  const session = await getServerAuthSession();

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground md:text-4xl">
        Your feed
      </h1>
      <div className="grid grid-cols-1 gap-y-4 py-6 md:grid-cols-3 md:gap-x-4">
        {session ? <CustomFeed /> : <GeneralFeed />}

        {/* subreddit info */}
        <div className="order-first h-fit overflow-hidden rounded-lg border border-border bg-background md:order-last">
          <div className="bg-secondary px-6 py-4">
            <p className="flex items-center gap-1.5 py-3 font-semibold text-foreground">
              <HomeIcon className="h-4 w-4" />
              Home
            </p>
          </div>
          <dl className="-my-3 divide-y divide-border px-6 py-4 text-sm leading-6">
            <div className="flex justify-between gap-x-4 py-3">
              <p className="text-muted-foreground">
                Your personal forum homepage. Come here to check in with your
                favorite communities.
              </p>
            </div>

            <Link
              className={buttonVariants({
                className: "mb-6 mt-4 w-full",
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
