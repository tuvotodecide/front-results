import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEV_AUTH_COOKIE,
  DEV_AUTH_COOKIE_VALUE,
  devSuperadminSession,
  isDevAuthEnabled,
} from "@/domains/dev-auth/devAuth";

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(request: NextRequest) {
  if (!isDevAuthEnabled()) {
    return notFound();
  }

  const devSession = request.cookies.get(DEV_AUTH_COOKIE)?.value ?? null;

  if (devSession !== DEV_AUTH_COOKIE_VALUE) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    session: devSuperadminSession,
  });
}
