import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "~/env";
import {
  getSimplePressProvisionForExchange,
  updateSimplePressProvisionFromExchange,
} from "~/server/jobs/simplepress-exchange";

function getBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function assertSimplePressAuth(req: Request): NextResponse | null {
  const token = getBearerToken(req.headers.get("authorization"));
  if (!env.SIMPLEPRESS_HASH_SECRET || token !== env.SIMPLEPRESS_HASH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

const postBodySchema = z.object({
  code: z.string().min(1),
  status: z.enum(["ACTIVE", "FAILED"]),
  subdomain: z.string().trim().min(1),
  customDomain: z.string().trim().min(1),
});

export async function GET(req: Request) {
  const unauthorized = assertSimplePressAuth(req);
  if (unauthorized) return unauthorized;

  const code = new URL(req.url).searchParams.get("code");
  if (!code?.trim()) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const payload = await getSimplePressProvisionForExchange(code.trim());
  if (!payload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    email: payload.email,
    subdomain: payload.subdomain,
  });
}

export async function POST(req: Request) {
  const unauthorized = assertSimplePressAuth(req);
  if (unauthorized) return unauthorized;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await updateSimplePressProvisionFromExchange(parsed.data);

  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Subdomain or custom domain already in use" },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
