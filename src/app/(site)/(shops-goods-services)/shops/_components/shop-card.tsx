import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { getInitials } from "~/lib/get-initials";
import { handleImageUrl } from "~/lib/handle-image-url";
import { shopPath } from "~/lib/seo/paths";

/** Only the fields the card renders, so landing pages can pass lighter rows. */
type Shop = Pick<
  NonNullable<RouterOutputs["shop"]["getAllPublic"][number]>,
  "id" | "slug" | "name" | "ownerName" | "ownerPhoto" | "logoPhoto" | "website"
>;

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <article className="group border-border bg-card hover:border-ring/30 relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md">
      {/* Owner portrait */}
      <Link href={shopPath(shop)}>
        {shop?.ownerPhoto ? (
          <div className="bg-muted relative aspect-square w-full overflow-hidden">
            <Image
              src={handleImageUrl(shop?.ownerPhoto)}
              alt={`Portrait of ${shop?.ownerName}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : shop?.logoPhoto ? (
          <div className="bg-muted relative aspect-square w-full overflow-hidden">
            <Image
              src={handleImageUrl(shop?.logoPhoto)}
              alt={`Logo of ${shop?.name}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="bg-muted flex aspect-4/3 w-full items-center justify-center">
            <span className="text-muted-foreground text-3xl font-semibold">
              {getInitials(shop?.ownerName ?? "")}
            </span>
          </div>
        )}
      </Link>

      {/* Identity */}
      <div className="flex flex-col items-center gap-1 px-6 pt-5 pb-6 text-center">
        <h2 className="text-foreground text-base leading-tight font-semibold text-balance">
          {shop?.ownerName}
        </h2>
        <span className="text-muted-foreground text-sm">{shop?.name}</span>
      </div>

      {/* Footer actions */}
      <div className="border-border mt-auto flex items-center border-t">
        <Link
          href={shopPath(shop)}
          className="text-foreground hover:bg-secondary flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors"
        >
          View Profile
        </Link>
        {shop?.website && (
          <>
            <div className="bg-border h-8 w-px" />
            <a
              href={shop?.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:bg-secondary hover:text-foreground flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors"
            >
              Website
              <ExternalLink className="size-3.5" />
            </a>
          </>
        )}
      </div>
    </article>
  );
}
