import { NextResponse } from "next/server";
import {
  InstitutionalVestingBalanceError,
  readInstitutionalVestingBalance,
} from "@/shared/tvd/institutionalVestingBalance";

export const dynamic = "force-dynamic";

// TVD_TOKEN_ADDRESS e INSTITUTIONAL_VESTING_ADDRESS no están expuestas al
// navegador, por eso el saldo se lee en el servidor.
export async function GET() {
  try {
    const data = await readInstitutionalVestingBalance();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const code =
      error instanceof InstitutionalVestingBalanceError
        ? error.code
        : "TVD_RPC_UNAVAILABLE";
    const message =
      error instanceof InstitutionalVestingBalanceError
        ? error.message
        : "No se pudo leer el saldo del vesting institucional desde la blockchain.";

    return NextResponse.json({ success: false, code, message }, { status: 503 });
  }
}
