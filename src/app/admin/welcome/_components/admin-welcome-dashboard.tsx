"use client";

import Image from "next/image";
import Link from "next/link";
import { ProvisionStatus } from "generated/prisma";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Globe,
  KeyRound,
  Lightbulb,
  MessageSquare,
  Package,
  Server,
  Sparkles,
} from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { UPCY_BASE_URL } from "~/lib/upcy";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  href?: string;
  action?: string;
}

export function AdminWelcomeDashboard({
  shopData,
  owner,
}: {
  shopData: NonNullable<RouterOutputs["shop"]["getWelcomeShop"]>;
  owner: {
    name: string;
    photo: string;
  };
}) {
  const provisionStatus = shopData?.shop?.websiteProvision?.status;
  // Only a live (ACTIVE) provision counts as a hosted website; the router's
  // `hasHostedWebsite` is true for any provision, including failed ones.
  const hasHostedWebsite = provisionStatus === ProvisionStatus.ACTIVE;
  const isProvisioning =
    provisionStatus === ProvisionStatus.PENDING ||
    provisionStatus === ProvisionStatus.PROVISIONING ||
    provisionStatus === ProvisionStatus.BUILDING ||
    provisionStatus === ProvisionStatus.DEPLOYING;
  const provisionFailed = provisionStatus === ProvisionStatus.FAILED;
  const hasWebsite = !!shopData?.shop?.website;
  const hasProfile = !!shopData?.completedSurvey && !!shopData?.shop;
  // Derived from the shop's relation counts so products and services are
  // tracked independently (the router flags can't tell them apart reliably).
  const hasProducts = (shopData?.shop?._count?.products ?? 0) > 0;
  const hasServices = (shopData?.shop?._count?.services ?? 0) > 0;

  const checklist: ChecklistItem[] = [
    {
      id: "profile",
      label: "Complete your profile and shop details",
      description:
        "Add a bio, photo, and shop details to help customers find you",
      completed: hasProfile,
      href: `/admin/shops/${shopData?.shop?.id}`,
      action: "Edit Shop",
    },
    {
      id: "products",
      label: "Add your first product",
      description: "Showcase what you create so visitors can explore your work",
      completed: hasProducts,
      href: `/admin/products`,
      action: "View Products",
    },
    {
      id: "services",
      label: "Add your first service",
      description: "Showcase what you offer so visitors can explore your work",
      completed: hasServices,
      href: `/admin/services`,
      action: "View Services",
    },
    {
      id: "website",
      label: isProvisioning
        ? "Your free site is being set up"
        : provisionFailed
          ? "Fix your free site setup"
          : hasWebsite
            ? "Connect your website"
            : "Create your free site",
      description: isProvisioning
        ? "We're building your site. Check back soon or view its progress"
        : provisionFailed
          ? "Something went wrong while setting up your site"
          : hasWebsite
            ? "We offer free hosting for your existing website"
            : "Get a simple, beautiful site to start selling online",
      completed: hasHostedWebsite,
      href: "/admin/website",
      action: isProvisioning
        ? "View Status"
        : provisionFailed
          ? "Review"
          : hasWebsite
            ? "Learn More"
            : "Get Started",
    },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-12">
          <div className="mb-6 flex items-center gap-4">
            {owner.photo ? (
              <div className="border-secondary relative size-16 overflow-hidden rounded-full border-2 shadow-sm">
                <Image
                  src={owner.photo}
                  alt={owner.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="border-secondary bg-muted flex size-16 items-center justify-center rounded-full border-2">
                <span className="text-muted-foreground text-xl font-semibold">
                  {owner.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
                Welcome, {owner.name.split(" ")[0]}
              </h1>
              <p className="text-muted-foreground">{shopData?.shop?.name}</p>
            </div>
          </div>
          <p className="text-foreground/80 max-w-2xl leading-relaxed">
            {
              "We're thrilled to have you as part of our artisan community. This is your home base for managing your profile, connecting with other makers, and growing your craft business."
            }
          </p>
        </header>

        {/* Getting Started Checklist */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-foreground text-lg font-semibold">
              Getting Started
            </h2>
            <span className="text-muted-foreground text-sm">
              {completedCount} of {checklist.length} complete
            </span>
          </div>
          <Progress
            value={(completedCount / checklist.length) * 100}
            className="mb-6 h-2"
          />

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 rounded-xl border p-5 transition-colors ${
                  item.completed
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-card hover:border-ring/30"
                }`}
              >
                <div className="mt-0.5">
                  {item.completed ? (
                    <CheckCircle2 className="text-primary size-5" />
                  ) : (
                    <Circle className="text-muted-foreground/50 size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-medium ${item.completed ? "text-primary" : "text-foreground"}`}
                  >
                    {item.label}
                  </h3>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {item.description}
                  </p>
                </div>
                {!item.completed && item.href && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="shrink-0"
                  >
                    <Link href={item.href}>
                      {item.action}
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Website Section - Contextual based on whether they have a website */}

        {!hasHostedWebsite && (
          <section className="mb-12">
            <div className="border-border from-secondary/50 to-accent/30 rounded-2xl border bg-gradient-to-br p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-xl">
                    {hasWebsite || isProvisioning || provisionFailed ? (
                      <Server className="text-primary size-6" />
                    ) : (
                      <Globe className="text-primary size-6" />
                    )}
                  </div>
                  <div>
                    {isProvisioning ? (
                      <>
                        <h3 className="text-foreground text-lg font-semibold">
                          Your Website Is Being Set Up
                        </h3>
                        <p className="text-muted-foreground mt-1 max-w-md text-sm">
                          We&apos;re building your free site. This can take a
                          little while; check the status page for the latest
                          progress.
                        </p>
                      </>
                    ) : provisionFailed ? (
                      <>
                        <h3 className="text-foreground text-lg font-semibold">
                          Website Setup Failed
                        </h3>
                        <p className="text-muted-foreground mt-1 max-w-md text-sm">
                          Something went wrong while setting up your site. Open
                          the website page to see what happened and try again.
                        </p>
                      </>
                    ) : hasWebsite ? (
                      <>
                        <h3 className="text-foreground text-lg font-semibold">
                          Free Website Hosting
                        </h3>
                        <p className="text-muted-foreground mt-1 max-w-md text-sm">
                          We noticed you already have a website. Did you know we
                          offer free hosting for artisan businesses? Migrate
                          your site to our platform and save on hosting costs
                          while reaching more customers.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-foreground text-lg font-semibold">
                          Get Your Free Website
                        </h3>
                        <p className="text-muted-foreground mt-1 max-w-md text-sm">
                          {
                            "Don't have a website yet? We offer free, beautifully designed sites for artisans to showcase their work and start selling online. No technical skills required."
                          }
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <Button asChild className="shrink-0">
                  <Link href={"/admin/website"}>
                    {isProvisioning
                      ? "View Status"
                      : provisionFailed
                        ? "Review Website"
                        : hasWebsite
                          ? "Explore Hosting"
                          : "Create My Site"}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Platform Tools */}
        <section className="mb-12">
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
                  Connect with fellow artisans, share tips, ask questions, and
                  grow together.
                </p>
              </div>
              <span className="text-primary mt-auto inline-flex items-center text-sm font-medium">
                Join the conversation
                <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* UPCY */}
            <a
              href={UPCY_BASE_URL}
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
                  Discover upcycling resources, sustainable materials, and
                  eco-friendly practices.
                </p>
              </div>
              <span className="text-primary mt-auto inline-flex items-center text-sm font-medium">
                Explore UPCY
                <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>

            {/* Add Products */}
            <Link
              href="/admin/products"
              className="group border-border bg-card hover:border-ring/30 flex flex-col gap-4 rounded-xl border p-6 transition-all hover:shadow-md"
            >
              <div className="bg-secondary flex size-11 items-center justify-center rounded-lg">
                <Package className="text-foreground size-5" />
              </div>
              <div>
                <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
                  Add Products
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Showcase your creations. Add photos, descriptions, and link to
                  your shop.
                </p>
              </div>
              <span className="text-primary mt-auto inline-flex items-center text-sm font-medium">
                Add your first product
                <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>

        {/* Account Security Section */}
        <section className="mb-12">
          <div className="border-border bg-card rounded-xl border p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <KeyRound className="text-foreground size-5" />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold">
                    Sign in faster next time
                  </h3>
                  <p className="text-muted-foreground mt-1 max-w-md text-sm">
                    You signed up with email and password, but you can also link
                    a Google, Discord, or Auth0 account so you can sign in with
                    one click going forward. Use the same email you signed up
                    with.
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild className="shrink-0">
                <Link href="/account/security">
                  Connect an account
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="mb-12">
          <div className="border-border bg-card rounded-xl border p-6">
            <div className="flex items-start gap-4">
              <div className="bg-accent flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Lightbulb className="text-accent-foreground size-5" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold">Quick Tip</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Artisan profiles with photos and detailed bios get{" "}
                  <strong className="text-foreground">3x more visits</strong>{" "}
                  than incomplete profiles. Take a few minutes to tell your
                  story and let customers connect with the maker behind the
                  craft.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
