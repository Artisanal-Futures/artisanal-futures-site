import ContactFormEmail from "~/emails/contact-form";
import { PlatformInviteEmail } from "~/emails/platform-invite";
import { WebsiteReadyEmail } from "~/emails/website-ready";
import { env } from "~/env";

import { EMAIL_FROM, sendEmail } from "./send";

// Contact Form Submission (to owner)
export async function sendContactFormSubmission(params: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  preferredContactMethod?: "email" | "phone" | "no-preference";
  business: {
    name: string;
    ownerEmail: string;
  };
}) {
  return sendEmail({
    from: EMAIL_FROM.NOREPLY,
    fromName: params.business.name,
    to: params.business.ownerEmail,
    replyTo: params.email,
    subject:
      params.subject ?? `New Contact Form Submission from ${params.name}`,
    react: ContactFormEmail({
      name: params.name,
      email: params.email,
      subject: params.subject,
      message: params.message,
      businessName: params.business.name,
    }),
    tags: [{ name: "category", value: "contact_form" }],
  });
}

export async function sendPlatformInviteEmail({
  to,
  role,
  inviteUrl,
  inviteCode,
  logoUrl,
  shopName,
}: {
  to: string;
  role: "ARTISAN" | "GUEST" | "ADMIN";
  inviteUrl: string;
  inviteCode: string;
  logoUrl?: string;
  shopName?: string;
}) {
  const roleLabels: Record<string, string> = {
    ARTISAN: "Artisan",
    GUEST: "Guest",
    ADMIN: "Admin",
  };
  const label = roleLabels[role] ?? role;
  const subject = shopName
    ? `You're invited to take ownership of ${shopName} on Artisanal Futures`
    : `You're invited to join Artisanal Futures as a ${label}`;
  return sendEmail({
    from: EMAIL_FROM.NOREPLY,
    fromName: "Artisanal Futures",
    to,
    subject,
    react: PlatformInviteEmail({
      inviteUrl,
      inviteCode,
      role,
      logoUrl,
      shopName,
    }),
    tags: [{ name: "category", value: "platform_invite" }],
  });
}

export async function sendWebsiteReadyEmail({
  to,
  businessName,
  subdomain,
  storefrontUrl,
  claimUrl,
  expiresAt,
  logoUrl,
}: {
  to: string;
  businessName: string;
  subdomain: string;
  storefrontUrl: string;
  claimUrl: string;
  expiresAt: Date | string;
  logoUrl?: string;
}) {
  return sendEmail({
    from: EMAIL_FROM.NOREPLY,
    fromName: "Artisanal Futures",
    to,
    subject: `Your website for ${businessName} is ready to claim`,
    react: WebsiteReadyEmail({
      businessName,
      recipientEmail: to,
      subdomain,
      storefrontUrl,
      claimUrl,
      expiresAt,
      logoUrl,
      welcomeGuideUrl: env.SIMPLEPRESS_WELCOME_GUIDE_URL,
    }),
    tags: [{ name: "category", value: "website_ready" }],
  });
}
