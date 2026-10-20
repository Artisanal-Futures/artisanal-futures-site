import type { ShopLocationTypeValue } from "~/lib/validators/shop";

type StreetLevelAddress = {
  address: string | null;
  street: string | null;
  additional: string | null;
  zip: string | null;
};

/**
 * What the public may see of a shop's address. Only a STOREFRONT publishes
 * its street lines; HOME_BASED and AREA shops show their locality only, with
 * ZIP+4 trimmed to the 5-digit ZIP (the +4 can narrow to a single block face).
 *
 * Anything that ends up somewhere public — the storefront, JSON-LD, or a
 * provisioned website — must go through this.
 */
export function toPublicAddress<T extends StreetLevelAddress>(
  address: T | null,
  locationType: ShopLocationTypeValue,
): T | null {
  if (!address || locationType === "STOREFRONT") return address;
  const zipPlusFour = /^(\d{5})[-\s]?\d{4}$/.exec(address.zip?.trim() ?? "");
  return {
    ...address,
    address: null,
    street: null,
    additional: null,
    zip: zipPlusFour?.[1] ?? address.zip,
  };
}
