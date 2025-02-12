import { NewProductClient } from "./_components/new-product-client";

export const metadata = {
  title: "Products",
  description:
    "Search through all our artisans&apos; products and support small businesses",
};

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          Artisanal Products
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Discover unique handcrafted goods from our talented artisans and
          support small businesses
        </p>
      </div>

      <div className="rounded-lg bg-background shadow-sm">
        <NewProductClient />
      </div>
    </div>
  );
}
