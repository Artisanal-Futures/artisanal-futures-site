import { revalidateTag } from "next/cache";

import { siteSettingsSchema } from "~/lib/validators/seo";
import { adminOnlyProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
  readSiteSettings,
  SITE_SETTINGS_ID,
  SITE_SETTINGS_TAG,
} from "~/server/seo/settings";

export const siteSettingsRouter = createTRPCRouter({
  /**
   * Current settings for the /admin/seo form (uncached, defaults filled in).
   * Public pages read them through `getSiteSettings()` instead.
   */
  get: adminOnlyProcedure.query(() => readSiteSettings()),

  update: adminOnlyProcedure
    .input(siteSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const data = await ctx.db.siteSettings.upsert({
        where: { id: SITE_SETTINGS_ID },
        create: { id: SITE_SETTINGS_ID, ...input },
        update: input,
      });

      // Root metadata, schema.org data and robots.txt all read these.
      revalidateTag(SITE_SETTINGS_TAG);

      return { data, message: "Site settings saved" };
    }),
});
