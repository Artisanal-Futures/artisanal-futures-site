import { type LucideIcon } from "lucide-react";

import { LoadButton } from "~/components/common/load-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { cn } from "~/lib/utils";

type Props = {
  onSubmit: () => void;
  color: "red" | "green" | "blue" | "orange";
  actionText: string;
  description: string;
  title: string;
  icon: LucideIcon;
  isLoading: boolean;
};

export function SingleActionDialog({
  onSubmit,
  color,
  actionText,
  description,
  title,
  icon: Icon,
  isLoading,
}: Props) {
  const colorClasses = {
    red: "bg-red-500 hover:bg-red-500/90bg-destructive text-destructive-foreground hover:bg-destructive/90",
    green: "bg-green-500 hover:bg-green-500/90",
    blue: "bg-blue-500 hover:bg-blue-500/90",
    orange: "bg-orange-500 hover:bg-orange-500/90",
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <LoadButton
          className={cn(colorClasses[color], `h-8 text-xs`)}
          size={"sm"}
          isLoading={isLoading}
        >
          <Icon className="mr-1 h-4 w-4" />
          <span>{actionText}</span>
        </LoadButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            className={cn(colorClasses[color], `text-background`)}
            onClick={onSubmit}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
