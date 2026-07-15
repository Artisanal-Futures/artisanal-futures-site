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
  if (!shop || !shop.isPublic) {
    return {
      title: "Artisan Profile",
      description: "View an artisan's profile and products",
    };
  }
  return {
    title: shop.name,
    description: `View ${shop.name}'s profile and products`,
  };
}

export default async function ShopProfilePage({ params }: Props) {
  const { shopId } = await params;
  const shop = await api.shop.get(shopId);

  if (!shop || !shop.isPublic) {
    return notFound();
  }

  return (
    <>
      <header className="mx-auto w-full max-w-7xl px-4 pt-12 pb-6 sm:px-6 sm:pt-16 sm:pb-8 lg:px-8">
        <ArtisanHero shop={shop} />
      </header>

      <section className="site-section">
        {/* Products & Services */}
        <div className="mx-auto">
          <ProductServiceGrid
            products={shop.products}
            services={shop.services}
            shop={shop}
          />
        </div>
      </section>
    </>
  );
}
