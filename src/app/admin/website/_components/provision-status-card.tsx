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
    onSuccess: () => {
      toast.success("Rebuilding your website...");
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

  if (provision.status === "PROVISIONING") {
    return (
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Spinner className="size-5" />
            Building your website...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This usually only takes a moment. Feel free to leave this page -
            we&apos;ll email you as soon as your site is ready.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (provision.status === "ACTIVE" && !provision.claimedAt) {
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
          {provision.claimUrl && (
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
          )}
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
