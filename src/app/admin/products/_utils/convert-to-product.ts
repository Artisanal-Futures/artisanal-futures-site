import type { ShopifyProduct, SquareSpaceProduct } from '../_validators/types'

export function convertToProduct(
  product: ShopifyProduct | SquareSpaceProduct,
  shopId: string,
) {
  // Handle Shopify product
  if ('body_html' in product) {
    return {
      shopProductId: product.id.toString(),
      name: product.title,
      description: product.body_html || '',
      priceInCents: product.variants[0]?.price
        ? Math.round(parseFloat(product.variants[0].price) * 100)
        : null,
      currency: 'USD', // Shopify typically uses USD
      imageUrl: product.images[0]?.src ?? null,
      productUrl: `/products/${product.handle}`,
      attributeTags: [],
      materialTags: [],
      environmentalTags: [],
      aiGeneratedTags: [],
      scrapeMethod: 'SHOPIFY',
      shopId,
    }
  }

  // Handle SquareSpace product
  return {
    shopProductId: product.id,
    name: product.title,
    description: product.body ?? product.excerpt ?? '',
    priceInCents: product.structuredContent?.variants[0]?.price ?? null,
    currency: product.structuredContent?.priceMoney?.currency ?? null,
    imageUrl: product.assetUrl ?? null,
    productUrl: product.fullUrl ?? null,
    attributeTags: product.categories ?? [],
    materialTags: [],
    environmentalTags: [],
    aiGeneratedTags: [],
    scrapeMethod: 'SQUARESPACE',
    shopId,
  }
}
