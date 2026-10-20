import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { EyeOff } from "lucide-react";

import { handleImageUrl } from "~/lib/handle-image-url";
import { buildPageMetadata } from "~/lib/seo/page-metadata";
import { shopPath } from "~/lib/seo/paths";
import { breadcrumbSchema, shopSchema } from "~/lib/seo/schema";
import { SITE_NAME, truncate } from "~/lib/seo/site";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { getShopLandingLinks } from "~/server/seo/landing-pages";
import { JsonLd } from "~/components/seo/json-ld";

import { ArtisanHero } from "./_components/artisan-hero";
import { ProductServiceGrid } from "./_components/product-service-grid";
import { getShop } from "./get-shop";

type Props = {
  params: Promise<{ slug: string }>;
};

// Keep the whole <title> (incl. " – Artisanal Futures") under ~60 characters
// so search results don't truncate the brand.
const MAX_TITLE_LENGTH = 60;

/**
 * /shops/{x} also resolves an old slug or the shop id. Once the shop has a
 * slug, anything else permanently redirects to /shops/{slug}.
 */
function redirectToCanonical(
  param: string,
  shop: { id: string; slug: string | null },
) {
  if (shop.slug && param !== shop.slug) {
    permanentRedirect(shopPath(shop));
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShop(slug);

  // A missing (or hidden, to the public) shop must never be indexed.
  if (!shop) {
    return {
      title: "Artisan Profile",
      robots: { index: false, follow: false },
    };
  }

  redirectToCanonical(slug, shop);

  const location = [shop.address?.city, shop.address?.state]
    .filter(Boolean)
    .join(", ");

  const titleWithLocation = location ? `${shop.name} · ${location}` : null;
  const title =
    titleWithLocation &&
    `${titleWithLocation} – ${SITE_NAME}`.length <= MAX_TITLE_LENGTH
      ? titleWithLocation
      : shop.name;

  const generated = [
    `${shop.name} is a worker-owned artisan business led by ${shop.ownerName}${
      location ? ` in ${location}` : ""
    }.`,
    shop.attributeTags.length > 0 ? `${shop.attributeTags.join(", ")}.` : null,
    "Browse their products and services on Artisanal Futures.",
  ]
    .filter(Boolean)
    .join(" ");

  // Admin overrides (/admin/shops/{id} > Search & sharing) win; otherwise the
  // first non-blank of description, bio, then the generated sentence.
  const description = truncate(
    [shop.seoDescription, shop.description, shop.bio].find((text) =>
      text?.trim(),
    ) ?? generated,
  );

  // Prefer the admin share image, then the shop's own imagery; otherwise the
  // generated card from /og/shops/[shopId].
  const photo = [shop.seoImage, shop.coverPhoto, shop.logoPhoto].find((image) =>
    image?.trim(),
  );
  const images = [photo ? handleImageUrl(photo) : `/og/shops/${shop.id}`];

  return buildPageMetadata({
    title: shop.seoTitle?.trim() ? shop.seoTitle.trim() : title,
    description,
    // Always the canonical slug URL, whatever the request came in on.
    path: shopPath(shop),
    images,
    // Owners/admins can preview a hidden shop; it must stay out of the index.
    noIndex: !shop.isPublic || shop.seoNoIndex,
  });
}

export default async function ShopProfilePage({ params }: Props) {
  const { slug } = await params;
  const shop = await getShop(slug);

  if (!shop) {
    return notFound();
  }

  redirectToCanonical(slug, shop);

  // A hidden shop is only returned to its owner or an admin (enforced in
  // shop.get); everyone else already got null above. Let the owner/admin preview
  // it, with a banner making the hidden state clear.
  const isHidden = !shop.isPublic;

  // Hidden products/services are likewise only included for the owner or an
  // admin. Say so, otherwise a preview looks identical to the public page and
  // the owner assumes those items are live.
  const hiddenItemCount = shop.hiddenItemCount;

  // Links to the city/state and tag landing pages, for the ones that qualify.
  const landingLinks = await getShopLandingLinks({
    city: shop.address?.city,
    state: shop.address?.state,
    attributeTags: shop.attributeTags,
  });

  return (
    <>
      {/* A hidden shop is only previewable by its owner/admin, and a noindexed
          one is kept out of search, so neither advertises structured data. */}
      {!isHidden && !shop.seoNoIndex && (
        <JsonLd
          data={[
            shopSchema(shop),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Shops", path: "/shops" },
              { name: shop.name, path: shopPath(shop) },
            ]),
          ]}
        />
      )}
      {hiddenItemCount > 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="border-border bg-secondary text-secondary-foreground flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
            <EyeOff className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>
                {hiddenItemCount} item{hiddenItemCount === 1 ? " is" : "s are"}{" "}
                hidden.
              </strong>{" "}
              You can see {hiddenItemCount === 1 ? "it" : "them"} here because
              you manage this shop, but visitors cannot, and{" "}
              {hiddenItemCount === 1 ? "it does" : "they do"} not appear in
              search or browse.
            </p>
          </div>
        </div>
      )}
      {isHidden && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="border-border bg-secondary text-secondary-foreground flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
            <EyeOff className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>This shop is hidden.</strong> Only you and the Artisanal
              Futures team can see this page. Turn on{" "}
              <strong>Publicly visible</strong> in your{" "}
              <Link
                href={`/admin/shops/${shop.id}`}
                className="font-medium underline underline-offset-2"
              >
                shop settings
              </Link>{" "}
              to make it live.
            </p>
          </div>
        </div>
      )}
      <header className="mx-auto w-full max-w-7xl px-4 pt-12 pb-6 sm:px-6 sm:pt-16 sm:pb-8 lg:px-8">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shops">Shops</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{shop.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <ArtisanHero
          shop={shop}
          locationPath={landingLinks.locationPath}
          tagPaths={landingLinks.tagPaths}
        />
      </header>

      <section className="site-section">
        {/* Products & Services */}
        <div className="mx-auto">
          <ProductServiceGrid
            products={shop.products}
            services={shop.services}
            shop={shop}
          />
        </div>
      </section>
    </>
  );
}
