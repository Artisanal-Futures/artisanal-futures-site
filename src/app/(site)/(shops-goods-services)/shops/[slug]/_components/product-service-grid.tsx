"use client";

import { useCallback, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Package, Wrench } from "lucide-react";

import type { CatalogSort } from "../_lib/use-shop-catalog";
import type { RouterOutputs } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import {
  CONTROLS_THRESHOLD,
  DEFAULT_SORT,
  isCatalogSort,
  PAGE_SIZE,
  useShopCatalog,
} from "../_lib/use-shop-catalog";
import { ProductCard } from "../../../_components/product-card";
import { ProductDetailDialog } from "../../../_components/product-detail-dialog";
import { ShopCatalogControls } from "./shop-catalog-controls";

type ShopData = NonNullable<RouterOutputs["shop"]["get"]>;
type Product = ShopData["products"][number];
type Service = ShopData["services"][number];
/** The few shop fields the cards need; it's a client component, so keep it lean. */
type Shop = Pick<
  ShopData,
  "id" | "name" | "logoPhoto" | "website" | "attributeTags"
>;

const GRID_CLASSES =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

// URL state lives in the query string. Tabs are separate panels, so each owns
// its own keys: products use q/cat/sort, services sq/scat/ssort; the tabbed
// layout also uses `tab` (omitted for "products").
const PRODUCT_KEYS = { q: "q", cat: "cat", sort: "sort" } as const;
const SERVICE_KEYS = { q: "sq", cat: "scat", sort: "ssort" } as const;
type ParamKeys = typeof PRODUCT_KEYS | typeof SERVICE_KEYS;

/**
 * Reads the query string and merges updates into it. Null/empty drops a key.
 * Uses the History API rather than router.replace: Next keeps useSearchParams
 * in sync without re-running the server page, so filtering stays instant.
 */
function useUrlParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${pathname}?${qs}` : pathname,
      );
    },
    [pathname, searchParams],
  );

  return { searchParams, update };
}

function CatalogPanel({
  items,
  noun,
  keys,
  shop,
  onItemClick,
}: {
  items: (Product | Service)[];
  noun: string;
  keys: ParamKeys;
  shop: Shop;
  onItemClick: (item: Product | Service) => void;
}) {
  const { searchParams, update } = useUrlParams();

  // Small catalogs hide the controls, so ignore any filters left in the URL.
  const showControls = items.length > CONTROLS_THRESHOLD;
  const query = showControls ? (searchParams.get(keys.q) ?? "") : "";
  const category = showControls ? (searchParams.get(keys.cat) ?? "") : "";
  const sortParam = showControls ? searchParams.get(keys.sort) : null;
  const sort: CatalogSort = isCatalogSort(sortParam) ? sortParam : DEFAULT_SORT;

  // Show-more state is keyed to the active filters so changing any of them
  // starts back at one page, without an effect-driven reset.
  const filterKey = `${query}\u0000${category}\u0000${sort}`;
  const [paging, setPaging] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = paging.key === filterKey ? paging.count : PAGE_SIZE;

  const { visible, totalMatches, categories } = useShopCatalog(items, {
    query,
    category,
    sort,
    visibleCount,
  });

  const remaining = totalMatches - visible.length;
  const isFiltered = !!query || !!category || sort !== DEFAULT_SORT;
  // An unknown ?cat= is ignored by the hook, so don't highlight it either.
  const activeCategory = categories.some((c) => c.name === category)
    ? category
    : "";

  const clearFilters = () =>
    update({ [keys.q]: null, [keys.cat]: null, [keys.sort]: null });

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {showControls && (
        <ShopCatalogControls
          noun={noun}
          query={query}
          onQueryChange={(value) => update({ [keys.q]: value || null })}
          sort={sort}
          onSortChange={(value) =>
            update({ [keys.sort]: value === DEFAULT_SORT ? null : value })
          }
          showPriceSort={items.some((item) => item.priceInCents != null)}
          category={activeCategory}
          onCategoryChange={(value) => update({ [keys.cat]: value || null })}
          categories={categories}
          total={items.length}
        />
      )}

      {showControls && (
        <p
          role="status"
          aria-live="polite"
          className="text-muted-foreground text-sm"
        >
          Showing {visible.length} of {totalMatches}
          {isFiltered &&
            totalMatches !== items.length &&
            ` (${items.length} total)`}
        </p>
      )}

      {visible.length > 0 ? (
        <div className={GRID_CLASSES}>
          {visible.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
              fallbackImage={shop.logoPhoto}
            />
          ))}
        </div>
      ) : (
        <div className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-12 text-center">
          <p className="text-foreground text-sm font-medium">
            {query
              ? `No items match “${query}”`
              : "No items match these filters"}
          </p>
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}

      {remaining > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setPaging({ key: filterKey, count: visibleCount + PAGE_SIZE })
            }
          >
            Show {Math.min(PAGE_SIZE, remaining)} more ({remaining} left)
          </Button>
        </div>
      )}
    </div>
  );
}

export function ProductServiceGrid({
  products,
  services,
  shop,
}: {
  products?: Product[];
  services?: Service[];
  shop: Shop;
}) {
  const { searchParams, update } = useUrlParams();
  const [selectedItem, setSelectedItem] = useState<Product | Service | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasProducts = products && products.length > 0;
  const hasServices = services && services.length > 0;

  if (!hasProducts && !hasServices) return null;

  const handleItemClick = (item: Product | Service) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const dialog = (
    <ProductDetailDialog
      item={selectedItem as Product}
      open={dialogOpen}
      linkToWebsite={shop?.website ?? undefined}
      createdBy={shop.name}
      onOpenChange={setDialogOpen}
      shopPrinciples={shop?.attributeTags ?? []}
      fallbackImage={shop?.logoPhoto}
      shopId={shop.id}
      trackingSource="SHOP_PROFILE"
    />
  );

  // Only one tab? Render the grid directly
  const onlyProducts = hasProducts && !hasServices;
  const onlyServices = hasServices && !hasProducts;

  if (onlyProducts || onlyServices) {
    return (
      <section className="flex flex-col gap-6">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {onlyProducts ? "Products" : "Services"}
        </h2>
        <CatalogPanel
          items={(onlyProducts ? products : services)!}
          noun={onlyProducts ? "products" : "services"}
          keys={PRODUCT_KEYS}
          shop={shop}
          onItemClick={handleItemClick}
        />
        {dialog}
      </section>
    );
  }

  const tab = searchParams.get("tab") === "services" ? "services" : "products";

  return (
    <section>
      <Tabs
        value={tab}
        onValueChange={(value) =>
          update({ tab: value === "services" ? "services" : null })
        }
        className="gap-6"
      >
        <TabsList className="h-10">
          <TabsTrigger value="products" className="gap-1.5 px-4">
            <Package className="size-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 px-4">
            <Wrench className="size-4" />
            Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <CatalogPanel
            items={products!}
            noun="products"
            keys={PRODUCT_KEYS}
            shop={shop}
            onItemClick={handleItemClick}
          />
        </TabsContent>

        <TabsContent value="services">
          <CatalogPanel
            items={services!}
            noun="services"
            keys={SERVICE_KEYS}
            shop={shop}
            onItemClick={handleItemClick}
          />
        </TabsContent>
      </Tabs>

      {dialog}
    </section>
  );
}
