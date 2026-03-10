import { EventBulletinText } from "./event-bulletin-text";

export type BulletinBoardEvent = {
  imageUrl: string;
  shopName: string;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type Props = {
  upcomingEvents: BulletinBoardEvent[];
};

export const EventBulletinBoard = ({ upcomingEvents }: Props) => {
  const getGridCols = (eventCount: number) => {
    if (eventCount === 1) return "grid-cols-1 max-w-7xl mx-auto";
    if (eventCount === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  };

  return (
    <>
      <h1 className="mt-12 px-4 pt-4 text-2xl font-semibold">
        Artisan Bulletin Board
      </h1>
      <p className="text-muted-foreground mb-3 px-4">
        Check out current and upcoming events, workshops, and other cool stuff
      </p>

      <div className="rounded border border-slate-200 shadow-inner">
        {upcomingEvents?.length === 0 ? (
          <p className="text-muted-foreground p-4 font-bold">
            Nothing new yet, but check back later!
          </p>
        ) : (
          <div
            className={`grid gap-5 p-4 md:gap-10 ${getGridCols(upcomingEvents.length)}`}
          >
            {upcomingEvents.map((item, idx) => (
              <EventBulletinText
                imageUrl={item.imageUrl}
                key={idx}
                shopName={item.shopName}
                text={item.text}
                ctaLabel={item.ctaLabel}
                ctaHref={item.ctaHref}
                featured={upcomingEvents.length === 1}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
