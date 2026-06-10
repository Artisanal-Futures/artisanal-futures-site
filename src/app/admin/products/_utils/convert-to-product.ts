import type {
  ShopifyData,
  ShopifyProduct,
  SimplePressData,
  SimplePressProduct,
  SquareData,
  SquareProduct,
  SquareSpaceData,
  SquareSpaceProduct,
  WordPressProduct,
} from "../_validators/types";
import type { ProductWithRelations } from "~/types/product";

export type ProductData =
  | ShopifyData
  | SquareSpaceData
  | SimplePressData
  | SquareData
  | WordPressProduct[];

export async function convertToProduct(
  product:
    | ShopifyProduct
    | SquareSpaceProduct
    | SimplePressProduct
    | SquareProduct
    | WordPressProduct,
  shopId: string,
  siteUrl?: string,
  fallbackImageUrl?: string | null,
) {
  // Handle Shopify product
  if ("body_html" in product) {
    return {
      shopProductId: product.id.toString(),
      name: product.title,
      description: removeHtmlTags(product.body_html),
      priceInCents: product.variants[0]?.price
        ? Math.round(parseFloat(product.variants[0].price) * 100)
        : null,
      currency: "USD", // Shopify typically uses USD
      imageUrl: product.images[0]?.src ?? fallbackImageUrl ?? null,
      productUrl: siteUrl
        ? `${siteUrl}/products/${product.handle}`
        : `/products/${product.handle}`,
      attributeTags: [],
      tags: product.tags ?? [],
      materialTags: [],
      environmentalTags: [],
      aiGeneratedTags: [],
      scrapeMethod: "SHOPIFY",
      shopId,
    };
  }

  // Handle WordPress product
  if ("class_list" in product) {
    const description = product.content.rendered.replace(/<[^>]*>/g, "");

    // The featured image is resolved server-side by `fetchFromStore` (which
    // injects `featured_image_url`) so we never make a CORS-bound request from
    // the browser. For manual pastes fetched with `_embed`, read the embedded
    // media instead. Falls back to the shop logo below when neither is present.
    const embedded = product._embedded?.["wp:featuredmedia"]?.[0];
    const imageUrl =
      product.featured_image_url ??
      embedded?.source_url ??
      embedded?.guid?.rendered ??
      null;

    return {
      shopProductId: product.id.toString(),
      name: product.title.rendered,
      description: removeHtmlTags(description),
      priceInCents: null, // WordPress core doesn't include price
      currency: null,
      imageUrl: imageUrl ?? fallbackImageUrl ?? null, // falls back to shop logo
      productUrl: product.link,
      attributeTags: [],
      tags: [], // Would need to map product_tag if needed
      materialTags: [],
      environmentalTags: [],
      aiGeneratedTags: [],
      scrapeMethod: "WORDPRESS",
      shopId,
    };
  }

  // Handle SimplePress product. Its feed has a flat shape with `price`
  // already in integer cents. Newer feeds expose a stable per-product `id` we
  // prefer as `shopProductId`; older feeds without one fall back to a slug
  // derived from the product URL.
  if ("priceFormatted" in product) {
    const slug =
      product.url
        ?.split("?")[0]
        ?.replace(/\/+$/, "")
        .split("/")
        .filter(Boolean)
        .pop() ?? product.url;
    const shopProductId =
      product.id !== undefined &&
      product.id !== null &&
      String(product.id).length > 0
        ? String(product.id)
        : slug;
    return {
      shopProductId,
      name: product.name,
      description: removeHtmlTags(product.description ?? undefined),
      priceInCents:
        typeof product.price === "number" && product.price > 0
          ? product.price
          : null,
      currency: product.currency ?? "USD",
      imageUrl: product.imageUrl ?? fallbackImageUrl ?? null,
      productUrl: product.url ?? null,
      attributeTags: [],
      tags: [],
      materialTags: [],
      environmentalTags: [],
      aiGeneratedTags: [],
      scrapeMethod: "SIMPLEPRESS",
      shopId,
    };
  }

  // Handle Square (square.site) product. Prices are nested integer cents under
  // `price.*_subunits`; images and links are already absolute URLs.
  if ("square_id" in product) {
    const priceInCents =
      product.price?.high_subunits ?? product.price?.low_subunits ?? null;
    const squareImageUrl =
      product.thumbnail?.data?.absolute_url ??
      product.images?.data?.[0]?.absolute_url ??
      fallbackImageUrl ??
      null;
    return {
      shopProductId: product.id,
      name: product.name,
      description: removeHtmlTags(product.short_description ?? undefined),
      priceInCents:
        typeof priceInCents === "number" && priceInCents > 0
          ? priceInCents
          : null,
      currency: "USD",
      imageUrl: squareImageUrl,
      productUrl: product.absolute_site_link ?? null,
      attributeTags: [],
      tags: [],
      materialTags: [],
      environmentalTags: [],
      aiGeneratedTags: [],
      scrapeMethod: "SQUARE",
      shopId,
    };
  }

  // Handle SquareSpace product

  const imageUrl =
    product.items?.[0]?.assetUrl ?? product.assetUrl ?? fallbackImageUrl ?? null;
  return {
    shopProductId: product.id,
    name: product.title,
    description: removeHtmlTags(product.body ?? product.excerpt),
    priceInCents: product.structuredContent?.variants?.[0]?.price ?? null,
    currency: product.structuredContent?.priceMoney?.currency ?? null,
    imageUrl: imageUrl,
    productUrl: siteUrl
      ? `${siteUrl}${product.fullUrl}`
      : (product.fullUrl ?? null),
    attributeTags: [],
    tags: [],
    materialTags: [],
    environmentalTags: [],
    aiGeneratedTags: [],
    scrapeMethod: "SQUARESPACE",
    shopId,
  };
}

export async function mapProducts({
  parsedJson,
  selectedSource,
  selectedShopId,
  selectedSiteUrl,
  fallbackImageUrl,
}: {
  parsedJson: ProductData;
  selectedSource: string;
  selectedShopId: string;
  selectedSiteUrl?: string;
  /** Shop logo URL used when a product has no image of its own. */
  fallbackImageUrl?: string | null;
}) {
  let convertedProducts: Partial<ProductWithRelations>[] = [];

  if (selectedSource === "shopify") {
    const shopifyData = parsedJson as ShopifyData;
    convertedProducts = await Promise.all(
      shopifyData?.products?.map(
        async (product) =>
          (await convertToProduct(
            product,
            selectedShopId,
            selectedSiteUrl ?? undefined,
            fallbackImageUrl,
          )) as Partial<ProductWithRelations>,
      ),
    );
  } else if (selectedSource === "squarespace") {
    const squarespaceData = parsedJson as SquareSpaceData;
    convertedProducts = await Promise.all(
      squarespaceData?.items?.map(
        async (product) =>
          (await convertToProduct(
            product,
            selectedShopId,
            selectedSiteUrl ?? undefined,
            fallbackImageUrl,
          )) as Partial<ProductWithRelations>,
      ),
    );
  } else if (selectedSource === "simplepress") {
    const simplePressData = parsedJson as SimplePressData;
    convertedProducts = await Promise.all(
      simplePressData?.products?.map(
        async (product) =>
          (await convertToProduct(
            product,
            selectedShopId,
            selectedSiteUrl ?? undefined,
            fallbackImageUrl,
          )) as Partial<ProductWithRelations>,
      ),
    );
  } else if (selectedSource === "square") {
    const squareData = parsedJson as SquareData;
    convertedProducts = await Promise.all(
      squareData?.data?.map(
        async (product) =>
          (await convertToProduct(
            product,
            selectedShopId,
            selectedSiteUrl ?? undefined,
            fallbackImageUrl,
          )) as Partial<ProductWithRelations>,
      ),
    );
  } else if (selectedSource === "wordpress") {
    const wordpressData = parsedJson as WordPressProduct[];
    convertedProducts = await Promise.all(
      wordpressData?.map(
        async (product) =>
          (await convertToProduct(
            product,
            selectedShopId,
            undefined,
            fallbackImageUrl,
          )) as Partial<ProductWithRelations>,
      ),
    );
  }

  return convertedProducts as ProductWithRelations[];
}

const removeHtmlTags = (text?: string) => {
  return !!text?.trim()
    ? text?.replace(/<[^>]*>/g, "")
    : "No description available";
};
