/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Pure helpers only: the core module never touches the database or env.
import {
  API_TOKEN_PREFIX,
  generateApiToken,
  hashApiToken,
  parseBearer,
} from "./api-tokens-core";

describe("generateApiToken", () => {
  it("returns a well-formed token, its sha256 hash, and a 12-char prefix", () => {
    const { token, tokenHash, prefix } = generateApiToken();
    assert.match(token, /^afk_[A-Za-z0-9_-]{43}$/);
    assert.match(tokenHash, /^[0-9a-f]{64}$/);
    assert.equal(tokenHash, hashApiToken(token));
    assert.equal(prefix, token.slice(0, 12));
    assert.ok(prefix.startsWith(API_TOKEN_PREFIX));
  });

  it("is unique per call", () => {
    assert.notEqual(generateApiToken().token, generateApiToken().token);
  });
});

describe("hashApiToken", () => {
  it("is deterministic and matches a known sha256 vector", () => {
    assert.equal(
      hashApiToken("abc"),
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    assert.equal(hashApiToken("abc"), hashApiToken("abc"));
  });
});

describe("parseBearer", () => {
  const { token } = generateApiToken();

  it("accepts a valid bearer token, case-insensitive scheme", () => {
    assert.equal(parseBearer(`Bearer ${token}`), token);
    assert.equal(parseBearer(`bearer ${token}`), token);
    assert.equal(parseBearer(`BEARER ${token}`), token);
  });

  it("rejects missing, wrong-scheme, and malformed values", () => {
    assert.equal(parseBearer(null), null);
    assert.equal(parseBearer(""), null);
    assert.equal(parseBearer(token), null);
    assert.equal(parseBearer(`Basic ${token}`), null);
    assert.equal(parseBearer("Bearer "), null);
    assert.equal(parseBearer("Bearer sk_" + "a".repeat(43)), null);
    assert.equal(parseBearer("Bearer spk_" + "a".repeat(43)), null);
    assert.equal(parseBearer("Bearer afk_short"), null);
    assert.equal(parseBearer(`Bearer ${token}x`), null);
    assert.equal(parseBearer(`Bearer ${token.slice(0, -1)}!`), null);
    assert.equal(parseBearer(`Bearer ${token} extra`), null);
  });
});
