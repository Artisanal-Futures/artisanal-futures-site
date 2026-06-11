"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { FeaturedEvent } from "./featured-event";
import { EventCard } from "./event-card";
import { EventDetailDialog } from "./event-detail-dialog";

export type HomepageEvent = RouterOutputs["event"]["getHomepageEvents"][number];

type Props = {
  featured: HomepageEvent | null;
  rest: HomepageEvent[];
};

export function EventsBoard({ featured, rest }: Props) {
  const [selected, setSelected] = useState<HomepageEvent | null>(null);

  return (
    <>
      <h2 className="mt-12 px-4 pt-4 text-2xl font-semibold text-foreground">
        Artisan Bulletin Board
      </h2>
      <p className="mb-3 px-4 text-muted-foreground">
        Check out current and upcoming events, workshops, and other cool stuff
      </p>

      <div className="rounded-2xl border bg-card shadow-sm">
        {!featured ? (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">
              Nothing on the calendar right now — check back soon!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-4 md:p-6">
            <FeaturedEvent event={featured} onOpen={setSelected} />

            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((event) => (
                  <EventCard key={event.id} event={event} onOpen={setSelected} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <EventDetailDialog
        event={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
