"use client";

import { Plus, Trash } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";

import type { MaterialCosts } from "../../_hooks/use-shop-calculator";
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
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

import { useShopCalculator } from "../../_hooks/use-shop-calculator";

const materialsFormSchema = z.object({
  hours: z.number(),
  materials: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
        metric: z.string(),
        cost: z.number(),
        amountUsed: z.number(),
      }),
    )
    .optional(),
});

type MaterialsFormValues = z.infer<typeof materialsFormSchema>;

export function MaterialsCostForm() {
  const { materialExpenses, setMaterials, setMaterialExpenses } =
    useShopCalculator((state) => state);

  const form = useForm<MaterialsFormValues>({
    resolver: zodResolver(materialsFormSchema),
    defaultValues: materialExpenses,
  });
  const { fields, append, remove } = useFieldArray({
    name: "materials",
    control: form.control,
    rules: {
      required: "Please add at least 1 item",
    },
  });

  // const getTotal = useCallback(() => {
  //   const values = form.getValues();

  //   const materialExpenses =
  //     values.expenses && values.materials.length > 0
  //       ? values.materials.reduce((total, item) => {
  //           return (
  //             total + (Number.isNaN(item?.amount ?? 0) ? 0 : item?.amount ?? 0)
  //           );
  //         }, 0)
  //       : 0;

  //   const hours = values.hours ?? 1;

  //   return materialExpenses / hours;
  // }, [form]);

  function onSubmit(data: MaterialsFormValues) {
    const { hours, materials } = data;

    // Calculate cost per hour for materials
    const materialCosts =
      materials?.reduce((total, item) => {
        const itemCostPerUnit = item.cost / item.amount;
        const costForUsedAmount = itemCostPerUnit * item.amountUsed;
        return total + costForUsedAmount;
      }, 0) ?? 0;

    const materialCostPerHour = hours ? materialCosts / hours : 0;
    setMaterials(materialCostPerHour);
    setMaterialExpenses(data as MaterialCosts);

    toastService.inform("Materials updated");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="w-full space-y-8"
      >
        <div className="py-4">
          <FormLabel className="text-2xl">Materials</FormLabel>{" "}
          <FormDescription className="text-lg">
            These costs are per project on average
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
                  How many hours do you spend on a given project? (on average)
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="Enter hours per project"
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

          <>
            <div className="col-span-full">
              <FormLabel className="text-lg">Materials</FormLabel>{" "}
              <FormDescription>
                With a given product, what are the materials you use?
              </FormDescription>
            </div>{" "}
            <ScrollArea className="col-span-full max-h-96 rounded-lg border bg-card p-4 shadow-sm">
              {fields.map((field, index) => (
                <section
                  key={field.id}
                  className="mb-4 flex w-full flex-col gap-4 rounded-md bg-background p-6 shadow-sm transition-colors hover:bg-accent/10 sm:col-span-full"
                >
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name={`materials.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="max-w-sm flex-1">
                          <FormLabel className="text-sm font-medium">
                            Material Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-background"
                              placeholder="e.g. Fabric, Thread, Dye"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={() => remove(index)}
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name={`materials.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-sm font-medium">
                              Total Amount
                            </FormLabel>
                            <FormControl>
                              <div className="relative mt-2 rounded-md shadow-sm">
                                <Input
                                  {...field}
                                  type="number"
                                  className="w-full py-1.5 pr-20"
                                  placeholder="0.00"
                                  onChange={(e) => {
                                    form.setValue(
                                      `materials.${index}.amount`,
                                      parseFloat(e.target.value),
                                    );
                                  }}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center">
                                  <Select
                                    onValueChange={(e) =>
                                      form.setValue(
                                        `materials.${index}.metric`,
                                        e,
                                      )
                                    }
                                    defaultValue={form.getValues(
                                      `materials.${index}.metric`,
                                    )}
                                  >
                                    <SelectTrigger>
                                      <SelectValue className="h-full rounded-md border-0 border-transparent bg-transparent py-0 pl-2 pr-7 text-gray-500 ring-0 sm:text-sm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="l">Liter</SelectItem>
                                      <SelectItem value="ml">
                                        Milliliter
                                      </SelectItem>
                                      <SelectItem value="yd">Yard</SelectItem>
                                      <SelectItem value="meter">
                                        Meter
                                      </SelectItem>
                                      <SelectItem value="in">Inch</SelectItem>
                                      <SelectItem value="unit">Unit</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`materials.${index}.cost`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-sm font-medium">
                              Total Cost
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="bg-background"
                                placeholder="$0.00"
                                {...field}
                                type="number"
                                onChange={(e) => {
                                  form.setValue(
                                    `materials.${index}.cost`,
                                    parseFloat(e.target.value),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`materials.${index}.amountUsed`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Amount Used Per Project
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-background"
                              placeholder="0.00"
                              {...field}
                              type="number"
                              onChange={(e) => {
                                form.setValue(
                                  `materials.${index}.amountUsed`,
                                  parseFloat(e.target.value),
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Separator className="mt-2" />
                </section>
              ))}
            </ScrollArea>
          </>
        </div>
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant={"outline"}
            onClick={() => {
              append({
                name: "Material",
                amount: 0,
                amountUsed: 0,
                metric: "unit",
                cost: 0,
              });
            }}
          >
            {" "}
            <Plus className="mr-2 h-4 w-4" />
            Add material
          </Button>
          <Button type="submit">Update totals</Button>
        </div>
      </form>
    </Form>
  );
}
