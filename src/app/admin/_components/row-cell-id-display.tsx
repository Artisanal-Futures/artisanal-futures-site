import Link from "next/link";

type Props = {
  id: string | number;
  label: string;
  identifier?: string;
  href?: string;
};
export const RowCellIdDisplay = ({
  id,
  label,
  identifier = "ID",
  href,
}: Props) => {
  return (
    <div className="flex flex-col space-y-1">
      {href ? (
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="hover:underline"
        >
          {label}
        </Link>
      ) : (
        <span>{label}</span>
      )}
      <span className="text-xs text-muted-foreground">
        {identifier}:{id}
      </span>
    </div>
  );
};
