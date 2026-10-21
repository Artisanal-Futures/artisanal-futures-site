import { z } from "zod";

import { SITE_URL } from "~/lib/seo/site-url";
import { auth } from "~/server/better-auth";
import { db } from "~/server/db";
import { checkRateLimit, getClientIp } from "~/server/lib/rate-limit";

/**
 * First-party outbound click tracking: one `OutboundClick` row per click on a
 * link to an artisan's own site. Stores no cookie, IP or visitor identifier —
 * the IP is only used in memory for rate limiting. Every outcome is a 204 so
 * the endpoint never reveals why a click was or wasn't counted.
 */

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse/i;

const idSchema = z.string().min(1).max(64);

const bodySchema = z
  .object({
    shopId: idSchema,
    productId: idSchema.nullish(),
    serviceId: idSchema.nullish(),
    target: z.enum(["PRODUCT", "SERVICE", "WEBSITE"]),
    source: z.enum([
      "SHOP_PROFILE",
      "SHOP_HERO",
      "COLLECTIONS",
      "SHOP_CARD",
      "ARTISAN_MAP",
    ]),
  })
  .refine(({ target, productId, serviceId }) =>
    target === "PRODUCT"
      ? !!productId && !serviceId
      : target === "SERVICE"
        ? !!serviceId && !productId
        : !productId && !serviceId,
  );

const noContent = () => new Response(null, { status: 204 });

/**
 * A present Origin header must match the configured site or the host being
 * served. The site URL check keeps clicks counted if a proxy rewrites Host.
 */
function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    const originHost = new URL(origin).host;
    return originHost === new URL(SITE_URL).host || originHost === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (
    !checkRateLimit(`outbound:${getClientIp(req)}`, {
      limit: 60,
      windowMs: 60_000,
    })
  ) {
    return noContent();
  }

  if (BOT_PATTERN.test(req.headers.get("user-agent") ?? "")) return noContent();
  if (!isSameOrigin(req)) return noContent();

  try {
    const parsed = bodySchema.safeParse(JSON.parse(await req.text()));
    if (!parsed.success) return noContent();
    const { shopId, productId, serviceId, target, source } = parsed.data;

    const shop = await db.shop.findFirst({
      where: { id: shopId, isPublic: true },
      select: { id: true, ownerId: true },
    });
    if (!shop) return noContent();

    // The item must belong to this shop and be publicly visible too.
    if (productId) {
      const product = await db.product.findFirst({
        where: { id: productId, shopId: shop.id, isPublic: true },
        select: { id: true },
      });
      if (!product) return noContent();
    }
    if (serviceId) {
      const service = await db.service.findFirst({
        where: { id: serviceId, shopId: shop.id, isPublic: true },
        select: { id: true },
      });
      if (!service) return noContent();
    }

    // Don't count the shop's own owner or admins clicking through.
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user.role === "ADMIN" || session?.user.id === shop.ownerId) {
      return noContent();
    }

    await db.outboundClick.create({
      data: {
        shopId: shop.id,
        productId: productId ?? null,
        serviceId: serviceId ?? null,
        target,
        source,
      },
    });
  } catch {
    // Tracking is best-effort; never surface a failure to the visitor.
  }

  return noContent();
}
