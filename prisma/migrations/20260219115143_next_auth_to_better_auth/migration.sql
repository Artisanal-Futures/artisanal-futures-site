-- ── USER ──────────────────────────────────────────────────────────────────
-- emailVerified: DateTime? → Boolean  (USING preserves "was verified" signal)
ALTER TABLE "User"
  ALTER COLUMN "emailVerified" TYPE BOOLEAN
  USING ("emailVerified" IS NOT NULL);
ALTER TABLE "User" ALTER COLUMN "emailVerified" SET DEFAULT false;
ALTER TABLE "User" ALTER COLUMN "emailVerified" SET NOT NULL;
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── SESSION ───────────────────────────────────────────────────────────────
ALTER TABLE "Session" RENAME COLUMN "sessionToken" TO "token";
ALTER TABLE "Session" RENAME COLUMN "expires" TO "expiresAt";
ALTER TABLE "Session" ADD COLUMN "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Session" ADD COLUMN "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Session" ADD COLUMN "ipAddress"  TEXT;
ALTER TABLE "Session" ADD COLUMN "userAgent"  TEXT;

-- ── ACCOUNT ───────────────────────────────────────────────────────────────
ALTER TABLE "Account" RENAME COLUMN "provider"          TO "providerId";
ALTER TABLE "Account" RENAME COLUMN "providerAccountId" TO "accountId";
ALTER TABLE "Account" RENAME COLUMN "access_token"      TO "accessToken";
ALTER TABLE "Account" RENAME COLUMN "refresh_token"     TO "refreshToken";
ALTER TABLE "Account" RENAME COLUMN "id_token"          TO "idToken";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "type";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "token_type";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "session_state";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "expires_at";
ALTER TABLE "Account" ADD COLUMN "accessTokenExpiresAt"  TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN "password"              TEXT;
ALTER TABLE "Account" ADD COLUMN "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Account" ADD COLUMN "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Rename the unique index (Prisma recreates it, but do it explicitly to be safe)
DROP INDEX IF EXISTS "Account_provider_providerAccountId_key";
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- ── VERIFICATION (table stays "VerificationToken", model renamed in Prisma) ─
ALTER TABLE "VerificationToken" RENAME COLUMN "token"   TO "value";
ALTER TABLE "VerificationToken" RENAME COLUMN "expires" TO "expiresAt";
ALTER TABLE "VerificationToken" ADD COLUMN "id"        TEXT;
UPDATE "VerificationToken" SET "id" = gen_random_uuid()::text;
ALTER TABLE "VerificationToken" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id");
DROP INDEX IF EXISTS "VerificationToken_identifier_token_key";
ALTER TABLE "VerificationToken" ADD COLUMN "createdAt" TIMESTAMP(3);
ALTER TABLE "VerificationToken" ADD COLUMN "updatedAt" TIMESTAMP(3);
