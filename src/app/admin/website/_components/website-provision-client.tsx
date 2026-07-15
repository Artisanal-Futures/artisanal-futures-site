"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Code,
  Globe,
  Palette,
  Shield,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

import { ProvisionStatusCard } from "./provision-status-card";
import { ShopPicker } from "./shop-picker";

/**
 * Live AF ↔ SimplePress link check. Green means a signed health call
 * round-tripped — URL, network, tokens, HMAC secret, and clock skew all
 * agree, so a real build request would authenticate. Admins also see the
 * failure diagnostic.
 */
function ConnectionIndicator() {
  const connectionQuery =
    api.websiteProvision.checkSimplePressConnection.useQuery(undefined, {
      retry: false,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    });

  if (connectionQuery.isPending) {
    return (
      <div className="text-muted-foreground mb-6 flex items-center gap-2 text-xs">
        <span className="size-2 animate-pulse rounded-full bg-gray-400" />
        Checking connection to SimplePress...
      </div>
    );
  }

  const data = connectionQuery.data;
  const connected = data?.connected === true;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`size-2 rounded-full ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className={connected ? "text-muted-foreground" : "text-red-600"}>
          {connected
            ? "Connected to SimplePress"
            : "Can't reach SimplePress right now"}
        </span>
      </div>
      {!connected && data?.detail && (
        <p className="mt-1 pl-4 text-xs text-red-600/80">{data.detail}</p>
      )}
    </div>
  );
}

const siteOptions = {
  wordpress: {
    name: "WordPress",
    tagline: "Full-featured and flexible",
    description:
      "A powerful, industry-standard platform with thousands of themes and plugins. Perfect if you want full control over your site.",
    pros: [
      "Thousands of themes and plugins",
      "Full e-commerce with WooCommerce",
      "Complete customization control",
      "Industry standard - lots of tutorials",
    ],
    cons: [
      "Steeper learning curve",
      "Requires more maintenance",
      "Can be overwhelming for beginners",
    ],
    icon: Code,
    color: "bg-blue-500/10 text-blue-600",
  },
  simplepress: {
    name: "SimplePress",
    tagline: "Beautiful and beginner-friendly",
    description:
      "Our streamlined platform built specifically for artisans. Get online fast with a beautiful site that's easy to manage.",
    pros: [
      "Set up in minutes, not hours",
      "Designed specifically for artisans",
      "No technical knowledge needed",
      "Built-in product showcase",
    ],
    cons: [
      "Restricted customization options",
      "Limited plugin ecosystem",
      "Newer platform (still in development)",
    ],
    icon: Sparkles,
    color: "bg-amber-500/10 text-amber-600",
  },
};

function FeatureItem({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "pro" | "con";
}) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {type === "pro" ? (
        <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
      ) : (
        <X className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      )}
      <span className={type === "con" ? "text-muted-foreground" : ""}>
        {children}
      </span>
    </li>
  );
}

/**
 * WordPress is kept in the comparison for context but can't be chosen (no
 * `onSelect` / hover / selected affordances) - the free-website flow only
 * builds SimplePress sites. SimplePress is shown as the (only) selected
 * option since it's the sole actionable choice.
 */
function SiteOptionCard({ type }: { type: "wordpress" | "simplepress" }) {
  const option = siteOptions[type];
  const Icon = option.icon;
  const isAvailable = type === "simplepress";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all ${
        isAvailable
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card opacity-60"
      }`}
    >
      {/* Selection indicator - SimplePress is the only choosable option */}
      {isAvailable && (
        <div className="bg-primary absolute top-4 right-4 flex size-6 items-center justify-center rounded-full">
          <Check className="text-primary-foreground size-4" />
        </div>
      )}

      {/* Icon and name */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex size-12 items-center justify-center rounded-xl ${option.color}`}
        >
          <Icon className="size-6" />
        </div>
        <div>
          <h3 className="text-foreground text-lg font-semibold">
            {option.name}
          </h3>
          <p className="text-muted-foreground text-sm">{option.tagline}</p>
        </div>
      </div>

      {!isAvailable && (
        <Badge variant="secondary" className="mb-4 w-fit">
          Not currently available
        </Badge>
      )}

      {/* Description */}
      <p className="text-foreground/80 mb-6 text-sm">{option.description}</p>

      {/* Pros */}
      <div className="mb-4">
        <p className="text-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          Best for
        </p>
        <ul className="space-y-1.5">
          {option.pros.map((pro) => (
            <FeatureItem key={pro} type="pro">
              {pro}
            </FeatureItem>
          ))}
        </ul>
      </div>

      {/* Cons */}
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          Consider
        </p>
        <ul className="space-y-1.5">
          {option.cons.map((con) => (
            <FeatureItem key={con} type="con">
              {con}
            </FeatureItem>
          ))}
        </ul>
      </div>

      {!isAvailable && (
        <p className="text-muted-foreground mt-4 text-xs">
          We may offer WordPress hosting again in the future.
        </p>
      )}
    </div>
  );
}

/**
 * Everything scoped to one shop: figures out whether that shop already has a
 * provision (show the status card) or needs the chooser + build CTA.
 */
function ProvisionGate({ shopId }: { shopId: string }) {
  const utils = api.useUtils();

  const provisionQuery = api.websiteProvision.getMyProvision.useQuery({
    shopId,
  });

  const requestSiteMutation = api.websiteProvision.requestMySite.useMutation({
    onSuccess: (result) => {
      toast.success("Your website is ready!");
      utils.websiteProvision.getMyProvision.setData({ shopId }, result);
      void utils.websiteProvision.getMyProvision.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Don't flash the chooser while we're still finding out whether this shop
  // already has a provision.
  if (provisionQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Spinner className="size-4" />
        Checking your website status...
      </div>
    );
  }

  // An existing provision (of any status) means this shop already went
  // through the chooser - show the live status card instead.
  if (provisionQuery.data) {
    return <ProvisionStatusCard shopId={shopId} />;
  }

  return (
    <>
      {/* What's included */}
      <div className="border-border bg-card mb-10 rounded-2xl border p-6 sm:p-8">
        <h2 className="text-foreground mb-6 text-lg font-semibold">
          What you get - completely free
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <div className="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Globe className="text-foreground size-5" />
            </div>
            <div>
              <p className="text-foreground font-medium">Free Hosting</p>
              <p className="text-muted-foreground text-sm">
                No monthly fees, ever
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Zap className="text-foreground size-5" />
            </div>
            <div>
              <p className="text-foreground font-medium">Fast Setup</p>
              <p className="text-muted-foreground text-sm">
                Online in minutes
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Shield className="text-foreground size-5" />
            </div>
            <div>
              <p className="text-foreground font-medium">SSL Included</p>
              <p className="text-muted-foreground text-sm">
                Secure by default
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Palette className="text-foreground size-5" />
            </div>
            <div>
              <p className="text-foreground font-medium">Custom Domain</p>
              <p className="text-muted-foreground text-sm">
                We help you connect it
              </p>
            </div>
          </div>
        </div>

        <div className="border-border mt-6 border-t pt-6">
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">Only cost:</span>{" "}
            Your domain name (typically $10-15/year). We&apos;ll help you
            register and connect it. Already have a site? Our admins can help
            migrate your content.
          </p>
        </div>
      </div>

      <h2 className="text-foreground mb-6 text-lg font-semibold">
        Choose your platform
      </h2>
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <SiteOptionCard type="simplepress" />
        <SiteOptionCard type="wordpress" />
      </div>

      {/* Early stage notice */}
      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Early stage program</p>
            <p className="mt-1 text-sm text-amber-800">
              SimplePress hosting is in early stages. You may encounter
              occasional bugs or limitations. Our team is here to help - just
              reach out if you need anything.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            disabled={requestSiteMutation.isPending}
            size="lg"
            className="w-full sm:w-auto"
          >
            {requestSiteMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-4" />
                Building your website...
              </>
            ) : (
              <>
                Build my free website
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Build your SimplePress website?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Here&apos;s what happens when you continue:</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    We&apos;ll build your website on SimplePress right away
                    using your shop&apos;s name, logo, and contact email — it
                    usually takes under half a minute.
                  </li>
                  <li>
                    Your site starts in &quot;coming soon&quot; mode, so
                    nothing is public yet.
                  </li>
                  <li>
                    We&apos;ll email your shop&apos;s contact address a link
                    to claim the site. You&apos;ll create your SimplePress
                    account with that same email — that&apos;s what makes the
                    site yours and takes it live.
                  </li>
                  <li>
                    You can watch the progress on this page while you wait.
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => requestSiteMutation.mutate({ shopId })}
            >
              Build my website
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {requestSiteMutation.isPending && (
        <p className="text-muted-foreground mt-3 text-sm">
          Building your website... this can take up to half a minute.
        </p>
      )}
    </>
  );
}

export function WebsiteProvisionClient() {
  const shopsQuery = api.websiteProvision.listMyShops.useQuery();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const shops = shopsQuery.data;

  // Default selection once shops load: single-shop artisans and ADMINs both
  // land on the first shop; the picker (when shown) can change it from there.
  useEffect(() => {
    if (shops && shops.length > 0 && selectedShopId === null) {
      setSelectedShopId(shops[0]!.id);
    }
  }, [shops, selectedShopId]);

  // Don't flash the empty state / chooser while we're still finding out
  // which shops the caller can act on.
  if (shopsQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Spinner className="size-4" />
        Loading your shops...
      </div>
    );
  }

  if (!shops || shops.length === 0) {
    return (
      <div className="border-border bg-card rounded-2xl border p-8 text-center">
        <p className="text-foreground font-medium">
          You need a shop before requesting a website
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Set up your shop profile first, then come back here to get your
          free website.
        </p>
      </div>
    );
  }

  const activeShopId =
    selectedShopId && shops.some((shop) => shop.id === selectedShopId)
      ? selectedShopId
      : shops[0]!.id;

  return (
    <>
      {shops.length > 1 && (
        <ShopPicker
          shops={shops}
          value={activeShopId}
          onChange={setSelectedShopId}
        />
      )}
      <ConnectionIndicator />
      {/* Remount on shop switch so no per-shop mutation/query state leaks
          across shops. */}
      <ProvisionGate key={activeShopId} shopId={activeShopId} />
    </>
  );
}
