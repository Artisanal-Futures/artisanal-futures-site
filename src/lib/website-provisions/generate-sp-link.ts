import { createHmac } from "node:crypto";

import { env } from "~/env";

export function generateSimplePressLink({
  userEmail,
  subdomain,
}: {
  userEmail: string;
  subdomain: string;
}) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // Simple 6-char code
  const expiresAt = Date.now() + 1000 * 60 * 5; // Valid for 5 minutes

  const dataToSign = `${userEmail}:${subdomain}:${code}:${expiresAt}`;
  const signature = createHmac("sha256", env.SIMPLEPRESS_HASH_SECRET)
    .update(dataToSign)
    .digest("hex");

  const params = new URLSearchParams({
    email: userEmail,
    code: code,
    expires: expiresAt.toString(),
    sig: signature,
    subdomain: subdomain,
  });

  return `https://simplepress.dev/verify?${params.toString()}`;
}
