import Link from "next/link";

export const metadata = {
  title: "Help Center",
  description: "Community guidelines for the Artisanal Futures forum",
};

export default function QuestionsPage() {
  return (
    <>
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

        <h4 id="this-is-a-civilized-place-for-public-discussion">
          This is a Civilized Place for Public Discussion
        </h4>
        <p>
          Please treat this discussion forum with the same respect you would a
          public park. We, too, are a shared community resource — a place to
          share skills, knowledge and interests through ongoing conversation.
        </p>

        <h4 id="improve-the-discussion">Improve the Discussion</h4>
        <p>
          Help us make this a great place for discussion by always working to
          improve the discussion in some way, however small. If you are not sure
          your post adds to the conversation, think over what you want to say
          and try again later.
        </p>
        <p>
          The topics discussed here matter to us, and we want you to act as if
          they matter to you, too. Be respectful of the topics and the people
          discussing them, even if you disagree with some of what is being said.
        </p>
        <p>
          One way to improve the discussion is by discovering ones that are
          already happening. Spend time browsing the topics here before replying
          or starting your own, and you&apos;ll have a better chance of meeting
          others who share your interests.
        </p>

        <h4 id="be-agreeable-even-when-you-disagree">
          Be Agreeable, Even When You Disagree
        </h4>
        <p>
          You may wish to respond to something by disagreeing with it.
          That&apos;s fine. But remember to criticize ideas, not people. Please
          avoid:
        </p>
        <ul>
          <li>Name-calling</li>
          <li>Ad hominem attacks</li>
          <li>
            Responding to a post&apos;s tone instead of its actual content
          </li>
          <li>Knee-jerk contradiction</li>
        </ul>
        <p>
          Instead, provide reasoned counter-arguments that improve the
          conversation.
        </p>

        <h5 id="your-participation-counts">Your Participation Counts</h5>
        <p>
          The conversations we have here set the tone for every new arrival.
          Help us influence the future of this community by choosing to engage
          in discussions that make this forum an interesting place to be — and
          avoiding those that do not.
        </p>
        <p>Let&apos;s leave our community better than we found it.</p>

        <h5 id="if-you-see-a-problem-tell-us">If You See a Problem, Tell Us</h5>
        <p>
          When you see content that breaks the law, our{" "}
          <Link
            href="/legal/terms-of-use"
            className="text-primary font-medium underline underline-offset-4"
          >
            Terms of Use
          </Link>
          , or these guidelines — including copyright, harassment, or misuse of
          traditional craft knowledge — do not engage with it. Report it using
          our{" "}
          <Link
            href="/legal/takedown"
            className="text-primary font-medium underline underline-offset-4"
          >
            Takedown Policy
          </Link>
          , or email{" "}
          <a
            href="mailto:support@artisanalfutures.org"
            className="text-primary font-medium underline underline-offset-4"
          >
            support@artisanalfutures.org
          </a>
          .
        </p>
        <p>
          We may remove content and restrict accounts as described in the Terms
          of Use and Takedown Policy. We do not preview every new post, and we
          are not responsible for content posted by the community.
        </p>

        <h5 id="always-be-civil">Always Be Civil</h5>
        <p>Nothing sabotages a healthy conversation like rudeness:</p>
        <ul>
          <li>
            Be civil. Don&apos;t post anything that a reasonable person would
            consider offensive, abusive, or hate speech.
          </li>
          <li>
            Keep it clean. Don&apos;t post anything obscene or sexually
            explicit.
          </li>
          <li>
            Respect each other. Don&apos;t harass anyone, impersonate people, or
            expose their private information.
          </li>
          <li>
            Respect our forum. Don&apos;t post spam or otherwise vandalize the
            forum.
          </li>
        </ul>
        <p>
          This is a public forum, and search engines may index these
          discussions. Keep the language, links, and images safe for family and
          friends.
        </p>

        <h5 id="keep-it-tidy">Keep It Tidy</h5>
        <p>
          Make the effort to put things in the right place, so that we can spend
          more time discussing and less cleaning up. So:
        </p>
        <ul>
          <li>Don&apos;t start a topic in the wrong community.</li>
          <li>Don&apos;t cross-post the same thing in multiple topics.</li>
          <li>Don&apos;t post no-content replies.</li>
          <li>Don&apos;t divert a topic by changing it midstream.</li>
        </ul>
        <p>
          Rather than posting “+1” or “Agreed”, use the vote buttons on a post
          or comment.
        </p>

        <h5 id="post-only-your-own-stuff">Post Only Your Own Stuff</h5>
        <p>
          You may not post descriptions of, links to, or methods for stealing
          someone&apos;s intellectual property (software, video, audio, images),
          or for breaking any other law. If you believe someone has posted your
          work without permission, follow our{" "}
          <Link
            href="/legal/takedown"
            className="text-primary font-medium underline underline-offset-4"
          >
            Takedown Policy
          </Link>
          .
        </p>

        <h5 id="terms-of-use">Terms of Use</h5>
        <p>
          To use this service, you must agree to our{" "}
          <Link
            href="/legal/terms-of-use"
            className="text-primary font-medium underline underline-offset-4"
          >
            Terms of Use
          </Link>
          . They describe your (and our) rights related to content, privacy, and
          the law.
        </p>
        <p>
          Content adopted from{" "}
          <a href="https://forum.nativesintech.org/faq">Natives in Tech</a>;{" "}
          <a href="https://opendefinition.org/licenses/cc-by-sa/">CC-BY-SA</a>
        </p>
      </section>
    </>
  );
}
