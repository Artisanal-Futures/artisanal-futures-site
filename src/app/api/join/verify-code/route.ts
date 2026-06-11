import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "~/server/db";

export async function POST(req: NextRequest) {
  try {
    const { invitationCode, type } = (await req.json()) as {
      invitationCode: string;
      type: "artisan" | "guest" | "admin";
    };

    const code = invitationCode?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 400 },
      );
    }

    const expectedRoleMap: Record<string, string> = {
      artisan: "ARTISAN",
      guest: "GUEST",
      admin: "ADMIN",
    };
    const expectedRole = expectedRoleMap[type];

    if (!expectedRole) {
      return NextResponse.json(
        { error: "Invalid invitation type" },
        { status: 400 },
      );
    }

    // Check PlatformInvite first
    const invite = await db.platformInvite.findUnique({
      where: { code },
    });

    if (invite) {
      if (invite.used) {
        return NextResponse.json(
          { error: "This invitation code has already been used" },
          { status: 400 },
        );
      }
      if (invite.expiresAt <= new Date()) {
        return NextResponse.json(
          { error: "This invitation code has expired" },
          { status: 400 },
        );
      }
      if (invite.role !== expectedRole) {
        return NextResponse.json(
          {
            error: `This code is not valid for ${type} invitations`,
          },
          { status: 400 },
        );
      }
      return NextResponse.json({ valid: true });
    }

    // Admin invites require a real PlatformInvite — no env-code fallback
    if (type === "admin") {
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 400 },
      );
    }

    // Fall back to environment variable for artisan/guest
    const validCode =
      type === "artisan" ? process.env.ARTISAN_CODE : process.env.GUEST_CODE;

    if (!validCode) {
      return NextResponse.json(
        { error: "Invitation system not configured" },
        { status: 500 },
      );
    }

    if (code !== validCode.toUpperCase()) {
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 400 },
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
