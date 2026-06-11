export function formatPrice(
  priceInCents?: number | null,
  currency?: string | null,
): string | null {
  if (priceInCents == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    // drop trailing .00 for whole amounts
    minimumFractionDigits: priceInCents % 100 === 0 ? 0 : 2,
  }).format(priceInCents / 100);
}
