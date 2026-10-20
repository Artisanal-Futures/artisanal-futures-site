type Props = {
  main: React.ReactNode;
  aside?: React.ReactNode;
};

/**
 * Two-column form body: a fluid main column and a fixed-width aside, stacked
 * below `lg`. The aside cell renders even when empty so the main column keeps
 * the same width across tabs.
 */
export function AdminFormColumns({ main, aside }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">{main}</div>
      <div className="min-w-0 space-y-6">{aside}</div>
    </div>
  );
}
