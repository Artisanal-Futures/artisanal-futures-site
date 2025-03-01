"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { toastService } from "@dreamwalker-studios/toasts";
import { TRPCError } from "@trpc/server";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { LoadButton } from "~/components/common/load-button";

const Page = () => {
  const router = useRouter();
  const [input, setInput] = useState<string>("");
  const { data: session } = useSession();

  if (!session) {
    void router.push("/auth/sign-in?callbackUrl=/forums/r/create");
  }
  // const { loginToast } = useCustomToasts()

  // const { mutate: createCommunity, isLoading } = useMutation({
  //   mutationFn: async () => {
  //     const payload: CreateSubredditPayload = {
  //       name: input,
  //     };

  //     const { data } = await axios.post("/api/subreddit", payload);
  //     return data as string;
  //   },
  //   onError: (err) => {
  //     if (err instanceof AxiosError) {
  //       if (err.response?.status === 409) {
  //         return toast({
  //           title: "Subreddit already exists.",
  //           description: "Please choose a different name.",
  //           variant: "destructive",
  //         });
  //       }

  //       if (err.response?.status === 422) {
  //         return toast({
  //           title: "Invalid subreddit name.",
  //           description: "Please choose a name between 3 and 21 letters.",
  //           variant: "destructive",
  //         });
  //       }

  //       if (err.response?.status === 401) {
  //         return loginToast();
  //       }
  //     }

  //     toast({
  //       title: "There was an error.",
  //       description: "Could not create subreddit.",
  //       variant: "destructive",
  //     });
  //   },
  //   onSuccess: (data) => {
  //     router.push(`/r/${data}`);
  //   },
  // });

  const createSubreddit = api.forumSubreddit.createSubreddit.useMutation({
    onError: (err) => {
      if (err instanceof TRPCError) {
        if (err?.code === "CONFLICT")
          toastService.error({
            message:
              "Subreddit already exists. Please choose a different name.",
          });

        if (err?.code === "BAD_REQUEST") {
          toastService.error({
            message:
              "Invalid subreddit name. Please choose a name between 3 and 21 letters.",
          });
        }

        if (err?.code === "UNAUTHORIZED") {
          void router.push("/auth/sign-in?callbackUrl=/forums/r/create");
        }
      }

      toastService.error({
        message: err.message || "Could not create subreddit.",
      });
    },
    onSuccess: ({ data }) => {
      void router.push(`/forums/r/${data.name}`);
      router.refresh();
    },
  });

  return (
    <div className="container mx-auto flex h-full max-w-3xl items-center">
      <div className="relative h-fit w-full space-y-6 rounded-lg bg-background p-4">
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
            variant="subtle"
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
};

export default Page;
