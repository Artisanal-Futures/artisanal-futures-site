/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  ShopifyProduct,
  SquareSpaceProduct,
  WordPressProduct,
} from "../_validators/types";

export async function convertToProduct(
  product: ShopifyProduct | SquareSpaceProduct | WordPressProduct,
  shopId: string,
) {
  // Handle Shopify product
  if ("body_html" in product) {
    return {
      shopProductId: product.id.toString(),
      name: product.title,
      description: product.body_html || "",
      priceInCents: product.variants[0]?.price
        ? Math.round(parseFloat(product.variants[0].price) * 100)
        : null,
      currency: "USD", // Shopify typically uses USD
      imageUrl: product.images[0]?.src ?? null,
      productUrl: `/products/${product.handle}`,
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
      description: description,
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
    description: product.body ?? product.excerpt ?? "",
    priceInCents: product.structuredContent?.variants?.[0]?.price ?? null,
    currency: product.structuredContent?.priceMoney?.currency ?? null,
    imageUrl: imageUrl,
    productUrl: product.fullUrl ?? null,
    attributeTags: [],
    tags: [],
    materialTags: [],
    environmentalTags: [],
    aiGeneratedTags: [],
    scrapeMethod: "SQUARESPACE",
    shopId,
  };
}
