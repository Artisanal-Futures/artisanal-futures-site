"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { toastService } from "@dreamwalker-studios/toasts";
import { TRPCError } from "@trpc/server";

import { api } from "~/trpc/react";
import { LoadButton } from "~/components/common/load-button";

type Props = {
  isSubscribed: boolean;
  subredditId: string;
  subredditName: string;
};

export const SubscribeLeaveToggle = ({
  isSubscribed,
  subredditId,
  subredditName,
}: Props) => {
  const router = useRouter();
  const { data: session } = useSession();

  const subscribeMutation = api.forumSubreddit.subscribeToSubreddit.useMutation(
    {
      onError: (err) => {
        if (err instanceof TRPCError && err.code === "UNAUTHORIZED") {
          void router.push("/sign-in");
        }

        toastService.error({
          message: "Something went wrong. Please try again.",
        });
      },
      onSuccess: () => {
        startTransition(() => {
          // Refresh the current route and fetch new data from the server without
          // losing client-side browser or React state.
          router.refresh();
        });
        toastService.success(`You are now subscribed to r/${subredditName}`);
      },
    },
  );

  const unsubscribeMutation =
    api.forumSubreddit.unsubscribeToSubreddit.useMutation({
      onError: (err) => {
        toastService.error({
          message: err?.message ?? "Something went wrong. Please try again.",
        });
      },
      onSuccess: () => {
        startTransition(() => {
          // Refresh the current route and fetch new data from the server without
          // losing client-side browser or React state.
          router.refresh();
        });
        toastService.success(`You are now unsubscribed from/${subredditName}`);
      },
    });

  // const { mutate: subscribe, isLoading: isSubLoading } = useMutation({
  //   mutationFn: async () => {
  //     const payload: SubscribeToSubredditPayload = {
  //       subredditId,
  //     };

  //     const { data } = await axios.post("/api/subreddit/subscribe", payload);
  //     return data as string;
  //   },
  //   onError: (err) => {
  //     if (err instanceof AxiosError) {
  //       if (err.response?.status === 401) {
  //         return loginToast();
  //       }
  //     }

  //     return toast({
  //       title: "There was a problem.",
  //       description: "Something went wrong. Please try again.",
  //       variant: "destructive",
  //     });
  //   },
  //   onSuccess: () => {
  //     startTransition(() => {
  //       // Refresh the current route and fetch new data from the server without
  //       // losing client-side browser or React state.
  //       router.refresh();
  //     });
  //     toast({
  //       title: "Subscribed!",
  //       description: `You are now subscribed to r/${subredditName}`,
  //     });
  //   },
  // });

  // const { mutate: unsubscribe, isLoading: isUnsubLoading } = useMutation({
  //   mutationFn: async () => {
  //     const payload: SubscribeToSubredditPayload = {
  //       subredditId,
  //     };

  //     const { data } = await axios.post("/api/subreddit/unsubscribe", payload);
  //     return data as string;
  //   },
  //   onError: (err: AxiosError) => {
  //     toast({
  //       title: "Error",
  //       description: err.response?.data as string,
  //       variant: "destructive",
  //     });
  //   },
  //   onSuccess: () => {
  //     startTransition(() => {
  //       // Refresh the current route and fetch new data from the server without
  //       // losing client-side browser or React state.
  //       router.refresh();
  //     });
  //     toast({
  //       title: "Unsubscribed!",
  //       description: `You are now unsubscribed from/${subredditName}`,
  //     });
  //   },
  // });

  if (!session) {
    return (
      <LoadButton
        isLoading={false}
        className="mb-4 mt-1 w-full"
        onClick={() => router.push("/auth/sign-in?callbackUrl=/forums")}
      >
        Login to join community
      </LoadButton>
    );
  }

  return isSubscribed ? (
    <LoadButton
      className="mb-4 mt-1 w-full"
      isLoading={unsubscribeMutation.isPending}
      onClick={() => unsubscribeMutation.mutate({ subredditId })}
    >
      Leave community
    </LoadButton>
  ) : (
    <LoadButton
      className="mb-4 mt-1 w-full"
      isLoading={subscribeMutation.isPending}
      onClick={() => subscribeMutation.mutate({ subredditId })}
    >
      Join to post
    </LoadButton>
  );
};
