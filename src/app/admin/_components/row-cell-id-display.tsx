type Props = {
  id: string | number;
  label: string;
  identifier?: string;
};
export const RowCellIdDisplay = ({ id, label, identifier = "ID" }: Props) => {
  return (
    <div className="flex flex-col space-y-1">
      <span>{label}</span>
      <span className="text-xs text-muted-foreground">
        {identifier}:{id}
      </span>
    </div>
  );
};
