import Link from "next/link";
import { Cog, GraduationCap, Store } from "lucide-react";

import { selectHomepageEvents } from "~/lib/select-homepage-events";
import { buildPageMetadata } from "~/lib/seo/page-metadata";
import {
  eventSchema,
  organizationSchema,
  websiteSchema,
} from "~/lib/seo/schema";
import { getSiteSettings } from "~/server/seo/settings";
import { api } from "~/trpc/server";
import { JsonLd } from "~/components/seo/json-ld";

import { EventsBoard } from "./_components/events-board";
import { Hero } from "./_components/hero";
import { HomePageCard } from "./_components/homepage-card";

const CARD_DATA = [
  {
    link: "/shops",
    title: "Browse our shops",
    icon: <Store className="text-muted-foreground h-8 w-8" />,
    description: "Browse our artisan's shops and sites",
  },
  // {
  //   link: "/forums",
  //   title: "Share Knowledge",
  //   icon: <GraduationCap className="text-muted-foreground h-8 w-8" />,
  //   description: "Share your artisanal knowledge with others",
  // },
  {
    link: "/tools",
    title: "Utilize Free Tools",
    icon: <Cog className="text-muted-foreground h-8 w-8" />,
    description: "Use our collection of free tools",
  },
];

export async function generateMetadata() {
  const settings = await getSiteSettings();

  return buildPageMetadata({
    // Google derives the site name from the homepage title and WebSite data,
    // so lead with the exact brand and skip the " – Artisanal Futures"
    // template. An /admin/seo override replaces the whole title.
    title: `${settings.siteName} – Worker-owned artisan marketplace`,
    absoluteTitle: true,
    description:
      "Shop worker-owned artisan stores, find local makers and services, and share knowledge and tools as part of the transition to a decolonized circular economy.",
    path: "/",
  });
}

export default async function HomePage() {
  const [events, settings] = await Promise.all([
    api.event.getHomepageEvents(),
    getSiteSettings(),
  ]);
  const { featured, rest } = selectHomepageEvents(events);

  // The bulletin board also keeps "persisted" past events on show, but only
  // events that haven't ended belong in structured data.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter(
    (event) => (event.endDate ?? event.startDate) >= startOfToday,
  );

  return (
    <div className="page-container">
      <JsonLd
        data={[
          organizationSchema(settings),
          websiteSchema(settings),
          ...upcomingEvents.map(eventSchema),
        ]}
      />
      <Hero />
      <div className="bg-accent dark:border-accent/20 mt-12 grid grid-cols-1 gap-5 rounded-lg p-4 md:grid-cols-2 md:gap-10 dark:border">
        {CARD_DATA.map((item, idx) => (
          <HomePageCard {...item} key={idx} />
        ))}
      </div>

      <EventsBoard featured={featured} rest={rest} />

      <div className="my-16 space-y-4 text-center">
        <h2 className="mt-12 text-3xl font-bold">
          Artisanal Technologies for Generative Justice
        </h2>

        <p className="text-muted-foreground text-xl">
          Learn more about Artisanal Futures at the{" "}
          <Link
            href="https://generativejustice.org/af"
            className="text-primary underline underline-offset-4"
            target="_blank"
          >
            Center for Generative Justice
          </Link>
        </p>
      </div>
    </div>
  );
}
