import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

/**
 * Redirects to /unauthorized unless the current session is an ADMIN.
 * Returns the session so callers that need it don't have to fetch it again.
 */
export async function requireAdmin() {
  const session = await getSession();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return session;
}
