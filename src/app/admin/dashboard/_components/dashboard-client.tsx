"use client";

import type { Role } from "generated/prisma";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProvisionStatus } from "generated/prisma";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Edit,
  ExternalLink,
  EyeOff,
  FolderTree,
  Globe,
  HeartHandshake,
  MessageSquare,
  Package,
  PackageX,
  Send,
  Server,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
  Zap,
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
  const totalMembers = metrics?.users ?? 0;
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="text-muted-foreground text-sm">Invites Sent</p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {totalInvites.toLocaleString()}
              </p>
            </div>
            <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
              <Send className="text-foreground size-5" />
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">All time</p>
        </div>

        <div className="border-border bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Services</p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {totalServices.toLocaleString()}
              </p>
            </div>
            <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
              <HeartHandshake className="text-foreground size-5" />
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">Across all shops</p>
        </div>

        <div className="border-border bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Members</p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {totalMembers.toLocaleString()}
              </p>
            </div>
            <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
              <UserRound className="text-foreground size-5" />
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">All accounts</p>
        </div>
      </div>
    </section>
  );
}

type AttentionItem = {
  key: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  destructive?: boolean;
};

// Surfaces actionable items admins should follow up on. Only shown when the
// underlying count is greater than zero; otherwise renders an empty state.
function NeedsAttention() {
  const { data: metrics } = api.shop.getMetrics.useQuery();

  const items: AttentionItem[] = [
    {
      key: "pendingProvisions",
      count: metrics?.pendingProvisions ?? 0,
      icon: Server,
      label: "Pending website provisions",
      href: "/admin/website-provisions",
    },
    {
      key: "failedProvisions",
      count: metrics?.failedProvisions ?? 0,
      icon: AlertTriangle,
      label: "Failed provisions",
      href: "/admin/website-provisions",
      destructive: true,
    },
    {
      key: "expiringInvites",
      count: metrics?.expiringInvites ?? 0,
      icon: Clock,
      label: "Invites expiring soon",
      href: "/admin/invites",
    },
    {
      key: "shopsWithoutProducts",
      count: metrics?.shopsWithoutProducts ?? 0,
      icon: PackageX,
      label: "Shops without products",
      href: "/admin/shops",
    },
    {
      key: "hiddenShops",
      count: metrics?.hiddenShops ?? 0,
      icon: EyeOff,
      label: "Hidden shops",
      href: "/admin/shops",
    },
  ];

  const visibleItems = items.filter((item) => item.count > 0);

  return (
    <section className="mb-10">
      <div className="mb-6 flex items-center gap-2">
        <AlertCircle className="text-primary size-5" />
        <h2 className="text-foreground text-lg font-semibold">
          Needs Attention
        </h2>
      </div>

      {visibleItems.length === 0 ? (
        <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-5">
          <div className="bg-secondary flex size-10 items-center justify-center rounded-lg">
            <CheckCircle2 className="text-foreground size-5" />
          </div>
          <p className="text-muted-foreground text-sm">
            {"You're all caught up. Nothing needs your attention right now."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group border-border bg-card hover:border-ring/30 flex items-center gap-3 rounded-xl border p-5 transition-all hover:shadow-md"
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  item.destructive ? "bg-destructive/10" : "bg-secondary"
                }`}
              >
                <item.icon
                  className={`size-5 ${
                    item.destructive ? "text-destructive" : "text-foreground"
                  }`}
                />
              </div>
              <div>
                <p className="text-foreground text-xl font-bold">
                  {item.count}
                </p>
                <p className="text-muted-foreground text-sm">{item.label}</p>
              </div>
              <ArrowRight className="text-muted-foreground ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

type QuickAction = {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
};

// A grid of shortcuts to the most common admin destinations, reusing the
// same "Platform Tools" card markup used in the shop view.
function QuickActions() {
  const actions: QuickAction[] = [
    {
      key: "invite",
      href: "/admin/invites",
      icon: UserPlus,
      title: "Send an invite",
      description: "Invite a new artisan or team member to join the platform.",
      cta: "Send an invite",
    },
    {
      key: "provisions",
      href: "/admin/website-provisions",
      icon: Globe,
      title: "Website provisions",
      description: "Review and manage hosted website provisioning requests.",
      cta: "Manage provisions",
    },
    {
      key: "members",
      href: "/admin/users",
      icon: Users,
      title: "Manage members",
      description: "View and manage all platform accounts and permissions.",
      cta: "Manage members",
    },
    {
      key: "categories",
      href: "/admin/categories",
      icon: FolderTree,
      title: "Categories",
      description: "Organize products and services into browsable categories.",
      cta: "Edit categories",
    },
    {
      key: "surveys",
      href: "/admin/surveys",
      icon: ClipboardList,
      title: "Surveys",
      description: "Review survey responses and manage active surveys.",
      cta: "View surveys",
    },
  ];

  return (
    <section className="mb-10">
      <div className="mb-6 flex items-center gap-2">
        <Zap className="text-primary size-5" />
        <h2 className="text-foreground text-lg font-semibold">
          Quick Actions
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className="group border-border bg-card hover:border-ring/30 flex flex-col gap-4 rounded-xl border p-6 transition-all hover:shadow-md"
          >
            <div className="bg-secondary flex size-11 items-center justify-center rounded-lg">
              <action.icon className="text-foreground size-5" />
            </div>
            <div>
              <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
                {action.title}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {action.description}
              </p>
            </div>
            <span className="text-primary mt-auto inline-flex items-center text-sm font-medium">
              {action.cta}
              <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
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

  // Admins default to a platform-wide view; artisans only ever see their shop.
  const [view, setView] = useState<"platform" | "shop">("platform");

  const productCount = selectedArtisan?.products?.length ?? 0;
  const hasWebsite = !!selectedArtisan?.website;
  const hasProducts = productCount > 0;

  const isAdmin = user.role === "ADMIN";

  // Segmented toggle letting admins switch between the platform-wide
  // overview and the per-shop (artisan) view. Not shown to non-admins.
  const modeToggle = isAdmin && (
    <div className="border-border bg-card mb-8 inline-flex items-center gap-1 rounded-lg border p-1">
      <Button
        type="button"
        size="sm"
        variant={view === "platform" ? "default" : "ghost"}
        onClick={() => setView("platform")}
      >
        Platform
      </Button>
      <Button
        type="button"
        size="sm"
        variant={view === "shop" ? "default" : "ghost"}
        onClick={() => setView("shop")}
      >
        Artisan View
      </Button>
    </div>
  );

  // The per-shop view: header (with the admin-only shop selector already
  // guarded below), shop stats, contextual nudges, and platform tools.
  // Shared between the admin's "shop" mode and the (unchanged) artisan path.
  const shopView = (
    <>
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
            href="/forums"
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
    </>
  );

  // Platform-wide view: a lightweight admin greeting, the mode toggle,
  // platform metrics, actionable items needing attention, and quick
  // shortcuts to common admin destinations.
  const platformView = (
    <>
      <header className="mb-8">
        <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
          {getGreeting()}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">Platform overview</p>
      </header>

      {modeToggle}

      <PlatformMetrics />
      <NeedsAttention />
      <QuickActions />
    </>
  );

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto w-full max-w-7xl">
        {isAdmin && view === "platform" ? (
          platformView
        ) : (
          <>
            {modeToggle}
            {shopView}
          </>
        )}

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
