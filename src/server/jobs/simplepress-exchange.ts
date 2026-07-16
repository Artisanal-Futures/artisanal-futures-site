import { db } from "~/server/db";

import { Prisma } from "../../../generated/prisma";

export type SimplePressProvisionPayload = {
  email: string;
  businessName: string;
};

/**
 * GET token-exchange lookup. Returns the artisan's email + business name for a
 * live provisioning token, or null if the token is unknown, not a SimplePress
 * (NEXTJS) provision, not currently PROVISIONING, or expired.
 *
 * Fix B: an `accessTokenExpiresAt` in the past behaves exactly as not-found, so
 * an expired token can no longer be exchanged for the artisan's identity.
 */
export async function getSimplePressProvisionForExchange(
  code: string,
): Promise<SimplePressProvisionPayload | null> {
  const provision = await db.websiteProvision.findUnique({
    where: { accessToken: code },
    select: {
      framework: true,
      status: true,
      contactEmail: true,
      businessName: true,
      accessTokenExpiresAt: true,
    },
  });

  if (!provision) return null;
  if (provision.framework !== "NEXTJS" || provision.status !== "PROVISIONING") {
    return null;
  }
  // Expired token → treat as not-found (fix B). A null expiry never expires.
  if (
    provision.accessTokenExpiresAt !== null &&
    provision.accessTokenExpiresAt.getTime() <= Date.now()
  ) {
    return null;
  }

  return {
    email: provision.contactEmail,
    businessName: provision.businessName,
  };
}

export type UpdateSimplePressProvisionInput = {
  code: string;
  event: "claimed" | "failed";
  status: "ACTIVE" | "FAILED";
  subdomain: string;
  deploymentUrl: string;
  customDomain?: string | null;
  errorMessage?: string | null;
};

export type UpdateSimplePressProvisionResult =
  | { ok: true }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "conflict" };

/**
 * POST status-callback handler. Applies a SimplePress provisioning outcome to
 * the matching `WebsiteProvision` row.
 *
 * Gate: the provision must be a SimplePress (NEXTJS) site whose status is
 * PROVISIONING **or** ACTIVE — in the new flow the "claimed" callback arrives
 * after the row is already ACTIVE (see the status state machine in the contract
 * doc). Anything else is reported as not-found.
 *
 * `event: "claimed"`:
 *   - sets `claimedAt` (only if not already set), `status` (ACTIVE), the
 *     `subdomain` and `deploymentUrl`;
 *   - sets `customDomain`/`hasCustomDomain` ONLY when a non-null bare domain is
 *     supplied. This fixes the old bug that unconditionally set
 *     `hasCustomDomain: true` and wrote a full URL into the unique
 *     `customDomain` column;
 *   - is IDEMPOTENT: a repeat claim for an already-claimed provision with the
 *     same subdomain is a no-op success, never a 409. A P2002 unique violation
 *     (a genuine subdomain/customDomain collision with ANOTHER row) still maps
 *     to `conflict`.
 *
 * `event: "failed"`: sets status FAILED + `errorMessage`.
 */
export async function updateSimplePressProvisionFromExchange(
  input: UpdateSimplePressProvisionInput,
): Promise<UpdateSimplePressProvisionResult> {
  const provision = await db.websiteProvision.findUnique({
    where: { accessToken: input.code },
    select: {
      id: true,
      framework: true,
      status: true,
      claimedAt: true,
      subdomain: true,
    },
  });

  if (
    provision?.framework !== "NEXTJS" ||
    (provision.status !== "PROVISIONING" && provision.status !== "ACTIVE")
  ) {
    return { ok: false, reason: "not_found" };
  }

  if (input.event === "failed") {
    await db.websiteProvision.update({
      where: { id: provision.id },
      data: { status: "FAILED", errorMessage: input.errorMessage ?? null },
    });
    return { ok: true };
  }

  // event === "claimed"
  // Idempotent short-circuit: an already-claimed provision receiving the same
  // subdomain again is a no-op success — do not write, do not 409.
  if (provision.claimedAt !== null && provision.subdomain === input.subdomain) {
    return { ok: true };
  }

  // Only set a custom domain when a real, non-empty bare domain is provided.
  const customDomain = input.customDomain?.trim()
    ? input.customDomain.trim()
    : null;

  try {
    await db.websiteProvision.update({
      where: { id: provision.id },
      data: {
        status: input.status,
        subdomain: input.subdomain,
        deploymentUrl: input.deploymentUrl,
        claimedAt: provision.claimedAt ?? new Date(),
        ...(customDomain ? { customDomain, hasCustomDomain: true } : {}),
      },
    });
    return { ok: true };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, reason: "conflict" };
    }
    throw e;
  }
}
