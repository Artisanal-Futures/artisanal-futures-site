import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildPageMetadata } from "~/lib/seo/page-metadata";
import { SITE_NAME, truncate } from "~/lib/seo/site";
import {
  getShopsForTag,
  getTagLandingPages,
  topCategories,
} from "~/server/seo/landing-pages";

import { joinList, ShopsLandingPage } from "../../_components/landing-page";

// Shops change rarely; regenerate at most hourly.
export const revalidate = 3600;

type Props = {
  params: Promise<{ tag: string }>;
};

function copyFor(
  landing: NonNullable<Awaited<ReturnType<typeof getShopsForTag>>>,
) {
  const { tag, shops } = landing;
  const names = shops.slice(0, 3).map((shop) => shop.name);
  const sample =
    shops.length > 3 ? `${names.join(", ")} and others` : joinList(names);
  const categories = topCategories(shops, 4).map((name) => name.toLowerCase());

  const intro = [
    `${SITE_NAME} lists ${tag.count} artisan businesses tagged "${tag.name}", including ${sample}.`,
    categories.length > 0
      ? `Between them they offer ${joinList(categories)}.`
      : null,
    "Each shop links straight to the maker's own website, so you buy directly from the artisan.",
  ]
    .filter(Boolean)
    .join(" ");

  const description = truncate(
    `${tag.count} ${tag.name} artisan shops on ${SITE_NAME}. Browse their products and services and visit their shops directly, including ${sample}.`,
  );

  return { title: `${tag.name} artisan shops`, intro, description };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const landing = await getShopsForTag(tag);

  // A page that doesn't qualify must never be indexed.
  if (!landing) {
    return { title: "Artisan shops", robots: { index: false, follow: false } };
  }

  const { title, description } = copyFor(landing);
  return buildPageMetadata({ title, description, path: landing.tag.path });
}

export default async function ShopsByTagPage({ params }: Props) {
  const { tag } = await params;
  const landing = await getShopsForTag(tag);
  if (!landing) return notFound();

  const { title, intro, description } = copyFor(landing);
  const related = (await getTagLandingPages())
    .filter((candidate) => candidate.slug !== landing.tag.slug)
    .slice(0, 12);

  return (
    <ShopsLandingPage
      trail={[
        { name: "Home", path: "/" },
        { name: "Shops", path: "/shops" },
        { name: "By tag", path: "/shops/tag" },
        { name: landing.tag.name, path: landing.tag.path },
      ]}
      tagline="Artisans by Tag"
      title={title}
      intro={intro}
      description={description}
      shops={landing.shops}
      relatedHeading="Other tags"
      related={related}
    />
  );
}
