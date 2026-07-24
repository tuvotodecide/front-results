"use client";

import { FormEvent, useRef, useState } from "react";
import { RefreshCw, Search, ShieldAlert, WalletCards } from "lucide-react";
import CopyButton from "../components/CopyButton";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import { useLazyLookupTvdAdminWalletQuery } from "@/store/tvd";
import type { TvdWalletLookupResponse } from "@/store/tvd";
import {
  getReasonCodeLabel,
  getWalletLookupErrorMessage,
  getWalletLookupFeedback,
  validateWalletLookupAddress,
} from "../utils/tvdWalletLookup";

const toneClasses = {
  success: "border-[#b8d9bd] bg-[#eef8ef] text-[#287c36]",
  warning: "border-[#f3d48d] bg-[#fff8e8] text-[#8a5a00]",
  danger: "border-[#f0b8b8] bg-[#fff0f0] text-[#a33030]",
  neutral: "border-[#d8dde3] bg-[#f7f8fa] text-[#4b5563]",
} as const;

const booleanLabel = (value: boolean | null) => {
  if (value === null) return "No disponible";
  return value ? "Sí" : "No";
};

const formatDate = (value: string | null) => {
  if (!value) return "No disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function WalletLookupResult({
  result,
}: {
  result: TvdWalletLookupResponse;
}) {
  const feedback = getWalletLookupFeedback(result);

  return (
    <article className="mt-5 overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#e8ece8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#3f3f3f]">
            Detalle de wallet
          </h2>
          <p className="mt-1 text-sm text-[#777]">{feedback.description}</p>
        </div>
        <span
          className={`rounded-full border px-4 py-1 text-sm font-medium ${toneClasses[feedback.tone]}`}
        >
          {feedback.title}
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 border-b border-[#e8ece8] pb-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs text-[#777]">Dirección normalizada</p>
            <p className="mt-1 break-all font-mono text-sm text-[#444]">
              {result.accountAddress}
            </p>
          </div>
          <CopyButton value={result.accountAddress} label="Copiar" />
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e8ece8] p-3">
            <dt className="text-xs text-[#777]">Registro Identity</dt>
            <dd className="mt-1 text-sm font-semibold text-[#444]">
              {result.identityStatus}
            </dd>
          </div>
          <div className="rounded-xl border border-[#e8ece8] p-3">
            <dt className="text-xs text-[#777]">Asociación Results</dt>
            <dd className="mt-1 text-sm font-semibold text-[#444]">
              {result.associationStatus}
            </dd>
          </div>
          <div className="rounded-xl border border-[#e8ece8] p-3">
            <dt className="text-xs text-[#777]">Puede utilizarse</dt>
            <dd className="mt-1 text-sm font-semibold text-[#444]">
              {result.canUse ? "Sí" : "No"}
            </dd>
          </div>
          <div className="rounded-xl border border-[#e8ece8] p-3">
            <dt className="text-xs text-[#777]">Resultado</dt>
            <dd className="mt-1 text-sm font-semibold text-[#444]">
              {getReasonCodeLabel(result.reasonCode)}
            </dd>
          </div>
        </dl>

        <section>
          <h3 className="text-sm font-semibold text-[#444]">
            Asociaciones institucionales
          </h3>
          {result.associations.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-[#d8dde3] bg-[#fafafa] p-4 text-sm text-[#777]">
              No hay asociaciones institucionales locales para esta wallet.
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-[#e8ece8]">
              <table className="min-w-full divide-y divide-[#e8ece8] text-left text-sm">
                <thead className="bg-[#f8faf8] text-xs uppercase text-[#777]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Institución</th>
                    <th className="px-4 py-3 font-semibold">Assignment</th>
                    <th className="px-4 py-3 font-semibold">Rol</th>
                    <th className="px-4 py-3 font-semibold">Activa</th>
                    <th className="px-4 py-3 font-semibold">Wallet</th>
                    <th className="px-4 py-3 font-semibold">Verificada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8ece8]">
                  {result.associations.map((association) => (
                    <tr key={association.assignmentId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#444]">
                          {association.tenantName}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#777]">
                          {association.tenantId}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#555]">
                        {association.assignmentStatus ?? "No disponible"}
                      </td>
                      <td className="px-4 py-3 text-[#555]">
                        {association.institutionalRole ?? "No disponible"}
                      </td>
                      <td className="px-4 py-3 text-[#555]">
                        {booleanLabel(association.assignmentActive)}
                      </td>
                      <td className="px-4 py-3 text-[#555]">
                        {association.walletStatus}
                      </td>
                      <td className="px-4 py-3 text-[#555]">
                        {formatDate(association.walletVerifiedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

export default function TvdWalletLookupPage() {
  const [wallet, setWallet] = useState("");
  const [lookupAddress, setLookupAddress] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const pendingAddressRef = useRef<string | null>(null);
  const [lookupWallet, lookupState] = useLazyLookupTvdAdminWalletQuery();
  const isLoading = lookupState.isFetching && Boolean(lookupAddress);
  const hasCurrentResult =
    Boolean(lookupAddress) &&
    Boolean(lookupState.data) &&
    lookupState.data?.accountAddress.toLowerCase() ===
      lookupAddress?.toLowerCase();

  const submitLookup = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmed = wallet.trim();
    const error = validateWalletLookupAddress(trimmed);
    setValidationError(error);

    if (error) {
      setLookupAddress(null);
      return;
    }

    if (pendingAddressRef.current === trimmed) {
      return;
    }

    setLookupAddress(trimmed);
    pendingAddressRef.current = trimmed;
    void lookupWallet(trimmed, false)
      .unwrap()
      .catch(() => undefined)
      .finally(() => {
        if (pendingAddressRef.current === trimmed) {
          pendingAddressRef.current = null;
        }
      });
  };

  const retryLookup = () => {
    if (!lookupAddress || pendingAddressRef.current === lookupAddress) {
      return;
    }
    pendingAddressRef.current = lookupAddress;
    void lookupWallet(lookupAddress, false)
      .unwrap()
      .catch(() => undefined)
      .finally(() => {
        if (pendingAddressRef.current === lookupAddress) {
          pendingAddressRef.current = null;
        }
      });
  };

  return (
    <section>
      <SuperadminPageHeader
        title="Consulta de billetera"
        subtitle="¿Esta billetera pertenece al ecosistema $TVD?"
      />

      <form
        onSubmit={submitLookup}
        className="rounded-2xl border border-[#dfe6df] bg-white p-5 shadow-sm"
      >
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
              setLookupAddress(null);
              setValidationError(null);
            }}
            aria-invalid={Boolean(validationError)}
            aria-describedby={
              validationError ? "superadmin-wallet-lookup-error" : undefined
            }
            placeholder="0x..."
            className="rounded-lg border border-[#dfe3df] px-4 py-3 font-mono text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#287c36] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:bg-[#8fb996]"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isLoading ? "Consultando" : "Consultar"}
          </button>
        </div>
        {validationError ? (
          <p
            id="superadmin-wallet-lookup-error"
            className="mt-2 text-sm font-medium text-[#a33030]"
          >
            {validationError}
          </p>
        ) : null}
      </form>

      {!lookupAddress && !validationError ? (
        <div className="mt-5 flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-[#dfe6df] bg-white p-6 text-center shadow-sm">
          <WalletCards className="h-9 w-9 text-[#777]" />
          <p className="mt-4 text-sm text-[#777]">
            Ingresa una dirección de wallet para verificar su registro y
            asociaciones institucionales.
          </p>
        </div>
      ) : null}

      {isLoading ? (
        <div
          role="status"
          className="mt-5 flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-[#dfe6df] bg-white p-6 text-center shadow-sm"
        >
          <RefreshCw className="h-8 w-8 animate-spin text-[#287c36]" />
          <p className="mt-4 text-sm font-medium text-[#444]">
            Consultando wallet...
          </p>
        </div>
      ) : null}

      {!isLoading && lookupAddress && lookupState.isError ? (
        <div className="mt-5 rounded-2xl border border-[#f0b8b8] bg-[#fff7f7] p-5 shadow-sm">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-none text-[#a33030]" />
            <div>
              <h2 className="text-base font-semibold text-[#7a2525]">
                No pudimos consultar la wallet
              </h2>
              <p className="mt-1 text-sm text-[#7a2525]">
                {getWalletLookupErrorMessage(lookupState.error)}
              </p>
              <button
                type="button"
                onClick={retryLookup}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#d99999] bg-white px-4 py-2 text-sm font-semibold text-[#7a2525] hover:border-[#a33030]"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && hasCurrentResult && lookupState.data ? (
        <WalletLookupResult result={lookupState.data} />
      ) : null}
    </section>
  );
}
