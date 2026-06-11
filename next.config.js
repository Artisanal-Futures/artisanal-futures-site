// import withPWA from 'next-pwa'

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */

const config = {
  reactStrictMode: true,

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  images: {
    // Product/shop images are pulled from arbitrary artisan store hostnames
    // (set in the DB by admins/artisans), so we allow any host rather than
    // maintaining an ever-growing allowlist. `**` matches any hostname.
    //
    // Trade-off: this makes the Next image optimizer (`/_next/image`) willing
    // to fetch and cache any https URL, i.e. it becomes an open image proxy.
    // We deliberately allow https only (not http) to keep the optimizer from
    // reaching internal plain-HTTP services (SSRF), and rely on the fact that
    // rendered srcs come from admin/artisan-curated records.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

// export default withPWA({
//   dest: 'public', // Destination directory for the PWA files
//   disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
//   register: true, // Register the PWA service worker
//   skipWaiting: true, // Skip waiting for service worker activation
// })(config)
export default config;
