type ProductWithImage = {
  imageUrl?: string | null;
  [key: string]: unknown;
} | null;

export const addFullProductImageUrl = <T extends ProductWithImage>(
  product: T,
): T => {
  if (!product) return product;
  const storageBaseUrl = "https://storage.artisanalfutures.org/products";
  if (product.imageUrl && !product.imageUrl.startsWith("http")) {
    return { ...product, imageUrl: `${storageBaseUrl}/${product.imageUrl}` };
  }
  return product;
};

export const addFullServiceImageUrl = <T extends { imageUrl?: string | null }>(
  service: T | null,
): T | null => {
  if (!service) return null;
  const storageBaseUrl = "https://storage.artisanalfutures.org/services";
  if (service.imageUrl && !service.imageUrl.startsWith("http")) {
    return { ...service, imageUrl: `${storageBaseUrl}/${service.imageUrl}` };
  }
  return service;
};
