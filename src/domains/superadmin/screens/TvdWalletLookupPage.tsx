"use client";

import { useState } from "react";
import { ExternalLink, Search, WalletCards } from "lucide-react";
import CopyButton from "../components/CopyButton";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import { walletTvdBalanceMock } from "../data/superadminTvd.mock";

export default function TvdWalletLookupPage() {
  const [wallet, setWallet] = useState("");
  const [searched, setSearched] = useState(false);
  const result = searched ? walletTvdBalanceMock : null;

  return (
    <section>
      <SuperadminPageHeader
        title="Consulta de billetera"
        subtitle="¿Esta billetera pertenece al ecosistema $TVD?"
      />

      <div className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-sm">
        <label
          htmlFor="superadmin-wallet-lookup"
          className="block text-sm font-semibold text-[#444]"
        >
          Dirección de wallet
        </label>
        <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            id="superadmin-wallet-lookup"
            value={wallet}
            onChange={(event) => {
              setWallet(event.target.value);
              setSearched(false);
            }}
            placeholder="0x..."
            className="rounded-lg border border-[#dfe3df] px-4 py-3 font-mono text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
          />
          <button
            type="button"
            onClick={() => setSearched(Boolean(wallet.trim()))}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#287c36] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b]"
          >
            <Search className="h-4 w-4" />
            Consultar
          </button>
        </div>
      </div>

      {!result ? (
        <div className="mt-5 flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-[#dfe6df] bg-white p-6 text-center shadow-sm">
          <WalletCards className="h-9 w-9 text-[#777]" />
          <p className="mt-4 text-sm text-[#777]">
            Ingresa una dirección de wallet para consultar.
          </p>
        </div>
      ) : (
        <article className="mt-5 overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#e8ece8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-[#3f3f3f]">
              Detalle de billetera
            </h2>
            <span className="rounded-full border border-[#b8d9bd] bg-[#eef8ef] px-4 py-1 text-sm font-medium text-[#287c36]">
              Sí pertenece
            </span>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid gap-3 border-b border-[#e8ece8] pb-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs text-[#777]">Dirección</p>
                <p className="mt-1 break-all font-mono text-sm text-[#444]">
                  {result.shortWallet}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={result.wallet} label="Copiar" />
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-[#dfe6df] px-3 py-2 text-xs font-medium text-[#4b4b4b] hover:border-[#287c36] hover:text-[#287c36]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Explorer
                </a>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs text-[#777]">Saldo</p>
                <p className="mt-1 font-mono text-lg text-[#444]">
                  {result.balance}
                </p>
              </div>
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#287c36]"
              >
                <ExternalLink className="h-4 w-4" />
                Ver en explorer
              </a>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
