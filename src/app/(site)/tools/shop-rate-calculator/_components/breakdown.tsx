"use client";

import { useMemo } from "react";

import { formatPrice } from "~/lib/calculations";

type Props = {
  monthlyCost: number;
  monthlyHourly: number;
  materialCost: number;
  materialHourly: number;
  laborHourly: number;
};
export const Breakdown = ({
  monthlyCost,
  monthlyHourly,
  materialCost,
  materialHourly,
  laborHourly,
}: Props) => {
  const calculatedPrices = useMemo(() => {
    return {
      fixed_monthly: formatPrice(monthlyCost),
      fixed_hourly: formatPrice(monthlyHourly),
      material_monthly: formatPrice(materialCost),
      material_hourly: formatPrice(materialHourly),
      labor_hourly: formatPrice(laborHourly),
      subtotal: formatPrice(monthlyHourly + materialHourly + laborHourly),
    };
  }, [monthlyCost, monthlyHourly, materialCost, materialHourly, laborHourly]);

  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr className="text-muted-foreground border-b text-sm">
            <th className="pb-2 text-left font-medium">Cost Type</th>
            <th className="pb-2 text-right font-medium">Monthly</th>
            <th className="pb-2 text-right font-medium">Hourly</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          <tr className="text-sm">
            <td className="py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#E38627]" />
                Fixed Costs
              </div>
            </td>
            <td className="py-3 text-right">
              {calculatedPrices.fixed_monthly}
            </td>
            <td className="py-3 text-right">{calculatedPrices.fixed_hourly}</td>
          </tr>
          <tr className="text-sm">
            <td className="py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#C13C37]" />
                Materials
              </div>
            </td>
            <td className="py-3 text-right">
              {calculatedPrices.material_monthly}
            </td>
            <td className="py-3 text-right">
              {calculatedPrices.material_hourly}
            </td>
          </tr>
          <tr className="text-sm">
            <td className="py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#6A2135]" />
                Labor
              </div>
            </td>
            <td className="py-3 text-right">-</td>
            <td className="py-3 text-right">{calculatedPrices.labor_hourly}</td>
          </tr>
          <tr className="font-medium">
            <td className="py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                Subtotal
              </div>
            </td>
            <td className="py-3 text-right">-</td>
            <td className="py-3 text-right">{calculatedPrices.subtotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
