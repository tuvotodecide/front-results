import { NextResponse } from "next/server";
import {
  DEV_AUTH_COOKIE,
  DEV_AUTH_COOKIE_VALUE,
  devSuperadminSession,
  isDevAuthEnabled,
} from "@/domains/dev-auth/devAuth";

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function POST() {
  if (!isDevAuthEnabled()) {
    return notFound();
  }

  const response = NextResponse.json({ session: devSuperadminSession });
  response.cookies.set(DEV_AUTH_COOKIE, DEV_AUTH_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
