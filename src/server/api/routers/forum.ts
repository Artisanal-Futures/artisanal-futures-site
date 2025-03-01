import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

export const forumRouter = createTRPCRouter({
  getPostComments: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: postId }) => {
      const comments = await ctx.db.forumComment.findMany({
        where: {
          postId: postId,
          replyToId: null, // only fetch top-level comments
        },
        include: {
          author: true,
          votes: true,
          post: {
            select: {
              id: true,
              authorId: true,
            },
          },
          replies: {
            // first level replies
            include: {
              author: true,
              votes: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return comments;
    }),
  postComment: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        text: z.string(),
        replyToId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.forumComment.create({
        data: {
          text: input.text,
          postId: input.postId,
          authorId: ctx.session.user.id,
          replyToId: input.replyToId,
        },
      });

      return {
        data: comment,
        message: "Comment posted successfully",
      };
    }),

  editComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.forumComment.findUnique({
        where: { id: input.commentId },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Check if user is either admin or original author
      if (
        ctx.session.user.role !== "ADMIN" &&
        comment.authorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to edit this comment",
        });
      }

      const updatedComment = await ctx.db.forumComment.update({
        where: { id: input.commentId },
        data: { text: input.text },
      });

      return {
        data: updatedComment,
        message: "Comment updated successfully",
      };
    }),

  deleteComment: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: commentId }) => {
      const comment = await ctx.db.forumComment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Check if user is either admin or original author
      if (
        ctx.session.user.role !== "ADMIN" &&
        comment.authorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to edit this comment",
        });
      }

      const updatedComment = await ctx.db.forumComment.update({
        where: { id: commentId },
        data: {
          text: "",
          deletedAt: new Date(),
          votes: { deleteMany: {} },
          createdAt: new Date(),
        },
      });

      return {
        data: updatedComment,
        message: "Comment deleted successfully",
      };
    }),

  postCommentVote: protectedProcedure
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to post vote",
        });
      }
    }),

  createSubredditPost: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string().optional(),
        subredditId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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

      const post = await ctx.db.post.create({
        data: {
          title: input.title,
          content: input.content,
          authorId: ctx.session.user.id,
          subredditId: input.subredditId,
        },
      });

      return {
        data: post,
        message: "Your post has been published.",
      };
    }),

  updateSubredditPost: protectedProcedure
    .input(
      z.object({ postId: z.string(), title: z.string(), content: z.string() }),
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
        data: { title: input.title, content: input.content },
      });

      return {
        data: updatedPost,
        message: "Post updated successfully",
      };
    }),

  deleteSubredditPost: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: postId, ctx }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: postId },
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

      const deletedPost = await ctx.db.post.delete({
        where: { id: postId },
      });

      return {
        data: deletedPost,
        message: "Post deleted successfully",
      };
    }),
});
