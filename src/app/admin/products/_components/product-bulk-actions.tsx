"use client";

import * as React from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import type { OptionType } from "~/components/inputs/multi-select-form-field";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { MultiSelectFormField } from "~/components/inputs/multi-select-form-field";

import { DeleteMultipleProductsDialog } from "./delete-multiple-products";

type Props = {
  selectedProductIds: string[];
  onClear: () => void;
};

export function ProductBulkActions({ selectedProductIds, onClear }: Props) {
  const apiUtils = api.useUtils();

  const { data: categories } = api.category.getAll.useQuery();
  const { data: shops } = api.shop.getAll.useQuery();

  const [categoryPopoverOpen, setCategoryPopoverOpen] = React.useState(false);
  const [storePopoverOpen, setStorePopoverOpen] = React.useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>([]);
  const [selectedShopId, setSelectedShopId] = React.useState<string | undefined>(undefined);

  const bulkUpdate = api.product.bulkUpdate.useMutation({
    onMutate: () => {
      toast.loading("Updating products…");
    },
    onSuccess: async (data) => {
      toast.dismiss();
      toast.success(data.message);
      await apiUtils.product.invalidate();
      onClear();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to update products.");
    },
  });

  const categoryOptions: OptionType[] =
    categories
      ?.filter((cat) => cat.type === "PRODUCT")
      .map((cat) => ({
        value: cat.id,
        label: `${cat.parent ? `${cat.parent.name} / ` : ""}${cat.name}`,
      })) ?? [];

  const handleVisibility = (isPublic: boolean) => {
    bulkUpdate.mutate({ productIds: selectedProductIds, isPublic });
  };

  const handleApplyCategories = () => {
    bulkUpdate.mutate({ productIds: selectedProductIds, categoryIds: selectedCategoryIds });
    setCategoryPopoverOpen(false);
    setSelectedCategoryIds([]);
  };

  const handleApplyStore = () => {
    if (!selectedShopId) return;
    bulkUpdate.mutate({ productIds: selectedProductIds, shopId: selectedShopId });
    setStorePopoverOpen(false);
    setSelectedShopId(undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedProductIds.length} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <DeleteMultipleProductsDialog
        productIds={selectedProductIds}
        onSuccessCallback={onClear}
      />

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        disabled={bulkUpdate.isPending}
        onClick={() => handleVisibility(true)}
      >
        Public
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        disabled={bulkUpdate.isPending}
        onClick={() => handleVisibility(false)}
      >
        Hidden
      </Button>

      {/* Categories popover */}
      <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Categories
            <ChevronDownIcon className="ml-1 h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <p className="mb-2 text-xs font-medium">Assign categories</p>
          <MultiSelectFormField
            options={categoryOptions}
            selected={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            placeholder="Select categories…"
          />
          <Button
            size="sm"
            className="mt-3 h-8 w-full text-xs"
            disabled={selectedCategoryIds.length === 0 || bulkUpdate.isPending}
            onClick={handleApplyCategories}
          >
            Apply
          </Button>
        </PopoverContent>
      </Popover>

      {/* Store popover */}
      <Popover open={storePopoverOpen} onOpenChange={setStorePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Store
            <ChevronDownIcon className="ml-1 h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <p className="mb-2 text-xs font-medium">Assign to store</p>
          <Select value={selectedShopId} onValueChange={setSelectedShopId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select a store…" />
            </SelectTrigger>
            <SelectContent>
              {shops?.map((shop) => (
                <SelectItem key={shop.id} value={shop.id} className="text-xs">
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="mt-3 h-8 w-full text-xs"
            disabled={!selectedShopId || bulkUpdate.isPending}
            onClick={handleApplyStore}
          >
            Apply
          </Button>
        </PopoverContent>
      </Popover>

      <div className="h-4 w-px bg-border" />

      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={onClear}
      >
        <XIcon className="h-4 w-4" />
        <span className="sr-only">Clear selection</span>
      </Button>
    </div>
  );
}
