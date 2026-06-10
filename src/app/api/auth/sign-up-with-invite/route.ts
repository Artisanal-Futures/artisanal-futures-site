import { NextResponse } from "next/server";

import { env } from "~/env";
import { db } from "~/server/db";

const SIGN_UP_URL = `${env.BETTER_AUTH_URL}/api/auth/sign-up/email`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      invitationCode?: string;
      captchaToken?: string;
    };

    const email = body.email?.trim();
    const password = body.password;
    const name = body.name?.trim();
    const invitationCode = body.invitationCode?.trim().toUpperCase();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Email, password, and name are required" },
        { status: 400 },
      );
    }

    if (!invitationCode) {
      return NextResponse.json(
        { message: "Invalid or missing invitation code" },
        { status: 401 },
      );
    }

    const invite = await db.platformInvite.findUnique({
      where: { code: invitationCode },
    });

    if (!invite) {
      return NextResponse.json(
        { message: "Invalid invitation code" },
        { status: 401 },
      );
    }

    if (invite.used) {
      return NextResponse.json(
        { message: "This invitation code has already been used" },
        { status: 401 },
      );
    }

    if (invite.expiresAt <= new Date()) {
      return NextResponse.json(
        { message: "This invitation code has expired" },
        { status: 401 },
      );
    }

    const emailNormalized = email.toLowerCase();
    if (invite.email.toLowerCase() !== emailNormalized) {
      return NextResponse.json(
        { message: "This invitation is for a different email address." },
        { status: 401 },
      );
    }

    const signUpRes = await fetch(SIGN_UP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: env.BETTER_AUTH_URL,
        "x-captcha-response": body.captchaToken ?? "",
      },
      body: JSON.stringify({
        email,
        password,
        name,
        role: invite.role,
        code: invitationCode,
      }),
    });

    const responseBody = await signUpRes.text();
    const nextHeaders = new Headers();

    signUpRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") return;
      nextHeaders.set(key, value);
    });

    const setCookies = (
      signUpRes.headers as Headers & { getSetCookie?: () => string[] }
    ).getSetCookie?.();
    if (setCookies?.length) {
      for (const cookie of setCookies) {
        nextHeaders.append("set-cookie", cookie);
      }
    } else {
      const setCookie = signUpRes.headers.get("set-cookie");
      if (setCookie) nextHeaders.set("set-cookie", setCookie);
    }

    return new NextResponse(responseBody, {
      status: signUpRes.status,
      headers: nextHeaders,
    });
  } catch (error) {
    console.error("[sign-up-with-invite]", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
