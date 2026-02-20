import type { Category, Product, Shop } from "generated/prisma";

export type ProductWithRelations = Product & {
  shop: Shop | null;
  categories: Category[];
};
