"use client";

import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

import type { MapShop } from "../_lib/types";
import { SITE_URL } from "~/lib/seo/site-url";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

import { BOUNDARY_LAYERS } from "../_lib/boundaries";
import {
  buildCitation,
  exportFileName,
  MAP_DATA_LICENSE,
  toCsv,
  toGeoJson,
} from "../_lib/export";
import { useMapSectors } from "./map-sectors-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAP_URL = `${SITE_URL}/tools/artisan-map`;

type ExportScope = "all" | "filtered";

/** Saves `content` as a file. CSV gets a BOM so Excel reads it as UTF-8. */
function downloadFile(filename: string, content: string, type: string) {
  const parts = type.startsWith("text/csv") ? ["﻿", content] : [content];
  const url = URL.createObjectURL(new Blob(parts, { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const linkClass =
  "text-foreground font-medium underline underline-offset-2 hover:text-primary";

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {children}
    </a>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

type MapAboutContentProps = {
  /** Every shop on the map. */
  shops: MapShop[];
  /** Shops passing the current filters. */
  filteredShops: MapShop[];
  hasFilters: boolean;
};

function MapAboutContent({
  shops,
  filteredShops,
  hasFilters,
}: MapAboutContentProps) {
  const id = useId();
  const sectors = useMapSectors();
  const [scope, setScope] = useState<ExportScope>("all");
  // Without filters both scopes are the same set, so "current" is disabled.
  const effectiveScope: ExportScope = hasFilters ? scope : "all";
  const exportShops = effectiveScope === "filtered" ? filteredShops : shops;
  const citation = useMemo(() => buildCitation({ url: MAP_URL }), []);

  const download = (format: "csv" | "geojson") => {
    if (exportShops.length === 0) {
      toast.info("No artisans to download");
      return;
    }
    const filename = exportFileName(effectiveScope, format);
    if (format === "csv") {
      downloadFile(
        filename,
        toCsv(exportShops, SITE_URL, sectors),
        "text/csv;charset=utf-8",
      );
    } else {
      downloadFile(
        filename,
        JSON.stringify(toGeoJson(exportShops, SITE_URL, sectors), null, 2),
        "application/geo+json",
      );
    }
  };

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      toast.success("Citation copied");
    } catch {
      toast.error("Couldn't copy the citation");
    }
  };

  const boundarySources = [
    ...new Map(
      Object.values(BOUNDARY_LAYERS).map((l) => [l.source.url, l.source]),
    ).values(),
  ];

  return (
    <div className="space-y-6">
      <Section title="Our mission">
        <p>
          Artisanal Futures helps worker-owned businesses, collectives and
          artisans build a community-based circular economy. This map shows
          who&apos;s in the network and where, so artisans and neighbors can
          find each other.{" "}
          <Link href="/about-us" className={linkClass}>
            About us
          </Link>
        </p>
      </Section>

      <Section title="Data sources">
        <ul className="list-disc space-y-1 pl-5">
          <li>Shop profiles, written and kept up to date by the artisans.</li>
          <li>
            Locations geocoded with{" "}
            <ExternalLink href="https://nominatim.org/">
              OpenStreetMap Nominatim
            </ExternalLink>
            .
          </li>
          <li>
            Basemap by{" "}
            <ExternalLink href="https://openfreemap.org/">
              OpenFreeMap
            </ExternalLink>
            , with data ©{" "}
            <ExternalLink href="https://www.openstreetmap.org/copyright">
              OpenStreetMap contributors
            </ExternalLink>
            .
          </li>
          <li>
            Boundary layers from{" "}
            {boundarySources.map((source, i) => (
              <span key={source.url}>
                {i > 0 && " and "}
                <ExternalLink href={source.url}>{source.name}</ExternalLink>
              </span>
            ))}
            .
          </li>
        </ul>
      </Section>

      <Section title="Privacy">
        <p>
          Storefronts are pinned at their public street address. Everyone else
          is shown at an approximate spot, offset 0.4–1.2 km from the centre of
          their ZIP code or town, never at a home address. Downloads follow the
          same rule and never include email addresses, phone numbers or owner
          names.
        </p>
      </Section>

      <Section title="Get on the map">
        <ul className="space-y-1">
          <li>
            <Link href="/join" className={linkClass}>
              Join Artisanal Futures
            </Link>{" "}
            to add your shop.
          </li>
          <li>
            Already a member?{" "}
            <Link href="/admin/shops" className={linkClass}>
              Update your shop
            </Link>{" "}
            to fix your entry.
          </li>
          <li>
            Anything missing or wrong?{" "}
            <Link href="/contact" className={linkClass}>
              Tell us
            </Link>
            .
          </li>
        </ul>
      </Section>

      <Section title="Download the data">
        <RadioGroup
          aria-label="Which artisans to download"
          value={effectiveScope}
          onValueChange={(next) =>
            setScope(next === "filtered" ? "filtered" : "all")
          }
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="all" id={`${id}-all`} />
            <Label htmlFor={`${id}-all`} className="font-normal">
              All artisans ({shops.length})
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="filtered"
              id={`${id}-filtered`}
              className="peer"
              disabled={!hasFilters}
              aria-describedby={hasFilters ? undefined : `${id}-filtered-hint`}
            />
            <Label htmlFor={`${id}-filtered`} className="font-normal">
              Current filters (
              {hasFilters ? filteredShops.length : shops.length})
            </Label>
            {!hasFilters && (
              <span
                id={`${id}-filtered-hint`}
                className="text-muted-foreground text-xs"
              >
                No filters applied
              </span>
            )}
          </div>
        </RadioGroup>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => download("csv")}
          >
            <Download aria-hidden />
            CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => download("geojson")}
          >
            <Download aria-hidden />
            GeoJSON
          </Button>
        </div>

        <p>
          Shared under{" "}
          <ExternalLink href={MAP_DATA_LICENSE.url}>
            {MAP_DATA_LICENSE.name}
          </ExternalLink>
          . You can reuse it, as long as you credit Artisanal Futures. Please
          cite:
        </p>
        <figure className="bg-muted/60 relative rounded-md border p-3 pr-11">
          <blockquote className="text-foreground text-xs leading-relaxed break-words">
            {citation}
          </blockquote>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Copy citation"
            title="Copy citation"
            className="absolute top-1.5 right-1.5"
            onClick={() => void copyCitation()}
          >
            <Copy aria-hidden />
          </Button>
        </figure>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

const TITLE = "About this map";
const DESCRIPTION = "Where the data comes from, and how to download it.";

/**
 * "About & data": mission, sources, privacy, how to get listed, and the data
 * download. A side sheet on desktop, a bottom drawer on mobile.
 */
export function MapAbout({
  open,
  onOpenChange,
  isDesktop,
  ...content
}: MapAboutContentProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDesktop: boolean;
}) {
  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{TITLE}</SheetTitle>
            <SheetDescription>{DESCRIPTION}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <MapAboutContent {...content} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>{TITLE}</DrawerTitle>
          <DrawerDescription>{DESCRIPTION}</DrawerDescription>
        </DrawerHeader>
        <div data-vaul-no-drag className="min-h-0 flex-1 overflow-y-auto p-4">
          <MapAboutContent {...content} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
