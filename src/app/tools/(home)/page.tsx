import ToolCard from '~/components/tools/tool-card'
import { TOOLS_DATA } from '~/data/tools'

export const metadata = {
  title: 'Tools',
  description:
    'Browse our current selection of free and open source tools to power up your business workflow',
}
export default function ToolsPage() {
  return (
    <>
      <h1 className="text-4xl font-semibold">Utilize Our Tools</h1>
      <p className="mb-3 mt-2 text-xl text-muted-foreground">
        Browse our current selection of free and open source tools to power up
        your business workflow
      </p>
      <div className="flex h-fit w-full flex-col md:flex-row md:flex-wrap">
        {TOOLS_DATA.map((tool, idx) => (
          <div
            className="mx-auto flex basis-full p-4 md:basis-1/2 lg:basis-1/4 "
            key={idx}
          >
            <ToolCard {...tool} />
          </div>
        ))}
      </div>
    </>
  )
}
