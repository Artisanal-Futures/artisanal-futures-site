"use client";

import { Slider } from "~/components/ui/slider";

import { InchMarker } from "./inch-marker";

type Props = {
  ppiSliderValue: number;
  setPpiSliderValue: (val: number) => void;
  length?: number;
  unit?: string;
};

export const ActualInch = ({
  ppiSliderValue = 72,
  setPpiSliderValue,
  length = 3,
  unit = "inches",
}: Props) => {
  return (
    <>
      <div>
        <InchMarker
          unit={unit}
          length={length}
          pixels_per_inch={ppiSliderValue}
        />
      </div>

      <label>
        <span>{ppiSliderValue} ppi</span>

        <Slider
          min={1}
          max={326}
          step={1}
          value={[ppiSliderValue]}
          onValueChange={(val) => setPpiSliderValue(val[0]!)}
        />
      </label>
      <label>
        <input type="number" min={1} max={50} step={1} value={length} />{" "}
        {unit == "inches" ? "in" : "mm"} length
      </label>
    </>
  );
};
