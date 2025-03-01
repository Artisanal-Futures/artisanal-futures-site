"use client";

import { formatPrice } from "~/utils/calculations";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

const productPricingSchema = z.object({
  materialCost: z.number().min(0),
  hoursPerProduct: z.number().min(0),
  productsPerDay: z.number().min(1),
  profitMargin: z.number().min(0),
});

type ProductPricingValues = z.infer<typeof productPricingSchema>;

interface ProductPricingFormProps {
  shopHourlyRate: number;
  laborHourlyRate: number;
}

export function ProductPricingForm({
  shopHourlyRate,
  laborHourlyRate,
}: ProductPricingFormProps) {
  const form = useForm<ProductPricingValues>({
    resolver: zodResolver(productPricingSchema),
    defaultValues: {
      materialCost: 0,
      hoursPerProduct: 0,
      productsPerDay: 1,
      profitMargin: 20,
    },
  });

  const watchedValues = form.watch();

  // Calculate base cost (materials + labor)
  const baseCost =
    watchedValues.materialCost +
    watchedValues.hoursPerProduct * laborHourlyRate;

  // Calculate overhead cost (shop rate * hours / products per day)
  const overheadCost =
    (shopHourlyRate * watchedValues.hoursPerProduct) /
    watchedValues.productsPerDay;

  // Calculate total cost including overhead
  const totalCost = baseCost + overheadCost;

  // Calculate suggested price with profit margin
  const suggestedPrice = totalCost * (1 + watchedValues.profitMargin / 100);

  return (
    <Form {...form}>
      <form className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold">Product Pricing</h2>
          <p className="text-muted-foreground">
            Calculate the optimal price for your product based on costs and
            desired profit
          </p>
        </div>

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="materialCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material Cost</FormLabel>
                <FormDescription>
                  Total cost of materials used in one product
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      form.setValue(
                        "materialCost",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hoursPerProduct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours Per Product</FormLabel>
                <FormDescription>
                  How many hours does it take to make one product?
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    step="0.25"
                    placeholder="1"
                    {...field}
                    onChange={(e) =>
                      form.setValue(
                        "hoursPerProduct",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productsPerDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Products Per Day</FormLabel>
                <FormDescription>
                  How many products can you make in a day?
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    {...field}
                    onChange={(e) =>
                      form.setValue(
                        "productsPerDay",
                        parseInt(e.target.value) || 1,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profitMargin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profit Margin (%)</FormLabel>
                <FormDescription>
                  Desired profit margin percentage
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="20"
                    {...field}
                    onChange={(e) =>
                      form.setValue(
                        "profitMargin",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-lg border bg-muted p-6">
          <h3 className="mb-4 text-lg font-medium">Price Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Base Cost (Materials + Labor)</span>
              <span className="font-medium">{formatPrice(baseCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Overhead Cost</span>
              <span className="font-medium">{formatPrice(overheadCost)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Total Cost</span>
              <span className="font-medium">{formatPrice(totalCost)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-semibold">
              <span>Suggested Price</span>
              <span className="text-primary">
                {formatPrice(suggestedPrice)}
              </span>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
