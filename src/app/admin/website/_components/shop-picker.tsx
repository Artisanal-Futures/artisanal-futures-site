"use client";

import { useMemo } from "react";
import { Store } from "lucide-react";

import { type RouterOutputs } from "~/trpc/react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "~/components/ui/combobox";

type Shop = RouterOutputs["websiteProvision"]["listMyShops"][number];

/**
 * Searchable shop picker shown only when the caller can act on more than one
 * shop (multi-shop artisan, or an ADMIN seeing every shop). Single-shop
 * artisans never see this - the parent auto-selects their one shop instead.
 */
export function ShopPicker({
  shops,
  value,
  onChange,
}: {
  shops: Shop[];
  value: string;
  onChange: (shopId: string) => void;
}) {
  const selected = useMemo(
    () => shops.find((shop) => shop.id === value) ?? null,
    [shops, value],
  );

  return (
    <div className="mb-6">
      <label className="text-muted-foreground mb-2 flex items-center gap-1.5 text-sm">
        <Store className="size-4" />
        Viewing website for
      </label>
      <Combobox
        items={shops}
        value={selected}
        onValueChange={(shop) => {
          if (shop) onChange(shop.id);
        }}
        itemToStringLabel={(shop) => shop.name}
        isItemEqualToValue={(item, val) => item.id === val.id}
      >
        <ComboboxInput
          placeholder="Search shops..."
          className="w-full sm:max-w-sm"
        />
        <ComboboxContent>
          <ComboboxEmpty>No shops found.</ComboboxEmpty>
          <ComboboxList>
            {(shop: Shop) => (
              <ComboboxItem key={shop.id} value={shop}>
                {shop.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
