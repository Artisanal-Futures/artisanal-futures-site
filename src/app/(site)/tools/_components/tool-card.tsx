"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";

type Props = {
  title: string;
  subtitle: string;
  image: string;
  url: string;
  type?: string;
};

export const ToolCard = ({ title, subtitle, image, url, type }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (title.toLowerCase().includes("in progress")) {
      e.preventDefault();
      setIsDialogOpen(true);
    }
  };

  const imageSrc =
    image.startsWith("http") || image.startsWith("/") ? image : `/${image}`;

  return (
    <>
      <Link
        className="group h-full"
        href={url}
        target={url.includes(".app") || url.includes(".dev") ? "_blank" : ""}
        onClick={handleClick}
      >
        <div className="group border-border bg-card hover:border-ring/30 flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border text-left shadow-sm transition-all hover:shadow-md">
          {/* Image */}
          <div className="bg-muted relative aspect-square w-full overflow-hidden">
            <Image
              src={imageSrc}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 p-4">
            <h3 className="text-card-foreground group-hover:text-foreground text-base leading-snug font-semibold">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
            {type && (
              <div className="mt-auto flex flex-wrap gap-1 pt-2">
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary/80 rounded-full px-2 py-0 text-[10px] font-normal"
                >
                  {type}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Link>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Update in Progress</DialogTitle>
          </DialogHeader>
          <p>
            We are currently in the process of updating the application. Please
            check back later to use the app.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
