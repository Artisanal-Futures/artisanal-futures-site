import { ImageResponse } from "next/og";

import { handleImageUrl } from "~/lib/handle-image-url";
import { SITE_NAME } from "~/lib/seo/site";
import { db } from "~/server/db";
import DefaultOgImage from "~/app/opengraph-image";

// A plain route rather than an opengraph-image file: Next gives metadata image
// routes in dynamic segments a hashed URL, so the shop page couldn't link to it
// as a fallback og:image. Served at /og/shops/{shopId}.
const size = { width: 1200, height: 630 };

type Props = { params: Promise<{ shopId: string }> };

/**
 * satori (behind next/og) only decodes PNG/JPEG, so fetch the logo ourselves,
 * check its type and inline it. Anything else (webp, a failed fetch) just means
 * the card renders without a logo instead of erroring.
 */
async function loadLogo(logoPhoto: string | null) {
  if (!logoPhoto) return null;
  try {
    const res = await fetch(handleImageUrl(logoPhoto), {
      signal: AbortSignal.timeout(4000),
    });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !["image/png", "image/jpeg"].includes(type)) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: Props) {
  const { shopId } = await params;

  // Query the db directly: the tRPC context needs request headers, which an
  // image route doesn't have. Only public shops get a personalised card.
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: {
      name: true,
      ownerName: true,
      isPublic: true,
      logoPhoto: true,
      address: { select: { city: true, state: true } },
    },
  });

  if (!shop?.isPublic) return DefaultOgImage();

  const logo = await loadLogo(shop.logoPhoto);
  const location = [shop.address?.city, shop.address?.state]
    .filter(Boolean)
    .join(", ");
  const name = shop.name.length > 80 ? `${shop.name.slice(0, 79)}…` : shop.name;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#ffffff",
        color: "#0a0a0a",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
        {logo && (
          <img
            src={logo}
            width={240}
            height={240}
            alt=""
            style={{ objectFit: "contain" }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: name.length > 40 ? 56 : 76,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 36, color: "#525252" }}>
            {`by ${shop.ownerName}`}
          </div>
          {location && (
            <div style={{ fontSize: 30, color: "#737373" }}>{location}</div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 30,
          fontWeight: 700,
          color: "#525252",
        }}
      >
        {SITE_NAME}
      </div>
    </div>,
    size,
  );
}
