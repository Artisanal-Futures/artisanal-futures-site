import type { Prisma } from "generated/prisma";

/**
 * The only User fields that may be exposed to the browser (API responses,
 * RSC props). Never add email, role, emailVerified or other private fields.
 */
export const publicUserSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;
