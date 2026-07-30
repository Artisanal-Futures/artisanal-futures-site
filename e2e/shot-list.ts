export type ShotRole = "admin" | "artisan" | "public";

export type Shot = {
  /** Namespaced path without extension, e.g. "admins/dashboard". Becomes
   * `<SHOTS_OUT_DIR>/<id>.png`. */
  id: string;
  /** Route to visit, relative to baseURL. */
  path: string;
  role: ShotRole;
  /** Optional selector to wait for before taking the screenshot. */
  waitFor?: string;
  fullPage?: boolean;
  actions?: Array<{ click?: string; fill?: [string, string] }>;
};

/**
 * Every path below was verified against `src/app/` at the time of writing:
 * - admin/artisan routes are gated by `src/app/admin/layout.tsx`, which
 *   allows both the ADMIN and ARTISAN roles through (individual pages may
 *   further restrict content, but won't redirect either role away).
 * - `/account/settings` comes from `@daveyplate/better-auth-ui`'s
 *   `accountViewPaths.SETTINGS` (default "settings"), rendered by
 *   `src/app/(site)/account/[path]/page.tsx`.
 * - `/forums/r/demo-makers` assumes the seed script creates a "demo-makers"
 *   subreddit; the route itself is `src/app/forums/r/[slug]/page.tsx`.
 */
export const shots: Shot[] = [
  // ---- admin ----
  { id: "admins/dashboard", path: "/admin/dashboard", role: "admin", waitFor: "main" },
  { id: "admins/users", path: "/admin/users", role: "admin", waitFor: "main" },
  { id: "admins/invites", path: "/admin/invites", role: "admin", waitFor: "main" },
  { id: "admins/categories", path: "/admin/categories", role: "admin", waitFor: "main" },
  { id: "admins/surveys", path: "/admin/surveys", role: "admin", waitFor: "main" },
  { id: "admins/guest-surveys", path: "/admin/guest-surveys", role: "admin", waitFor: "main" },
  { id: "admins/fork-import", path: "/admin/fork-import", role: "admin", waitFor: "main" },
  { id: "admins/website-provisions", path: "/admin/website-provisions", role: "admin", waitFor: "main" },
  { id: "admins/upcycling", path: "/admin/upcycling", role: "admin", waitFor: "main" },
  { id: "admins/shops", path: "/admin/shops", role: "admin", waitFor: "main" },
  { id: "admins/events", path: "/admin/events", role: "admin", waitFor: "main" },

  // ---- artisan ----
  { id: "artisans/dashboard", path: "/admin/dashboard", role: "artisan", waitFor: "main" },
  { id: "artisans/shops", path: "/admin/shops", role: "artisan", waitFor: "main" },
  { id: "artisans/products", path: "/admin/products", role: "artisan", waitFor: "main" },
  { id: "artisans/services", path: "/admin/services", role: "artisan", waitFor: "main" },
  { id: "artisans/events", path: "/admin/events", role: "artisan", waitFor: "main" },
  { id: "artisans/account-settings", path: "/account/settings", role: "artisan", waitFor: "main" },
  { id: "artisans/forums", path: "/forums", role: "artisan", waitFor: "main" },
  { id: "artisans/forums-demo-makers", path: "/forums/r/demo-makers", role: "artisan", waitFor: "main" },

  // ---- public ----
  { id: "public/homepage", path: "/", role: "public", waitFor: "main" },
  { id: "public/shops", path: "/shops", role: "public", waitFor: "main" },
  { id: "public/collections-products", path: "/collections/products", role: "public", waitFor: "main" },
  { id: "public/collections-services", path: "/collections/services", role: "public", waitFor: "main" },
];
