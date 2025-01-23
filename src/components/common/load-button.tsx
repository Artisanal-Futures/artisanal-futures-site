import { Loader2, type LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "~/components/ui/button";

interface LoadButtonProps extends ButtonProps {
  isLoading: boolean;
  loadingText?: string;
  Icon?: LucideIcon;
}

export const LoadButton = ({
  isLoading,
  loadingText,
  Icon,
  children,
  ...props
}: LoadButtonProps) => {
  return (
    <Button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="mr-2 size-4" />
      )}
      {isLoading ? (loadingText ?? "Loading...") : children}
    </Button>
  );
};
