import { db } from "~/server/db";

import { Prisma } from "../../../generated/prisma";

export type SimplePressProvisionPayload = {
  email: string;
  businessName: string;
};

export async function getSimplePressProvisionForExchange(
  code: string,
): Promise<SimplePressProvisionPayload | null> {
  const provision = await db.websiteProvision.findUnique({
    where: { accessToken: code },
    select: {
      framework: true,
      status: true,
      subdomain: true,
      contactEmail: true,
      userId: true,
      businessName: true,
    },
  });

  if (!provision) return null;
  if (provision.framework !== "NEXTJS" || provision.status !== "PROVISIONING") {
    return null;
  }

  const email = provision.contactEmail;

  return {
    email,
    businessName: provision.businessName,
  };
}

export type UpdateSimplePressProvisionInput = {
  code: string;
  status: "ACTIVE" | "FAILED";
  subdomain: string;
  customDomain: string;
};

export type UpdateSimplePressProvisionResult =
  | { ok: true }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "conflict" };

export async function updateSimplePressProvisionFromExchange(
  input: UpdateSimplePressProvisionInput,
): Promise<UpdateSimplePressProvisionResult> {
  const provision = await db.websiteProvision.findUnique({
    where: { accessToken: input.code },
    select: { id: true, framework: true, status: true },
  });

  if (
    provision?.framework !== "NEXTJS" ||
    provision?.status !== "PROVISIONING"
  ) {
    return { ok: false, reason: "not_found" };
  }

  try {
    await db.websiteProvision.update({
      where: { id: provision.id },
      data: {
        status: input.status,
        subdomain: input.subdomain,
        customDomain: input.customDomain,
        hasCustomDomain: true,
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
