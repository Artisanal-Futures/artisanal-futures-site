import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const UPCY_URL = "https://generate.dev.artisanalfutures.org";

export default function GuestWelcomePage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Artisanal Futures</CardTitle>
          <CardDescription>You&apos;re in as a guest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            As a guest of Artisanal Futures, you have limited access on the
            platform. You can explore and use the tools we make available to
            guests.
          </p>
          <p className="text-muted-foreground">
            You have access to <strong>UPCY</strong>, our upcycling design tool.
            Use it to reimagine and visualize upcycled products.
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
  );
}

export const metadata = {
  title: "Welcome, Guest",
};
