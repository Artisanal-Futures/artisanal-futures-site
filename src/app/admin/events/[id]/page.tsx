import { api } from "~/trpc/server";

import { EventForm } from "../_components/event-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};
export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const event = await api.event.get(id);
  const shops = await api.shop.getAll();

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Events", href: "/admin/events" },
          { label: event?.title ?? "Event" },
        ]}
      />

      <EventForm initialData={event} shops={shops} />
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const event = await api.event.get(id);
  if (!event) {
    return {
      title: "Event Not Found",
    };
  }
  return {
    title: `Edit ${event.title}`,
  };
};
