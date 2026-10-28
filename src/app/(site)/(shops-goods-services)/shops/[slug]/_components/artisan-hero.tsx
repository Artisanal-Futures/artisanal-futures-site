import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Globe, Mail, MapPin, Phone } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { getInitials } from "~/lib/get-initials";
import { getSocialPlatform } from "~/lib/social-links";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { SocialIcon } from "~/components/icons/social-icons";
import { OutboundLink } from "~/components/outbound-link";

import { OpenToCollaborate } from "./open-to-collaborate";

type Props = {
  shop: NonNullable<RouterOutputs["shop"]["get"]>;
  /** City (else state) landing page for this shop, if one qualifies. */
  locationPath?: string | null;
  /** Landing page per attribute tag, for the tags that qualify. */
  tagPaths?: Record<string, string>;
};

/** "https://www.example.com/shop" -> "example.com" */
function websiteDomain(website: string) {
  try {
    const url = new URL(
      /^https?:\/\//i.test(website) ? website : `https://${website}`,
    );
    return url.hostname.replace(/^www\./, "");
  } catch {
    return website.replace(/^https?:\/\//, "");
  }
}

/** The site is US-only for now, so only a non-US country is worth showing. */
function isUnitedStates(country: string) {
  return /^(us|usa|u\.s\.(a\.)?|united states( of america)?)$/i.test(
    country.trim(),
  );
}

/** Short, factual summary of the shop; any fact without data is skipped. */
function getFacts(shop: Props["shop"], locationPath?: string | null) {
  const location = [shop.address?.city, shop.address?.state]
    .filter(Boolean)
    .join(", ");

  // Owners/admins also get hidden items back from shop.get; only public ones
  // describe what the shop sells.
  const categories = [
    ...new Set(
      [...shop.products, ...shop.services]
        .filter((item) => item.isPublic)
        .flatMap((item) => item.categories.map((category) => category.name)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return [
    { label: "Location", value: location, href: locationPath ?? undefined },
    { label: "What they make", value: categories.slice(0, 6).join(", ") },
    { label: "Member since", value: String(shop.createdAt.getFullYear()) },
    {
      label: "Website",
      value: shop.website ? websiteDomain(shop.website) : "",
    },
  ].filter((fact) => fact.value) as {
    label: string;
    value: string;
    href?: string;
  }[];
}

export function ArtisanHero({ shop, locationPath, tagPaths = {} }: Props) {
  const facts = getFacts(shop, locationPath);

  // Only a storefront shows its street. shop.get already blanks it for
  // home-based and area-only shops; check the type here as well so the hero
  // never depends on that alone.
  const showStreetAddress =
    shop.locationType === "STOREFRONT" && !!shop.address?.address;
  const locality = [shop.address?.city, shop.address?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
      {/* Left: Artisan Photo + Identity */}
      <div className="flex flex-col items-center gap-6 lg:w-72 lg:shrink-0">
        {shop?.ownerPhoto ? (
          <div className="border-card relative size-40 overflow-hidden rounded-full border-4 shadow-lg lg:size-52">
            <Image
              src={shop?.ownerPhoto ?? "/placeholder.svg"}
              alt={`Portrait of ${shop.ownerName}`}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="border-card bg-muted flex size-40 items-center justify-center rounded-full border-4 shadow-lg lg:size-52">
            <span className="text-muted-foreground text-4xl font-semibold lg:text-5xl">
              {getInitials(shop?.ownerName)}
            </span>
          </div>
        )}

        {/* Business logo (small, beneath the person). The name lives in the h1. */}
        {shop?.logoPhoto && (
          <div className="border-border relative size-12 shrink-0 overflow-hidden rounded-md border">
            <Image
              src={shop?.logoPhoto ?? "/placeholder.svg"}
              alt={`${shop.name} logo`}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Right: Name, bio, details */}
      <div className="flex flex-1 flex-col gap-6">
        {/* Shop name, owner & Visit Website CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance lg:text-4xl">
              {shop?.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              by {shop?.ownerName}
            </p>
          </div>
          {shop?.website && (
            <OutboundLink
              href={shop?.website}
              track={{
                shopId: shop.id,
                target: "WEBSITE",
                source: "SHOP_HERO",
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition-colors"
            >
              Visit Website
              <ExternalLink className="size-4" />
            </OutboundLink>
          )}
        </div>

        {/* At a glance */}
        {facts.length > 0 && (
          <div>
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
              At a glance
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-muted-foreground text-xs">
                    {fact.label}
                  </dt>
                  <dd className="text-foreground text-sm font-medium">
                    {fact.href ? (
                      <Link
                        href={fact.href}
                        className="underline-offset-2 hover:underline"
                      >
                        {fact.value}
                      </Link>
                    ) : (
                      fact.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Bio */}
        {shop?.bio && (
          <p className="text-foreground/80 max-w-2xl leading-relaxed whitespace-pre-line">
            {shop?.bio}
          </p>
        )}

        {/* Shop Description */}
        {shop?.description && (
          <div className="border-border bg-card rounded-xl border p-5">
            <h2 className="text-muted-foreground mb-2 text-xs font-semibold tracking-widest uppercase">
              About the Shop
            </h2>
            <p className="text-card-foreground/80 text-sm leading-relaxed whitespace-pre-line">
              {shop?.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {shop?.attributeTags && shop?.attributeTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {shop.attributeTags.map((tag) => {
              const badge = (
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs font-normal"
                >
                  {tag}
                </Badge>
              );
              const href = tagPaths[tag];
              return href ? (
                <Link key={tag} href={href}>
                  {badge}
                </Link>
              ) : (
                <span key={tag}>{badge}</span>
              );
            })}
          </div>
        )}

        {/* Mutual-aid listing (opt-in) */}
        <OpenToCollaborate shop={shop} />

        <Separator />

        {/* Contact Info */}
        <div className="grid gap-3 sm:grid-cols-2">
          {shop?.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-3 text-sm transition-colors"
            >
              <Phone className="size-4 shrink-0" />
              {shop.phone}
            </a>
          )}
          {shop?.email && (
            <a
              href={`mailto:${shop.email}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-3 text-sm transition-colors"
            >
              <Mail className="size-4 shrink-0" />
              {shop.email}
            </a>
          )}
          {showStreetAddress ? (
            <div className="text-muted-foreground flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>
                {[shop.address?.address, shop.address?.street]
                  .filter(Boolean)
                  .join(", ")}
                {shop.address?.city ||
                shop.address?.state ||
                shop.address?.zip ? (
                  <>
                    <br />
                    {[
                      shop.address?.city,
                      shop.address?.state,
                      shop.address?.zip,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </>
                ) : null}
                {shop.address?.country && (
                  <>
                    <br />
                    {shop.address.country}
                  </>
                )}
                {shop.address?.additional && (
                  <>
                    <br />
                    <span className="italic">{shop.address.additional}</span>
                  </>
                )}
              </span>
            </div>
          ) : (
            locality && (
              <div className="text-muted-foreground flex items-start gap-3 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {locality}
                  {shop.address?.country &&
                    !isUnitedStates(shop.address.country) && (
                      <>
                        <br />
                        {shop.address.country}
                      </>
                    )}
                </span>
              </div>
            )
          )}
          {shop?.website && (
            <OutboundLink
              href={shop.website}
              track={{
                shopId: shop.id,
                target: "WEBSITE",
                source: "SHOP_HERO",
              }}
              className="text-muted-foreground hover:text-foreground flex items-center gap-3 text-sm transition-colors"
            >
              <Globe className="size-4 shrink-0" />
              {shop.website.replace(/^https?:\/\//, "")}
            </OutboundLink>
          )}
        </div>

        {/* Social profiles */}
        {shop?.socialLinks && shop.socialLinks.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {shop.socialLinks.map((url) => {
              const { platform, label } = getSocialPlatform(url);
              return (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring flex size-9 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <SocialIcon platform={platform} className="size-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
