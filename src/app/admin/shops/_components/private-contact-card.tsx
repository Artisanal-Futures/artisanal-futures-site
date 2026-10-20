import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import type { PrivateContactValues } from "./private-contact-form";
import { PrivateContactForm } from "./private-contact-form";

type Props = {
  shopId: string;
  initial: PrivateContactValues | null;
};

export function PrivateContactCard({ shopId, initial }: Props) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Private contact</CardTitle>
          <Badge variant="secondary">Admin only</Badge>
        </div>
        <CardDescription>
          How to reach the artisan behind this shop. Never shown on the
          storefront or to the shop owner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PrivateContactForm shopId={shopId} initial={initial} hideNotice />
      </CardContent>
    </Card>
  );
}
