/**
 * The static public pages: listed in the sitemap, and the pages admins can
 * override titles/descriptions for at /admin/seo. Each page's
 * `generateMetadata` calls `buildPageMetadata({ path })` with the same path.
 * Client-safe: plain data.
 */
export type StaticPage = {
  path: string;
  label: string;
  /** Sitemap priority, 0–1. */
  priority: number;
};

export const STATIC_PAGES: StaticPage[] = [
  { path: "/", label: "Homepage", priority: 1 },
  { path: "/shops", label: "Shops directory", priority: 0.9 },
  { path: "/collections/products", label: "Product categories", priority: 0.8 },
  { path: "/collections/services", label: "Service categories", priority: 0.8 },
  { path: "/about-us", label: "About us", priority: 0.7 },
  { path: "/contact", label: "Contact", priority: 0.5 },
  { path: "/donate", label: "Donate", priority: 0.6 },
  { path: "/join", label: "Join", priority: 0.7 },
  { path: "/join/criteria", label: "Joining criteria", priority: 0.6 },
  {
    path: "/legal/collective-agreement",
    label: "Collective agreement",
    priority: 0.3,
  },
  { path: "/legal/cookies", label: "Cookie policy", priority: 0.3 },
  { path: "/legal/help-center", label: "Help center", priority: 0.4 },
  { path: "/legal/privacy", label: "Privacy policy", priority: 0.3 },
  { path: "/legal/takedown", label: "Takedown policy", priority: 0.3 },
  { path: "/legal/terms-of-use", label: "Terms of use", priority: 0.3 },
  { path: "/tools", label: "Tools", priority: 0.6 },
  { path: "/tools/artisan-map", label: "Artisan map", priority: 0.6 },
  { path: "/tools/sankofa-sizer", label: "Sankofa Sizer", priority: 0.5 },
  {
    path: "/tools/shop-rate-calculator",
    label: "Shop rate calculator",
    priority: 0.5,
  },
  { path: "/forums", label: "Forums home", priority: 0.5 },
  { path: "/forums/communities", label: "Forum communities", priority: 0.5 },
  {
    path: "/forums/content-policy",
    label: "Forums content policy",
    priority: 0.2,
  },
  {
    path: "/forums/privacy-policy",
    label: "Forums privacy policy",
    priority: 0.2,
  },
  {
    path: "/forums/user-agreement",
    label: "Forums user agreement",
    priority: 0.2,
  },
];

export const STATIC_PAGE_PATHS = new Set(STATIC_PAGES.map(({ path }) => path));
