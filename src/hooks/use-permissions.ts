import { authClient } from "~/server/better-auth/client";

export const usePermissions = () => {
  const { data: session } = authClient.useSession();
  const userRole = session?.user.role ?? "ARTISAN";
  const isElevated = userRole !== "ARTISAN";
  const isAdmin = userRole === "ADMIN";

  return { isElevated, isAdmin, userRole, session };
};
