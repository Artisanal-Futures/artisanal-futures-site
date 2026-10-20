import { STATIC_PAGES } from "~/lib/seo/static-pages";
import { api } from "~/trpc/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { TrailHeader } from "../_components/trail-header";
import { PageOverrides } from "./_components/page-overrides";
import { ShopSeoHealth } from "./_components/shop-seo-health";
import { SiteSettingsForm } from "./_components/site-settings-form";

export default async function AdminSeoPage() {
  const [settings, overrides, shopHealth] = await Promise.all([
    api.siteSettings.get(),
    api.pageSeo.list(),
    api.shop.getSeoHealth(),
  ]);

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "SEO" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Search &amp; sharing</h1>
            <p>
              How Artisanal Futures appears in search results, AI answers and
              link previews
            </p>
          </div>
        </div>

        <Tabs defaultValue="settings" className="gap-6">
          <TabsList>
            <TabsTrigger value="settings">Site settings</TabsTrigger>
            <TabsTrigger value="pages">Page overrides</TabsTrigger>
            <TabsTrigger value="shops">Shop SEO health</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <SiteSettingsForm initialData={settings} />
          </TabsContent>

          <TabsContent value="pages">
            <PageOverrides pages={STATIC_PAGES} overrides={overrides} />
          </TabsContent>

          <TabsContent value="shops">
            <ShopSeoHealth rows={shopHealth} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export const metadata = {
  title: "SEO",
};
