import { redirect } from "next/navigation";

import { api } from "~/trpc/server";
import { ShopForm } from "~/app/(site)/profile/_components/shop-form";

type Props = {
  params: { shopId: string };
};

export const metadata = {
  title: "Shop Dashboard",
};
export default async function ShopPage({ params }: Props) {
  const shop = await api.shop.get(params.shopId);

  if (!shop) {
    return redirect("/profile");
  }

  return (
    <div className="space-y-6">
      <ShopForm initialData={shop} />
    </div>
  );
}
