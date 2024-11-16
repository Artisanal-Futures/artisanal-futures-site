import { EventBulletinBoard, Hero, HomePageCard } from '~/apps/homepage'
import { Cog, GraduationCap, Store } from 'lucide-react'

import Image from 'next/image'

export const CARD_DATA = [
  {
    link: '/shops',
    title: 'Browse our shops',
    icon: <Store className="h-8 w-8 text-muted-foreground" />,
    description: "Browse our artisan's shops and sites",
  },
  {
    link: '/forum',
    title: 'Share Knowledge',
    icon: <GraduationCap className="h-8  w-8  text-muted-foreground" />,
    description: 'Share your artisanal knowledge with others',
  },
  {
    link: '/tools',
    title: 'Utilize Free Tools',
    icon: <Cog className="h-8  w-8  text-muted-foreground" />,
    description: 'Use our collection of free tools',
  },
]

export const metadata = {
  description:
    'Shop worker-owned stores, share knowledge and tech, & participate in the transition to a decolonized circular economy.',
}

export default function HomePage() {
  return (
    <>
      <Hero />

      <div className="mt-12 grid grid-cols-1 gap-5 bg-slate-200 p-4 md:grid-cols-3 md:gap-10">
        {CARD_DATA.map((item, idx) => (
          <HomePageCard {...item} key={idx} />
        ))}
      </div>

      <EventBulletinBoard upcomingEvents={[]} />

      <div className=" text-center">
        <h2 className="mt-12 text-3xl font-bold">
          Artisanal Technologies for Generative Justice
        </h2>

        <Image
          width={200}
          height={160}
          src="/img/flowchart.png"
          alt="Flowchart showing the generative nature of artisanal tech"
          className="aspect-auto w-full "
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    </>
  )
}
