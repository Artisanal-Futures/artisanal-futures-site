"use client";

import type { CommentVote } from "generated/prisma";
import type { FC } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { toast } from "sonner";

import { env } from "~/env";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { usePrevious } from "~/hooks/use-previous";
import { Button } from "~/components/ui/button";

type Props = {
  commentId: string;
  votesAmt: number;
  currentVote?: PartialVote;
};

type PartialVote = Pick<CommentVote, "type">;

const IS_VOTE_DISABLED = env.NEXT_PUBLIC_VOTE_DISABLED;

export const CommentVotes: FC<Props> = ({
  commentId,
  votesAmt: _votesAmt,
  currentVote: _currentVote,
}) => {
  const [votesAmt, setVotesAmt] = useState<number>(_votesAmt);
  const [currentVote, setCurrentVote] = useState<PartialVote | undefined>(
    _currentVote,
  );
  const prevVote = usePrevious(currentVote);
  const router = useRouter();

  const voteSubredditPostComment =
    api.forumSubreddit.createSubredditPostCommentVote.useMutation({
      onError: (err, { voteType }) => {
        if (voteType === "UP") setVotesAmt((prev) => prev - 1);
        else setVotesAmt((prev) => prev + 1);

        // reset current vote
        setCurrentVote(prevVote);

        if (err instanceof TRPCError && err.code === "UNAUTHORIZED") {
          router.push("/sign-in");
          return;
        }

        toast.error("Your vote was not registered. Please try again.");
      },
      onMutate: ({ voteType }) => {
        if (currentVote?.type === voteType) {
          // User is voting the same way again, so remove their vote
          setCurrentVote(undefined);
          if (voteType === "UP") setVotesAmt((prev) => prev - 1);
          else if (voteType === "DOWN") setVotesAmt((prev) => prev + 1);
        } else {
          // User is voting in the opposite direction, so subtract 2
          setCurrentVote({ type: voteType });
          if (voteType === "UP")
            setVotesAmt((prev) => prev + (currentVote ? 2 : 1));
          else if (voteType === "DOWN")
            setVotesAmt((prev) => prev - (currentVote ? 2 : 1));
        }
      },
    });
  if (IS_VOTE_DISABLED) return null;
  return (
    <div className="flex gap-1">
      {/* upvote */}
      <Button
        onClick={() =>
          voteSubredditPostComment.mutate({ voteType: "UP", commentId })
        }
        size="xs"
        variant="ghost"
        aria-label="upvote"
      >
        <ArrowBigUp
          className={cn("text-muted-foreground h-5 w-5", {
            "fill-emerald-500 text-emerald-500": currentVote?.type === "UP",
          })}
        />
      </Button>

      {/* score */}
      <p className="text-foreground px-1 py-2 text-center text-xs font-medium">
        {votesAmt}
      </p>

      {/* downvote */}
      <Button
        onClick={() =>
          voteSubredditPostComment.mutate({ voteType: "DOWN", commentId })
        }
        size="xs"
        className={cn({
          "text-emerald-500": currentVote?.type === "DOWN",
        })}
        variant="ghost"
        aria-label="downvote"
      >
        <ArrowBigDown
          className={cn("text-muted-foreground h-5 w-5", {
            "fill-red-500 text-red-500": currentVote?.type === "DOWN",
          })}
        />
      </Button>
    </div>
  );
};
