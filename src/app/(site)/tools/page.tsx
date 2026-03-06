import { TOOLS_DATA } from "~/data/tools";

import { ToolCard } from "~/app/(site)/tools/_components/tool-card";

export const metadata = {
  title: "Tools",
  description:
    "Browse our current selection of free and open source tools to power up your business workflow",
};

export default function ToolsPage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Free and Open Source</p>
            <h1>Artisanal Futures Tools</h1>
          </div>
          <p className="description">
            Explore our collection of free, open-source tools designed to
            enhance your artisanal business workflow and boost productivity
          </p>
        </div>
      </header>

      <section className="site-section">
        <div className="mx-auto grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TOOLS_DATA.map((tool, idx) => (
            <div
              key={idx}
              className="transform transition duration-300 hover:scale-105"
            >
              <ToolCard {...tool} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
