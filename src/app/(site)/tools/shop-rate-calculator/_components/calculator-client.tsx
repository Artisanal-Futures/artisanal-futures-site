"use client";

import { useMemo, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { useShopCalculator } from "../_hooks/use-shop-calculator";
import { Breakdown } from "./breakdown";
import { HourlyPieChart } from "./hourly-pie-chart";
import { LaborCostForm } from "./panels/labor-form";
import { MaterialsCostForm } from "./panels/materials-form";
import { MonthlyCostForm } from "./panels/monthly-form";
import { ProfitsPanel } from "./panels/profit-panel";

const COST_COLORS = {
  fixed: "#E38627",
  material: "#C13C37",
  labor: "#6A2135",
  profits: "#f472b6",
};

const HOURS_PER_YEAR = 2080; // 40 hours/week * 52 weeks
export function CalculatorClient() {
  const [profitPercentage, setProfitPercentage] = useState(0);

  const { monthly, materials, labor } = useShopCalculator((state) => state);

  const breakdown = useMemo(() => {
    const monthlyToHourly = monthly / (HOURS_PER_YEAR / 12);

    return {
      monthlyCost: monthly,
      monthlyHourly: monthlyToHourly,
      materialCost: materials,
      materialHourly: materials, // Already per hour from materials form
      laborHourly: labor / (HOURS_PER_YEAR / 12), // Convert monthly labor to hourly
    };
  }, [monthly, materials, labor]);

  const totalHourlyRate = useMemo(() => {
    const baseRate =
      breakdown.monthlyHourly +
      breakdown.materialHourly +
      breakdown.laborHourly;
    const profitAmount = baseRate * (profitPercentage / 100);
    return baseRate + profitAmount;
  }, [breakdown, profitPercentage]);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="bg-card rounded-lg border shadow-sm">
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="material">Materials</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="profit">Profit</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="monthly">
              <MonthlyCostForm />
            </TabsContent>
            <TabsContent value="material">
              <MaterialsCostForm />
            </TabsContent>
            <TabsContent value="labor">
              <LaborCostForm />
            </TabsContent>
            <TabsContent value="profit">
              <ProfitsPanel
                sliderValue={profitPercentage}
                setSliderValue={(v) => setProfitPercentage(v as number)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right Column - Results */}
      <div className="flex flex-col gap-8">
        <div className="bg-card rounded-lg border p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold">Shop Rate</h2>
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-lg">
              Total Hourly Rate
            </span>
            <span className="text-primary text-4xl font-bold">
              ${totalHourlyRate.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold">Cost Breakdown</h2>
          <div className="mb-8">
            <HourlyPieChart
              {...breakdown}
              hours={HOURS_PER_YEAR / 12}
              isValid={totalHourlyRate > 0}
              colors={COST_COLORS}
            />
          </div>
          <Breakdown {...breakdown} />
        </div>
      </div>
    </div>
  );
}
