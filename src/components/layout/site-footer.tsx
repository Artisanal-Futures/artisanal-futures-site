import Link from "next/link";

export const SiteFooter = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-accent/50 dark:bg-accent/20 mt-16 border-t">
      <section className="mx-auto flex w-full max-w-6xl p-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex-start col-span-2 flex flex-col gap-2">
            <h5 className="pb-2 text-lg font-semibold">Explore</h5>

            <Link
              href="/shops"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              Shops
            </Link>
            <Link
              href="/product-categories"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              Products
            </Link>
            <Link
              href="/service-categories"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              Services
            </Link>
            <Link
              href="/tools"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              Tools
            </Link>
          </div>
          <div className="flex-start flex flex-col gap-2">
            <h5 className="pb-2 text-lg font-semibold">The Collective</h5>
            <Link
              href="/about-us"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              About Us
            </Link>
            <Link
              href="/join"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              Interested in Joining?
            </Link>
            <Link
              href="/join/criteria"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              Artisan Criteria
            </Link>
            <Link
              href="/contact"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              Contact Us
            </Link>
          </div>
          <div className="flex-start flex flex-col gap-2">
            <h5 className="pb-2 text-lg font-semibold">Legal</h5>
            <Link
              href="/legal/collective-agreement"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              The Artisanal Futures Collective Agreement
            </Link>
            <Link
              href="/legal/privacy"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/terms-of-service"
              className="text-muted-foreground/80 hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </section>

      <div className="border-border/50 bg-accent/80 dark:bg-accent/30 border-t">
        <div className="mx-auto py-10">
          <p className="text-muted-foreground text-center text-sm">
            &copy; {year} Artisanal Futures. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
