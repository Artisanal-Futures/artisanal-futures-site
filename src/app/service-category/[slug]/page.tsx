import { api } from "~/trpc/server";
import { ServiceCategoryClient } from "./_components/service-category-client";

type Props = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function ServiceCategoryPage({ params, searchParams }: Props) {
  const page = Number(searchParams.page ?? 1);
  const limit = Number(searchParams.limit ?? 20);
  const sort = (searchParams.sort as "asc" | "desc") ?? "asc";
  const storeId = searchParams.store as string | undefined;
  const search = searchParams.search as string | undefined;
  const attributes = searchParams.attributes
    ? (searchParams.attributes as string).split(",")
    : undefined;
    
  const categoryName = decodeURIComponent(params.slug);
  const subcategoryName = searchParams.subcategory ? decodeURIComponent(searchParams.subcategory as string) : undefined;

  const { services: rawServices, totalCount, totalPages, subcategories } = await api.service.getAllByCategory({
    categoryName: categoryName,
    subcategoryName: subcategoryName,
    page,
    limit,
    sort,
    storeId,
    search,
    attributes,
  });

  const services = rawServices.filter((service): service is NonNullable<typeof service> => service !== null);

  const category = await api.category.getBySlug({ slug: categoryName });

  if (!category) {
    return <div>Category not found.</div>;
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight">{category.name}</h1>
      </div>
      <ServiceCategoryClient
        initialServices={services}
        subcategories={subcategories}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
}