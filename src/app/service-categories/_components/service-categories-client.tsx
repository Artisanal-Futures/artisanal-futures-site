"use client";

import Link from "next/link";

import type { Category, Product, Service } from "@prisma/client";

import type { ServiceWithShop } from "~/types/service";
import { NewServiceCard } from "~/app/(site)/services/_components/new-service-card";

type Props = {
  categories: (Category & { items: Product[] | Service[] })[];
};

export function ServiceCategoriesClient({ categories }: Props) {
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <div key={category.id}>
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            <Link
              href={`/service-category/${encodeURIComponent(category.name)}`}
              className="hover:underline"
            >
              {category.name}
            </Link>
          </h2>

          {category.items.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {category.items.map((product) => (
                <NewServiceCard
                  key={product.id}
                  service={product as ServiceWithShop}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
