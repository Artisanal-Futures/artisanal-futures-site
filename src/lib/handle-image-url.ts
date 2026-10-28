const STORAGE_ORIGIN = "https://storage.artisanalfutures.org";

/**
 * Resolves a stored image reference to something `next/image` can load.
 * Some rows hold a full URL, others just the storage key (e.g. "abc.jpg");
 * bare keys live under `folder` in the storage bucket. Absolute URLs,
 * root-relative paths and data/blob URLs are returned unchanged.
 */
export const resolveStorageImageUrl = (
  imageUrl: string,
  folder: "shops" | "products" | "services",
) => {
  if (/^(https?:|data:|blob:|\/)/.test(imageUrl)) return imageUrl;
  return `${STORAGE_ORIGIN}/${folder}/${imageUrl}`;
};

/** Shop photos (logo, owner, cover): bare keys live under `shops/`. */
export const handleImageUrl = (imageUrl: string) =>
  resolveStorageImageUrl(imageUrl, "shops");
