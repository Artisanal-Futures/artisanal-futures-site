"use client";

import type { VoteType } from "generated/prisma";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { Heart } from "lucide-react";
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

export const HeartPostVoteClient = ({
  postId,
  initialVotesAmt,
  initialVote,
}: PostVoteClientProps) => {
  const [votesAmt, setVotesAmt] = useState<number>(initialVotesAmt);
  const [currentVote, setCurrentVote] = useState<VoteType | undefined | null>(
    initialVote === "UP" ? initialVote : undefined,
  );
  const prevVote = usePrevious(currentVote);
  const router = useRouter();

  // ensure sync with server
  useEffect(() => {
    setCurrentVote(initialVote === "UP" ? initialVote : undefined);
  }, [initialVote]);

  const subredditPostVote =
    api.forumSubreddit.createSubredditPostVote.useMutation({
      onError: (err) => {
        setVotesAmt((prev) => prev - 1);
        setCurrentVote(prevVote);

        if (err instanceof TRPCError && err.code === "UNAUTHORIZED") {
          router.push("/sign-in");
          return;
        }

        return toast.error("Your heart was not registered. Please try again.");
      },
      onMutate: () => {
        if (currentVote === "UP") {
          // User is unhearting
          setCurrentVote(undefined);
          setVotesAmt((prev) => prev - 1);
        } else {
          // User is hearting
          setCurrentVote("UP");
          setVotesAmt((prev) => prev + 1);
        }
      },
    });

  if (IS_VOTE_DISABLED) return null;
  return (
    <div className="flex flex-col gap-4 pr-6 pb-4 sm:w-20 sm:gap-0 sm:pb-0">
      <Button
        onClick={() => subredditPostVote.mutate({ voteType: "UP", postId })}
        size="sm"
        variant="ghost"
        className="h-auto p-1.5"
        aria-label={currentVote ? "unheart" : "heart"}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-colors",
            currentVote === "UP"
              ? "fill-destructive text-destructive"
              : "text-muted-foreground hover:fill-destructive/20 hover:text-destructive",
          )}
        />
      </Button>

      <p className="text-foreground py-2 text-center text-sm font-medium">
        {votesAmt}
      </p>
    </div>
  );
};
