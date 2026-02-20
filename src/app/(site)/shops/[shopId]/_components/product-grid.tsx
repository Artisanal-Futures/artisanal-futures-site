"use client";

import type { Shop } from "generated/prisma";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ProductWithRelations } from "~/types/product";
import { api } from "~/trpc/react";
import PageLoader from "~/components/ui/page-loader";
import Container from "~/app/_components/container";

import { NewProductCard } from "./new-product-card";

export const ProductGrid = ({ id }: { id: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") ?? "1", 10),
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get("limit") ?? "20", 10),
  );

  const { data: productData, isPending } = api.product.getByShopId.useQuery({
    shopId: id,
    page: currentPage,
    limit: itemsPerPage,
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (currentPage > 1) params.set("page", currentPage.toString());
    else params.delete("page");

    if (itemsPerPage !== 20) params.set("limit", itemsPerPage.toString());
    else params.delete("limit");

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(newUrl, { scroll: false });
  }, [currentPage, itemsPerPage, router, searchParams]);

  const productsWithShops = useMemo(() => {
    return (
      productData?.products?.filter(
        (p: ProductWithRelations): p is ProductWithRelations & { shop: Shop } =>
          p.shop !== null,
      ) ?? []
    );
  }, [productData?.products]);

  if (isPending) return <PageLoader />;

  if (!productData || productsWithShops.length === 0)
    return (
      <div className="my-auto">
        <p className="text-muted-foreground my-auto text-xl">
          This shop has no products yet. But check back later to see what they
          have!
        </p>
      </div>
    );

  return (
    <>
      <Container className="p-4 shadow-inner">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, productData.totalCount)} of{" "}
            {productData.totalCount} products
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm font-medium">
              Items per page:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-8 w-24 rounded-md border px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:flex-wrap">
          {productsWithShops.map((product) => (
            <div
              className="flex basis-full justify-center p-4 md:basis-1/3 lg:basis-1/4"
              key={product.id}
            >
              <NewProductCard product={product} key={product.id} />
            </div>
          ))}
        </div>

        {productData.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2 py-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
              className="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: productData.totalPages },
                (_, i) => i + 1,
              ).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`focus-visible:ring-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent hover:text-accent-foreground border"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, productData.totalPages),
                )
              }
              disabled={currentPage >= productData.totalPages}
              className="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </Container>
    </>
  );
};
