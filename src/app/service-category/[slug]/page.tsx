import { api } from "~/trpc/server";
import { ServiceCategoryClient } from "./_components/service-category-client";

type ServiceCategoryPageProps = {
  params: {
    slug: string;
  };
};

export default async function ServiceCategoryPage({ params }: ServiceCategoryPageProps) {
  const slug = decodeURIComponent(params.slug);
  const category = await api.category.getBySlug({ slug });

  if (!category) {
    return <div>Category not found.</div>;
  }

  // Create a list of all relevant category IDs (the parent and all its children)
  const idsToFetch = [category.id, ...category.children.map(child => child.id)];

  // Fetch all services belonging to these categories
  const services = await api.service.getAllByCategory({ categoryIds: idsToFetch });

  return (
    // The <SiteLayout> wrapper has been removed. The layout is now correctly
    // handled by the layout.tsx file in this same directory.
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          {category.name}
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Browse all services in the {category.name} category.
        </p>
      </div>
      <div className="rounded-lg bg-background shadow-sm">
        <ServiceCategoryClient 
          initialServices={services} 
          subcategories={category.children} 
        />
      </div>
    </div>
  );
}
