import { TOOLS_DATA } from "~/data/tools";

import ToolCard from "~/app/tools/_components/tool-card";

export const metadata = {
  title: "Tools",
  description:
    "Browse our current selection of free and open source tools to power up your business workflow",
};

export default function ToolsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          Artisanal Tools
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Explore our collection of free, open-source tools designed to enhance
          your artisanal business workflow and boost productivity
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS_DATA.map((tool, idx) => (
          <div
            key={idx}
            className="transform transition duration-300 hover:scale-105"
          >
            <ToolCard {...tool} />
          </div>
        ))}
      </div>
    </div>
  );
}
