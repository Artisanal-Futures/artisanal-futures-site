import Link from 'next/link';
import { api } from '~/trpc/server';
import SiteLayout from '~/app/(site)/layout';
import { CategoryType } from '@prisma/client';

export const metadata = {
  title: "All Product Categories",
  description: "Browse all product categories.",
};

export default async function ProductCategoriesPage() {
  const categories = await api.category.getNavigationTree({
    type: CategoryType.PRODUCT,
  });

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            All Product Categories
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Explore our products by browsing through all available categories and subcategories.
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((category) => (
            <div key={category.id}>
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                <Link href={`/product-category/${encodeURIComponent(category.name)}`} className="hover:underline">
                  {category.name}
                </Link>
              </h2>
              {category.children.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {category.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/product-category/${encodeURIComponent(category.name)}?subcategory=${encodeURIComponent(sub.name)}`}
                      className="block rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent"
                    >
                      <h3 className="font-semibold">{sub.name}</h3>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}