"use client";

import { useCallback, useEffect, useMemo } from "react";

import { env } from "~/env";

const SCRIPT_SRC = (siteKey: string) =>
  `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;

/** Bound script-load / execute so a hung Google request cannot stall forever. */
const RECAPTCHA_CLIENT_TIMEOUT_MS = 15_000;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}

/**
 * Module-level so the `<script>` is injected once per page no matter how many
 * components mount the hook simultaneously. Reset to `null` on failure so a
 * transient network error doesn't permanently poison every later `execute()`.
 */
let scriptPromise: Promise<void> | null = null;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise;

  const src = SCRIPT_SRC(siteKey);

  const promise = withTimeout(
    new Promise<void>((resolve, reject) => {
      if (typeof document === "undefined") {
        reject(new Error("recaptcha: no document"));
        return;
      }

      // A previous page render (or a Fast Refresh cycle that cleared the module
      // cache) may already have injected the tag. Adopt it instead of adding a
      // second copy — Google's script warns and re-registers on double load.
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${src}"]`,
      );
      if (existing) {
        if (window.grecaptcha) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("recaptcha: script failed to load")),
        );
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", () => resolve());
      script.addEventListener("error", () =>
        reject(new Error("recaptcha: script failed to load")),
      );
      document.head.appendChild(script);
    }),
    RECAPTCHA_CLIENT_TIMEOUT_MS,
    "recaptcha script load",
  ).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  scriptPromise = promise;
  return promise;
}

async function mintToken(
  siteKey: string,
  action: string,
): Promise<string | null> {
  try {
    await loadRecaptchaScript(siteKey);

    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) return null;

    await withTimeout(
      new Promise<void>((resolve) => grecaptcha.ready(resolve)),
      RECAPTCHA_CLIENT_TIMEOUT_MS,
      "recaptcha ready",
    );

    const token = await withTimeout(
      grecaptcha.execute(siteKey, { action }),
      RECAPTCHA_CLIENT_TIMEOUT_MS,
      "recaptcha execute",
    );
    return token || null;
  } catch (error) {
    // Callers still get `null` and can show a retryable UI error without
    // crashing the form.
    console.error("[reCAPTCHA] mint failed", error);
    return null;
  }
}

/**
 * The site key to mint with, or `null` when captcha is skipped: no site key, or
 * `NODE_ENV === "development"` (mirrors the server verifier).
 */
function getActiveSiteKey(): string | null {
  if (process.env.NODE_ENV === "development") return null;
  return env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || null;
}

/**
 * Non-hook variant of `useRecaptchaV3().execute` for code outside React (e.g.
 * the auth client's request hook). Resolves `null` — never throws — on the
 * server, when captcha is skipped, or when minting fails.
 */
export async function executeRecaptcha(action: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const siteKey = getActiveSiteKey();
  if (!siteKey) return null;
  return mintToken(siteKey, action);
}

/**
 * reCAPTCHA v3 — mints invisible, score-based tokens.
 *
 * There is no widget and nothing for the user to solve: call `execute(action)`
 * right before submitting and send the token along. Tokens are single-use and
 * expire 120 seconds after minting, so mint at submit time rather than holding
 * one in state.
 *
 * `execute` resolves `null` — never throws — on any failure (script blocked,
 * network down, `grecaptcha` missing), and when captcha is skipped: disabled,
 * no site key, or `NODE_ENV === "development"` (mirrors the server verifier).
 *
 * `warm` picks when Google's script is fetched:
 * - `"mount"` (default): as soon as the consumer mounts, so the first
 *   `execute()` isn't waiting on a cold fetch.
 * - `"interaction"`: not on mount; call the returned `warm()` on first focus.
 *   `execute()` still loads the script on demand if `warm()` never ran.
 */
export function useRecaptchaV3({
  enabled = true,
  warm: warmMode = "mount",
}: { enabled?: boolean; warm?: "mount" | "interaction" } = {}): {
  execute: (action: string) => Promise<string | null>;
  warm: () => void;
} {
  const siteKey = enabled ? getActiveSiteKey() : null;

  const warm = useCallback(() => {
    if (!siteKey) return;
    void loadRecaptchaScript(siteKey).catch(() => {
      /* handled per-call in mintToken */
    });
  }, [siteKey]);

  useEffect(() => {
    if (warmMode === "mount") warm();
  }, [warmMode, warm]);

  const execute = useCallback(
    async (action: string) => {
      if (!siteKey) return null;
      return mintToken(siteKey, action);
    },
    [siteKey],
  );

  return useMemo(() => ({ execute, warm }), [execute, warm]);
}
