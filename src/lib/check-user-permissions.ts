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

export const checkUserProductPermissions = async (
  session: Session,
  productId: string,
) => {
  if (session.user.role === "ADMIN") {
    return true;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      shops: { select: { products: { select: { id: true } } } },
    },
  });

  if (!user) {
    return false;
  }

  const products = user.shops?.flatMap((shop) => shop.products) ?? [];

  return products.some((product) => product.id === productId);
};

export const checkUserServicePermissions = async (
  session: Session,
  serviceId: string,
) => {
  if (session.user.role === "ADMIN") {
    return true;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      shops: { select: { services: { select: { id: true } } } },
    },
  });

  if (!user) {
    return false;
  }

  const services = user.shops?.flatMap((shop) => shop.services) ?? [];

  return services.some((service) => service.id === serviceId);
};
