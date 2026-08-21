import { NextResponse } from "next/server";
import {
  ElectoralCreditsRateError,
  readTvdPerCredit,
} from "@/shared/tvd/electoralCreditsRate";

export const dynamic = "force-dynamic";

// Parámetro público del protocolo: se lee on-chain en el servidor porque
// ELECTORAL_CREDITS_ADDRESS y TVD_RPC_URL no están expuestas al navegador.
export async function GET() {
  try {
    const data = await readTvdPerCredit();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const code =
      error instanceof ElectoralCreditsRateError
        ? error.code
        : "ELECTORAL_CREDITS_RPC_UNAVAILABLE";
    const message =
      error instanceof ElectoralCreditsRateError
        ? error.message
        : "No se pudo leer el costo por participante desde la blockchain.";

    return NextResponse.json({ success: false, code, message }, { status: 503 });
  }
}
