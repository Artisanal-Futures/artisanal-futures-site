"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { type Category } from "@prisma/client";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { NewProductCard } from "~/app/(site)/products/_components/new-product-card";
import { type ProductWithRelations } from "~/types/product";

const STORE_ATTRIBUTES = [
  "African American Culture", "African Culture", "African American Civil Rights",
  "Black Owned", "Woman Owned", "Community Education", "Food Sovereignty",
];

const FilterControls = memo(function FilterControls({
  searchTerm, setSearchTerm, stores, selectedStore, setSelectedStore, sortOrder, setSortOrder,
  selectedAttributes, setSelectedAttributes, resetFilters, subcategories,
}: {
  searchTerm: string; setSearchTerm: (value: string) => void; stores: { id: string; name: string }[] | undefined;
  selectedStore: string; setSelectedStore: (value: string) => void; sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void; selectedAttributes: string[];
  setSelectedAttributes: (value: string[]) => void; resetFilters: () => void;
  subcategories?: Category[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSubcategory = searchParams.get("subcategory");

  return (
    <div className="flex flex-col space-y-6">
      {subcategories && subcategories.length > 0 && (
        <div className="space-y-4 border-b pb-6">
          <h3 className="font-medium text-slate-900">Subcategories</h3>
          <ul className="space-y-2">
            {subcategories.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`${pathname}?subcategory=${sub.name.toLowerCase()}`}
                  scroll={false}
                  className={`block rounded-md p-2 text-sm ${selectedSubcategory === sub.name.toLowerCase() ? 'bg-accent font-bold' : 'hover:bg-accent/50'}`}
                >
                  {sub.name}
                </Link>
              </li>
            ))}
            {selectedSubcategory && (
              <Link href={pathname} scroll={false} className="mt-2 block text-sm text-muted-foreground hover:underline">
                Clear filter
              </Link>
            )}
          </ul>
        </div>
      )}
      
      <div className="space-y-4 pt-6">
        <h3 className="font-medium text-slate-900">Search</h3>
        <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Store</h3>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger><SelectValue placeholder="Filter by store" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores?.map((store) => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Sort</h3>
        <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
          <SelectTrigger><SelectValue placeholder="Sort by name" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Name (A-Z)</SelectItem>
            <SelectItem value="desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-900">Store Attributes</h3>
          <Button variant="ghost" size="sm" onClick={resetFilters}>Reset all</Button>
        </div>
        <div className="space-y-3">
          {STORE_ATTRIBUTES.map((attribute) => (
            <div key={attribute} className="flex items-center space-x-2">
              <Checkbox
                id={attribute}
                checked={selectedAttributes.includes(attribute)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedAttributes([...selectedAttributes, attribute]);
                  } else {
                    setSelectedAttributes(selectedAttributes.filter((attr) => attr !== attribute));
                  }
                }}
              />
              <Label htmlFor={attribute} className="text-sm text-slate-600">{attribute}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export function CategoryClient({ initialProducts, subcategories }: { initialProducts: ProductWithRelations[]; subcategories?: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const { data: stores } = api.shop.getAllValid.useQuery();

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedStore("all");
    setSelectedAttributes([]);
    setSortOrder("asc");
    setCurrentPage(1);
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const filteredProducts = useMemo(() => {
    const selectedSubcategory = searchParams.get("subcategory");
    return initialProducts
      .filter((product) => {
        const matchesSubcategory = !selectedSubcategory || product.categories.some(cat => cat.name.toLowerCase() === selectedSubcategory);
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTermLower) || product.description.toLowerCase().includes(searchTermLower);
        const matchesStore = selectedStore === "all" || !selectedStore || product.shopId === selectedStore;
        const matchesAttributes = selectedAttributes.length === 0 || selectedAttributes.every((attr) => product.shop?.attributeTags?.includes(attr));
        return matchesSubcategory && matchesSearch && matchesStore && matchesAttributes;
      })
      .sort((a, b) => sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  }, [initialProducts, searchParams, searchTerm, selectedStore, selectedAttributes, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStore, selectedAttributes, searchParams]);

  return (
    <div className="mt-5 flex flex-col gap-6 md:flex-row">
      <aside className="sticky top-4 h-fit w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:w-72 md:shrink-0">
        <FilterControls
          subcategories={subcategories}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          stores={stores}
          selectedStore={selectedStore}
          setSelectedStore={setSelectedStore}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          selectedAttributes={selectedAttributes}
          setSelectedAttributes={setSelectedAttributes}
          resetFilters={resetFilters}
        />
      </aside>
      <main className="flex-1 space-y-6 px-4 md:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedProducts.length} of {filteredProducts.length} products
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm font-medium">Items per page:</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="h-8 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm..."
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {paginatedProducts.map((product) => (
            <NewProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <p className="text-center text-muted-foreground">No products found for the selected filters.</p>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-6">
            <Button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
            <span className="flex items-center px-4 text-sm">Page {currentPage} of {totalPages}</span>
            <Button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        )}
      </main>
    </div>
  );
}