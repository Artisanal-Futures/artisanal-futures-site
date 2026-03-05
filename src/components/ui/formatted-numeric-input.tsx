import type { PatternFormatProps } from "react-number-format";
import * as React from "react";
import { PatternFormat } from "react-number-format";

import { cn } from "~/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  PatternFormatProps;

const FormattedNumericInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <PatternFormat
        type={type}
        className={cn(
          "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        getInputRef={ref}
        {...props}
      />
    );
  },
);
FormattedNumericInput.displayName = "FormattedNumericInput";

export { FormattedNumericInput };
