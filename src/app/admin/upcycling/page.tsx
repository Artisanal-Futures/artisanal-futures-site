import { UPCY_ADMIN_URL } from "~/lib/upcy";
import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { UpcyclingClient } from "./_components/upcycling-client";

export const metadata = {
  title: "Upcycling Generations",
};

export default async function AdminUpcyclingPage() {
  const upcycling = await api.upcycling.getAll();
  const count = upcycling?.length ?? 0;
  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Upcycling" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All UPCY v1 Generations</h1>
            <p>
              {count} {count === 1 ? "generation" : "generations"}. Manage
              generations from the first version of UPCY. You can manage the
              latest version of UPCY generations in the{" "}
              <a
                href={UPCY_ADMIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-semibold"
              >
                UPCY page
              </a>
            </p>
          </div>
        </div>
        <UpcyclingClient upcycling={upcycling ?? []} />
      </div>
    </>
  );
}
