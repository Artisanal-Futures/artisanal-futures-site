"use client";

import type { Role } from "generated/prisma";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProvisionStatus } from "generated/prisma";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Edit,
  ExternalLink,
  Globe,
  Mail,
  MessageSquare,
  Package,
  Server,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

// Platform-wide metrics for admin
// const platformMetrics = {
//   totalArtisans: 247,
//   totalProducts: 1842,
//   totalSites: 156,
//   totalEmails: 12450,
//   newArtisansThisMonth: 23,
//   productsAddedThisWeek: 89,
// };

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function ShopStats({
  artisan,
}: {
  artisan: RouterOutputs["shop"]["getAll"][number] | undefined;
}) {
  const productCount = artisan?.products?.length ?? 0;
  const serviceCount = artisan?.services?.length ?? 0;
  const hasWebsite = !!artisan?.website;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
            <Package className="text-foreground size-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-bold">{productCount}</p>
            <p className="text-muted-foreground text-sm">Products</p>
          </div>
        </div>
      </div>
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
            <ShoppingBag className="text-foreground size-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-bold">{serviceCount}</p>
            <p className="text-muted-foreground text-sm">Services</p>
          </div>
        </div>
      </div>
      <div className="border-border bg-card rounded-xl border p-5">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
            <Globe className="text-foreground size-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-bold">
              {hasWebsite ? "Active" : "None"}
            </p>
            <p className="text-muted-foreground text-sm">Website</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NudgeCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  href,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  variant?: "default" | "highlight";
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between ${
        variant === "highlight"
          ? "border-primary/20 from-primary/5 to-accent/10 bg-gradient-to-br"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${
            variant === "highlight" ? "bg-primary/10" : "bg-secondary"
          }`}
        >
          <Icon
            className={`size-5 ${
              variant === "highlight" ? "text-primary" : "text-foreground"
            }`}
          />
        </div>
        <div>
          <h3 className="text-foreground font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">
            {description}
          </p>
        </div>
      </div>
      <Button
        asChild
        variant={variant === "highlight" ? "default" : "outline"}
        className="shrink-0"
      >
        <Link href={href}>
          {actionLabel}
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </Button>
    </div>
  );
}

function PlatformMetrics() {
  const { data: metrics } = api.shop.getMetrics.useQuery();
  const totalArtisans = metrics?.shops ?? 0;
  const totalProducts = metrics?.products ?? 0;
  const totalServices = metrics?.services ?? 0;
  const totalSites = metrics?.websites ?? 0;
  const totalInvites = metrics?.invites ?? 0;
  const newArtisansThisMonth = metrics?.newArtisansThisMonth ?? 0;
  const productsAddedThisWeek = metrics?.productsAddedThisWeek ?? 0;
  return (
    <section className="mb-10">
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 className="text-primary size-5" />
        <h2 className="text-foreground text-lg font-semibold">
          Platform Overview
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Artisans</p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {totalArtisans}
              </p>
            </div>
            <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
              <Users className="text-foreground size-5" />
            </div>
          </div>
          <div className="text-muted-foreground mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="size-3 text-green-600" />
            <span className="font-medium text-green-600">
              +{newArtisansThisMonth}
            </span>
            <span>this month</span>
          </div>
        </div>

        <div className="border-border bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Products</p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {totalProducts.toLocaleString()}
              </p>
            </div>
            <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
              <Package className="text-foreground size-5" />
            </div>
          </div>
          <div className="text-muted-foreground mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="size-3 text-green-600" />
            <span className="font-medium text-green-600">
              +{productsAddedThisWeek}
            </span>
            <span>this week</span>
          </div>
        </div>

        <div className="border-border bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Hosted Sites</p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {totalSites}
              </p>
            </div>
            <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
              <Server className="text-foreground size-5" />
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            {Math.round((totalSites / totalArtisans) * 100)}% adoption rate
          </p>
        </div>

        <div className="border-border bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Emails Sent</p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {totalInvites.toLocaleString()}
              </p>
            </div>
            <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
              <Mail className="text-foreground size-5" />
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">All time</p>
        </div>
      </div>
    </section>
  );
}

export function DashboardClient({
  shops,
  user,
}: {
  shops: RouterOutputs["shop"]["getAll"];
  user: { name: string; photo: string; role: Role; shopId: string };
}) {
  // For admins, they can select any shop. For artisans, it's their own shop.
  const defaultArtisan = shops.find((a) => a.id === user.shopId) ?? shops[0];
  const [selectedArtisan, setSelectedArtisan] = useState<
    RouterOutputs["shop"]["getAll"][number] | undefined
  >(defaultArtisan);

  const productCount = selectedArtisan?.products?.length ?? 0;
  const hasWebsite = !!selectedArtisan?.website;
  const hasProducts = productCount > 0;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              {selectedArtisan?.logoPhoto ? (
                <div className="border-secondary relative size-16 overflow-hidden rounded-full border-2 shadow-sm">
                  <Image
                    src={selectedArtisan.logoPhoto}
                    alt={selectedArtisan.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="border-secondary bg-muted flex size-16 items-center justify-center rounded-full border-2">
                  <span className="text-muted-foreground text-xl font-semibold">
                    {selectedArtisan?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
                  {getGreeting()}, {user?.name?.split(" ")[0]}
                </h1>
                <p className="text-muted-foreground">{selectedArtisan?.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Admin shop selector */}
              {user.role === "ADMIN" && (
                <Select
                  value={selectedArtisan?.id}
                  onValueChange={(value) => {
                    const artisan = shops.find((a) => a.id === value);
                    if (artisan) setSelectedArtisan(artisan);
                  }}
                >
                  <SelectTrigger className="w-[220px]">
                    <Store className="text-muted-foreground mr-2 size-4" />
                    <SelectValue placeholder="Select shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="outline" asChild>
                <Link href={`/shops/${selectedArtisan?.id}`}>
                  View Public Profile
                  <ExternalLink className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/admin/shops/${selectedArtisan?.id}`}>
                  <Edit className="mr-2 size-4" />
                  Edit Shop
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Platform Metrics */}
        {user.role === "ADMIN" && <PlatformMetrics />}

        {user.role === "ADMIN" && (
          <div className="mb-10">
            <Separator />
            <p className="text-muted-foreground mt-6 mb-2 flex items-center gap-2 text-sm">
              <Store className="size-4" />
              Viewing:{" "}
              <span className="text-foreground font-medium">
                {selectedArtisan?.name}
              </span>
            </p>
          </div>
        )}

        {/* Shop Stats */}
        <section className="mb-10">
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Shop Overview
          </h2>
          <ShopStats artisan={selectedArtisan} />
        </section>

        {/* Contextual Nudges */}
        <section className="mb-10 space-y-4">
          {/* No products nudge */}
          {!hasProducts && (
            <NudgeCard
              icon={AlertCircle}
              title="Add your first product"
              description="Your shop doesn't have any products yet. Add products to help customers discover your work and drive traffic to your shop."
              actionLabel="Add Products"
              href="/admin/products"
              variant="highlight"
            />
          )}

          {/* Website nudges */}
          {selectedArtisan?.websiteProvision?.status !==
            ProvisionStatus.ACTIVE && (
            <>
              {hasWebsite ? (
                <NudgeCard
                  icon={Server}
                  title="Free website hosting available"
                  description={`We noticed ${selectedArtisan?.name} has a website at ${selectedArtisan?.website}. Did you know we offer free hosting? Migrate your site and save on hosting costs.`}
                  actionLabel="Learn About Hosting"
                  href="/admin/website"
                />
              ) : (
                <NudgeCard
                  icon={Globe}
                  title="Create your free website"
                  description="You don't have a website yet. We offer free, beautifully designed sites for artisans to showcase their work and start selling online. No technical skills required."
                  actionLabel="Create My Site"
                  href="/admin/website"
                  variant="highlight"
                />
              )}
            </>
          )}
        </section>

        {/* Platform Tools */}
        <section className="mb-10">
          <h2 className="text-foreground mb-6 text-lg font-semibold">
            Platform Tools
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Forum */}
            <Link
              href="/forum"
              className="group border-border bg-card hover:border-ring/30 flex flex-col gap-4 rounded-xl border p-6 transition-all hover:shadow-md"
            >
              <div className="bg-secondary flex size-11 items-center justify-center rounded-lg">
                <MessageSquare className="text-foreground size-5" />
              </div>
              <div>
                <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
                  Community Forum
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Connect with fellow artisans, share tips, and grow together.
                </p>
              </div>
              <span className="text-primary mt-auto inline-flex items-center text-sm font-medium">
                Join the conversation
                <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* UPCY */}
            <a
              href="https://generate.dev.artisanalfutures.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="group border-border bg-card hover:border-ring/30 flex flex-col gap-4 rounded-xl border p-6 transition-all hover:shadow-md"
            >
              <div className="bg-secondary flex size-11 items-center justify-center rounded-lg">
                <Sparkles className="text-foreground size-5" />
              </div>
              <div>
                <h3 className="text-foreground group-hover:text-primary flex items-center gap-2 font-semibold transition-colors">
                  UPCY
                  <ExternalLink className="text-muted-foreground size-3.5" />
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Discover upcycling resources and sustainable materials.
                </p>
              </div>
              <span className="text-primary mt-auto inline-flex items-center text-sm font-medium">
                Explore UPCY
                <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>

            {/* Import Products */}
            <Link
              href="/admin/products/migrate"
              className="group border-border bg-card hover:border-ring/30 flex flex-col gap-4 rounded-xl border p-6 transition-all hover:shadow-md"
            >
              <div className="bg-secondary flex size-11 items-center justify-center rounded-lg">
                <Package className="text-foreground size-5" />
              </div>
              <div>
                <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
                  Import Products
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Bulk import products from Shopify, Squarespace, or WordPress.
                </p>
              </div>
              <span className="text-primary mt-auto inline-flex items-center text-sm font-medium">
                Start importing
                <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>

        {/* Quick Links
        <section>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link
              href={`/shops/${selectedArtisan?.id}`}
              className="hover:text-foreground transition-colors"
            >
              View public profile
            </Link>
            <Link
              href="/products"
              className="hover:text-foreground transition-colors"
            >
              Browse all products
            </Link>
            <Link
              href="/shops"
              className="hover:text-foreground transition-colors"
            >
              Artisan directory
            </Link>
            <Link
              href="/join"
              className="hover:text-foreground transition-colors"
            >
              Invite an artisan
            </Link>
          </div>
        </section> */}
      </div>
    </div>
  );
}
