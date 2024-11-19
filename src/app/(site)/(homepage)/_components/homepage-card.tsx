import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

type Props = {
  link: string
  title: string
  icon: React.ReactNode
  description: string
}
export const HomePageCard = ({ link, title, icon, description }: Props) => (
  <Link href={link}>
    <Card className="hover:bg-slate-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 ">
        <CardTitle className="text-sm font-medium">{description}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{title}</div>
      </CardContent>
    </Card>
  </Link>
)
