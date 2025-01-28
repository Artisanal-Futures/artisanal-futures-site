import type { LucideProps } from "lucide-react";
import { cn } from "~/utils/styles";
import { Check } from "lucide-react";

const StepBtn = ({
  Icon,
  title,
  subtitle,
  completed,
}: {
  Icon: React.ReactElement<LucideProps>;
  title: string;
  subtitle: string;
  completed?: boolean;
}) => {
  return (
    <div className="flex w-full items-center gap-4 p-1 hover:bg-slate-200">
      <figure
        className={cn(
          "w-fit rounded-full border bg-white p-2 shadow",
          completed ? "border-green-500" : "border-slate-100",
        )}
      >
        {completed ? <Check className="h-6 w-6 text-green-500" /> : Icon}
      </figure>
      <div>
        <p>{title}</p>
        <p className="whitespace-pre-wrap text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
};

export default StepBtn;
