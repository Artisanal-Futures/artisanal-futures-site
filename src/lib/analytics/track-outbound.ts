/**
 * Client side of first-party outbound click tracking. The payload carries only
 * which link was clicked and where — no visitor identifier of any kind (see the
 * privacy policy). String unions mirror the Prisma enums so client code never
 * imports `@prisma/client`.
 */

export type OutboundTarget = "PRODUCT" | "SERVICE" | "WEBSITE";

export type OutboundSource =
  | "SHOP_PROFILE"
  | "SHOP_HERO"
  | "COLLECTIONS"
  | "SHOP_CARD"
  | "ARTISAN_MAP";

export type OutboundClickPayload = {
  shopId: string;
  productId?: string | null;
  serviceId?: string | null;
  target: OutboundTarget;
  source: OutboundSource;
};

export const OUTBOUND_TRACK_ENDPOINT = "/api/track/outbound";

/**
 * Fire-and-forget. `sendBeacon` survives the page unloading as the new tab
 * opens; `fetch` with `keepalive` is the fallback. Never throws — tracking must
 * not get in the way of the link itself.
 */
export function trackOutboundClick(payload: OutboundClickPayload): void {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify(payload);

    if (
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(
        OUTBOUND_TRACK_ENDPOINT,
        new Blob([body], { type: "application/json" }),
      )
    ) {
      return;
    }

    void fetch(OUTBOUND_TRACK_ENDPOINT, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Swallow: analytics must never break navigation.
  }
}
