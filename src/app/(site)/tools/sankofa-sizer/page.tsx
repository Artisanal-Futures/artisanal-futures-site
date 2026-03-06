import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { BodyPartsUI } from "./_components/body-parts-ui";
import { BodyMeasurements } from "./_components/measurements-ui";
import { VirtualPattern } from "./_components/virtual-pattern";

export const metadata = {
  title: "Sankofa Sizer",
  description:
    "Sankofa Sizer is a tool to help you measure your body and generate a virtual pattern. ",
};
export default function SankofaSizer() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Tools</p>
            <h1>Sankofa Sizer (Beta)</h1>
          </div>
          <p className="description">
            Measure your body and generate a virtual pattern. This is currently
            a work in progress, so there may be bugs and issues. Check out the{" "}
            <Link href="https://svelte.dev/repl/7b61a8d2610f43f193ac16bb52029215?version=4.2.1">
              Svelte Repl
            </Link>{" "}
            for the latest version.
          </p>
        </div>
      </header>
      <section className="site-section">
        <div className="mx-auto flex h-full w-full max-w-7xl rounded-md border border-gray-300 bg-white">
          <Tabs defaultValue="parts" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="parts">Select Body Parts</TabsTrigger>
              <TabsTrigger value="stats">Body Measurements</TabsTrigger>
              <TabsTrigger value="pattern">Upload Pattern</TabsTrigger>
              <TabsTrigger value="generate">Actual Pattern</TabsTrigger>
              <Link href="https://svelte.dev/repl/7b61a8d2610f43f193ac16bb52029215?version=4.2.1">
                <LinkIcon className="h-4 w-4" />
              </Link>
            </TabsList>
            <TabsContent value="parts">
              <BodyPartsUI />
            </TabsContent>
            <TabsContent value="stats">
              <BodyMeasurements />
            </TabsContent>
            <TabsContent value="pattern">
              <VirtualPattern />
            </TabsContent>
            <TabsContent value="generate" className="flex h-full grow">
              <div className="flex w-full flex-col items-center justify-center py-12">
                <h2 className="mb-2 text-center text-xl font-semibold text-gray-700">
                  Feature coming soon
                </h2>
                <p className="max-w-md text-center text-base text-gray-500">
                  We&apos;re working to bring you the ability to generate
                  precision cutting patterns. Check back soon for updates.
                </p>
                <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-400">
                  <span>⏳</span>
                  <span>Please check back for updates.</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
}
