import { api } from "~/trpc/server";
import ProfileCard from "~/app/(site)/shops/[shopId]/_components/profile-card";

import { ProductGrid } from "./_components/product-grid";

type Props = {
  params: { shopId: string };
};

export async function generateMetadata({ params }: Props) {
  const shop = await api.shop.get(params?.shopId);
  return {
    title: shop?.name ?? "Artisan Profile",
    description: `View ${shop?.name}'s profile and products`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const shop = await api.shop.get(params?.shopId);

  return (
    <>
      {/* <ProfileCard className="mx-auto h-full" {...shop} />

      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Products
      </h2>
      <ArtisanProductsGrid shopName={shop?.name} /> */}

      {!shop && (
        <div className="flex h-[50vh] flex-col items-center justify-center">
          <h1 className="text-3xl font-semibold">Shop not found</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t find the shop you&apos;re looking for.
          </p>
        </div>
      )}

      {shop && (
        <div className="flex min-h-[50vh] flex-col gap-12">
          {/* Hero Section with Profile */}
          <section className="bg-slate-50">
            <div className="container py-8">
              <ProfileCard className="mx-auto h-full" {...shop} />
            </div>
          </section>

          {/* Products Section */}
          <section className="container">
            <div className="mb-8">
              <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
                Products
              </h2>
              <p className="text-muted-foreground">
                Browse through {shop.name}&apos;s unique collection
              </p>
            </div>
            <ProductGrid id={params?.shopId ?? ""} />

            {/* <ArtisanProductsGrid name={shop.name} /> */}
          </section>

          {/* About Section */}
          {shop.bio && (
            <section className="bg-slate-50">
              <div className="container py-12">
                <h2 className="mb-4 scroll-m-20 text-3xl font-semibold tracking-tight">
                  About {shop.name}
                </h2>
                <div className="prose max-w-none lg:prose-lg">
                  <p className="text-muted-foreground">{shop.bio}</p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
