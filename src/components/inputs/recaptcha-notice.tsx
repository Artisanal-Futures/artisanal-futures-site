"use client";

import { useRecaptchaV3 } from "~/lib/captcha/use-recaptcha-v3";
import { RecaptchaDisclosure } from "~/components/inputs/recaptcha-disclosure";

/**
 * Google's required disclosure plus a script warm-up: mounting this preloads
 * reCAPTCHA so the first sign-in / reset submit isn't waiting on a cold fetch.
 * Place it on pages whose auth requests mint a token via the auth client.
 */
export function RecaptchaNotice({ className }: { className?: string }) {
  useRecaptchaV3();

  return <RecaptchaDisclosure className={className} />;
}
