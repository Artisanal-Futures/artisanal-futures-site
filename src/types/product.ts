import type { Shop } from "@prisma/client";

export type Product = {
  id: string;
  shopProductId?: string | null;
  name: string;
  description: string;
  priceInCents?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  tags: string[];
  productUrl?: string | null;
  attributeTags: string[];
  materialTags: string[];
  environmentalTags: string[];
  aiGeneratedTags: string[];
  createdAt: Date;
  updatedAt: Date;
  scrapeMethod: "MANUAL" | "WORDPRESS" | "SHOPIFY" | "SQUARESPACE";
  shopId?: string | null;
  shop?: Partial<Shop> | null;
};
