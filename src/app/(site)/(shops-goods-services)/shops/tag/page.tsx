import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildPageMetadata } from "~/lib/seo/page-metadata";
import { SITE_NAME } from "~/lib/seo/site";
import { getTagLandingPages } from "~/server/seo/landing-pages";

import { ShopsLandingIndexPage } from "../_components/landing-page";

export const revalidate = 3600;

const TITLE = "Artisan shops by tag";
const DESCRIPTION = `Browse ${SITE_NAME} artisans and worker-owned shops by what they stand for, such as Black Owned, Woman Owned and Worker Owned.`;

export async function generateMetadata(): Promise<Metadata> {
  const tags = await getTagLandingPages();
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/shops/tag",
    noIndex: tags.length === 0,
  });
}

export default async function ShopsByTagIndexPage() {
  const tags = await getTagLandingPages();
  if (tags.length === 0) return notFound();

  return (
    <ShopsLandingIndexPage
      trail={[
        { name: "Home", path: "/" },
        { name: "Shops", path: "/shops" },
        { name: "By tag", path: "/shops/tag" },
      ]}
      tagline="Artisans by Tag"
      title={TITLE}
      intro={DESCRIPTION}
      links={tags.map(({ name, path, count }) => ({ name, path, count }))}
    />
  );
}
