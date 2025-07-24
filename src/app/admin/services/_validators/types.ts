// This file defines the TypeScript types for raw data imported from external sources.
// It ensures that we can safely handle the data before it's converted and validated.
// These types are based on the product equivalents and may need to be adjusted
// if your service data sources have a different structure.

export type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: {
    id: number;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    sku: string;
    requires_shipping: boolean;
    taxable: boolean;
    featured_image: {
      id: number;
      product_id: number;
      position: number;
      created_at: string;
      updated_at: string;
      alt: string | null;
      width: number;
      height: number;
      src: string;
      variant_ids: number[];
    } | null;
    available: boolean;
    price: string;
    grams: number;
    compare_at_price: string | null;
    position: number;
    product_id: number;
    created_at: string;
    updated_at: string;
  }[];
  images: {
    id: number;
    created_at: string;
    position: number;
    updated_at: string;
    product_id: number;
    variant_ids: number[];
    src: string;
    width: number;
    height: number;
  }[];
  options: {
    name: string;
    position: number;
    values: string[];
  }[];
};

export type ShopifyData = {
  products: ShopifyProduct[];
};

export type SquareSpaceProduct = {
  id: string;
  title: string;
  body?: string;
  excerpt?: string;
  structuredContent?: {
    variants: { price: number }[];
    priceMoney?: { currency: string };
  };
  assetUrl?: string;
  fullUrl?: string;
  categories?: string[];
};

export type SquareSpaceData = {
  items: SquareSpaceProduct[];
};

export type WordPressProduct = {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  link: string;
  _links: {
    "wp:featuredmedia"?: { href: string }[];
  };
  class_list: string[]; 
};

export type WordPressData = {
  products: WordPressProduct[];
};
