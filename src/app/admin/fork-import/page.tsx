import { TrailHeader } from "../_components/trail-header";
import { ForkImportClient } from "./_components/fork-import-client";

export const metadata = {
  title: "Fork import",
  description: "Compare and import data from a fork JSON export table by table.",
};

export default function ForkImportPage() {
  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Tools", href: "/admin/upcycling" },
          { label: "Fork import" },
        ]}
      />
      <div className="admin-container">
        <ForkImportClient />
      </div>
    </>
  );
}
