import type { RouterOutputs } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";

type Shop = NonNullable<RouterOutputs["shop"]["get"]>;

type Props = {
  shop: Pick<
    Shop,
    "collabOffers" | "collabOfferTags" | "collabNeeds" | "collabNeedTags"
  >;
};

/** The shop's opt-in mutual-aid listing; renders nothing when it's empty. */
export function OpenToCollaborate({ shop }: Props) {
  const rows = [
    {
      label: "Can offer",
      tags: shop.collabOfferTags,
      text: shop.collabOffers?.trim(),
    },
    {
      label: "Looking for",
      tags: shop.collabNeedTags,
      text: shop.collabNeeds?.trim(),
    },
  ].filter((row) => row.tags.length > 0 || row.text);

  if (rows.length === 0) return null;

  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
        Open to collaborate
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-2">
            <dt className="text-card-foreground text-sm font-medium">
              {row.label}
            </dt>
            {row.tags.length > 0 && (
              <dd className="flex flex-wrap gap-1.5">
                {row.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-full px-2.5 py-0.5 text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </dd>
            )}
            {row.text && (
              <dd className="text-card-foreground/80 text-sm leading-relaxed whitespace-pre-line">
                {row.text}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}
