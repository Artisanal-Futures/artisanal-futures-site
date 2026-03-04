import { ShopForm } from "../_components/shop-form";
import { TrailHeader } from "../../_components/trail-header";

export default async function NewProductPage() {
  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Shops", href: "/admin/shops" },
          { label: "New Shop" },
        ]}
      />

      <ShopForm initialData={null} />
    </>
  );
}
export const metadata = {
  title: "Add Shop",
};
