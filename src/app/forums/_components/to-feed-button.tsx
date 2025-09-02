"use client";

import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";

export const ToFeedButton = () => {
  const pathname = usePathname();

  // if path is /r/mycom, turn into /
  // if path is /r/mycom/post/cligad6jf0003uhest4qqkeco, turn into /r/mycom

  const subredditPath = getSubredditPath(pathname);

  return (
    <a href={subredditPath} className={buttonVariants({ variant: "ghost" })}>
      <ChevronLeft className="mr-1 h-4 w-4" />
      {subredditPath === "/" ? "Back home" : "Back to community"}
    </a>
  );
};

const getSubredditPath = (pathname: string) => {
  const splitPath = pathname.split("/");

  if (splitPath.length === 4) return "/forums";
  else if (splitPath.length > 4)
    return `/forums/${splitPath[2]}/${splitPath[3]}`;
  // default path, in case pathname does not match expected format
  else return "/forums";
};
