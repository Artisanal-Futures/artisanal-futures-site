"use client";

import { AlertTriangle, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { type RouterOutputs, api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";

type Provision = NonNullable<RouterOutputs["websiteProvision"]["getMyProvision"]>;

function needsPolling(provision: Provision | null | undefined) {
  if (!provision) return false;
  return (
    provision.status === "PROVISIONING" ||
    (provision.status === "ACTIVE" && !provision.claimedAt)
  );
}

export function ProvisionStatusCard() {
  const utils = api.useUtils();

  const provisionQuery = api.websiteProvision.getMyProvision.useQuery(
    undefined,
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
      utils.websiteProvision.getMyProvision.setData(undefined, result);
      void utils.websiteProvision.getMyProvision.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const provision = provisionQuery.data;

  if (!provision) {
    return null;
  }

  const retryButton = (label: string, pendingLabel: string) => (
    <Button
      onClick={() => retryMutation.mutate()}
      disabled={retryMutation.isPending}
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
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
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
        </CardContent>
      </Card>
    );
  }

  if (provision.status === "ACTIVE" && provision.claimedAt) {
    return (
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="text-green-600 size-5" />
            Your website is live
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {provision.deploymentUrl && (
            <Button asChild variant="outline">
              <a
                href={provision.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit your site
                <ExternalLink className="ml-2 size-4" />
              </a>
            </Button>
          )}
          <p className="text-muted-foreground text-sm">
            You manage your site&apos;s content and design directly on
            SimplePress.
          </p>
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
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
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
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Your website is currently {provision.status.toLowerCase()}.
        </p>
      </CardContent>
    </Card>
  );
}
