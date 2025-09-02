"use client";

import type { FC } from "react";

import { Slider } from "~/components/ui/slider";

interface IProps {
  sliderValue: number;
  setSliderValue: (v: unknown) => void;
}
export const ProfitsPanel: FC<IProps> = ({ sliderValue, setSliderValue }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Profit Margin</h2>
        <p className="text-muted-foreground">
          Set your desired profit margin as a percentage of your costs
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Profit Percentage</span>
          <span className="text-sm font-medium">{sliderValue}%</span>
        </div>

        <Slider
          id="profit-slider"
          defaultValue={[sliderValue]}
          min={0}
          max={100}
          step={1}
          onValueChange={(val) => setSliderValue(val[0])}
          className="py-4"
        />

        <div className="grid grid-cols-3 text-xs text-muted-foreground">
          <div>Low Margin</div>
          <div className="text-center">Average</div>
          <div className="text-right">High Margin</div>
        </div>
      </div>
    </div>
  );
};
