import Image from "next/image";
import { ExternalLink, Globe, Mail, MapPin, Phone } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
type Props = {
  shop: NonNullable<RouterOutputs["shop"]["get"]>;
};
export function ArtisanHero({ shop }: Props) {
  return (
    <section className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
      {/* Left: Artisan Photo + Identity */}
      <div className="flex flex-col items-center gap-6 lg:w-72 lg:shrink-0">
        {shop.ownerPhoto ? (
          <div className="border-card relative size-40 overflow-hidden rounded-full border-4 shadow-lg lg:size-52">
            <Image
              src={shop.ownerPhoto ?? "/placeholder.svg"}
              alt={`Portrait of ${shop.ownerName}`}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="border-card bg-muted flex size-40 items-center justify-center rounded-full border-4 shadow-lg lg:size-52">
            <span className="text-muted-foreground text-4xl font-semibold lg:text-5xl">
              {getInitials(shop.ownerName)}
            </span>
          </div>
        )}

        {/* Business logo + name (small, beneath the person) */}
        <div className="flex items-center gap-3">
          {shop.logoPhoto && (
            <div className="border-border relative size-9 shrink-0 overflow-hidden rounded-md border">
              <Image
                src={shop.logoPhoto}
                alt={`${shop.name} logo`}
                fill
                className="object-cover"
              />
            </div>
          )}
          <span className="text-muted-foreground text-sm font-medium">
            {shop.name}
          </span>
        </div>
      </div>

      {/* Right: Name, bio, details */}
      <div className="flex flex-1 flex-col gap-6">
        {/* Owner Name & Visit Website CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance lg:text-4xl">
              {shop.ownerName}
            </h1>
            <p className="text-muted-foreground mt-1 text-base">{shop.name}</p>
          </div>
          {shop.website && (
            <a
              href={shop.website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition-colors"
            >
              Visit Website
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>

        {/* Bio */}
        {shop.bio && (
          <p className="text-foreground/80 max-w-2xl leading-relaxed">
            {shop.bio}
          </p>
        )}

        {/* Shop Description */}
        {shop?.description && (
          <div className="border-border bg-card rounded-xl border p-5">
            <h2 className="text-muted-foreground mb-2 text-xs font-semibold tracking-widest uppercase">
              About the Shop
            </h2>
            <p className="text-card-foreground/80 text-sm leading-relaxed">
              {shop.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {shop?.attributeTags && shop?.attributeTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {shop.attributeTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

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
          {shop?.address?.address && (
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
          )}
          {shop?.website && (
            <a
              href={shop.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-3 text-sm transition-colors"
            >
              <Globe className="size-4 shrink-0" />
              {shop.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
