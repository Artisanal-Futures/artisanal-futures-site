import type { Service, Shop, Category } from "@prisma/client";

export type ServiceWithShop = Service & {
  shop?: Shop | null;
  categories: Category[];
};
