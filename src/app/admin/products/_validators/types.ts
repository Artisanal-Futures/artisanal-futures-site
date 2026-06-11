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

// export type SquareSpaceProduct = {
//   id: string;
//   collectionId: string;
//   recordType: number;
//   addedOn: number;
//   updatedOn: number;
//   displayIndex: number;
//   starred: boolean;
//   passthrough: boolean;
//   categories: string[];
//   workflowState: number;
//   publishOn: number;
//   authorId: string;
//   urlId: string;
//   title: string;
//   body: string | null;
//   excerpt: string | null;
//   likeCount: number;
//   commentCount: number;
//   publicCommentCount: number;
//   commentState: number;
//   author: {
//     id: string;
//     displayName: string;
//     firstName: string;
//     lastName: string;
//     bio: string;
//   };
//   fullUrl: string;
//   assetUrl: string;
//   contentType: string;
//   structuredContent: {
//     _type: string;
//     priceCents: number;
//     salePriceCents: number;
//     priceMoney: {
//       currency: string;
//       value: string;
//     };
//     salePriceMoney: {
//       currency: string;
//       value: string;
//     };
//     onSale: boolean;
//     productType: number;
//     customAddButtonText: string;
//     useCustomAddButtonText: boolean;
//     variants: {
//       attributes: Record<string, unknown>;
//       optionValues: unknown[];
//       id: string;
//       sku: string;
//       price: number;
//       salePrice: number;
//       priceMoney: {
//         currency: string;
//         value: string;
//       };
//       salePriceMoney: {
//         currency: string;
//         value: string;
//       };
//       onSale: boolean;
//       unlimited: boolean;
//       qtyInStock: number;
//       width: number;
//       fullUrl: string;
//       assetUrl: string;
//       height: number;
//       weight: number;
//       imageIds: string[];
//       images: unknown[];
//       items: {
//         id: string;
//         assetUrl: string;
//       }[];
//       len: number;
//     }[];
//     variantOptionOrdering: unknown[];
//     isSubscribable: boolean;
//     fulfilledExternally: boolean;
//   };
//   items: {
//     id: string;
//     collectionId: string;
//     recordType: number;
//     addedOn: number;
//     updatedOn: number;
//     displayIndex: number;
//     workflowState: number;
//     authorId: string;
//     parentId: string;
//     systemDataId: string;
//     systemDataVariants: string;
//     systemDataSourceType: string;
//     filename: string;
//     mediaFocalPoint: {
//       x: number;
//       y: number;
//       source: number;
//     };
//     colorData: {
//       topLeftAverage: string;
//       topRightAverage: string;
//       bottomLeftAverage: string;
//       bottomRightAverage: string;
//       centerAverage: string;
//       suggestedBgColor: string;
//     };
//     title: string;
//     body: string | null;
//     assetUrl: string;
//     contentType: string;
//     originalSize: string;
//     recordTypeLabel: string;
//   }[];
//   seoData?: {
//     seoTitle: string;
//     seoDescription: string;
//     seoHidden: boolean;
//   };
// };

export type SquareSpaceProduct = {
  id: string;
  collectionId: string;
  recordType: number;
  addedOn: number;
  updatedOn: number;
  displayIndex: number;
  starred?: boolean;
  passthrough?: boolean;
  workflowState: number;
  publishOn?: number;
  authorId: string;
  urlId?: string;
  title: string;
  body: string | null;
  excerpt?: string;
  likeCount?: number;
  commentCount?: number;
  publicCommentCount?: number;
  commentState?: number;
  unsaved?: boolean;
  author?: {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    bio: string;
  };
  fullUrl?: string;
  assetUrl?: string;
  contentType?: string;
  structuredContent?: {
    _type: string;
    priceCents?: number;
    salePriceCents?: number;
    priceMoney?: {
      currency: string;
      value: string;
    };
    salePriceMoney?: {
      currency: string;
      value: string;
    };
    onSale?: boolean;
    productType?: number;
    customAddButtonText?: string;
    useCustomAddButtonText?: boolean;
    variants?: Array<{
      attributes: Record<string, unknown>;
      optionValues: unknown[];
      id: string;
      sku: string;
      price: number;
      salePrice: number;
      priceMoney: {
        currency: string;
        value: string;
      };
      salePriceMoney: {
        currency: string;
        value: string;
      };
      onSale: boolean;
      unlimited: boolean;
      qtyInStock: number;
      width: number;
      height: number;
      weight: number;
      imageIds: string[];
      images: string[];
      len: number;
    }>;
    variantOptionOrdering?: unknown[];
    isSubscribable?: boolean;
    fulfilledExternally?: boolean;
    productAddOnsConfiguration?: {
      productAddOns: unknown[];
    };
  };
  priceCents?: number;
  salePriceCents?: number;
  priceMoney?: {
    currency: string;
    value: string;
  };
  salePriceMoney?: {
    currency: string;
    value: string;
  };
  onSale?: boolean;
  productType?: number;
  customAddButtonText?: string;
  useCustomAddButtonText?: boolean;
  variants?: Array<{
    attributes: Record<string, unknown>;
    optionValues: unknown[];
    id: string;
    sku: string;
    price: number;
    salePrice: number;
    priceMoney: {
      currency: string;
      value: string;
    };
    salePriceMoney: {
      currency: string;
      value: string;
    };
    onSale: boolean;
    unlimited: boolean;
    qtyInStock: number;
    width: number;
    height: number;
    weight: number;
    imageIds: string[];
    images: string[];
    len: number;
  }>;
  variantOptionOrdering?: unknown[];
  isSubscribable?: boolean;
  fulfilledExternally?: boolean;
  productAddOnsConfiguration?: {
    productAddOns: unknown[];
  };
  items?: Array<{
    id: string;
    collectionId: string;
    recordType: number;
    addedOn: number;
    updatedOn: number;
    displayIndex: number;
    workflowState: number;
    authorId: string;
    parentId: string;
    systemDataId?: string;
    systemDataVariants?: string;
    systemDataSourceType?: string;
    filename?: string;
    mediaFocalPoint?: {
      x: number;
      y: number;
      source: number;
    };
    colorData?: {
      topLeftAverage: string;
      topRightAverage: string;
      bottomLeftAverage: string;
      bottomRightAverage: string;
      centerAverage: string;
      suggestedBgColor: string;
    };
    title: string;
    body: string | null;
    likeCount?: number;
    commentCount?: number;
    publicCommentCount?: number;
    commentState?: number;
    author?: {
      id: string;
      displayName: string;
      firstName: string;
      lastName: string;
      bio: string;
    };
    fullUrl?: string;
    assetUrl?: string;
    contentType?: string;
    pushedServices?: Record<string, unknown>;
    pendingPushedServices?: Record<string, unknown>;
    originalSize?: string;
    recordTypeLabel?: string;
  }>;
  pushedServices?: Record<string, unknown>;
  pendingPushedServices?: Record<string, unknown>;
  recordTypeLabel?: string;
};

export type SquareSpaceData = {
  items: SquareSpaceProduct[];
};

export type WooCommerceProduct = {
  id: string;
  type: "simple" | "variable" | "variation";
  sku: string;
  gtin?: string; // "GTIN, UPC, EAN, or ISBN"
  name: string;
  published: boolean;
  isFeatured: boolean;
  catalogVisibility: string;
  shortDescription: string;
  description: string;
  salePriceStartDate?: string;
  salePriceEndDate?: string;
  taxStatus: string;
  taxClass: string;
  inStock: boolean;
  stockQuantity?: number;
  lowStockAmount?: number;
  backordersAllowed: boolean;
  soldIndividually: boolean;
  weight?: number; // in kg
  length?: number; // in cm
  width?: number; // in cm
  height?: number; // in cm
  allowCustomerReviews: boolean;
  purchaseNote?: string;
  salePrice?: string;
  regularPrice?: string;
  categories: string[];
  tags: string[];
  shippingClass?: string;
  images: string[];
  downloadLimit?: number;
  downloadExpiryDays?: number;
  parentId?: string;
  groupedProducts?: string[];
  upsells?: string[];
  crossSells?: string[];
  externalUrl?: string;
  buttonText?: string;
  position: number;
  brands?: string[];
  attributes?: {
    name: string;
    values: string[];
    visible: boolean;
    global: boolean;
  }[];
  meta?: Record<string, string>;
};

export type WooCommerceData = {
  products: WooCommerceProduct[];
};

export type WordPressProduct = {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  featured_media: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: unknown[];
  product_brand: unknown[];
  product_cat: number[];
  product_tag: unknown[];
  class_list: Record<string, string>;
  // Injected server-side by `fetchFromStore`: the product's featured image
  // resolved from the WordPress media endpoint. Absent on manual pastes.
  featured_image_url?: string | null;
  // Present when the feed was fetched with `_embed=wp:featuredmedia`.
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      guid?: { rendered?: string };
    }>;
  };
  _links: {
    self: Array<{
      href: string;
      targetHints?: {
        allow: string[];
      };
    }>;
    collection: Array<{
      href: string;
    }>;
    about: Array<{
      href: string;
    }>;
    replies: Array<{
      embeddable: boolean;
      href: string;
    }>;
    "wp:featuredmedia": Array<{
      embeddable: boolean;
      href: string;
    }>;
    "wp:attachment": Array<{
      href: string;
    }>;
    "wp:term": Array<{
      taxonomy: string;
      embeddable: boolean;
      href: string;
    }>;
    curies: Array<{
      name: string;
      href: string;
      templated: boolean;
    }>;
  };
};

export type WordPressData = {
  products: WordPressProduct[];
};

// SimplePress exposes a flat product feed at `/api/products`. Prices are
// already integer cents. Newer feeds include a stable per-product `id`, which
// we prefer as the dedupe/update key; older feeds without one fall back to the
// product `url` slug (see convertToProduct).
export type SimplePressProduct = {
  id?: number | string | null;
  name: string;
  price: number | null;
  priceFormatted: string | null;
  currency: string | null;
  description: string | null;
  url: string;
  imageUrl: string | null;
};

export type SimplePressData = {
  business?: string;
  products: SimplePressProduct[];
};

// Square Online (square.site / Weebly) renders its storefront via an internal
// `products?page=N` XHR feed. There's no public API, so this is paste-only.
// Prices live under `price.*_subunits` (integer cents); descriptions are HTML.
type SquareImage = {
  absolute_url?: string | null;
  url?: string | null;
};

export type SquareProduct = {
  id: string;
  // Always present in the Square feed; used as the discriminator that tells
  // this shape apart from SquareSpace in convertToProduct.
  square_id: string;
  site_product_id?: string;
  name: string;
  short_description?: string | null;
  absolute_site_link?: string | null;
  site_link?: string | null;
  price?: {
    high_subunits?: number | null;
    low_subunits?: number | null;
    regular_high_subunits?: number | null;
    regular_low_subunits?: number | null;
  } | null;
  thumbnail?: { data?: SquareImage | null } | null;
  images?: { data?: SquareImage[] | null } | null;
};

export type SquareData = {
  data: SquareProduct[];
};
