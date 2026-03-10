"use client";

import { Slider } from "~/components/ui/slider";

type Props = {
  sliderValue: number;
  setSliderValue: (v: unknown) => void;
};
export const ProfitsPanel = ({ sliderValue, setSliderValue }: Props) => {
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

        <div className="text-muted-foreground grid grid-cols-3 text-xs">
          <div>Low Margin</div>
          <div className="text-center">Average</div>
          <div className="text-right">High Margin</div>
        </div>
      </div>
    </div>
  );
};
