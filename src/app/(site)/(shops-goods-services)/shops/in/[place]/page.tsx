import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { buildPageMetadata } from "~/lib/seo/page-metadata";
import { SITE_NAME, truncate } from "~/lib/seo/site";
import {
  canonicalStateSlug,
  getLocationLandingPages,
  getShopsForPlace,
  topCategories,
} from "~/server/seo/landing-pages";

import { joinList, ShopsLandingPage } from "../../_components/landing-page";

// Shops change rarely; regenerate at most hourly.
export const revalidate = 3600;

type Props = {
  params: Promise<{ place: string }>;
};

async function getLanding(place: string) {
  const landing = await getShopsForPlace(place);
  if (landing) return landing;

  // "/shops/in/mi" -> "/shops/in/michigan": send an abbreviation to the one
  // canonical state URL when that state has a page.
  const canonical = canonicalStateSlug(place);
  if (canonical !== place && (await getShopsForPlace(canonical))) {
    permanentRedirect(`/shops/in/${canonical}`);
  }

  return null;
}

function copyFor(landing: NonNullable<Awaited<ReturnType<typeof getLanding>>>) {
  const { place, shops } = landing;
  const names = shops.slice(0, 3).map((shop) => shop.name);
  const sample =
    shops.length > 3 ? `${names.join(", ")} and others` : joinList(names);
  const categories = topCategories(shops, 4).map((name) => name.toLowerCase());

  const intro = [
    `${place.count} artisan businesses in ${place.name} are part of ${SITE_NAME}, including ${sample}.`,
    categories.length > 0 ? `Their work spans ${joinList(categories)}.` : null,
    "Each shop links straight to the maker's own website, so you buy directly from the artisan.",
  ]
    .filter(Boolean)
    .join(" ");

  const description = truncate(
    `${place.count} artisan shops in ${place.name} on ${SITE_NAME}. Browse local makers and visit their shops directly, including ${sample}.`,
  );

  return { title: `Artisan shops in ${place.name}`, intro, description };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { place } = await params;
  const landing = await getLanding(place);

  // A page that doesn't qualify must never be indexed.
  if (!landing) {
    return { title: "Artisan shops", robots: { index: false, follow: false } };
  }

  const { title, description } = copyFor(landing);
  return buildPageMetadata({ title, description, path: landing.place.path });
}

export default async function ShopsInPlacePage({ params }: Props) {
  const { place } = await params;
  const landing = await getLanding(place);
  if (!landing) return notFound();

  const { title, intro, description } = copyFor(landing);
  const related = (await getLocationLandingPages())
    .filter((candidate) => candidate.slug !== landing.place.slug)
    .slice(0, 12);

  return (
    <ShopsLandingPage
      trail={[
        { name: "Home", path: "/" },
        { name: "Shops", path: "/shops" },
        { name: "By location", path: "/shops/in" },
        { name: landing.place.name, path: landing.place.path },
      ]}
      tagline={
        landing.place.kind === "city" ? "Local Artisans" : "Artisans by State"
      }
      title={title}
      intro={intro}
      description={description}
      shops={landing.shops}
      relatedHeading="Other locations"
      related={related}
    />
  );
}
