import Link from "next/link";
import { Cog, GraduationCap, Store } from "lucide-react";

import { api } from "~/trpc/server";
import { selectHomepageEvents } from "~/lib/select-homepage-events";
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
  {
    link: "/forum",
    title: "Share Knowledge",
    icon: <GraduationCap className="text-muted-foreground h-8 w-8" />,
    description: "Share your artisanal knowledge with others",
  },
  {
    link: "/tools",
    title: "Utilize Free Tools",
    icon: <Cog className="text-muted-foreground h-8 w-8" />,
    description: "Use our collection of free tools",
  },
];

export default async function HomePage() {
  const events = await api.event.getHomepageEvents();
  const { featured, rest } = selectHomepageEvents(events);

  return (
    <div className="page-container">
      <Hero />
      <div className="bg-accent dark:border-accent/20 mt-12 grid grid-cols-1 gap-5 rounded-lg p-4 md:grid-cols-3 md:gap-10 dark:border">
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
