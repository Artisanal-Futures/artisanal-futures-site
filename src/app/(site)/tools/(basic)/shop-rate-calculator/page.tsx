"use client";

import { useMemo, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import Breakdown from "./_components/breakdown";
import HourlyPieChart from "./_components/hourly-pie-chart";
import { LaborCostForm } from "./_components/panels/labor-form";
import { MaterialsCostForm } from "./_components/panels/materials-form";
import { MonthlyCostForm } from "./_components/panels/monthly-form";
import { ProfitsPanel } from "./_components/panels/profit-panel";
import { useShopCalculator } from "./_hooks/use-shop-calculator";

export default function ShopRateCalculator() {
  const [profitPercentage, setProfitPercentage] = useState(0);
  const HOURS_PER_YEAR = 2080; // 40 hours/week * 52 weeks

  const COST_COLORS = {
    fixed: "#E38627",
    material: "#C13C37",
    labor: "#6A2135",
    profits: "#f472b6",
  };

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
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Shop Rate Calculator</h1>
        <p className="text-lg text-muted-foreground">
          Calculate your shop&apos;s hourly rate based on fixed costs,
          materials, labor, and desired profit margin
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left Column - Forms */}
        <div className="rounded-lg border bg-card shadow-sm">
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="material">Materials</TabsTrigger>
              <TabsTrigger value="labor">Labor</TabsTrigger>
              <TabsTrigger value="profit">Profit</TabsTrigger>
              {/* <TabsTrigger value="product">Product</TabsTrigger> */}
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
              {/* <TabsContent value="product">
                <ProductPricingForm
                  shopHourlyRate={totalHourlyRate}
                  laborHourlyRate={breakdown.laborHourly}
                />
              </TabsContent> */}
            </div>
          </Tabs>
        </div>

        {/* Right Column - Results */}
        <div className="flex flex-col gap-8">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold">Shop Rate</h2>
            <div className="flex items-baseline justify-between">
              <span className="text-lg text-muted-foreground">
                Total Hourly Rate
              </span>
              <span className="text-4xl font-bold text-primary">
                ${totalHourlyRate.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-8 shadow-sm">
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
    </div>
  );
}
