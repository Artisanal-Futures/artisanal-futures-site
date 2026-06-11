import Link from "next/link";

import { env } from "~/env";
import { getSession } from "~/server/better-auth/server";

import { AdminWizardClient } from "./_components/admin-wizard-client";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function AdminJoinPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const session = await getSession();
  const isDev = env.NODE_ENV === "development";

  if (session && !isDev) {
    return (
      <>
        <header className="site-header">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="tagline">Join Artisanal Futures</p>
              <h1>Become an Admin</h1>
            </div>
          </div>
        </header>
        <section className="site-section">
          <div className="bg-muted/30 border-border mx-auto max-w-2xl rounded-lg border p-8 text-center">
            <h2 className="text-foreground mb-2 text-xl font-semibold">
              You&apos;re already registered
            </h2>
            <p className="text-muted-foreground mb-6">
              You already have an account on the platform. Welcome back!
            </p>
            <Link href="/" className="text-primary font-medium hover:underline">
              Return to home
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <AdminWizardClient initialCode={code} />
    </>
  );
}

export const metadata = {
  title: "Become an Admin",
};
