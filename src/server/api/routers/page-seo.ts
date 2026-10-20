import { revalidateTag } from "next/cache";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { STATIC_PAGE_PATHS } from "~/lib/seo/static-pages";
import { pageSeoSchema } from "~/lib/validators/seo";
import { adminOnlyProcedure, createTRPCRouter } from "~/server/api/trpc";
import { PAGE_SEO_TAG } from "~/server/seo/settings";

/** Overrides only apply to pages that call `buildPageMetadata` with their path. */
function assertStaticPage(path: string) {
  if (!STATIC_PAGE_PATHS.has(path)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${path} is not an editable page`,
    });
  }
}

export const pageSeoRouter = createTRPCRouter({
  list: adminOnlyProcedure.query(({ ctx }) =>
    ctx.db.pageSeo.findMany({ orderBy: { path: "asc" } }),
  ),

  upsert: adminOnlyProcedure
    .input(pageSeoSchema)
    .mutation(async ({ ctx, input }) => {
      assertStaticPage(input.path);
      const { path, ...fields } = input;

      const data = await ctx.db.pageSeo.upsert({
        where: { path },
        create: { path, ...fields },
        update: fields,
      });

      revalidateTag(PAGE_SEO_TAG);

      return { data, message: "Page override saved" };
    }),

  /** Removes the override, so the page goes back to its built-in metadata. */
  delete: adminOnlyProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.pageSeo.deleteMany({ where: { path: input.path } });

      revalidateTag(PAGE_SEO_TAG);

      return { data: null, message: "Page override removed" };
    }),
});
