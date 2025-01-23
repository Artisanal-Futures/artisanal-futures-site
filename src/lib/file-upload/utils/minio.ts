import { randomBytes } from "crypto";
import sharp from "sharp";

export function randomString(length = 10): string {
  const lettersAndDigits =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  const result = new Array(length);
  for (let i = 0; i < length; i++) {
    const index = (bytes[i] ?? 0) % lettersAndDigits.length;
    result[i] = lettersAndDigits[index];
  }

  return result.join("");
}

export async function ensureImageSize(file: ArrayBuffer): Promise<ArrayBuffer> {
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB in bytes

  if (file.byteLength <= MAX_SIZE) {
    return file;
  }

  let quality = 80;
  let scaledImage = Buffer.from(file);
  const metadata = await sharp(scaledImage).metadata();

  while (scaledImage.length > MAX_SIZE && quality > 10) {
    const format = metadata.format ?? "jpeg"; // Default to 'jpeg' if format is undefined
    scaledImage = await sharp(scaledImage)
      .resize(
        Math.round(metadata.width! * 0.9),
        Math.round(metadata.height! * 0.9),
      )
      .toFormat(format, { quality })
      .toBuffer();

    quality -= 10;
  }

  if (scaledImage.length > MAX_SIZE) {
    throw new Error("Unable to scale image to under 2MB");
  }

  return scaledImage.buffer.slice(
    scaledImage.byteOffset,
    scaledImage.byteOffset + scaledImage.byteLength,
  );
}
