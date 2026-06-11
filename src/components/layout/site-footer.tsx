import Link from "next/link";

export const SiteFooter = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-accent/50 dark:bg-accent/20 mt-auto border-t">
      <section className="mx-auto flex w-full max-w-6xl p-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex-start col-span-2 flex flex-col gap-2">
            <h5 className="pb-2 text-lg font-semibold">Explore</h5>

            <Link
              href="/shops"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Shops
            </Link>
            <Link
              href="/collections/products"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Products
            </Link>
            <Link
              href="/collections/services"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Services
            </Link>
            <Link
              href="/tools"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Tools
            </Link>
          </div>
          <div className="flex-start flex flex-col gap-2">
            <h5 className="pb-2 text-lg font-semibold">The Collective</h5>
            <Link
              href="/about-us"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              About Us
            </Link>
            <Link
              href="/join"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Interested in Joining?
            </Link>
            <Link
              href="/join/criteria"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Artisan Criteria
            </Link>
            <Link
              href="/contact"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Contact Us
            </Link>
          </div>
          <div className="flex-start flex flex-col gap-2">
            <h5 className="pb-2 text-lg font-semibold">Legal</h5>
            <Link
              href="/legal/collective-agreement"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              The Artisanal Futures Collective Agreement
            </Link>
            <Link
              href="/legal/privacy"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/terms-of-use"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Terms of Use
            </Link>
            <Link
              href="/legal/cookies"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Cookies Policy
            </Link>
            <Link
              href="/legal/help-center"
              className="text-muted-foreground/80 hover:text-foreground text-sm"
            >
              Help Center
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
