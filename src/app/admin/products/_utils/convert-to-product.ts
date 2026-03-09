/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  ShopifyData,
  ShopifyProduct,
  SquareSpaceData,
  SquareSpaceProduct,
  WordPressProduct,
} from "../_validators/types";
import type { ProductWithRelations } from "~/types/product";

export type ProductData = ShopifyData | SquareSpaceData | WordPressProduct[];

export async function convertToProduct(
  product: ShopifyProduct | SquareSpaceProduct | WordPressProduct,
  shopId: string,
  siteUrl?: string,
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
      imageUrl: product.images[0]?.src ?? null,
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
    let imageUrl = null;
    const description = product.content.rendered.replace(/<[^>]*>/g, "");

    const mediaHref = product._links["wp:featuredmedia"]?.[0]?.href ?? "";
    let isJson = false;
    if (mediaHref) {
      const getMedia = await fetch(mediaHref);
      const contentType = getMedia.headers.get("content-type") ?? "";
      if (getMedia.ok && contentType.includes("application/json")) {
        isJson = true;
        const media = (await getMedia.json()) as {
          guid: {
            rendered: string;
          };
        };
        imageUrl = media.guid.rendered;
      }
    }

    return {
      shopProductId: product.id.toString(),
      name: product.title.rendered,
      description: removeHtmlTags(description),
      priceInCents: null, // WordPress core doesn't include price
      currency: null,
      imageUrl: imageUrl, // Would need to fetch featured media separately
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

  // Handle SquareSpace product

  const imageUrl = product.items?.[0]?.assetUrl ?? product.assetUrl ?? null;
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
}: {
  parsedJson: ProductData;
  selectedSource: string;
  selectedShopId: string;
  selectedSiteUrl?: string;
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
