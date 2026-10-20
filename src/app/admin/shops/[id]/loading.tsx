import { Skeleton } from "~/components/ui/skeleton";

/** Content-area placeholder; the layout keeps the toolbar and sub-nav up. */
export default function ShopHubLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="bg-muted h-9 w-80 max-w-full" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Skeleton className="bg-muted h-56 w-full rounded-xl" />
          <Skeleton className="bg-muted h-44 w-full rounded-xl" />
        </div>
        <div className="min-w-0 space-y-6">
          <Skeleton className="bg-muted h-20 w-full rounded-xl" />
          <Skeleton className="bg-muted h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
