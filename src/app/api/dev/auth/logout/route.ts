import { NextResponse } from "next/server";
import {
  DEV_AUTH_COOKIE,
  isDevAuthEnabled,
} from "@/domains/dev-auth/devAuth";

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function POST() {
  if (!isDevAuthEnabled()) {
    return notFound();
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEV_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });

  return response;
}
