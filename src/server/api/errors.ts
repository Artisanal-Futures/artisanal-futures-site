import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * tRPC wraps anything a procedure throws that is not a TRPCError (Prisma
 * errors, network failures, bugs) as INTERNAL_SERVER_ERROR with
 * `message = cause.message` and the original error as `cause`. Deliberate
 * `new TRPCError({ code, message })` throws never pass a `cause`, so a cause on
 * an INTERNAL_SERVER_ERROR is the signature of an unexpected failure. Zod
 * errors are excluded because the formatter already exposes them in a safe,
 * structured form.
 */
export function isUnexpectedError(error: TRPCError): boolean {
  return (
    error.code === "INTERNAL_SERVER_ERROR" &&
    error.cause != null &&
    !(error.cause instanceof TRPCError) &&
    !(error.cause instanceof ZodError)
  );
}

/**
 * Prisma messages embed the full query and every field value, so unexpected
 * errors are replaced with a generic message and a short reference id before
 * reaching the client. The real cause is logged server-side under the same id
 * so a user-reported ref can be matched to the log line.
 */
export function toSafeErrorShape<
  TShape extends {
    message: string;
    data: { stack?: string } & Record<string, unknown>;
  },
>(shape: TShape, error: TRPCError, path: string | undefined): TShape {
  if (!isUnexpectedError(error)) return shape;

  const ref = randomUUID().slice(0, 8);
  console.error(`[tRPC] ${path ?? "<no-path>"} failed (ref ${ref})`, error.cause);

  return {
    ...shape,
    message: `${GENERIC_ERROR_MESSAGE} (ref ${ref})`,
    data: { ...shape.data, stack: undefined },
  };
}
