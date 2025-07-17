import type { Service, Shop } from "@prisma/client";

export type ServiceWithShop = Service & {
  shop?: Shop | null;
};
