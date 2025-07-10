/* eslint-disable @next/next/no-img-element */
import type { FC } from "react";
import Link from "next/link";

import type { Shop, Service } from "@prisma/client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";

type ServiceWithShop = Service & { shop?: Shop };

type Props = {
  service: ServiceWithShop;
};

export const NewServiceCard: FC<Props> = ({ service }) => {
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="h-full cursor-pointer overflow-hidden transition-all hover:shadow-lg">
          <div className="aspect-square overflow-hidden">
            <img
              src={service.imageUrl ?? "/img/background-fallback.jpg"}
              alt={`Image of ${service.name}`}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>

          <CardHeader className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {service.shop?.attributeTags?.map((tag) => tag).join(" • ")}
            </p>
            <CardTitle className="line-clamp-1 text-xl capitalize">
              {service.name}
            </CardTitle>
            <CardDescription className="line-clamp-1 capitalize">
              Offered By {service?.shop?.name}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-1">
              {service.attributeTags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>

          <CardFooter>
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </CardFooter>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {service.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            By {service?.shop?.name}
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <h4 className="font-semibold">Description</h4>
          <p className="text-sm text-muted-foreground">
            {stripHtmlTags(service.description)}
          </p>
        </div>
        <div className="mt-4">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/shops/${service.shopId}`}>View Shop</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};