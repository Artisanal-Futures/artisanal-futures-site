import { getAdminShop } from "../_lib/get-admin-shop";
import { ApiKeysCard } from "./_components/api-keys-card";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShopIntegrationsPage({ params }: Props) {
  const { id } = await params;
  const { shop } = await getAdminShop(id);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-muted-foreground text-sm">
          Connect {shop.name} to other tools you use.
        </p>
      </div>

      <ApiKeysCard shopId={shop.id} isPublic={shop.isPublic} />
    </div>
  );
}

export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const { shop } = await getAdminShop(id);
  return { title: `Integrations · ${shop.name}` };
};
