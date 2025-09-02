"use client";

import type { FC } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { toastService } from "@dreamwalker-studios/toasts";
import { TRPCError } from "@trpc/server";

import { api } from "~/trpc/react";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { LoadButton } from "~/components/common/load-button";

type Props = {
  postId: string;
  replyToId?: string;
};

export const CreateComment: FC<Props> = ({ postId, replyToId }) => {
  const [input, setInput] = useState<string>("");
  const router = useRouter();

  const createSubredditPostComment =
    api.forumSubreddit.createSubredditPostComment.useMutation({
      onError: (err) => {
        if (err instanceof TRPCError && err.code === "UNAUTHORIZED") {
          router.push("/sign-in");
          return;
        }

        toastService.error({
          message: "Comment wasn't created successfully. Please try again.",
        });
      },
      onSuccess: () => {
        router.refresh();
        setInput("");
      },
    });

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="comment">Your comment</Label>
      <div className="mt-2">
        <Textarea
          id="comment"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          placeholder="What are your thoughts?"
        />

        <div className="mt-2 flex justify-end">
          <LoadButton
            isLoading={createSubredditPostComment.isPending}
            disabled={input.length === 0}
            onClick={() =>
              createSubredditPostComment.mutate({
                postId,
                text: input,
                replyToId,
              })
            }
          >
            Post
          </LoadButton>
        </div>
      </div>
    </div>
  );
};
