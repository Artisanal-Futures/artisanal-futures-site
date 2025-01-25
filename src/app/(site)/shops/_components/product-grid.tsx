"use client";

import { Product } from "~/types/product";
import { api } from "~/trpc/react";
import PageLoader from "~/components/ui/page-loader";
import Container from "~/app/_components/container";

import { ProductCard } from "./product-card";

export const ProductGrid = ({ id }: { id: string }) => {
  const { data: products, isPending } = api.product.getByShopId.useQuery(id);

  if (isPending) return <PageLoader />;

  if (products?.length === 0)
    return (
      <div className="my-auto">
        <p className="my-auto text-xl text-muted-foreground">
          This shop has no products yet. But check back later to see what they
          have!
        </p>
      </div>
    );

  return (
    <>
      <Container className="p-4 shadow-inner">
        <div className="flex flex-col md:flex-row md:flex-wrap">
          {products?.map((product) => (
            <div
              className="flex basis-full justify-center p-4 md:basis-1/3 lg:basis-1/4"
              key={product.name}
            >
              <ProductCard product={product as Product} key={product.id} />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
};
