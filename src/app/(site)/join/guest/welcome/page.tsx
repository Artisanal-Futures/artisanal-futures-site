import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const UPCY_URL = "https://generate.dev.artisanalfutures.org";

export default async function GuestWelcomePage() {
  const session = await getSession();

  if (!session) return notFound();
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Join Artisanal Futures</p>
            <h1>Welcome to Artisanal Futures!</h1>
          </div>
          <p className="description">
            As a guest of Artisanal Futures, you have limited access on the
            platform. You can explore and use the tools we make available to
            guests.
          </p>
        </div>
      </header>
      <section className="site-section">
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>UPCY Design Tool</CardTitle>
              <CardDescription>
                Use it to reimagine and visualize upcycled products.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You have access to <strong>UPCY</strong>, our upcycling design
                tool. Try it out below!
              </p>
              <p>
                <Link
                  href={UPCY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium underline underline-offset-4 hover:no-underline"
                >
                  Open UPCY → {UPCY_URL}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

export const metadata = {
  title: "Welcome",
};
