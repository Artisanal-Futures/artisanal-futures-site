"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

import { ProvisionStatusCard } from "./provision-status-card";

type SiteType = "wordpress" | "simplepress" | null;
type ProvisionStep = "choose" | "confirm" | "provisioning" | "complete";

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

function SiteOptionCard({
  type,
  selected,
  onSelect,
}: {
  type: "wordpress" | "simplepress";
  selected: boolean;
  onSelect: () => void;
}) {
  const option = siteOptions[type];
  const Icon = option.icon;

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-ring/50 hover:shadow-sm"
      }`}
    >
      {/* Selection indicator */}
      {selected && (
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
    </button>
  );
}

export function WebsiteProvisionClient() {
  const router = useRouter();
  const utils = api.useUtils();

  const [step] = useState<ProvisionStep>("choose");
  const [selectedType, setSelectedType] = useState<SiteType>(null);

  const provisionQuery = api.websiteProvision.getMyProvision.useQuery();

  const requestSiteMutation = api.websiteProvision.requestMySite.useMutation({
    onSuccess: (result) => {
      toast.success("Your website is ready!");
      utils.websiteProvision.getMyProvision.setData(undefined, result);
      void utils.websiteProvision.getMyProvision.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // An existing provision (of any status) means the artisan already went
  // through the chooser - show the live status card instead.
  if (provisionQuery.data) {
    return <ProvisionStatusCard />;
  }

  return (
    <>
      {/* What's included */}
      {step === "choose" && (
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
      )}

      {/* Step: Choose */}
      {step === "choose" && (
        <>
          <h2 className="text-foreground mb-6 text-lg font-semibold">
            Choose your platform
          </h2>
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <SiteOptionCard
              type="simplepress"
              selected={selectedType === "simplepress"}
              onSelect={() => setSelectedType("simplepress")}
            />
            <SiteOptionCard
              type="wordpress"
              selected={selectedType === "wordpress"}
              onSelect={() => setSelectedType("wordpress")}
            />
          </div>

          {/* Early stage notice */}
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  Early stage program
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Both hosting options are in early stages. You may encounter
                  occasional bugs or limitations. Our team is here to help -
                  just reach out if you need anything.
                </p>
              </div>
            </div>
          </div>

          {selectedType === "simplepress" ? (
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
                          We&apos;ll build your website on SimplePress right
                          away using your shop&apos;s name, logo, and contact
                          email — it usually takes under half a minute.
                        </li>
                        <li>
                          Your site starts in &quot;coming soon&quot; mode, so
                          nothing is public yet.
                        </li>
                        <li>
                          We&apos;ll email your shop&apos;s contact address a
                          link to claim the site. You&apos;ll create your
                          SimplePress account with that same email — that&apos;s
                          what makes the site yours and takes it live.
                        </li>
                        <li>
                          You can watch the progress on this page while you
                          wait.
                        </li>
                      </ul>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Not yet</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => requestSiteMutation.mutate()}
                  >
                    Build my website
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              onClick={() => router.push("/contact")}
              disabled={!selectedType}
              size="lg"
              className="w-full sm:w-auto"
            >
              Contact us to get started
              <ArrowRight className="ml-2 size-4" />
            </Button>
          )}
          {requestSiteMutation.isPending && (
            <p className="text-muted-foreground mt-3 text-sm">
              Building your website... this can take up to half a minute.
            </p>
          )}
        </>
      )}
    </>
  );
}
