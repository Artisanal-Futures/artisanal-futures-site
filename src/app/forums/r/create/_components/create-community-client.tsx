"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { toast } from "sonner";

import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { LoadButton } from "~/components/common/load-button";

export default function CreateCommunityClient() {
  const router = useRouter();
  const [input, setInput] = useState<string>("");
  const { data: session } = authClient.useSession();

  if (!session) {
    void router.push("/auth/sign-in?callbackUrl=/forums/r/create");
  }

  const createSubreddit = api.forumSubreddit.createSubreddit.useMutation({
    onError: (err) => {
      if (err instanceof TRPCError) {
        if (err?.code === "CONFLICT")
          toast.error(
            "Subreddit already exists. Please choose a different name.",
          );

        if (err?.code === "BAD_REQUEST") {
          toast.error(
            "Invalid subreddit name. Please choose a name between 3 and 21 letters.",
          );
        }

        if (err?.code === "UNAUTHORIZED") {
          void router.push("/auth/sign-in?callbackUrl=/forums/r/create");
        }
      }

      toast.error(err.message || "Could not create subreddit.");
    },
    onSuccess: ({ data }) => {
      void router.push(`/forums/r/${data.name}`);
      router.refresh();
    },
  });

  return (
    <div className="container mx-auto flex h-full max-w-3xl items-center">
      <div className="bg-background relative h-fit w-full space-y-6 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Create a Community</h1>
        </div>

        <hr className="h-px bg-red-500" />

        <div>
          <p className="text-lg font-medium">Name</p>
          <p className="pb-2 text-xs">
            Community names including capitalization cannot be changed.
          </p>
          <div className="relative">
            <p className="absolute inset-y-0 left-0 grid w-8 place-items-center text-sm text-zinc-400">
              r/
            </p>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-6"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            disabled={createSubreddit.isPending}
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <LoadButton
            isLoading={createSubreddit.isPending}
            disabled={input.length === 0}
            onClick={() => createSubreddit.mutate({ name: input })}
          >
            Create Community
          </LoadButton>
        </div>
      </div>
    </div>
  );
}
