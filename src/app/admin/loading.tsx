import { Skeleton } from "~/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <>
      <div className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4 lg:px-6">
        <Skeleton className="bg-muted size-7" />
        <Skeleton className="bg-muted h-4 w-40" />
      </div>
      <div className="admin-container w-full" aria-busy="true">
        <div className="mb-8 space-y-2">
          <Skeleton className="bg-muted h-8 w-56" />
          <Skeleton className="bg-muted h-4 w-80 max-w-full" />
        </div>
        <div className="border-border space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="bg-muted h-9 w-64 max-w-full" />
            <Skeleton className="bg-muted h-9 w-24" />
          </div>
          <Skeleton className="bg-muted h-10 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="bg-muted h-12 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
