import Link from 'next/link'

import Container from './container'

const Footer = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16 border-t bg-accent/50 dark:bg-accent/20">
      <Container>
        <section className="mx-auto flex w-full max-w-6xl p-4 py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex-start flex flex-col gap-2">
              <h5 className="pb-2 text-lg font-semibold">Products</h5>
              <Link
                href="/products"
                className="text-muted-foreground/80 hover:text-foreground"
              >
                All
              </Link>
              <Link
                href="/shops"
                className="text-muted-foreground/80 hover:text-foreground"
              >
                Shops
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
                href="/auth/sign-up"
                className="text-muted-foreground/80 hover:text-foreground"
              >
                Become an Artisan
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
            <div className="flex-start flex flex-col gap-2">
              <h5 className="pb-2 text-lg font-semibold">Follow Us</h5>
              <Link
                href="#!"
                className="text-muted-foreground/80 hover:text-foreground"
              >
                Facebook
              </Link>
              <Link
                href="#!"
                className="text-muted-foreground/80 hover:text-foreground"
              >
                Twitter
              </Link>
              <Link
                href="#!"
                className="text-muted-foreground/80 hover:text-foreground"
              >
                Instagram
              </Link>
            </div>
          </div>
        </section>
      </Container>
      <div className="border-t border-border/50 bg-accent/80 dark:bg-accent/30">
        <div className="mx-auto py-10">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {year} Artisanal Futures. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
