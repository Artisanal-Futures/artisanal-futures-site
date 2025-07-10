import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  getNavigationTree: publicProcedure.query(({ ctx }) => {
    return ctx.db.category.findMany({
      where: { parentId: null }, 
      include: { children: true }, 
    });
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.category.findFirst({
        where: { name: { equals: input.slug, mode: "insensitive" } },
        include: { children: true }, 
      });
    }),
});