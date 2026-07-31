import Link from "next/link";
import { notFound } from "next/navigation";
import { EyeOff } from "lucide-react";

import { api } from "~/trpc/server";

import { ArtisanHero } from "./_components/artisan-hero";
import { ProductServiceGrid } from "./_components/product-service-grid";

type Props = {
  params: Promise<{ shopId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { shopId } = await params;
  const shop = await api.shop.get(shopId);
  if (!shop) {
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

  if (!shop) {
    return notFound();
  }

  // A hidden shop is only returned to its owner or an admin (enforced in
  // shop.get); everyone else already got null above. Let the owner/admin preview
  // it, with a banner making the hidden state clear.
  const isHidden = !shop.isPublic;

  // Hidden products/services are likewise only included for the owner or an
  // admin. Say so, otherwise a preview looks identical to the public page and
  // the owner assumes those items are live.
  const hiddenItemCount = shop.hiddenItemCount;

  return (
    <>
      {hiddenItemCount > 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="border-border bg-secondary text-secondary-foreground flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
            <EyeOff className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>
                {hiddenItemCount} item{hiddenItemCount === 1 ? " is" : "s are"}{" "}
                hidden.
              </strong>{" "}
              You can see {hiddenItemCount === 1 ? "it" : "them"} here because
              you manage this shop, but visitors cannot, and{" "}
              {hiddenItemCount === 1 ? "it does" : "they do"} not appear in
              search or browse.
            </p>
          </div>
        </div>
      )}
      {isHidden && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="border-border bg-secondary text-secondary-foreground flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
            <EyeOff className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>This shop is hidden.</strong> Only you and the Artisanal
              Futures team can see this page. Turn on{" "}
              <strong>Publicly visible</strong> in your{" "}
              <Link
                href={`/admin/shops/${shop.id}`}
                className="font-medium underline underline-offset-2"
              >
                shop settings
              </Link>{" "}
              to make it live.
            </p>
          </div>
        </div>
      )}
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
