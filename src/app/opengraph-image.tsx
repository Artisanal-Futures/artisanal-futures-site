import { ImageResponse } from "next/og";

import { getOgLogoDataUri } from "~/lib/seo/og-logo";
import { SITE_NAME } from "~/lib/seo/site";

export const alt = `${SITE_NAME} – worker-owned artisan marketplace`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await getOgLogoDataUri();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 64,
        padding: 80,
        background: "#ffffff",
        color: "#0a0a0a",
      }}
    >
      {logo && (
        <img src={logo} width={300} height={296} alt="" />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 34, lineHeight: 1.3, color: "#525252" }}>
          Worker-owned artisan marketplace for a circular economy
        </div>
      </div>
    </div>,
    size,
  );
}
