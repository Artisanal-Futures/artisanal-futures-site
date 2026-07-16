"use client";

import { AlertTriangle, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { type RouterOutputs, api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";

type Provision = NonNullable<RouterOutputs["websiteProvision"]["getMyProvision"]>;

const HELP_EMAIL = "csdt@generativejustice.org";

function needsPolling(provision: Provision | null | undefined) {
  if (!provision) return false;
  return (
    provision.status === "PROVISIONING" ||
    (provision.status === "ACTIVE" && !provision.claimedAt)
  );
}

/**
 * Consistent muted footer shown at the bottom of every status-card state so
 * artisans always have a way to reach a human.
 */
function HelpFooter() {
  return (
    <p className="text-muted-foreground pt-2 text-xs">
      Need help? Contact us at{" "}
      <a
        href={`mailto:${HELP_EMAIL}`}
        className="underline underline-offset-2 hover:text-foreground"
      >
        {HELP_EMAIL}
      </a>
    </p>
  );
}

export function ProvisionStatusCard({ shopId }: { shopId: string }) {
  const utils = api.useUtils();

  const provisionQuery = api.websiteProvision.getMyProvision.useQuery(
    { shopId },
    {
      refetchInterval: (query) => (needsPolling(query.state.data) ? 5000 : false),
    },
  );

  const retryMutation = api.websiteProvision.requestMySite.useMutation({
    onSuccess: (result) => {
      toast.success(
        result?.claimUrl
          ? "Done - we've emailed you a fresh claim link."
          : "Rebuilding your website...",
      );
      utils.websiteProvision.getMyProvision.setData({ shopId }, result);
      void utils.websiteProvision.getMyProvision.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Shares the ConnectionIndicator's query (same key + options), so this adds
  // no extra network call. Every retry path here hits the SimplePress API, so
  // the buttons stay disabled until the health check comes back green.
  const connectionQuery =
    api.websiteProvision.checkSimplePressConnection.useQuery(undefined, {
      retry: false,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    });
  const simplePressConnected = connectionQuery.data?.connected === true;
  const simplePressUnreachable =
    !connectionQuery.isPending && !simplePressConnected;

  const provision = provisionQuery.data;

  if (!provision) {
    return null;
  }

  const connectionNotice = simplePressUnreachable ? (
    <p className="text-sm text-red-600">
      We can&apos;t connect to SimplePress right now, so this isn&apos;t
      available. Please try again later.
    </p>
  ) : null;

  const retryButton = (label: string, pendingLabel: string) => (
    <>
      <Button
        onClick={() => retryMutation.mutate({ shopId })}
        disabled={retryMutation.isPending || !simplePressConnected}
      >
        {retryMutation.isPending ? (
          <>
            <Spinner className="mr-2 size-4" />
            {pendingLabel}
          </>
        ) : (
          label
        )}
      </Button>
      {connectionNotice}
    </>
  );

  if (provision.status === "PROVISIONING") {
    // A genuinely in-flight build resolves in well under a minute; anything
    // older is a stuck/legacy row the owner can safely restart (SimplePress
    // is idempotent on the provision token).
    const stale =
      Date.now() - new Date(provision.updatedAt).getTime() > 2 * 60 * 1000;

    return (
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Spinner className="size-5" />
            Building your website...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            This usually only takes a moment. Feel free to leave this page -
            we&apos;ll email you as soon as your site is ready.
          </p>
          {stale && (
            <>
              <p className="text-muted-foreground text-sm">
                This is taking longer than expected. You can safely restart the
                build.
              </p>
              {retryButton("Restart the build", "Restarting...")}
            </>
          )}
          <HelpFooter />
        </CardContent>
      </Card>
    );
  }

  if (provision.status === "ACTIVE" && !provision.claimedAt) {
    // Legacy rows (pre-claim-flow) are ACTIVE but never got a claim link -
    // offer to finish setup instead of dead-ending.
    if (!provision.claimUrl) {
      return (
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="text-amber-600 size-5" />
              Finish setting up your website
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Your website was reserved earlier, but setup was never completed.
              Click below and we&apos;ll build it on SimplePress and email your
              shop&apos;s contact address a link to claim it.
            </p>
            {retryButton("Finish setup", "Building your website...")}
            <HelpFooter />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-amber-600 size-5" />
            Your website is ready - claim it!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            We emailed you a claim link. Sign up on SimplePress using your shop
            email address to take ownership of your new site.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a
                href={provision.claimUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Claim your site
                <ExternalLink className="ml-2 size-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => retryMutation.mutate({ shopId })}
              disabled={retryMutation.isPending || !simplePressConnected}
            >
              {retryMutation.isPending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Resending...
                </>
              ) : (
                "Resend claim email"
              )}
            </Button>
          </div>
          {connectionNotice}
          <HelpFooter />
        </CardContent>
      </Card>
    );
  }

  if (provision.status === "ACTIVE" && provision.claimedAt) {
    const claimedDate = new Date(provision.claimedAt).toLocaleDateString(
      undefined,
      { year: "numeric", month: "long", day: "numeric" },
    );

    return (
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="text-green-600 size-5" />
            Your website is live
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Your business is live on SimplePress. You manage your site&apos;s
            content and design directly there.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {provision.subdomain && (
              <div>
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Subdomain
                </dt>
                <dd className="text-foreground text-sm font-medium">
                  {provision.subdomain}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Claimed on
              </dt>
              <dd className="text-foreground text-sm font-medium">
                {claimedDate}
              </dd>
            </div>
          </dl>
          {provision.deploymentUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <a
                  href={provision.deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit your storefront
                  <ExternalLink className="ml-2 size-4" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`${provision.deploymentUrl}/admin`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Manage your site
                  <ExternalLink className="ml-2 size-4" />
                </a>
              </Button>
            </div>
          )}
          <HelpFooter />
        </CardContent>
      </Card>
    );
  }

  if (provision.status === "FAILED") {
    return (
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="text-destructive size-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {provision.errorMessage ??
              "We couldn't finish building your website."}
          </p>
          <Button
            onClick={() => retryMutation.mutate({ shopId })}
            disabled={retryMutation.isPending || !simplePressConnected}
          >
            {retryMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-4" />
                Retrying...
              </>
            ) : (
              "Try again"
            )}
          </Button>
          {connectionNotice}
          <HelpFooter />
        </CardContent>
      </Card>
    );
  }

  // Other statuses (WordPress / Coolify path: BUILDING, DEPLOYING, SUSPENDED,
  // DELETING, DELETED, PENDING) - keep this generic.
  return (
    <Card className="mb-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          Website status
          <Badge variant="secondary">{provision.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Your website is currently {provision.status.toLowerCase()}.
        </p>
        <HelpFooter />
      </CardContent>
    </Card>
  );
}
