"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";

import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";

import type { LaborCosts } from "../../_hooks/use-shop-calculator";
import { Button } from "~/components/ui/button";
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

import { useShopCalculator } from "../../_hooks/use-shop-calculator";

const laborFormSchema = z.object({
  hours: z.number(),
  rate: z.number(),
});
const AVG_WEEK_PER_MONTH = 4.33;
type LaborFormValues = z.infer<typeof laborFormSchema>;

export function LaborCostForm() {
  const { laborExpenses, setLabor, setLaborExpenses } = useShopCalculator(
    (state) => state,
  );

  const form = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: laborExpenses,
  });

  function onSubmit(data: LaborFormValues) {
    const { hours, rate } = data;
    // Calculate monthly labor cost (hours per week * 4.33 weeks * hourly rate)
    const monthlyLaborCost = hours * 4.33 * rate;
    setLabor(monthlyLaborCost);
    setLaborExpenses(data as LaborCosts);
    toastService.inform("Labor updated");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="w-full space-y-8"
      >
        <div className="py-4">
          <FormLabel className="text-2xl">Labor</FormLabel>{" "}
          <FormDescription className="text-lg">
            These costs are for you, the artisan, for a typical month.
          </FormDescription>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <FormField
            control={form.control}
            name="hours"
            render={({ field }) => (
              <FormItem className="sm:col-span-full">
                <FormLabel>Hours</FormLabel>{" "}
                <FormDescription>
                  How many hours do you work per week?
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="e.g. 40"
                    {...field}
                    onChange={(e) => {
                      form.setValue(`hours`, parseInt(e.target.value));
                    }}
                    type="number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem className="sm:col-span-full">
                <FormLabel>Rate</FormLabel>{" "}
                <FormDescription>
                  How much would you consider your time to be worth? (per hour)
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="e.g. 25.75"
                    {...field}
                    onChange={(e) => {
                      form.setValue(`rate`, parseInt(e.target.value));
                    }}
                    type="number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center justify-end gap-4">
          <Button type="submit">Update totals</Button>
        </div>
      </form>
    </Form>
  );
}
