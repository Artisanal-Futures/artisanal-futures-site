import { api } from "~/trpc/server";

import { AdminClientLayout } from "../_components/client-layout";
import { UpcyclingClient } from "./_components/upcycling-client";

export const metadata = {
  title: "Upcycling Generations",
};

export default async function AdminUpcyclingPage() {
  const upcycling = await api.upcycling.getAll();

  return (
    <AdminClientLayout
      title={`Upcycling Generations (${upcycling?.length ?? 0})`}
      currentPage="Upcycling"
    >
      <UpcyclingClient upcycling={upcycling ?? []} />
    </AdminClientLayout>
  );
}
