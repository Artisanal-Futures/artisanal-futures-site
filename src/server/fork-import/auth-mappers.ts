/**
 * Map export (fork) auth rows to Better Auth Prisma schema.
 * Export: User (emailVerified null), Account (provider, providerAccountId, refresh_token, expires_at), Session (sessionToken, expires), VerificationToken (token -> value).
 */

const ROLES = ["USER", "ADMIN", "ARTISAN", "DRIVER", "GUEST"] as const;

export function mapExportUserToBetterAuth(row: Record<string, unknown>): Record<string, unknown> {
  const emailVerified = row.emailVerified;
  const emailVerifiedBool =
    emailVerified === null || emailVerified === undefined
      ? false
      : Boolean(emailVerified);
  const role = row.role as string;
  const roleVal = ROLES.includes(role as (typeof ROLES)[number]) ? role : "GUEST";

  return {
    id: row.id as string,
    name: (row.name as string) ?? null,
    email: (row.email as string) ?? null,
    emailVerified: emailVerifiedBool,
    image: (row.image as string) ?? null,
    title: (row.title as string) ?? null,
    role: roleVal,
    createdAt: row.createdAt ? new Date(row.createdAt as string) : new Date(),
    username: (row.username as string) ?? null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt as string) : new Date(),
  };
}

export function mapExportAccountToBetterAuth(row: Record<string, unknown>): Record<string, unknown> {
  const expiresAt = row.expires_at;
  const accessTokenExpiresAt =
    typeof expiresAt === "number"
      ? new Date(expiresAt * 1000)
      : expiresAt != null
        ? new Date(expiresAt as string)
        : null;

  return {
    id: row.id as string,
    userId: row.userId as string,
    providerId: (row.provider as string) ?? (row.providerId as string),
    accountId: (row.providerAccountId as string) ?? (row.accountId as string),
    refreshToken: (row.refresh_token as string) ?? (row.refreshToken as string) ?? null,
    accessToken: (row.access_token as string) ?? (row.accessToken as string) ?? null,
    scope: (row.scope as string) ?? null,
    idToken: (row.id_token as string) ?? (row.idToken as string) ?? null,
    accessTokenExpiresAt,
    refreshTokenExpiresAt: null,
    password: null,
    createdAt: row.createdAt ? new Date(row.createdAt as string) : new Date(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt as string) : new Date(),
  };
}

export function mapExportSessionToBetterAuth(row: Record<string, unknown>): Record<string, unknown> {
  const expires = row.expires;
  const expiresAt =
    typeof expires === "string"
      ? new Date(expires)
      : typeof expires === "number"
        ? new Date(expires * 1000)
        : new Date();

  return {
    id: row.id as string,
    token: (row.sessionToken as string) ?? (row.token as string),
    userId: row.userId as string,
    expiresAt,
    createdAt: row.createdAt ? new Date(row.createdAt as string) : new Date(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt as string) : new Date(),
    ipAddress: null,
    userAgent: null,
  };
}

export function mapExportVerificationToBetterAuth(
  row: Record<string, unknown>
): Record<string, unknown> {
  const expires = row.expires ?? row.expiresAt;
  const expiresAt =
    typeof expires === "string"
      ? new Date(expires)
      : typeof expires === "number"
        ? new Date(expires * 1000)
        : new Date();

  return {
    id: (row.id as string) ?? crypto.randomUUID(),
    identifier: row.identifier as string,
    value: (row.token as string) ?? (row.value as string),
    expiresAt,
    createdAt: row.createdAt != null ? new Date(row.createdAt as string) : null,
    updatedAt: row.updatedAt != null ? new Date(row.updatedAt as string) : null,
  };
}
