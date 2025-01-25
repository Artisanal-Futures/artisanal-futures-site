import type { FC } from "react";
import { cn } from "~/utils/styles";
import { Store, User } from "lucide-react";

import type { Shop } from "@prisma/client";

import { env } from "~/env";
import BlurImage from "~/components/ui/blur-image";

type IProps = Shop & React.HTMLAttributes<HTMLDivElement>;

const ShopCard: FC<IProps> = ({
  id,
  ownerName,
  name,
  website,
  logoPhoto,
  bio,
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
      <div className="w-full rounded bg-slate-50 p-4 shadow">
        <div className="relative aspect-square w-full">
          <BlurImage src={availableImage} alt="" />
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-xl font-semibold">{ownerName}</h3>
            <p className="font-normal text-slate-500">{name}</p>
          </div>

          <div className="flex gap-2">
            {bio && logoPhoto && (
              <a
                className="block rounded bg-slate-400 p-2 text-white"
                href={`/shops/${id}`}
              >
                <span className="sr-only">Head to artisan profile</span>
                <User />
              </a>
            )}

            {website && (
              <a
                className="block rounded bg-slate-500 p-2 text-white"
                href={website}
              >
                <span className="sr-only">Head to artisan&apos;s website</span>
                <Store />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;
