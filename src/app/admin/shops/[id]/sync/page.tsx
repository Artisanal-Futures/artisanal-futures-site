import Link from "next/link";

import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

import { getAdminShop } from "../_lib/get-admin-shop";
import {
  RunsTable,
  ShopSyncCard,
} from "../../../products/sync/_components/sync-runs-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShopSyncPage({ params }: Props) {
  const { id } = await params;
  const { shop, isAdmin } = await getAdminShop(id);

  const [runs, shopConfigs] = await Promise.all([
    api.productSync.listRuns({ shopId: shop.id, limit: 50 }),
    api.productSync.listShopConfigs({ shopId: shop.id }),
  ]);
  const config = shopConfigs[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Sync</h2>
          <p className="text-muted-foreground text-sm">
            Keep {shop.name}&apos;s products in step with its own website.
            Nothing goes live until it&apos;s approved.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/products/migrate?shopId=${shop.id}`}>
            Migrate products
          </Link>
        </Button>
      </div>

      {config ? (
        <ShopSyncCard shop={config} isAdmin={isAdmin} />
      ) : (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            Sync settings aren&apos;t available for this shop.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="text-base font-medium">Recent runs</h3>
        <RunsTable runs={runs} isAdmin={isAdmin} hideShopColumn />
      </div>
    </div>
  );
}

export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const { shop } = await getAdminShop(id);
  return { title: `Sync · ${shop.name}` };
};
