import Image from "next/image";
import Link from "next/link";
import { Store } from "lucide-react";

import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { RefreshButton } from "~/components/refresh-button";

export default async function NotFound() {
  return (
    <div className="bg-background relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4">
      {/* Subtle grid texture */}
      <div
        className="not-found-pattern pointer-events-none absolute inset-0"
        aria-hidden
      />

      <main className="relative z-10 flex max-w-lg flex-col items-center text-center">
        <Link
          href="/"
          className="text-foreground focus:ring-primary mb-8 block rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
        >
          <Image
            src={"/logos/logo.png"}
            alt="Artisanal Futures logo"
            width={120}
            height={48}
            className="h-12 w-auto object-contain"
            unoptimized
          />
        </Link>

        <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
          Error 404
        </p>
        <h1 className="text-foreground mb-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          This page does not exist.
        </h1>
        <p className="text-muted-foreground mb-10 max-w-md text-base leading-relaxed sm:text-lg">
          <>
            The product, shop, or page may have been removed, or there may be a
            temporary issue with the site. Try heading back or refreshing.
          </>
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/">
              <Store className="size-4 shrink-0" aria-hidden />
              Back to home
            </Link>
          </Button>
          <RefreshButton />
        </div>

        <p className="text-muted-foreground/80 mt-12 text-sm">
          Need help?{" "}
          <Link
            href="/contact"
            className="text-primary underline-offset-2 hover:underline"
          >
            Contact support
          </Link>
        </p>
      </main>
    </div>
  );
}
