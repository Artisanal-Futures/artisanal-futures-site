import Link from "next/link";

import { env } from "~/env";
import { getSession } from "~/server/better-auth/server";

import { WizardClient } from "./_components/wizard-client";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function ArtisanSignupPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const session = await getSession();
  const isDev = env.NODE_ENV === "development";

  if (session && !isDev) {
    return (
      <>
        <header className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 sm:pt-16 sm:pb-8 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
                Join Artisanal Futures
              </p>
              <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Become an Artisan
              </h1>
            </div>
          </div>
        </header>
        <section className="page-container">
          <div className="bg-muted/30 border-border mx-auto max-w-2xl rounded-lg border p-8 text-center">
            <h2 className="text-foreground mb-2 text-xl font-semibold">
              You&apos;re already registered
            </h2>
            <p className="text-muted-foreground mb-6">
              You already have an account on the platform. Welcome back!
            </p>
            <Link
              href="/"
              className="text-primary hover:underline font-medium"
            >
              Return to home
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <header className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 sm:pt-16 sm:pb-8 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              Join Artisanal Futures
            </p>
            <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              Become an Artisan
            </h1>
            {session && isDev && (
              <p className="text-muted-foreground text-sm italic">
                You wouldn&apos;t see this in production
              </p>
            )}
          </div>
        </div>
      </header>
      <section className="page-container">
        <WizardClient initialCode={code} />
      </section>
    </>
  );
}

export const metadata = {
  title: "Become an Artisan",
};
