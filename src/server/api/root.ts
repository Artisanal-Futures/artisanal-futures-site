import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { authRouter } from "./routers/auth";
import { forumRouter } from "./routers/forum";
import { forumSubredditRouter } from "./routers/forum-subreddit";
import { guestRouter } from "./routers/guest";
import { migrationRouter } from "./routers/migration";
import { productRouter } from "./routers/product";
import { productsRouter } from "./routers/products";
import { shopsRouter } from "./routers/shops";
import { surveysRouter } from "./routers/surveys";
import { upcyclingRouter } from "./routers/upcycling";
import { userRouter } from "./routers/user";
import { serviceRouter } from "./routers/service";
import { categoryRouter } from "./routers/category";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  shop: shopsRouter,
  survey: surveysRouter,

  auth: authRouter,
  user: userRouter,
  product: productRouter,
  service: serviceRouter,
  migration: migrationRouter,
  category: categoryRouter,
  products: productsRouter,
  forum: forumRouter,
  forumSubreddit: forumSubredditRouter,
  guest: guestRouter,
  upcycling: upcyclingRouter,
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
