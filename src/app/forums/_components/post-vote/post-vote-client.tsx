"use client";

import type { VoteType } from "generated/prisma";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { toast } from "sonner";

import { env } from "~/env";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { usePrevious } from "~/hooks/use-previous";
import { Button } from "~/components/ui/button";

interface PostVoteClientProps {
  postId: string;
  initialVotesAmt: number;
  initialVote?: VoteType | null;
}

const IS_VOTE_DISABLED = env.NEXT_PUBLIC_VOTE_DISABLED;

export const PostVoteClient = ({
  postId,
  initialVotesAmt,
  initialVote,
}: PostVoteClientProps) => {
  const [votesAmt, setVotesAmt] = useState<number>(initialVotesAmt);
  const [currentVote, setCurrentVote] = useState(initialVote);
  const prevVote = usePrevious(currentVote);
  const router = useRouter();

  // ensure sync with server
  useEffect(() => {
    setCurrentVote(initialVote);
  }, [initialVote]);

  const subredditPostVote =
    api.forumSubreddit.createSubredditPostVote.useMutation({
      onError: (err, { voteType }) => {
        if (voteType === "UP") setVotesAmt((prev) => prev - 1);
        else setVotesAmt((prev) => prev + 1);

        // reset current vote
        setCurrentVote(prevVote);

        if (err instanceof TRPCError && err.code === "UNAUTHORIZED") {
          router.push("/sign-in");
          return;
        }

        return toast.error("Your vote was not registered. Please try again.");
      },
      onMutate: ({ voteType }) => {
        if (currentVote === voteType) {
          // User is voting the same way again, so remove their vote
          setCurrentVote(undefined);
          if (voteType === "UP") setVotesAmt((prev) => prev - 1);
          else if (voteType === "DOWN") setVotesAmt((prev) => prev + 1);
        } else {
          // User is voting in the opposite direction, so subtract 2
          setCurrentVote(voteType);
          if (voteType === "UP")
            setVotesAmt((prev) => prev + (currentVote ? 2 : 1));
          else if (voteType === "DOWN")
            setVotesAmt((prev) => prev - (currentVote ? 2 : 1));
        }
      },
    });

  if (IS_VOTE_DISABLED) return null;
  return (
    <div className="flex flex-col gap-4 pr-6 pb-4 sm:w-20 sm:gap-0 sm:pb-0">
      {/* upvote */}
      <Button
        onClick={() => subredditPostVote.mutate({ voteType: "UP", postId })}
        size="sm"
        variant="ghost"
        aria-label="upvote"
      >
        <ArrowBigUp
          className={cn("text-muted-foreground h-5 w-5", {
            "fill-emerald-500 text-emerald-500": currentVote === "UP",
          })}
        />
      </Button>

      {/* score */}
      <p className="text-foreground py-2 text-center text-sm font-medium">
        {votesAmt}
      </p>

      {/* downvote */}
      <Button
        onClick={() => subredditPostVote.mutate({ voteType: "DOWN", postId })}
        size="sm"
        className={cn({
          "text-emerald-500": currentVote === "DOWN",
        })}
        variant="ghost"
        aria-label="downvote"
      >
        <ArrowBigDown
          className={cn("text-muted-foreground h-5 w-5", {
            "fill-red-500 text-red-500": currentVote === "DOWN",
          })}
        />
      </Button>
    </div>
  );
};
