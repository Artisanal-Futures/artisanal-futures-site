import type { FC } from "react";

import type { Product } from "~/types/product";

import { ProductDetails } from "./product-details";

const formatAttributes = (attributes: string[]) => {
  return attributes.join(" • ");
};

export const ProductCard: FC<{ product: Product }> = ({ product }) => {
  return (
    <ProductDetails product={product}>
      <div className="h-full max-w-sm cursor-pointer rounded-lg border shadow-lg hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl ?? "/img/background-fallback.jpg"}
          alt={`Image of ${product.name}`}
          className="aspect-square w-full rounded-t-lg object-cover"
          onError={({ currentTarget }) => {
            currentTarget.onerror = null; // prevents looping
            currentTarget.src = "/img/background-fallback.jpg";
          }}
        />

        <div className="flex flex-col p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatAttributes(product.attributeTags)}
          </p>

          <h3 className="mb-3 mt-3 font-semibold capitalize leading-3">
            {product.name}
          </h3>

          <span className="text-sm capitalize text-slate-600">
            {product.shop?.name}
          </span>
        </div>
      </div>
    </ProductDetails>
  );
};
