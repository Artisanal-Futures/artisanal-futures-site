export default function CookiePolicyPage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Legal</p>
            <h1>Cookie Policy</h1>
          </div>
          <p className="description">Last updated: June 10th, 2026</p>
        </div>
      </header>

      <section className="site-section prose prose-sm lg:prose-base mb-6">
        <h2>Introduction</h2>
        <p>
          Welcome to Artisanal Futures&apos; Cookie Policy. This policy explains
          how we use cookies across our website and services, including our
          application, &quot;Solidarity Pathways&quot;. We only use cookies that
          are strictly necessary to operate the site, so there are no optional
          cookies to accept or decline.
        </p>
        <h2>What are Cookies?</h2>
        <p>
          Cookies are small text files that are placed on your device when you
          visit a website. They are commonly used to make websites work more
          efficiently and to provide information to website owners.
        </p>
        <h2>How We Use Cookies</h2>
        <p>
          At Artisanal Futures, we only use cookies that are strictly necessary
          for the functionality and security of our website and application,
          &quot;Solidarity Pathways&quot;. Specifically, we use cookies for
          authentication purposes. These cookies are essential for ensuring the
          security of our users&apos; accounts and for enabling access to the
          features and functionalities of our app.
        </p>
        <p>
          <span className="font-bold">
            We do <u>not</u> use cookies for personal tracking, advertising,
            analytics, or any other non-essential purposes.
          </span>{" "}
          Your experience is never subject to marketing, retargeting, or
          behavioral profiling by means of cookies on this site.
        </p>
        <h2>Types of Cookies We Use</h2>
        <ul>
          <li>
            <span className="font-bold">Authentication &amp; Session Cookies</span>
            : Set when you sign in to authenticate users and drivers accessing
            our app, &quot;Solidarity Pathways&quot;. They keep you securely
            logged in and let you access your account and our services.
          </li>
          <li>
            <span className="font-bold">Sign-up Cookies</span>: A short-lived
            cookie (expiring after a few minutes) used to validate an invitation
            code while you create an account.
          </li>
          <li>
            <span className="font-bold">Preference Cookies</span>: Remember
            interface choices, such as whether the navigation sidebar is expanded
            or collapsed, so the site behaves the way you left it.
          </li>
          <li>
            <span className="font-bold">Strictly Necessary Cookies</span>:
            Without these, parts of our website and app may not function
            properly. We do not set any optional or non-essential cookies.
          </li>
        </ul>
        <h2>Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes
          in our practices or for other operational, legal, or regulatory
          reasons. We encourage you to review this policy periodically for any
          updates.
        </p>
        <h2>Contact Us</h2>
        <p>
          If you have any questions about our Cookie Policy, please contact us
          at
          <a
            href="mailto:support@artisanalfutures.org"
            className="text-primary font-medium underline underline-offset-4"
          >
            support@artisanalfutures.org
          </a>
          .
        </p>
      </section>
    </>
  );
}
export const metadata = {
  title: "Cookie Policy",
  description: "The cookie policy for Artisanal Futures",
};
