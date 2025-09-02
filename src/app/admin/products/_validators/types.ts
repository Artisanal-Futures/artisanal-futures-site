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
  collectionId: string;
  recordType: number;
  addedOn: number;
  updatedOn: number;
  displayIndex: number;
  starred: boolean;
  passthrough: boolean;
  categories: string[];
  workflowState: number;
  publishOn: number;
  authorId: string;
  urlId: string;
  title: string;
  body: string | null;
  excerpt: string | null;
  likeCount: number;
  commentCount: number;
  publicCommentCount: number;
  commentState: number;
  author: {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    bio: string;
  };
  fullUrl: string;
  assetUrl: string;
  contentType: string;
  structuredContent: {
    _type: string;
    priceCents: number;
    salePriceCents: number;
    priceMoney: {
      currency: string;
      value: string;
    };
    salePriceMoney: {
      currency: string;
      value: string;
    };
    onSale: boolean;
    productType: number;
    customAddButtonText: string;
    useCustomAddButtonText: boolean;
    variants: {
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
      images: unknown[];
      len: number;
    }[];
    variantOptionOrdering: unknown[];
    isSubscribable: boolean;
    fulfilledExternally: boolean;
  };
  items: {
    id: string;
    collectionId: string;
    recordType: number;
    addedOn: number;
    updatedOn: number;
    displayIndex: number;
    workflowState: number;
    authorId: string;
    parentId: string;
    systemDataId: string;
    systemDataVariants: string;
    systemDataSourceType: string;
    filename: string;
    mediaFocalPoint: {
      x: number;
      y: number;
      source: number;
    };
    colorData: {
      topLeftAverage: string;
      topRightAverage: string;
      bottomLeftAverage: string;
      bottomRightAverage: string;
      centerAverage: string;
      suggestedBgColor: string;
    };
    title: string;
    body: string | null;
    assetUrl: string;
    contentType: string;
    originalSize: string;
    recordTypeLabel: string;
  }[];
  seoData?: {
    seoTitle: string;
    seoDescription: string;
    seoHidden: boolean;
  };
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
