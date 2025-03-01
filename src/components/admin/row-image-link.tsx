"use client";

import Image from "next/image";

type Props = {
  id: string;
  name: string;
  image?: string;
  hasLink?: boolean;
  subheader?: string;
};

export const RowImageLink = ({ name, image, subheader }: Props) => {
  return (
    <div className="group flex w-full items-center gap-2">
      <div className="relative aspect-square h-10 rounded-lg border border-border shadow-sm">
        <Image
          src={image ?? "/placeholder-image.webp"}
          fill
          className="rounded-lg"
          alt=""
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-500">{name}</span>
        {subheader && (
          <span className="text-xs text-muted-foreground">{subheader}</span>
        )}
      </div>
    </div>
  );
};
