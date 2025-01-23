import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";

import type { Vote } from "@prisma/client";
import { TRPCError } from "@trpc/server";

// const CACHE_AFTER_UPVOTES = 1;

export type CachedPost = {
  id: string;
  title: string;
  authorUsername: string;
  content: string;
  currentVote: Vote["type"] | null;
  createdAt: Date;
};

export const forumSubredditRouter = createTRPCRouter({
  getAllSubreddits: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.subreddit.findMany();
  }),
  findOrCreatePersonalSubreddit: protectedProcedure.query(async ({ ctx }) => {
    // Remove spaces from name
    const cleanName = (ctx.session.user.name ?? "").replace(/\s+/g, "");

    const subreddit = await ctx.db.subreddit.findFirst({
      where: {
        creatorId: ctx.session.user.id,
        name: cleanName,
      },
    });

    if (!subreddit) {
      // Check if any subreddit exists with user's name
      const existingSubreddit = await ctx.db.subreddit.findFirst({
        where: {
          name: cleanName,
        },
      });

      let subredditName = cleanName;

      if (existingSubreddit) {
        // Generate random 4 digit suffix
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        subredditName = `${subredditName}${randomSuffix}`;
      }

      const newSubreddit = await ctx.db.subreddit.create({
        data: {
          name: subredditName,
          creatorId: ctx.session.user.id,
        },
      });

      // creator also has to be subscribed
      await ctx.db.subscription.create({
        data: {
          userId: ctx.session.user.id,
          subredditId: newSubreddit.id,
        },
      });

      return newSubreddit;
    }

    return subreddit;
  }),

  createSubreddit: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // check if subreddit already exists
        const subredditExists = await ctx.db.subreddit.findFirst({
          where: {
            name: input.name,
          },
        });

        if (subredditExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Subreddit already exists",
          });
        }

        // create subreddit and associate it with the user
        const subreddit = await ctx.db.subreddit.create({
          data: {
            name: input.name,
            creatorId: ctx.session.user.id,
          },
        });

        // creator also has to be subscribed
        await ctx.db.subscription.create({
          data: {
            userId: ctx.session.user.id,
            subredditId: subreddit.id,
          },
        });

        return {
          data: subreddit,
          message: "Your post has been published.",
        };
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create subreddit",
        });
      }
    }),

  unsubscribeToSubreddit: protectedProcedure
    .input(z.object({ subredditId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // check if user has already subscribed or not
        const subscriptionExists = await ctx.db.subscription.findFirst({
          where: {
            subredditId: input.subredditId,
            userId: ctx.session.user.id,
          },
        });

        if (!subscriptionExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You've not been subscribed to this subreddit, yet.",
          });
        }

        // create subreddit and associate it with the user
        await ctx.db.subscription.delete({
          where: {
            userId_subredditId: {
              subredditId: input.subredditId,
              userId: ctx.session.user.id,
            },
          },
        });

        return {
          data: null,
          message: "You've been unsubscribed from this subreddit.",
        };
      } catch (error) {
        error;
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Could not unsubscribe from subreddit at this time. Please try later",
        });
      }
    }),

  subscribeToSubreddit: protectedProcedure
    .input(z.object({ subredditId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // check if user has already subscribed to subreddit
        const subscriptionExists = await ctx.db.subscription.findFirst({
          where: {
            subredditId: input.subredditId,
            userId: ctx.session.user.id,
          },
        });

        if (subscriptionExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You've already subscribed to this subreddit",
          });
        }

        // create subreddit and associate it with the user
        await ctx.db.subscription.create({
          data: {
            subredditId: input.subredditId,
            userId: ctx.session.user.id,
          },
        });

        return {
          data: null,
          message: "You've been subscribed to this subreddit.",
        };
      } catch (error) {
        error;
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Could not subscribe to subreddit at this time. Please try later",
        });
      }
    }),

  createSubredditPostVote: protectedProcedure
    .input(z.object({ postId: z.string(), voteType: z.enum(["UP", "DOWN"]) }))
    .mutation(async ({ input, ctx }) => {
      try {
        // check if user has already voted on this post
        const existingVote = await ctx.db.vote.findFirst({
          where: {
            userId: ctx.session.user.id,
            postId: input.postId,
          },
        });

        const post = await ctx.db.post.findUnique({
          where: {
            id: input.postId,
          },
          include: {
            author: true,
            votes: true,
          },
        });

        if (!post) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        if (existingVote) {
          // if vote type is the same as existing vote, delete the vote
          if (existingVote.type === input.voteType) {
            await ctx.db.vote.delete({
              where: {
                userId_postId: {
                  postId: input.postId,
                  userId: ctx.session.user.id,
                },
              },
            });

            // // Recount the votes
            // const votesAmt = post.votes.reduce((acc, vote) => {
            //   if (vote.type === 'UP') return acc + 1
            //   if (vote.type === 'DOWN') return acc - 1
            //   return acc
            // }, 0)

            // if (votesAmt >= CACHE_AFTER_UPVOTES) {
            //   const cachePayload: CachedPost = {
            //     authorUsername: post.author.username ?? '',
            //     content: JSON.stringify(post.content),
            //     id: post.id,
            //     title: post.title,
            //     currentVote: null,
            //     createdAt: post.createdAt,
            //   }

            //   await redis.hset(`post:${postId}`, cachePayload) // Store the post data as a hash
            // }

            return {
              data: null,
              message: "",
            };
          }

          // if vote type is different, update the vote
          await ctx.db.vote.update({
            where: {
              userId_postId: {
                postId: input.postId,
                userId: ctx.session.user.id,
              },
            },
            data: {
              type: input.voteType,
            },
          });

          //   // Recount the votes
          //   const votesAmt = post.votes.reduce((acc, vote) => {
          //     if (vote.type === "UP") return acc + 1;
          //     if (vote.type === "DOWN") return acc - 1;
          //     return acc;
          //   }, 0);

          //   if (votesAmt >= CACHE_AFTER_UPVOTES) {
          //     const cachePayload: CachedPost = {
          //       authorUsername: post.author.username ?? "",
          //       content: JSON.stringify(post.content),
          //       id: post.id,
          //       title: post.title,
          //       currentVote: voteType,
          //       createdAt: post.createdAt,
          //     };

          //     // await redis.hset(`post:${postId}`, cachePayload); // Store the post data as a hash
          //   }

          return {
            data: null,
            message: "",
          };
        }

        // if no existing vote, create a new vote
        await ctx.db.vote.create({
          data: {
            type: input.voteType,
            userId: ctx.session.user.id,
            postId: input.postId,
          },
        });

        // // Recount the votes
        // const votesAmt = post.votes.reduce((acc, vote) => {
        //   if (vote.type === "UP") return acc + 1;
        //   if (vote.type === "DOWN") return acc - 1;
        //   return acc;
        // }, 0);

        // if (votesAmt >= CACHE_AFTER_UPVOTES) {
        //   const cachePayload: CachedPost = {
        //     authorUsername: post.author.username ?? "",
        //     content: JSON.stringify(post.content),
        //     id: post.id,
        //     title: post.title,
        //     currentVote: input.voteType,
        //     createdAt: post.createdAt,
        //   };

        //   // await redis.hset(`post:${postId}`, cachePayload); // Store the post data as a hash
        // }

        return {
          data: null,
          message: "",
        };
      } catch (error) {
        error;
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not post to subreddit at this time. Please try later",
        });
      }
    }),

  createSubredditPost: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.any(),
        subredditId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // verify user is subscribed to passed subreddit id
        const subscription = await ctx.db.subscription.findFirst({
          where: {
            subredditId: input.subredditId,
            userId: ctx.session.user.id,
          },
        });

        if (!subscription) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Subscribe to post",
          });
        }

        await ctx.db.post.create({
          data: {
            title: input.title,
            content: JSON.stringify(input.content),
            authorId: ctx.session.user.id,
            subredditId: input.subredditId,
          },
        });

        return {
          data: null,
          message: "Your post has been published.",
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not post to subreddit at this time. Please try later",
        });
      }
    }),

  updateSubredditPost: protectedProcedure
    .input(
      z.object({ postId: z.string(), title: z.string(), content: z.any() }),
    )
    .mutation(async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if user is either admin or original author
      if (
        ctx.session.user.role !== "ADMIN" &&
        post.authorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to edit this post",
        });
      }

      const updatedPost = await ctx.db.post.update({
        where: { id: input.postId },
        data: { title: input.title, content: JSON.stringify(input.content) },
      });

      return {
        data: updatedPost,
        message: "Post updated successfully",
      };
    }),

  createSubredditPostComment: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        text: z.string(),
        replyToId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // if no existing vote, create a new vote
        await ctx.db.forumComment.create({
          data: {
            text: input.text,
            postId: input.postId,
            authorId: ctx.session.user.id,
            replyToId: input.replyToId,
          },
        });

        return {
          data: null,
          message: "Comment created successfully",
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not post to subreddit at this time. Please try later",
        });
      }
    }),

  createSubredditPostCommentVote: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        voteType: z.enum(["UP", "DOWN"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // check if user has already voted on this post
        const existingVote = await ctx.db.commentVote.findFirst({
          where: {
            userId: ctx.session.user.id,
            commentId: input.commentId,
          },
        });

        if (existingVote) {
          // if vote type is the same as existing vote, delete the vote
          if (existingVote.type === input.voteType) {
            await ctx.db.commentVote.delete({
              where: {
                userId_commentId: {
                  commentId: input.commentId,
                  userId: ctx.session.user.id,
                },
              },
            });
            return {
              data: null,
              message: "Vote removed successfully",
            };
          } else {
            // if vote type is different, update the vote
            await ctx.db.commentVote.update({
              where: {
                userId_commentId: {
                  commentId: input.commentId,
                  userId: ctx.session.user.id,
                },
              },
              data: {
                type: input.voteType,
              },
            });
            return {
              data: null,
              message: "Vote updated successfully",
            };
          }
        }

        // if no existing vote, create a new vote
        await ctx.db.commentVote.create({
          data: {
            type: input.voteType,
            userId: ctx.session.user.id,
            commentId: input.commentId,
          },
        });

        return {
          data: null,
          message: "Vote created successfully",
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not post to subreddit at this time. Please try later",
        });
      }
    }),

  searchSubreddit: publicProcedure
    .input(z.object({ query: z.string().nullish() }))
    .query(async ({ input, ctx }) => {
      if (!input.query) return [];

      const results = await ctx.db.subreddit.findMany({
        where: {
          name: {
            startsWith: input.query,
          },
        },
        include: {
          _count: true,
        },
        take: 5,
      });

      return results;
    }),

  getPosts: publicProcedure
    .input(
      z.object({
        limit: z.string(),
        page: z.string(),
        subredditName: z.string().nullish().optional(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ input, ctx }) => {
      let followedCommunitiesIds: string[] = [];

      if (ctx?.session) {
        const followedCommunities = await ctx.db.subscription.findMany({
          where: {
            userId: ctx?.session?.user.id,
          },
          include: {
            subreddit: true,
          },
        });

        followedCommunitiesIds = followedCommunities.map(
          (sub) => sub.subreddit.id,
        );
      }

      try {
        const { limit, page, subredditName } = input;

        let whereClause = {};

        if (subredditName) {
          whereClause = {
            subreddit: {
              name: subredditName,
            },
          };
        } else if (ctx?.session) {
          whereClause = {
            subreddit: {
              id: {
                in: followedCommunitiesIds,
              },
            },
          };
        }

        const posts = await ctx.db.post.findMany({
          take: parseInt(limit),
          skip: (parseInt(page) - 1) * parseInt(limit), // skip should start from 0 for page 1
          cursor: input.cursor ? { id: input.cursor } : undefined,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            subreddit: true,
            votes: true,
            author: true,
            comments: true,
          },
          where: whereClause,
        });

        let nextCursor: typeof input.cursor | undefined = undefined;
        if (posts.length > parseInt(limit)) {
          const nextItem = posts.pop(); // return the last item from the array
          nextCursor = nextItem?.id;
        }

        return {
          posts,
          nextCursor,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not fetch posts",
        });
      }
    }),

  getSubreddits: publicProcedure
    .input(
      z.object({
        limit: z.string(),
        page: z.string(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const { limit, page } = input;

        const subreddits = await ctx.db.subreddit.findMany({
          take: parseInt(limit),
          skip: (parseInt(page) - 1) * parseInt(limit),
          cursor: input.cursor ? { id: input.cursor } : undefined,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            creator: true,
            _count: {
              select: {
                posts: true,
                subscribers: true,
              },
            },
          },
        });

        let nextCursor: typeof input.cursor | undefined = undefined;
        if (subreddits.length > parseInt(limit)) {
          const nextItem = subreddits.pop();
          nextCursor = nextItem?.id;
        }

        return {
          subreddits,
          nextCursor,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not fetch subreddits",
        });
      }
    }),

  getNavigationSubreddits: publicProcedure.query(async ({ ctx }) => {
    try {
      const subreddits = await ctx.db.subreddit.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      });

      return subreddits;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not fetch subreddits",
      });
    }
  }),

  updateSubreddit: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        isPublic: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, name, description, isPublic } = input;

      const subreddit = await ctx.db.subreddit.findUnique({
        where: { id },
        include: { creator: true },
      });

      if (!subreddit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subreddit not found",
        });
      }

      if (
        subreddit.creatorId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this subreddit",
        });
      }

      // Check if name is taken by another subreddit
      const existingSubreddit = await ctx.db.subreddit.findFirst({
        where: {
          name,
          NOT: {
            id,
          },
        },
      });

      if (existingSubreddit) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A subreddit with this name already exists",
        });
      }

      const updatedSubreddit = await ctx.db.subreddit.update({
        where: { id },
        data: { name, description, isPublic },
      });

      return {
        data: updatedSubreddit,
        message: "Subreddit updated successfully",
      };
    }),

  deleteSubreddit: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const subreddit = await ctx.db.subreddit.findUnique({
        where: { id },
        include: { creator: true },
      });

      if (!subreddit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subreddit not found",
        });
      }

      if (
        subreddit.creatorId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this subreddit",
        });
      }

      const deletedSubreddit = await ctx.db.subreddit.delete({
        where: { id },
      });

      return {
        data: deletedSubreddit,
        message: "Subreddit deleted successfully",
      };
    }),
});
