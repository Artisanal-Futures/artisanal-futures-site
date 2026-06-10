"use client";

import { type ServiceWithShop } from "~/types/service";
import { type Shop } from "~/types/shop";
import { type FilterOption } from "~/components/tables/advanced-data-table";

/**
 * @description Creates a list of filter configurations for the services data table.
 * @param services - The array of service data.
 * @param shops - The array of shop data.
 * @returns An array of FilterOption objects to be used by the AdvancedDataTable component.
 */
export function createServiceFilter(
  services: ServiceWithShop[],
  shops: { id: string; name: string }[],
): FilterOption[] {
  // Only surface shops that actually have services in the current data set, so
  // the Shop filter doesn't list businesses with nothing to show.
  const shopsWithServices = new Set(services.map((service) => service.shopId));

  // Create a filter for shops, allowing admins to see services from a specific shop.
  const shopFilter: FilterOption = {
    column: "shopId",
    title: "Shop",
    filters: shops
      .filter((shop) => shopsWithServices.has(shop.id))
      .map((shop) => ({
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
