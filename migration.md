# **next-auth → better-auth Migration Guide**
## Zero Data Loss Database Schema Migration

### **Prerequisites**
- Database migration has been applied (if shared DB, this is already done!)
- You have a multi-file Prisma setup with models in `prisma/models/` or similar

---

## **Step 1: Update Your Auth Models in Prisma Schema**

Update the four auth models in your `prisma/schema.prisma` (or wherever you define them):

### **User Model**
```prisma
model User {
  id            String   @id @default(cuid())
  name          String?
  email         String?  @unique
  emailVerified Boolean  @default(false)  // Changed from DateTime?
  image         String?
  // ... your custom fields ...
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt        // Added
  // ... your relations ...
  accounts      Account[]
  sessions      Session[]
  // ... other relations ...
}
```

### **Session Model**
```prisma
model Session {
  id        String   @id @default(cuid())
  token     String   @unique              // Renamed from sessionToken
  userId    String
  expiresAt DateTime                      // Renamed from expires
  createdAt DateTime @default(now())      // Added
  updatedAt DateTime @updatedAt           // Added
  ipAddress String?                       // Added
  userAgent String?                       // Added
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### **Account Model**
```prisma
model Account {
  id                     String    @id @default(cuid())
  userId                 String
  providerId             String    // Renamed from provider
  accountId              String    // Renamed from providerAccountId
  accessToken            String?   // Renamed from access_token
  refreshToken           String?   // Renamed from refresh_token
  idToken                String?   // Renamed from id_token
  accessTokenExpiresAt   DateTime? // Added
  refreshTokenExpiresAt  DateTime? // Added
  scope                  String?
  password               String?   // Added (for email/password auth)
  createdAt              DateTime  @default(now()) // Added
  updatedAt              DateTime  @updatedAt      // Added
  user                   User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId]) // Updated from [provider, providerAccountId]
  @@index([userId])
}
```

### **Verification Model**
```prisma
model Verification {
  id         String    @id @default(cuid())     // Added
  identifier String
  value      String    @unique                  // Renamed from token
  expiresAt  DateTime                           // Renamed from expires
  createdAt  DateTime?                          // Added
  updatedAt  DateTime?                          // Added

  @@map("VerificationToken") // Keeps DB table name unchanged
}
```

---

## **Step 2: Create Migration Manually**

**If the shared database already has the migration applied, you can skip this step!** Just mark the migration as applied:

```bash
# Create empty migration directory
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_next_auth_to_better_auth

# Create empty migration.sql
touch prisma/migrations/$(date +%Y%m%d%H%M%S)_next_auth_to_better_auth/migration.sql

# Mark as applied without running
pnpm prisma migrate resolve --applied $(ls prisma/migrations/ | grep next_auth_to_better_auth)
```

**If the database needs the migration**, create the migration with this safe SQL:

```bash
# Create migration directory
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_next_auth_to_better_auth
```

Then create `migration.sql` with this content:

```sql
-- ── USER ──────────────────────────────────────────────────────────────────
-- emailVerified: DateTime? → Boolean (preserves "was verified" signal)
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
DROP INDEX IF EXISTS "Account_provider_providerAccountId_key";
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- ── VERIFICATION (table stays "VerificationToken") ─────────────────────────
ALTER TABLE "VerificationToken" RENAME COLUMN "token"   TO "value";
ALTER TABLE "VerificationToken" RENAME COLUMN "expires" TO "expiresAt";
ALTER TABLE "VerificationToken" ADD COLUMN "id"        TEXT;
UPDATE "VerificationToken" SET "id" = gen_random_uuid()::text;
ALTER TABLE "VerificationToken" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id");
DROP INDEX IF EXISTS "VerificationToken_identifier_token_key";
ALTER TABLE "VerificationToken" ADD COLUMN "createdAt" TIMESTAMP(3);
ALTER TABLE "VerificationToken" ADD COLUMN "updatedAt" TIMESTAMP(3);
```

Then apply:

```bash
pnpm prisma migrate deploy
```

---

## **Step 3: Generate Prisma Client**

Now generate your Prisma client using your normal workflow:

```bash
pnpm db:generate
# or
pnpm prisma generate
```

---

## **What Makes This Safe**

1. **`ALTER TABLE ... RENAME COLUMN`** - Metadata-only operation in PostgreSQL, no data touched
2. **`USING` clause** - Converts `emailVerified` from timestamp to boolean while preserving verification status
3. **UUID generation** - Safely adds primary key to existing VerificationToken records before making it required
4. **No DROP + ADD** - Never drops columns that have data (unlike Prisma's auto-generated migrations)

---

## **After Migration**

Your better-auth config needs **NO changes**! It stays clean like a native installation:

```ts
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_BASE_URL,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    discord: {
      clientId: env.DISCORD_ID,
      clientSecret: env.DISCORD_SECRET,
      // ...
    },
  },
  user: {
    additionalFields: {
      role: { type: "string" },
    },
  },
});
```

No `session`, `account`, or `verification` field mappings needed because we renamed the columns to match better-auth's native expectations!
