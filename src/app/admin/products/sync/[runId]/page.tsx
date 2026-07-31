import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { api } from "~/trpc/server";

import { TrailHeader } from "../../../_components/trail-header";
import { SyncReviewClient } from "./_components/sync-review-client";

export default async function SyncRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  let run;
  try {
    run = await api.productSync.getRun({ runId });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "Product Sync", href: "/admin/products/sync" },
          { label: run.shop.name },
        ]}
      />
      <div className="admin-container">
        <SyncReviewClient run={run} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Review Product Sync",
};
