import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildPageMetadata } from "~/lib/seo/page-metadata";
import { SITE_NAME } from "~/lib/seo/site";
import { getLocationLandingPages } from "~/server/seo/landing-pages";

import { ShopsLandingIndexPage } from "../_components/landing-page";

export const revalidate = 3600;

const TITLE = "Artisan shops by location";
const DESCRIPTION = `Find ${SITE_NAME} artisans and worker-owned shops near you, by city and state.`;

export async function generateMetadata(): Promise<Metadata> {
  const places = await getLocationLandingPages();
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/shops/in",
    noIndex: places.length === 0,
  });
}

export default async function ShopsByLocationPage() {
  const places = await getLocationLandingPages();
  if (places.length === 0) return notFound();

  return (
    <ShopsLandingIndexPage
      trail={[
        { name: "Home", path: "/" },
        { name: "Shops", path: "/shops" },
        { name: "By location", path: "/shops/in" },
      ]}
      tagline="Local Artisans"
      title={TITLE}
      intro={DESCRIPTION}
      links={places.map(({ name, path, count }) => ({ name, path, count }))}
    />
  );
}
