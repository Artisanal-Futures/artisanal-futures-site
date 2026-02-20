import { api } from "~/trpc/server";

import { ServiceCategoryClient } from "./_components/service-category-client";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ServiceCategoryPage({
  params,
  searchParams,
}: Props) {
  const serverParams = await params;
  const serverSearchParams = await searchParams;

  const page = Number(serverSearchParams.page ?? 1);
  const limit = Number(serverSearchParams.limit ?? 20);
  const sort = (serverSearchParams.sort as "asc" | "desc") ?? "asc";
  const storeId = serverSearchParams.store as string | undefined;
  const search = serverSearchParams.search as string | undefined;
  const attributes = serverSearchParams.attributes
    ? (serverSearchParams.attributes as string).split(",")
    : undefined;

  const categoryName = decodeURIComponent(serverParams.slug);
  const subcategoryName = serverSearchParams.subcategory
    ? decodeURIComponent(serverSearchParams.subcategory as string)
    : undefined;

  const {
    services: rawServices,
    totalCount,
    totalPages,
    subcategories,
  } = await api.service.getAllByCategory({
    categoryName: categoryName,
    subcategoryName: subcategoryName,
    page,
    limit,
    sort,
    storeId,
    search,
    attributes,
  });

  const services = rawServices.filter(
    (service): service is NonNullable<typeof service> => service !== null,
  );

  const category = await api.category.getBySlug({ slug: categoryName });

  if (!category && categoryName !== "all-services") {
    return <div>Category not found.</div>;
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight">{category?.name}</h1>
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

export const generateMetadata = async ({ params }: Props) => {
  const serverParams = await params;
  const categoryName = decodeURIComponent(serverParams.slug);
  const category = await api.category.getBySlug({ slug: categoryName });

  return {
    title: category?.name ?? "Service Category",
    description: `Browse all our artisans' services in the ${category?.name} category`,
  };
};
