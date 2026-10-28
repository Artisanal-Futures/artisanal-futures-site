import { resolveStorageImageUrl } from "~/lib/handle-image-url";

type ProductWithImage = {
  imageUrl?: string | null;
  [key: string]: unknown;
} | null;

export const addFullProductImageUrl = <T extends ProductWithImage>(
  product: T,
): T => {
  if (!product?.imageUrl) return product;
  return {
    ...product,
    imageUrl: resolveStorageImageUrl(product.imageUrl, "products"),
  };
};

export const addFullServiceImageUrl = <
  T extends { imageUrl?: string | null } | null,
>(
  service: T,
): T => {
  if (!service?.imageUrl) return service;
  return {
    ...service,
    imageUrl: resolveStorageImageUrl(service.imageUrl, "services"),
  };
};
