export const handleImageUrl = (imageUrl: string) => {
  return imageUrl.startsWith("https://storage.artisanalfutures.org/")
    ? imageUrl
    : `https://storage.artisanalfutures.org/shops/${imageUrl}`;
};
