import { ChevronLeft } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type Props = {
  isOpen: boolean | undefined;
  setIsOpen?: () => void;
};

export function SidebarToggle({ isOpen, setIsOpen }: Props) {
  return (
    <div className="invisible absolute -right-[16px] top-[12px] z-30 lg:visible">
      <Button
        onClick={() => setIsOpen?.()}
        className="h-8 w-8 rounded-md"
        variant="outline"
        size="icon"
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform duration-700 ease-in-out",
            isOpen === false ? "rotate-180" : "rotate-0",
          )}
        />
      </Button>
    </div>
  );
}
