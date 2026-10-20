import Link from "next/link";

import type { Guideline, GuidelineSegment } from "./_data/guidelines";
import { faqSchema } from "~/lib/seo/schema";
import { buildPageMetadata } from "~/lib/seo/page-metadata";
import { JsonLd } from "~/components/seo/json-ld";

import { guidelineAnswer, GUIDELINES } from "./_data/guidelines";

export async function generateMetadata() {
  return buildPageMetadata({
    title: "Help Center",
    description: "Community guidelines for the Artisanal Futures forum",
    path: "/legal/help-center",
  });
}

const LINK_CLASS = "text-primary font-medium underline underline-offset-4";

function Segment({ segment }: { segment: GuidelineSegment }) {
  if (typeof segment === "string") return segment;
  if (segment.href.startsWith("/")) {
    return (
      <Link href={segment.href} className={LINK_CLASS}>
        {segment.text}
      </Link>
    );
  }
  // The attribution links at the bottom have always been unstyled.
  return (
    <a
      href={segment.href}
      className={segment.href.startsWith("mailto:") ? LINK_CLASS : undefined}
    >
      {segment.text}
    </a>
  );
}

function Segments({ segments }: { segments: GuidelineSegment[] }) {
  return segments.map((segment, index) => (
    <Segment key={index} segment={segment} />
  ));
}

function GuidelineSection({ guideline }: { guideline: Guideline }) {
  const Heading = guideline.level === 4 ? "h4" : "h5";

  return (
    <>
      <Heading id={guideline.id}>{guideline.title}</Heading>
      {guideline.blocks.map((block, index) =>
        block.type === "p" ? (
          <p key={index}>
            <Segments segments={block.content} />
          </p>
        ) : (
          <ul key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Segments segments={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

export default function QuestionsPage() {
  return (
    <>
      <JsonLd
        data={faqSchema(
          GUIDELINES.map((guideline) => ({
            question: guideline.title,
            answer: guidelineAnswer(guideline),
          })),
        )}
      />
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Legal</p>
            <h1>Help Center</h1>
          </div>
          <p className="description">Last updated: September 9th, 2026</p>
        </div>
      </header>

      <section className="site-section prose prose-sm lg:prose-base mb-6">
        <p>
          These are community guidelines for our forum. They sit alongside our{" "}
          <Link
            href="/legal/terms-of-use"
            className="text-primary font-medium underline underline-offset-4"
          >
            Terms of Use
          </Link>
          , which are the binding rules for using Artisanal Futures. If the two
          ever differ, the Terms of Use control.
        </p>

        {GUIDELINES.map((guideline) => (
          <GuidelineSection key={guideline.id} guideline={guideline} />
        ))}
      </section>
    </>
  );
}
