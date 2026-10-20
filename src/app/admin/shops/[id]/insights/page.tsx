import { getAdminShop } from "../_lib/get-admin-shop";
import { ShopInsightsClient } from "./_components/shop-insights-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShopInsightsPage({ params }: Props) {
  const { id } = await params;
  const { shop } = await getAdminShop(id);

  return <ShopInsightsClient shopId={shop.id} />;
}

export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const { shop } = await getAdminShop(id);
  return { title: `Insights · ${shop.name}` };
};
