import { cookies } from "next/headers";

export async function setSignupCode(code: string) {
  "use server";
  const cookieStore = await cookies();

  cookieStore.set("signup-code", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300, // 5 minutes
  });
}
