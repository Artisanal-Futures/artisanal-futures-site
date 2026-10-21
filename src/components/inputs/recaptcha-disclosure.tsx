import { cn } from "~/lib/utils";

/**
 * Google's required attribution.
 *
 * The v3 badge is hidden site-wide (`.grecaptcha-badge` rule in
 * src/styles/globals.css), and Google's terms permit that only if this
 * disclosure appears in the user flow instead. Render it on every form that
 * mints a reCAPTCHA token.
 */
export function RecaptchaDisclosure({ className }: { className?: string }) {
  return (
    <p
      className={cn("text-muted-foreground text-xs leading-relaxed", className)}
    >
      This site is protected by reCAPTCHA and the Google{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:no-underline"
      >
        Privacy Policy
      </a>{" "}
      and{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:no-underline"
      >
        Terms of Service
      </a>{" "}
      apply.
    </p>
  );
}
