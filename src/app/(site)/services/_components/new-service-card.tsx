/* eslint-disable @next/next/no-img-element */
import type { FC } from "react";
import { useState } from "react";
import Link from "next/link";

import type { ServiceWithShop } from "~/types/service"; 

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";

type Props = {
  service: ServiceWithShop;
};

export const NewServiceCard: FC<Props> = ({ service }) => {
  const [isOpen, setIsOpen] = useState(false);

  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  const serviceUrl = service.shop?.website ?? `/shops/${service.shopId}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="h-full cursor-pointer overflow-hidden transition-all hover:shadow-lg">
          <div className="aspect-square overflow-hidden">
            <img
              src={service.imageUrl ?? "/img/background-fallback.jpg"}
              alt={`Image of ${service.name}`}
              className="h-full w-full object-cover transition-transform hover:scale-105"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = "/img/background-fallback.jpg";
              }}
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-lg">
            <img
              src={service.imageUrl ?? "/img/background-fallback.jpg"}
              alt={`Image of ${service.name}`}
              className="h-full w-full object-cover"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = "/img/background-fallback.jpg";
              }}
            />
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Description</h4>
              <ScrollArea className="h-48">
                <p className="text-sm text-muted-foreground">
                  {stripHtmlTags(service.description)}
                </p>
              </ScrollArea>
            </div>

            {service.tags.length > 0 && (
              <div>
                <h4 className="mb-1 font-semibold">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {service.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {service.attributeTags.length > 0 && (
              <div>
                <h4 className="mb-1 font-semibold">Attributes</h4>
                <div className="flex flex-wrap gap-1">
                  {service.attributeTags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {service.aiGeneratedTags.length > 0 && (
              <div>
                <h4 className="mb-1 font-semibold">AI Generated Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {service.aiGeneratedTags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          <Button asChild className="flex-1">
            <Link href={serviceUrl ?? "#"} target="_blank">
              View Service
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/shops/${service.shopId}`}>View Shop</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
