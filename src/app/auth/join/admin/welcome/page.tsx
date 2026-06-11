import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default async function AdminWelcomePage() {
  const session = await getSession();

  if (!session) return notFound();

  const firstName = session.user.name?.split(" ")[0] ?? session.user.name ?? "Admin";

  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Join Artisanal Futures</p>
            <h1>Welcome, {firstName}!</h1>
          </div>
          <p className="description">
            Your admin account is set up. Here are some quick links to help you
            get started managing the platform.
          </p>
        </div>
      </header>
      <section className="site-section">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Manage Invites</CardTitle>
                <CardDescription>
                  Send and track platform invitations for artisans, guests, and
                  admins.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/invites">Go to Invites</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  Browse and manage all products listed on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/products">Go to Products</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>
                  Review and manage all services offered by artisans.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/services">Go to Services</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Surveys</CardTitle>
                <CardDescription>
                  Review artisan surveys and guest survey responses.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/surveys">Artisan Surveys</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/guest-surveys">Guest Surveys</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Forum</CardTitle>
                <CardDescription>
                  Visit the community forum to engage with artisans and guests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/forums">Go to Forum</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>
                  Head to the full admin dashboard to manage all platform
                  content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin">Go to Admin Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

export const metadata = {
  title: "Welcome",
};
