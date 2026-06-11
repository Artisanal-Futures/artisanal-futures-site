import type { Category, Service, Shop } from "generated/prisma";

export type ServiceWithShop = Service & {
  shop?: Shop | null;
  categories: Category[];
};
