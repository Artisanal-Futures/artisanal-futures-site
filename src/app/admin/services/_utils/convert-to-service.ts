import type {
  ShopifyProduct,
  SquareSpaceProduct,
  WordPressProduct,
} from "../_validators/types"; // Assuming these types can be reused for services

/**
 * @description Converts a raw product/service object from an external source
 * into the format expected by the Prisma Service model.
 * @param item - The raw data object from Shopify, WordPress, or Squarespace.
 * @param shopId - The ID of the shop this service belongs to.
 * @returns A partial service object ready for validation and database insertion.
 */
export async function convertToService(
  item: ShopifyProduct | SquareSpaceProduct | WordPressProduct,
  shopId: string,
) {
  // Handle Shopify data
  if ("body_html" in item) {
    return {
      name: item.title,
      description: item.body_html || "",
      priceInCents: item.variants[0]?.price
        ? Math.round(parseFloat(item.variants[0].price) * 100)
        : null,
      currency: "USD",
      imageUrl: item.images[0]?.src ?? null,
      tags: item.tags ?? [],
      attributeTags: [],
      aiGeneratedTags: [],
      shopId,
      // Service-specific fields (defaulted to null)
      durationInMinutes: null,
      locationType: null,
    };
  }

  // Handle WordPress data
  if ("class_list" in item) {
    const getMedia = await fetch(
      item._links["wp:featuredmedia"]?.[0]?.href ?? "",
    );
    const media = (await getMedia.json()) as {
      guid: { rendered: string };
    };
    const imageUrl = media.guid.rendered;
    const description = item.content.rendered.replace(/<[^>]*>/g, "");

    return {
      name: item.title.rendered,
      description: description,
      priceInCents: null,
      currency: null,
      imageUrl: imageUrl,
      tags: [],
      attributeTags: [],
      aiGeneratedTags: [],
      shopId,
      durationInMinutes: null,
      locationType: null,
    };
  }

  // Handle SquareSpace data
  return {
    name: item.title,
    description: item.body ?? item.excerpt ?? "",
    priceInCents: item.structuredContent?.variants[0]?.price ?? null,
    currency: item.structuredContent?.priceMoney?.currency ?? null,
    imageUrl: item.assetUrl ?? null,
    tags: [],
    attributeTags: item.categories ?? [],
    aiGeneratedTags: [],
    shopId,
    durationInMinutes: null,
    locationType: null,
  };
}
