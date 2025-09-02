import type { ShopAddress } from "@prisma/client";

import type { ProductWithRelations } from "./product";

export type Shop = {
  id: string;
  name: string;
  ownerName: string;
  bio?: string | null;
  description?: string | null;
  ownerPhoto?: string | null;
  logoPhoto?: string | null;
  coverPhoto?: string | null;
  address?: ShopAddress | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  ownerId: string;
  attributeTags: string[];
  createdAt: Date;
  updatedAt: Date;
  products?: ProductWithRelations[];
};
