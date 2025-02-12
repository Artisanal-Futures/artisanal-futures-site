import { NewProductClient } from "./_components/new-product-client";

export const metadata = {
  title: "Products",
  description:
    "Search through all our artisans&apos; products and support small businesses",
};

export default function ProductsPage() {
  return (
    <>
      <h1 className="text-4xl font-semibold">Products</h1>
      <p className="mb-3 mt-2 text-xl text-muted-foreground">
        Search through all our artisans&apos; products and support small
        businesses
      </p>

      <NewProductClient />
    </>
  );
}
