import { notFound } from "next/navigation";

import { api } from "~/trpc/server";

import { ArtisanHero } from "./_components/artisan-hero";
import { ProductServiceGrid } from "./_components/product-service-grid";

type Props = {
  params: Promise<{ shopId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { shopId } = await params;
  const shop = await api.shop.get(shopId);
  return {
    title: shop?.name ?? "Artisan Profile",
    description: `View ${shop?.name}'s profile and products`,
  };
}

export default async function ShopProfilePage({ params }: Props) {
  const { shopId } = await params;
  const shop = await api.shop.get(shopId);

  if (!shop) {
    return notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      {/* Hero: Artisan first, business second */}
      <ArtisanHero shop={shop} />

      {/* Products & Services */}
      <div className="mt-12">
        <ProductServiceGrid
          products={shop.products}
          services={shop.services}
          website={shop.website ?? ""}
        />
      </div>
    </div>
  );
}
