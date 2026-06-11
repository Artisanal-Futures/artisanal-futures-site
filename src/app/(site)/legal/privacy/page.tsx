export const metadata = {
  title: "Privacy Policy",
  description: "The privacy policy for Artisanal Futures",
};

export default function PrivacyPage() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Legal</p>
            <h1>Privacy Policy</h1>
          </div>
          <p className="description">Last updated: June 10th, 2026</p>
        </div>
      </header>

      <section className="site-section prose prose-sm lg:prose-base mb-6">
        <h2>Introduction</h2>
        <p>
          This Privacy Policy explains what information Artisanal Futures
          collects, how we use it, and the choices you have. It applies to our
          website and the services we offer through it, including artisan and
          shop profiles, our community forum, surveys, and our image generation
          app, &quot;UPCY&quot;. By using our site you agree to the practices
          described here.
        </p>
        <p>
          We aim to collect as little personal information as possible and to
          keep as much of it as we can on infrastructure we operate ourselves.
        </p>

        <h2>What information do we collect?</h2>
        <p>
          We only collect information that is needed to provide our services.
          Depending on how you use the site, this may include:
        </p>
        <ul>
          <li>
            <span className="font-bold">Account information</span>: When you
            register, we collect your name, email address, and an optional
            username and profile image. You may sign up with an email and
            password or through a third-party login (Google, Discord, or
            Auth0). Email addresses may be verified by sending a unique link.
          </li>
          <li>
            <span className="font-bold">Shop and artisan profiles</span>: If you
            create a shop or artisan profile, we collect the details you
            provide, such as business name, owner name, bio, contact email,
            phone number, website, business address, and photos. This
            information is generally displayed publicly on your profile.
          </li>
          <li>
            <span className="font-bold">Survey responses</span>: If you complete
            one of our surveys, we collect the answers you give, which may
            include your name, email address, general location (country and
            state), and information about your craft or business.
          </li>
          <li>
            <span className="font-bold">Forum activity</span>: When you
            participate in the community forum, we store the content you create
            — posts, comments, and votes — along with the IP address a post or
            comment originated from.
          </li>
          <li>
            <span className="font-bold">Messages</span>: If you use our
            messaging features, we store the messages and any files you send so
            they can be delivered and displayed.
          </li>
          <li>
            <span className="font-bold">UPCY content</span>: When you use UPCY,
            our image generation app, we store the images you upload, the
            prompts and settings you provide, the images that are generated, and
            any custom models or &quot;checkpoints&quot; you train, so we can
            produce and return your results.
          </li>
          <li>
            <span className="font-bold">Technical information</span>: When you
            sign in, we record limited technical details such as your IP address
            and browser user-agent to maintain your session and protect against
            abuse. We may also keep server logs that include the IP address of
            requests to our servers.
          </li>
        </ul>

        <h2>How do we use your information?</h2>
        <p>The information we collect is used to:</p>
        <ul>
          <li>Create and maintain your account and keep you signed in.</li>
          <li>
            Provide the features you use — shop profiles, the forum, surveys,
            messaging, and UPCY image generation.
          </li>
          <li>
            Communicate with you, including account-related and service emails
            and notifications you request.
          </li>
          <li>Operate, secure, maintain, and improve our services.</li>
          <li>
            Comply with the law and protect the rights, property, and safety of
            our community, others, and ourselves.
          </li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We only use cookies that are strictly necessary for the functionality
          and security of our website and services, such as keeping you signed
          in and remembering interface preferences.{" "}
          <span className="font-bold">
            We do <u>not</u> use cookies for personal tracking, advertising, or
            analytics.
          </span>{" "}
          For more detail, see our{" "}
          <a
            href="/legal/cookies"
            className="text-primary font-medium underline underline-offset-4"
          >
            Cookie Policy
          </a>
          .
        </p>

        <h2>How we share information</h2>
        <p>
          <span className="font-bold">
            We do not sell or rent your personal information, and we do not share
            it for advertising or marketing purposes.
          </span>{" "}
          We share information only with the service providers we rely on to
          operate the site, and only as needed to provide our services:
        </p>
        <ul>
          <li>
            <span className="font-bold">Sign-in providers</span> (Google,
            Discord, Auth0): used only if you choose to sign in with them.
          </li>
          <li>
            <span className="font-bold">Email delivery</span> (Resend): to send
            account and service emails.
          </li>
          <li>
            <span className="font-bold">Payments</span> (Stripe): if you make a
            purchase. Payment card details are handled by Stripe; we do not store
            full card numbers.
          </li>
          <li>
            <span className="font-bold">Abuse prevention</span> (hCaptcha): to
            help protect sign-in and account flows from automated abuse.
          </li>
        </ul>
        <p>
          Wherever practical, we keep processing in-house: uploaded files and
          images are stored on storage we operate, image generation is performed
          on our own backend, and our hosting infrastructure is self-managed. We
          may also disclose information when we believe it is necessary to comply
          with the law or to protect the rights, property, or safety of our
          community.
        </p>

        <h2>Third-party links</h2>
        <p>
          Our site may link to or offer third-party products or services. Those
          sites have their own privacy policies, and we are not responsible for
          their content or practices. We encourage you to review the privacy
          policy of any third-party site you visit.
        </p>

        <h2>Data retention</h2>
        <p>
          We keep personal information for as long as your account is active or
          as needed to provide our services, and we make a good-faith effort to:
        </p>
        <ul>
          <li>
            Retain server logs containing IP addresses for no more than 90 days.
          </li>
          <li>
            Retain IP addresses associated with registered users and their forum
            posts for no more than 5 years.
          </li>
        </ul>
        <p>
          When information is no longer needed, we delete or anonymize it where
          reasonably possible.
        </p>

        <h2>Your rights and choices</h2>
        <p>
          You may request to access, correct, or delete the personal information
          we hold about you, and you may close your account at any time.
          Depending on where you live, you may have additional rights under
          applicable privacy laws. To make a request, contact us using the
          details below, and we will respond as required by law.
        </p>

        <h2>How we protect your information</h2>
        <p>
          We implement a variety of technical and organizational measures to
          maintain the safety of your personal information when you enter,
          submit, or access it. No method of transmission or storage is
          completely secure, but we work to protect your information using
          industry-standard practices.
        </p>

        <h2>Children&apos;s privacy</h2>
        <p>
          Our site, products, and services are directed to people who are at
          least 13 years old. In accordance with the Children&apos;s Online
          Privacy Protection Act (
          <a href="https://en.wikipedia.org/wiki/Children%27s_Online_Privacy_Protection_Act">
            COPPA
          </a>
          ), if you are under the age of 13, please do not use this site.
        </p>

        <h2>Changes to this Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or for legal, operational, or regulatory reasons. When
          we do, we will revise the &quot;Last updated&quot; date above and post
          the changes on this page.
        </p>

        <h2>Contact us</h2>
        <p>
          If you have any questions about this Privacy Policy or wish to exercise
          your rights, please contact us at{" "}
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
