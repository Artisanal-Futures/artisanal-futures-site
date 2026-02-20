import { TOOLS_DATA } from "~/data/tools";

import ToolCard from "~/app/(site)/tools/_components/tool-card";

export const metadata = {
  title: "Tools",
  description:
    "Browse our current selection of free and open source tools to power up your business workflow",
};

export default function ToolsPage() {
  return (
    <div className="site-container">
      <div className="site-header">
        <h1>Artisanal Tools</h1>
        <p className="max-w-2xl">
          Explore our collection of free, open-source tools designed to enhance
          your artisanal business workflow and boost productivity
        </p>
      </div>

      <div className="mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
