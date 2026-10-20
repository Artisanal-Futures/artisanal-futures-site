"use client";

import type { UseFormReturn } from "react-hook-form";

import type {
  ShopFormData,
  ShopLocationTypeValue,
} from "~/lib/validators/shop";
import { cn } from "~/lib/utils";
import { SHOP_LOCATION_TYPES } from "~/lib/validators/shop";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { InputFormField } from "~/components/inputs/input-form-field";

type Props = {
  form: UseFormReturn<ShopFormData>;
  disabled?: boolean;
};

const LOCATION_TYPE_OPTIONS = Object.entries(SHOP_LOCATION_TYPES) as [
  ShopLocationTypeValue,
  (typeof SHOP_LOCATION_TYPES)[ShopLocationTypeValue],
][];

/** "City, ST", either part alone, or null. */
function formatLocality(city?: string | null, state?: string | null) {
  const parts = [city?.trim(), state?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Location type plus the address fields. The type decides what is public:
 * a storefront's street is shown and pinned exactly; a home-based shop's
 * street stays private (owner and admins only); an area-only shop has no
 * street at all, and the server clears any it was sent.
 */
export function ShopLocationCard({ form, disabled }: Props) {
  const locationType = form.watch("locationType") ?? "HOME_BASED";
  const address = form.watch("address");
  const locality =
    formatLocality(form.watch("city"), form.watch("state")) ?? "your city";

  const isArea = locationType === "AREA";
  const hasStreet = !!address?.trim();

  const publicNote = {
    STOREFRONT: `Public: your full street address, on your profile and as an exact pin on the Artisan Map.`,
    HOME_BASED: `Public: only ${locality}. Your street address is visible to you and site admins only; the map pin marks the general area.`,
    AREA: `Public: only ${locality}. The map pin marks the general area.${
      hasStreet
        ? " The street address on file will be removed when you save."
        : ""
    }`,
  }[locationType];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
        <CardDescription>
          Where customers can find you, and how much of it is shown publicly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="locationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                  className="grid grid-cols-1 gap-3 md:grid-cols-3"
                >
                  {LOCATION_TYPE_OPTIONS.map(([value, option]) => {
                    const id = `location-type-${value}`;
                    return (
                      <label
                        key={value}
                        htmlFor={id}
                        className={cn(
                          "hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                          field.value === value &&
                            "border-primary bg-primary/5 hover:bg-primary/5",
                          disabled && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <RadioGroupItem
                          value={value}
                          id={id}
                          className="mt-0.5"
                        />
                        <span className="flex flex-col gap-1">
                          <span className="text-sm leading-none font-medium">
                            {option.label}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-3">
          {!isArea && (
            <InputFormField
              form={form}
              name="address"
              label="Street Address"
              className="w-full"
              placeholder="e.g. 123 Main St"
              disabled={disabled}
            />
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <InputFormField
              form={form}
              name="city"
              label="City"
              className="col-span-1"
              placeholder="e.g. Detroit"
              disabled={disabled}
            />
            <InputFormField
              form={form}
              name="state"
              label="State"
              className="col-span-1"
              placeholder="e.g. MI"
              disabled={disabled}
            />
            <InputFormField
              form={form}
              name="zip"
              label="ZIP Code"
              className="col-span-1"
              placeholder="e.g. 48201"
              disabled={disabled}
            />
          </div>
          <InputFormField
            form={form}
            name="country"
            label="Country"
            className="w-full"
            placeholder="e.g. US"
            disabled={disabled}
          />
          <p className="text-muted-foreground text-sm">{publicNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}
