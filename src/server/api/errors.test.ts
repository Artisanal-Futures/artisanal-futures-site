/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";

import { GENERIC_ERROR_MESSAGE, toSafeErrorShape } from "./errors";

function shapeFor(error: TRPCError) {
  return {
    message: error.message,
    code: -32603,
    data: {
      code: error.code,
      httpStatus: 500,
      path: "shops.update",
      stack: "Error: boom\n    at somewhere",
    },
  };
}

function run(error: TRPCError) {
  const spy = mock.method(console, "error", () => undefined);
  try {
    const shape = toSafeErrorShape(shapeFor(error), error, "shops.update");
    return { shape, calls: spy.mock.calls };
  } finally {
    spy.mock.restore();
  }
}

describe("toSafeErrorShape", () => {
  it("replaces an unexpected error's message, drops the stack, and logs the cause", () => {
    const cause = new Error(
      "Invalid `prisma.shop.update()` invocation: secret-value",
    );
    const error = new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause });
    assert.match(error.message, /secret-value/);

    const { shape, calls } = run(error);

    assert.ok(shape.message.startsWith(GENERIC_ERROR_MESSAGE));
    assert.match(shape.message, /ref [0-9a-f]{8}/);
    assert.doesNotMatch(shape.message, /prisma|secret-value/i);
    assert.equal(shape.data.stack, undefined);
    assert.equal(shape.data.path, "shops.update");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.arguments[1], cause);
    assert.match(String(calls[0]?.arguments[0]), /shops\.update.*ref/);
  });

  it("keeps a deliberate INTERNAL_SERVER_ERROR that has no cause", () => {
    const error = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not post",
    });
    const { shape, calls } = run(error);

    assert.deepEqual(shape, shapeFor(error));
    assert.equal(calls.length, 0);
  });

  it("keeps non-internal errors unchanged", () => {
    const error = new TRPCError({
      code: "CONFLICT",
      message: "That shop URL was just taken.",
    });
    const { shape, calls } = run(error);

    assert.deepEqual(shape, shapeFor(error));
    assert.equal(calls.length, 0);
  });

  it("keeps validation errors caused by a ZodError unchanged", () => {
    const error = new TRPCError({
      code: "BAD_REQUEST",
      cause: new ZodError([]),
    });
    const { shape, calls } = run(error);

    assert.deepEqual(shape, shapeFor(error));
    assert.equal(calls.length, 0);
  });
});
