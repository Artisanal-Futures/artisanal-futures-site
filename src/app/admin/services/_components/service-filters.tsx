"use client";

import { type FilterOption } from "~/components/tables/advanced-data-table";
import { type ServiceWithShop } from "~/types/service";
import { type Shop } from "~/types/shop";

/**
 * @description Creates a list of filter configurations for the services data table.
 * @param services - The array of service data.
 * @param shops - The array of shop data.
 * @returns An array of FilterOption objects to be used by the AdvancedDataTable component.
 */
export function createServiceFilter(
  services: ServiceWithShop[],
  shops: Shop[],
): FilterOption[] {
  // Create a filter for shops, allowing admins to see services from a specific shop.
  const shopFilter: FilterOption = {
    column: "shopId",
    title: "Shop",
    filters: shops.map((shop) => ({
      value: shop.id,
      label: shop.name,
    })),
  };

  // You can add more filters here in the future. For example, filtering by locationType:
  /*
  const locationFilter: FilterOption = {
    column: "locationType",
    title: "Location",
    filters: [
      { value: "Online", label: "Online" },
      { value: "In-Person", label: "In-Person" },
    ],
  };
  */

  // Return the array of all filter configurations.
  return [shopFilter];
}
