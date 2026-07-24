import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_KEYS } from "../../../../../../middleware";
import { readTvdContractsOverview } from "@/shared/tvd/superadminTvdReadService";
import type { HistoryContractsResponse } from "@/shared/tvd/superadminTvdTypes";

export const dynamic = "force-dynamic";

const getBaseApiUrl = () => {
  const configured = String(
    process.env.VITE_BASE_API_URL ?? process.env.NEXT_PUBLIC_BASE_API_URL ?? "",
  ).trim();
  return (configured || "http://localhost:3000/api/v1").replace(/\/$/, "");
};

const getHistoryContractsUrl = () =>
  getBaseApiUrl().replace(/\/api\/v1\/?$/i, "") + "/history/contracts";

export async function GET(request: NextRequest) {
  const token =
    request.cookies.get(AUTH_COOKIE_KEYS.token)?.value ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;

  if (!token) {
    return NextResponse.json(
      { message: "Sesión Superadmin requerida" },
      { status: 401 },
    );
  }

  const response = await fetch(getHistoryContractsUrl(), {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: `No fue posible obtener el registro de contratos (${response.status}).` },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as HistoryContractsResponse;
  const contracts = payload.data ?? {};
  const data = await readTvdContractsOverview(contracts);

  return NextResponse.json({ success: true, data });
}
