import type { Product, Shop, Category } from "@prisma/client";

export type ProductWithRelations = Product & {
  shop: Shop | null;
  categories: Category[];
};