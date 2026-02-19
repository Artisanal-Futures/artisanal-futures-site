import type { VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button, buttonVariants } from "~/components/ui/button";

type LoadButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    isLoading: boolean;
    loadingText?: string;
    Icon?: LucideIcon;
  };

export const LoadButton = React.forwardRef<HTMLButtonElement, LoadButtonProps>(
  ({ isLoading, loadingText, Icon, children, ...props }, ref) => {
    return (
      <Button {...props} ref={ref} disabled={isLoading || props.disabled}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          Icon && <Icon className="mr-2 size-4" />
        )}
        {isLoading ? (loadingText ?? "Loading...") : children}
      </Button>
    );
  },
);

LoadButton.displayName = "LoadButton";
