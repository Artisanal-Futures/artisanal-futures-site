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
    const getMedia = await fetch(
      product._links["wp:featuredmedia"]?.[0]?.href ?? "",
    );
    const media = (await getMedia.json()) as {
      guid: {
        rendered: string;
      };
    };
    const imageUrl = media.guid.rendered;
    const description = product.content.rendered.replace(/<[^>]*>/g, "");

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
  return {
    shopProductId: product.id,
    name: product.title,
    description: product.body ?? product.excerpt ?? "",
    priceInCents: product.structuredContent?.variants[0]?.price ?? null,
    currency: product.structuredContent?.priceMoney?.currency ?? null,
    imageUrl: product.assetUrl ?? null,
    productUrl: product.fullUrl ?? null,
    attributeTags: product.categories ?? [],
    tags: [],
    materialTags: [],
    environmentalTags: [],
    aiGeneratedTags: [],
    scrapeMethod: "SQUARESPACE",
    shopId,
  };
}
