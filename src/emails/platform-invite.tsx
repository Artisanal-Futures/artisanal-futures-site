import { Button, Section, Text } from "@react-email/components";

import { EmailLayout } from "./components/layout";

interface PlatformInviteEmailProps {
  inviteUrl: string;
  inviteCode: string;
  role: "ARTISAN" | "GUEST" | "ADMIN";
  logoUrl?: string;
  shopName?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ARTISAN: "Artisan",
  GUEST: "Guest",
  ADMIN: "Admin",
};

const roleLabel = (role: "ARTISAN" | "GUEST" | "ADMIN") =>
  ROLE_LABELS[role] ?? role;

export function PlatformInviteEmail({
  inviteUrl,
  inviteCode,
  role,
  logoUrl,
  shopName,
}: PlatformInviteEmailProps) {
  const label = roleLabel(role);
  const previewText = shopName
    ? `You're invited to take ownership of ${shopName} on Artisanal Futures`
    : `You're invited to join Artisanal Futures as a ${label}`;
  const headingText = shopName
    ? `Take ownership of ${shopName} on Artisanal Futures`
    : `You're invited to join Artisanal Futures`;

  return (
    <EmailLayout
      previewText={previewText}
      businessName="Artisanal Futures"
      logoUrl={logoUrl}
    >
      <Text style={heading}>{headingText}</Text>

      <Text style={text}>Hi there,</Text>

      {shopName ? (
        <Text style={text}>
          You&apos;ve been invited to join Artisanal Futures as an <strong>Artisan</strong> and take ownership of <strong>{shopName}</strong>. Your shop profile has already been set up — you&apos;ll review and edit its details when you sign up. Use the link or code below to get started.
        </Text>
      ) : (
        <Text style={text}>
          You&apos;ve been invited to join Artisanal Futures as a <strong>{label}</strong>.
          Use the link or code below to get started.
        </Text>
      )}

      <Section style={codeBlockContainer}>
        <Text style={codeLabel}>Your invitation code</Text>
        <Text style={codeValue}>{inviteCode}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={inviteUrl}>
          Join as {label}
        </Button>
      </Section>

      <Text style={footer}>
        This link and code are valid for 30 days and can only be used once.
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
  fontSize: "24px",
  fontWeight: "bold",
  letterSpacing: "0.1em",
  margin: "0",
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

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0",
};
