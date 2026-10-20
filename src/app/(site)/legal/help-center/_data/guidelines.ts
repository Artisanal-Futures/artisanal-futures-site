/**
 * Forum community guidelines as data. The help-center page renders them and
 * the FAQPage JSON-LD is built from the same array, so the two can't drift.
 */

/** Inline text, or a link inside it. */
export type GuidelineSegment = string | { text: string; href: string };

export type GuidelineBlock =
  | { type: "p"; content: GuidelineSegment[] }
  | { type: "ul"; items: GuidelineSegment[][] };

export type Guideline = {
  id: string;
  /** Heading level the section is rendered at. */
  level: 4 | 5;
  title: string;
  blocks: GuidelineBlock[];
};

const TERMS_OF_USE = { text: "Terms of Use", href: "/legal/terms-of-use" };
const TAKEDOWN_POLICY = { text: "Takedown Policy", href: "/legal/takedown" };

export const GUIDELINES: Guideline[] = [
  {
    id: "this-is-a-civilized-place-for-public-discussion",
    level: 4,
    title: "This is a Civilized Place for Public Discussion",
    blocks: [
      {
        type: "p",
        content: [
          "Please treat this discussion forum with the same respect you would a public park. We, too, are a shared community resource — a place to share skills, knowledge and interests through ongoing conversation.",
        ],
      },
    ],
  },
  {
    id: "improve-the-discussion",
    level: 4,
    title: "Improve the Discussion",
    blocks: [
      {
        type: "p",
        content: [
          "Help us make this a great place for discussion by always working to improve the discussion in some way, however small. If you are not sure your post adds to the conversation, think over what you want to say and try again later.",
        ],
      },
      {
        type: "p",
        content: [
          "The topics discussed here matter to us, and we want you to act as if they matter to you, too. Be respectful of the topics and the people discussing them, even if you disagree with some of what is being said.",
        ],
      },
      {
        type: "p",
        content: [
          "One way to improve the discussion is by discovering ones that are already happening. Spend time browsing the topics here before replying or starting your own, and you'll have a better chance of meeting others who share your interests.",
        ],
      },
    ],
  },
  {
    id: "be-agreeable-even-when-you-disagree",
    level: 4,
    title: "Be Agreeable, Even When You Disagree",
    blocks: [
      {
        type: "p",
        content: [
          "You may wish to respond to something by disagreeing with it. That's fine. But remember to criticize ideas, not people. Please avoid:",
        ],
      },
      {
        type: "ul",
        items: [
          ["Name-calling"],
          ["Ad hominem attacks"],
          ["Responding to a post's tone instead of its actual content"],
          ["Knee-jerk contradiction"],
        ],
      },
      {
        type: "p",
        content: [
          "Instead, provide reasoned counter-arguments that improve the conversation.",
        ],
      },
    ],
  },
  {
    id: "your-participation-counts",
    level: 5,
    title: "Your Participation Counts",
    blocks: [
      {
        type: "p",
        content: [
          "The conversations we have here set the tone for every new arrival. Help us influence the future of this community by choosing to engage in discussions that make this forum an interesting place to be — and avoiding those that do not.",
        ],
      },
      {
        type: "p",
        content: ["Let's leave our community better than we found it."],
      },
    ],
  },
  {
    id: "if-you-see-a-problem-tell-us",
    level: 5,
    title: "If You See a Problem, Tell Us",
    blocks: [
      {
        type: "p",
        content: [
          "When you see content that breaks the law, our ",
          TERMS_OF_USE,
          ", or these guidelines — including copyright, harassment, or misuse of traditional craft knowledge — do not engage with it. Report it using our ",
          TAKEDOWN_POLICY,
          ", or email ",
          {
            text: "support@artisanalfutures.org",
            href: "mailto:support@artisanalfutures.org",
          },
          ".",
        ],
      },
      {
        type: "p",
        content: [
          "We may remove content and restrict accounts as described in the Terms of Use and Takedown Policy. We do not preview every new post, and we are not responsible for content posted by the community.",
        ],
      },
    ],
  },
  {
    id: "always-be-civil",
    level: 5,
    title: "Always Be Civil",
    blocks: [
      {
        type: "p",
        content: ["Nothing sabotages a healthy conversation like rudeness:"],
      },
      {
        type: "ul",
        items: [
          [
            "Be civil. Don't post anything that a reasonable person would consider offensive, abusive, or hate speech.",
          ],
          ["Keep it clean. Don't post anything obscene or sexually explicit."],
          [
            "Respect each other. Don't harass anyone, impersonate people, or expose their private information.",
          ],
          [
            "Respect our forum. Don't post spam or otherwise vandalize the forum.",
          ],
        ],
      },
      {
        type: "p",
        content: [
          "This is a public forum, and search engines may index these discussions. Keep the language, links, and images safe for family and friends.",
        ],
      },
    ],
  },
  {
    id: "keep-it-tidy",
    level: 5,
    title: "Keep It Tidy",
    blocks: [
      {
        type: "p",
        content: [
          "Make the effort to put things in the right place, so that we can spend more time discussing and less cleaning up. So:",
        ],
      },
      {
        type: "ul",
        items: [
          ["Don't start a topic in the wrong community."],
          ["Don't cross-post the same thing in multiple topics."],
          ["Don't post no-content replies."],
          ["Don't divert a topic by changing it midstream."],
        ],
      },
      {
        type: "p",
        content: [
          "Rather than posting “+1” or “Agreed”, use the vote buttons on a post or comment.",
        ],
      },
    ],
  },
  {
    id: "post-only-your-own-stuff",
    level: 5,
    title: "Post Only Your Own Stuff",
    blocks: [
      {
        type: "p",
        content: [
          "You may not post descriptions of, links to, or methods for stealing someone's intellectual property (software, video, audio, images), or for breaking any other law. If you believe someone has posted your work without permission, follow our ",
          TAKEDOWN_POLICY,
          ".",
        ],
      },
    ],
  },
  {
    id: "terms-of-use",
    level: 5,
    title: "Terms of Use",
    blocks: [
      {
        type: "p",
        content: [
          "To use this service, you must agree to our ",
          TERMS_OF_USE,
          ". They describe your (and our) rights related to content, privacy, and the law.",
        ],
      },
      {
        type: "p",
        content: [
          "Content adopted from ",
          {
            text: "Natives in Tech",
            href: "https://forum.nativesintech.org/faq",
          },
          "; ",
          {
            text: "CC-BY-SA",
            href: "https://opendefinition.org/licenses/cc-by-sa/",
          },
        ],
      },
    ],
  },
];

const segmentText = (segment: GuidelineSegment) =>
  typeof segment === "string" ? segment : segment.text;

/** Plain-text answer for a guideline, used by the FAQPage structured data. */
export function guidelineAnswer({ blocks }: Guideline) {
  return blocks
    .map((block) =>
      block.type === "p"
        ? block.content.map(segmentText).join("")
        : block.items.map((item) => item.map(segmentText).join("")).join(" "),
    )
    .join(" ");
}
