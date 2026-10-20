export function formatPrice(
  priceInCents?: number | null,
  currency?: string | null,
): string | null {
  // 0 is never a real price (old form defaults and imports stored it as unset)
  if (priceInCents == null || priceInCents <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    // drop trailing .00 for whole amounts
    minimumFractionDigits: priceInCents % 100 === 0 ? 0 : 2,
  }).format(priceInCents / 100);
}
