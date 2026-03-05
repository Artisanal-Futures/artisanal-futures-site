import type { Session } from "~/server/better-auth/client";
import { db } from "~/server/db";

export const checkUserShopPermissions = async (
  session: Session,
  shopId: string,
) => {
  if (session.user.role === "ADMIN") {
    return true;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { shops: true },
  });

  if (!user) {
    return false;
  }

  return user.shops.some((shop) => shop.id === shopId);
};
