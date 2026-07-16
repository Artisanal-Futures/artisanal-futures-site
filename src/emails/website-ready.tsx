import { Button, Section, Text } from "@react-email/components";

import { EmailLayout } from "./components/layout";

interface WebsiteReadyEmailProps {
  businessName: string;
  recipientEmail: string;
  subdomain: string;
  storefrontUrl: string;
  claimUrl: string;
  expiresAt: Date | string;
  logoUrl?: string;
  /** Optional link to the SimplePress welcome/getting-started guide. */
  welcomeGuideUrl?: string;
}

const formatExpiresAt = (expiresAt: Date | string) => {
  const date = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function WebsiteReadyEmail({
  businessName,
  recipientEmail,
  subdomain,
  storefrontUrl,
  claimUrl,
  expiresAt,
  logoUrl,
  welcomeGuideUrl,
}: WebsiteReadyEmailProps) {
  const expiresLabel = formatExpiresAt(expiresAt);

  return (
    <EmailLayout
      previewText={`Your website for ${businessName} is ready to claim`}
      businessName="Artisanal Futures"
      logoUrl={logoUrl}
    >
      <Text style={heading}>Your website is ready to claim</Text>

      <Text style={text}>Hi there,</Text>

      <Text style={text}>
        Great news — the website for <strong>{businessName}</strong> has been
        built and is live at:
      </Text>

      <Section style={codeBlockContainer}>
        <Text style={codeLabel}>Your website</Text>
        <Text style={codeValue}>{subdomain}</Text>
      </Section>

      <Text style={text}>
        Right now your site is in <strong>&quot;coming soon&quot;</strong>{" "}
        mode and isn&apos;t visible to visitors yet. To make it live, claim it
        using the button below.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={claimUrl}>
          Claim your website
        </Button>
      </Section>

      <Text style={text}>
        Or visit your storefront directly:{" "}
        <a href={storefrontUrl} style={link}>
          {storefrontUrl}
        </a>
      </Text>

      <Text style={warning}>
        Important: when you sign up on SimplePress to claim your site, you
        must use this exact email address — <strong>{recipientEmail}</strong>.
        Signing up with a different email will be rejected. This claim link
        expires on <strong>{expiresLabel}</strong> (14 days from when it was
        sent).
      </Text>

      <Text style={text}>
        <strong>After you claim your site</strong>, you can manage it anytime
        by signing in at{" "}
        <a href={`${storefrontUrl}/admin`} style={link}>
          {storefrontUrl}/admin
        </a>{" "}
        with the account you create — that&apos;s your dashboard for editing
        your site&apos;s branding, pages, and products.
      </Text>

      {welcomeGuideUrl ? (
        <Text style={text}>
          New to SimplePress? Read the{" "}
          <a href={welcomeGuideUrl} style={link}>
            welcome guide
          </a>{" "}
          for a walkthrough of claiming your site and getting around your
          dashboard.
        </Text>
      ) : null}

      <Text style={footer}>
        If you weren&apos;t expecting this email, you can safely ignore it.
      </Text>
    </EmailLayout>
  );
}

const heading = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const codeBlockContainer = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "bold",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const codeValue = {
  color: "#111827",
  fontFamily: "ui-monospace, monospace",
  fontSize: "18px",
  fontWeight: "bold",
  letterSpacing: "0.02em",
  margin: "0",
  wordBreak: "break-all" as const,
};

const buttonContainer = {
  padding: "27px 0 27px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#5e6ad2",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const link = {
  color: "#5e6ad2",
  textDecoration: "underline",
};

const warning = {
  color: "#92400e",
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "8px",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "24px 0",
  padding: "16px 20px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0",
};
