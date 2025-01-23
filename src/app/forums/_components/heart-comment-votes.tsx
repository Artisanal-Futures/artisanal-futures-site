"use client";

import type { FC } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import type { CommentVote } from "@prisma/client";
import { toastService } from "@dreamwalker-studios/toasts";
import { TRPCError } from "@trpc/server";

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

export const HeartCommentVotes: FC<Props> = ({
  commentId,
  votesAmt: _votesAmt,
  currentVote: _currentVote,
}) => {
  const [votesAmt, setVotesAmt] = useState<number>(_votesAmt);
  const [currentVote, setCurrentVote] = useState<PartialVote | undefined>(
    _currentVote?.type === "UP" ? _currentVote : undefined,
  );
  const prevVote = usePrevious(currentVote);
  const router = useRouter();

  const voteSubredditPostComment =
    api.forumSubreddit.createSubredditPostCommentVote.useMutation({
      onError: (err) => {
        setVotesAmt((prev) => prev - 1);
        setCurrentVote(prevVote);

        if (err instanceof TRPCError && err.code === "UNAUTHORIZED") {
          router.push("/sign-in");
          return;
        }

        toastService.error({
          message: "Your heart was not registered. Please try again.",
        });
      },
      onMutate: () => {
        if (currentVote?.type === "UP") {
          // User is unheating
          setCurrentVote(undefined);
          setVotesAmt((prev) => prev - 1);
        } else {
          // User is hearting
          setCurrentVote({ type: "UP" });
          setVotesAmt((prev) => prev + 1);
        }
      },
    });

  if (IS_VOTE_DISABLED) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        onClick={() =>
          voteSubredditPostComment.mutate({ voteType: "UP", commentId })
        }
        size="xs"
        variant="ghost"
        className="h-auto p-1"
        aria-label={currentVote ? "unheart" : "heart"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            currentVote?.type === "UP"
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground hover:fill-red-200 hover:text-red-500",
          )}
        />
      </Button>

      <span className="text-xs font-medium text-foreground">{votesAmt}</span>
    </div>
  );
};
