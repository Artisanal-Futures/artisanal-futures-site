import Image from "next/image";
import Link from "next/link";

type Props = {
  shopName: string;
  text: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  featured?: boolean; // Add this prop
};

export const EventBulletinText = ({
  shopName,
  text,
  imageUrl,
  ctaLabel = "Learn More",
  ctaHref = "#",
  featured = false,
}: Props) => {
  if (featured) {
    // Enhanced layout for single/featured events
    return (
      <section className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start">
        {imageUrl && (
          <div className="lg:w-1/2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Click to view larger image"
              className="block transition hover:opacity-90"
            >
              <Image
                width={400}
                height={300}
                src={imageUrl}
                alt={`Event for ${shopName}`}
                className="aspect-[4/3] w-full rounded-lg object-contain"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </a>
          </div>
        )}
        <div className="flex flex-col gap-4 lg:w-1/2">
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {shopName}
          </span>
          <div className="prose prose-sm max-w-none text-slate-700">
            {text.split("\n").map(
              (paragraph, idx) =>
                paragraph.trim() && (
                  <p key={idx} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ),
            )}
          </div>
          <Link
            href={ctaHref}
            className="mt-auto inline-flex w-fit items-center rounded-lg border border-primary bg-primary px-6 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>
    );
  }

  // Original layout for multiple events
  return (
    <section className="flex flex-col items-start gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {shopName}
      </span>
      <p className="text-sm text-slate-700">{text}</p>
      {imageUrl && (
        <div className="w-full">
          <Image
            width={200}
            height={160}
            src={imageUrl}
            alt={`Event for ${shopName}`}
            className="aspect-auto w-full rounded"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <Link
        href={ctaHref}
        className="mt-2 inline-block rounded border border-primary bg-primary px-4 py-1 text-sm font-medium text-white transition hover:bg-primary/90"
      >
        {ctaLabel}
      </Link>
    </section>
  );
};
