"use client";

import { useId } from "react";
import { AlertCircle, Layers, Loader2 } from "lucide-react";

import type { BoundaryLayerId } from "../_lib/boundaries";
import type { BoundaryStatus } from "./boundary-overlay";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

import {
  BOUNDARY_LAYER_IDS,
  BOUNDARY_LAYERS,
  isBoundaryLayer,
} from "../_lib/boundaries";

const NONE = "none";

/**
 * The map's "Layers" button (under Near me): pick one Detroit boundary
 * overlay, or none.
 */
export function MapLayersControl({
  value,
  onChange,
  status,
  className,
}: {
  value: BoundaryLayerId | null;
  onChange: (layer: BoundaryLayerId | null) => void;
  /** Load state of the active layer's file. */
  status: BoundaryStatus;
  className?: string;
}) {
  const id = useId();
  const active = value ? BOUNDARY_LAYERS[value] : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={
            active ? `Map layers, showing ${active.label}` : "Map layers"
          }
          title="Map layers"
          className={cn(
            "border-border bg-card text-foreground hover:bg-secondary relative size-[31px] rounded-[4px] border shadow-xs",
            active && "bg-secondary",
            className,
          )}
        >
          <Layers className="size-4" aria-hidden />
          {active && (
            <span
              aria-hidden
              className={cn(
                "border-card absolute -top-1 -right-1 size-2.5 rounded-full border-2",
                status === "error" ? "bg-destructive" : "bg-primary",
              )}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="left" align="start" className="w-64">
        <h2 className="text-sm leading-none font-semibold">Boundaries</h2>
        <p className="text-muted-foreground mt-1 mb-3 text-xs">
          Overlay Detroit civic areas under the pins.
        </p>
        <RadioGroup
          aria-label="Boundary layer"
          value={value ?? NONE}
          onValueChange={(next) =>
            onChange(isBoundaryLayer(next) ? next : null)
          }
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value={NONE} id={`${id}-${NONE}`} />
            <Label htmlFor={`${id}-${NONE}`} className="font-normal">
              None
            </Label>
          </div>
          {BOUNDARY_LAYER_IDS.map((layerId) => (
            <div key={layerId} className="flex items-center gap-2">
              <RadioGroupItem value={layerId} id={`${id}-${layerId}`} />
              <Label htmlFor={`${id}-${layerId}`} className="font-normal">
                {BOUNDARY_LAYERS[layerId].label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div aria-live="polite" className="text-xs">
          {active && status === "loading" && (
            <p className="text-muted-foreground mt-3 flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Loading {active.label.toLowerCase()}…
            </p>
          )}
          {active && status === "error" && (
            <p className="bg-destructive/10 text-foreground mt-3 flex gap-1.5 rounded-md p-2">
              <AlertCircle
                className="text-destructive mt-px size-3.5 shrink-0"
                aria-hidden
              />
              <span>
                {active.label} aren&apos;t available right now. The rest of the
                map still works.
              </span>
            </p>
          )}
          {active && status === "ready" && (
            <p className="text-muted-foreground mt-3">
              Source:{" "}
              <a
                href={active.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline underline-offset-2"
              >
                {active.source.name}
              </a>{" "}
              ({active.license})
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
