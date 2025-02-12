import type { FC } from "react";
import { cn } from "~/utils/styles";
import { Store, User } from "lucide-react";

import type { Shop } from "@prisma/client";

import { env } from "~/env";
import BlurImage from "~/components/ui/blur-image";

type Props = Shop & React.HTMLAttributes<HTMLDivElement>;

export const ShopCard: FC<Props> = ({
  id,
  ownerName,
  name,
  website,
  logoPhoto,

  className,
  ownerPhoto,
}) => {
  const availableImage = `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${
    ownerPhoto! && ownerPhoto != ""
      ? ownerPhoto
      : logoPhoto! && logoPhoto != ""
        ? logoPhoto
        : "background-fallback.jpg"
  }`;

  return (
    <div className={cn("", className)}>
      <div className="group relative w-full overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg">
        <a href={`/shops/${id}`}>
          <div className="relative aspect-square w-full overflow-hidden">
            <BlurImage
              src={availableImage}
              alt={`${name}'s shop image`}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </a>

        <div className="space-y-4 p-4">
          <div className="flex flex-col">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              {ownerName}
            </h3>
            <p className="text-sm text-slate-500">{name}</p>
          </div>

          <div className="flex gap-2">
            <a
              href={`/shops/${id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-slate-100 py-2 text-center text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200"
            >
              <Store className="h-4 w-4" />
              View Shop
            </a>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-slate-900 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <User className="h-4 w-4" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
