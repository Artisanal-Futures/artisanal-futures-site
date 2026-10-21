import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { analyticsRouter } from "./routers/analytics";
import { authRouter } from "./routers/auth";
import { categoryRouter } from "./routers/category";
import { contactRouter } from "./routers/contact";
import { csvImportRouter } from "./routers/csv-import";
import { eventRouter } from "./routers/event";
import { forumRouter } from "./routers/forum";
import { forumSubredditRouter } from "./routers/forum-subreddit";
import { inviteRouter } from "./routers/invite";
import { migrationRouter } from "./routers/migration";
import { onboardingRouter } from "./routers/onboarding";
import { pageSeoRouter } from "./routers/page-seo";
import { productRouter } from "./routers/product";
import { productSyncRouter } from "./routers/product-sync";
import { serviceRouter } from "./routers/service";
import { shopsRouter } from "./routers/shops";
import { siteSettingsRouter } from "./routers/site-settings";
import { surveysRouter } from "./routers/surveys";
import { upcyclingRouter } from "./routers/upcycling";
import { userRouter } from "./routers/user";
import { websiteProvisionRouter } from "./routers/website-provision";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  shop: shopsRouter,
  survey: surveysRouter,
  analytics: analyticsRouter,

  auth: authRouter,
  user: userRouter,
  product: productRouter,
  productSync: productSyncRouter,
  service: serviceRouter,
  migration: migrationRouter,
  category: categoryRouter,
  forum: forumRouter,
  forumSubreddit: forumSubredditRouter,
  invite: inviteRouter,

  upcycling: upcyclingRouter,
  websiteProvision: websiteProvisionRouter,
  onboarding: onboardingRouter,
  event: eventRouter,
  contact: contactRouter,
  csvImport: csvImportRouter,
  siteSettings: siteSettingsRouter,
  pageSeo: pageSeoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
