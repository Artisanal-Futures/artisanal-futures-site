import { api } from "~/trpc/server";

import { EventForm } from "../_components/event-form";
import { TrailHeader } from "../../_components/trail-header";

export default async function NewEventPage() {
  const shops = await api.shop.getAll();

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Events", href: "/admin/events" },
          { label: "New Event" },
        ]}
      />

      <EventForm initialData={null} shops={shops} />
    </>
  );
}
export const metadata = {
  title: "Add Event",
};
