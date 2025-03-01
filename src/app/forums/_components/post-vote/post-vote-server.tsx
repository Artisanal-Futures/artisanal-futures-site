import { notFound } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

import type { Post, Vote } from "@prisma/client";

import { env } from "~/env";

import { HeartPostVoteClient } from "./heart-post-vote-client";
import { PostVoteClient } from "./post-vote-client";

interface PostVoteServerProps {
  postId: string;
  initialVotesAmt?: number;
  initialVote?: Vote["type"] | null;
  getData?: () => Promise<(Post & { votes: Vote[] }) | null>;
}

/**
 * We split the PostVotes into a client and a server component to allow for dynamic data
 * fetching inside of this component, allowing for faster page loads via suspense streaming.
 * We also have to option to fetch this info on a page-level and pass it in.
 *
 */

export const PostVoteServer = async ({
  postId,
  initialVotesAmt,
  initialVote,
  getData,
}: PostVoteServerProps) => {
  const session = await getServerAuthSession();

  let _votesAmt = 0;
  let _currentVote: Vote["type"] | null | undefined = undefined;

  if (getData) {
    // fetch data in component
    const post = await getData();
    if (!post) return notFound();

    _votesAmt = post.votes.reduce((acc, vote) => {
      if (vote.type === "UP") return acc + 1;
      if (vote.type === "DOWN") return acc - 1;
      return acc;
    }, 0);

    _currentVote = post.votes.find(
      (vote) => vote.userId === session?.user?.id,
    )?.type;
  } else {
    // passed as props
    _votesAmt = initialVotesAmt!;
    _currentVote = initialVote;
  }

  return (
    <>
      {env.NEXT_PUBLIC_HEART_VOTE_DISABLED ? (
        <PostVoteClient
          postId={postId}
          initialVotesAmt={_votesAmt}
          initialVote={_currentVote}
        />
      ) : (
        <HeartPostVoteClient
          postId={postId}
          initialVotesAmt={_votesAmt}
          initialVote={_currentVote}
        />
      )}
    </>
  );
};
