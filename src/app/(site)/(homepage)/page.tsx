import Image from "next/image";
import Link from "next/link";
import { Cog, GraduationCap, Store } from "lucide-react";

import { EventBulletinBoard } from "./_components/event-bulletin-board";
import { Hero } from "./_components/hero";
import { HomePageCard } from "./_components/homepage-card";

const CARD_DATA = [
  {
    link: "/shops",
    title: "Browse our shops",
    icon: <Store className="h-8 w-8 text-muted-foreground" />,
    description: "Browse our artisan's shops and sites",
  },
  {
    link: "/forum",
    title: "Share Knowledge",
    icon: <GraduationCap className="h-8 w-8 text-muted-foreground" />,
    description: "Share your artisanal knowledge with others",
  },
  {
    link: "/tools",
    title: "Utilize Free Tools",
    icon: <Cog className="h-8 w-8 text-muted-foreground" />,
    description: "Use our collection of free tools",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mt-12 grid grid-cols-1 gap-5 rounded-lg bg-accent p-4 dark:border dark:border-accent/20 md:grid-cols-3 md:gap-10">
        {CARD_DATA.map((item, idx) => (
          <HomePageCard {...item} key={idx} />
        ))}
      </div>

      <EventBulletinBoard
        upcomingEvents={[
          {
            shopName: "Home Ec Detroit",
            text: `
              A Hoophouse Warming 

              Neighbors in Bloom

              A cozy space where community and connection take root

              📍 15100 Mendota St, Detroit, MI 48238
              📅 November 8th, 2025
              ⏰ 2 PM - 5 PM

              Bulb Planting Activity
              Bonfire & S'mores
              Herbal Tea Bar
              Community Yoga
              Collage Table Vendors
              Music
              Moxie the Foxie
            `,
            imageUrl: "/img/homeec-nov.png",
            // ctaLabel: "Learn More",
            // ctaHref: "https://www.dbcfsn.org/harvest2025",
          },
        ]}
      />

      <div className="mt-4 space-y-4 text-center">
        <h2 className="mt-12 text-3xl font-bold">
          Artisanal Technologies for Generative Justice
        </h2>

        <p className="text-xl text-muted-foreground">
          Learn more about Artisanal Futures at the{" "}
          <Link
            href="https://generativejustice.org/af"
            className="text-primary underline underline-offset-4"
            target="_blank"
          >
            Center for Generative Justice
          </Link>
        </p>

        {/* <Image
          width={200}
          height={160}
          src="/img/flowchart.png"
          alt="Flowchart showing the generative nature of artisanal tech"
          className="aspect-auto w-full"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        /> */}
      </div>
    </>
  );
}
