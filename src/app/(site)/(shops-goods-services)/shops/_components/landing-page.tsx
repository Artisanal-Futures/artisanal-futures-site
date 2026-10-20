import { Fragment } from "react";
import Link from "next/link";

import type { LandingShop } from "~/server/seo/landing-pages";
import { shopPath } from "~/lib/seo/paths";
import { breadcrumbSchema, collectionPageSchema } from "~/lib/seo/schema";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { JsonLd } from "~/components/seo/json-ld";

import { ShopCard } from "./shop-card";

type Crumb = { name: string; path: string };

type RelatedLink = { name: string; path: string; count: number };

function LandingBreadcrumb({ trail }: { trail: Crumb[] }) {
  const current = trail[trail.length - 1]!;
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {trail.slice(0, -1).map((crumb) => (
          <Fragment key={crumb.path}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={crumb.path}>{crumb.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{current.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function LinkList({
  heading,
  links,
}: {
  heading: string;
  links: RelatedLink[];
}) {
  if (links.length === 0) return null;
  return (
    <nav aria-label={heading}>
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
        {heading}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.path}>
            <Link
              href={link.path}
              className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors"
            >
              {link.name}
              <span className="text-muted-foreground text-xs">
                {link.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Shared layout for /shops/in/{place} and /shops/tag/{tag}. */
export function ShopsLandingPage({
  trail,
  tagline,
  title,
  intro,
  description,
  shops,
  relatedHeading,
  related,
}: {
  /** Home > Shops > ... > this page. The last entry is the current page. */
  trail: Crumb[];
  tagline: string;
  title: string;
  intro: string;
  description: string;
  shops: LandingShop[];
  relatedHeading: string;
  related: RelatedLink[];
}) {
  const current = trail[trail.length - 1]!;
  return (
    <>
      <JsonLd
        data={[
          collectionPageSchema({
            name: title,
            description,
            path: current.path,
            items: shops.map((shop) => ({
              name: shop.name,
              path: shopPath(shop),
            })),
          }),
          breadcrumbSchema(trail),
        ]}
      />
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <LandingBreadcrumb trail={trail} />
          <div className="flex flex-col gap-2">
            <p className="tagline">{tagline}</p>
            <h1>{title}</h1>
          </div>
          <p className="description">{intro}</p>
        </div>
      </header>

      <section className="site-section">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
        {related.length > 0 && (
          <div className="mt-12">
            <LinkList heading={relatedHeading} links={related} />
          </div>
        )}
      </section>
    </>
  );
}

/** Shared layout for the /shops/in and /shops/tag index pages. */
export function ShopsLandingIndexPage({
  trail,
  tagline,
  title,
  intro,
  links,
}: {
  trail: Crumb[];
  tagline: string;
  title: string;
  intro: string;
  links: RelatedLink[];
}) {
  const current = trail[trail.length - 1]!;
  return (
    <>
      <JsonLd
        data={[
          collectionPageSchema({
            name: title,
            description: intro,
            path: current.path,
            items: links.map((link) => ({ name: link.name, path: link.path })),
          }),
          breadcrumbSchema(trail),
        ]}
      />
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <LandingBreadcrumb trail={trail} />
          <div className="flex flex-col gap-2">
            <p className="tagline">{tagline}</p>
            <h1>{title}</h1>
          </div>
          <p className="description">{intro}</p>
        </div>
      </header>
      <section className="site-section">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <li key={link.path}>
              <Link
                href={link.path}
                className="border-border bg-card hover:border-ring/30 flex items-center justify-between gap-4 rounded-xl border px-5 py-4 transition-all hover:shadow-md"
              >
                <span className="text-foreground font-medium">{link.name}</span>
                <span className="text-muted-foreground text-sm">
                  {link.count} {link.count === 1 ? "shop" : "shops"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/** "A", "A and B", "A, B and C". */
export function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * "Browse by location / tag" link row for the /shops directory. Renders
 * nothing when no landing page qualifies yet.
 */
export function BrowseLandingLinks({
  locations,
  tags,
}: {
  locations: RelatedLink[];
  tags: RelatedLink[];
}) {
  if (locations.length === 0 && tags.length === 0) return null;
  return (
    <div className="mt-12 flex flex-col gap-8">
      {locations.length > 0 && (
        <LinkList heading="Browse by location" links={locations} />
      )}
      {tags.length > 0 && <LinkList heading="Browse by tag" links={tags} />}
    </div>
  );
}
