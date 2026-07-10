"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardDocumentIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import Modal2 from "@/components/Modal2";
import { explorerBaseUrl } from "../data/adminTvd.mock";
import { copyTextToClipboard } from "../services/clipboard";
import {
  addInstitutionalWallet,
  disableInstitutionalWallet,
  getInstitutionalWallets,
  validateInstitutionalWallet,
} from "../services/institutionalWalletApi";
import type { InstitutionalWallet, WalletValidationResult } from "../types";

const shortAddress = (address: string) =>
  address.length > 14 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address;

interface AddWalletModalProps {
  isOpen: boolean;
  wallets: InstitutionalWallet[];
  onClose: () => void;
  onAdd: (wallet: InstitutionalWallet) => void;
}

function AddWalletModal({ isOpen, wallets, onClose, onAdd }: AddWalletModalProps) {
  const [address, setAddress] = useState("");
  const [alias, setAlias] = useState("");
  const [validation, setValidation] = useState<WalletValidationResult>({
    status: "idle",
    message: "",
  });

  useEffect(() => {
    let active = true;

    if (!address.trim()) {
      setValidation({ status: "idle", message: "" });
      return () => {
        active = false;
      };
    }

    void validateInstitutionalWallet(address, wallets).then((result) => {
      if (active) setValidation(result);
    });

    return () => {
      active = false;
    };
  }, [address, wallets]);

  const canAdd = validation.status === "available" && alias.trim().length > 0;

  const handleClose = () => {
    setAddress("");
    setAlias("");
    setValidation({ status: "idle", message: "" });
    onClose();
  };

  const handleAdd = async () => {
    if (!canAdd || !validation.wallet) return;
    const nextWallet = await addInstitutionalWallet({
      ...validation.wallet,
      alias: alias.trim(),
    });
    onAdd(nextWallet);
    handleClose();
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title="Agregar cuenta"
      type="plain"
      size="md"
      closeOnEscape
      className="sm:rounded-2xl max-sm:mt-auto max-sm:rounded-b-none"
    >
      <div className="space-y-5">
        <div>
          <label htmlFor="wallet-address" className="mb-2 block text-sm font-medium text-slate-700">
            Dirección
          </label>
          <input
            id="wallet-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="0x..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
          />
          {validation.message ? (
            <p
              className={`mt-2 text-xs font-medium ${
                validation.status === "available" ? "text-[#2E6A38]" : "text-red-600"
              }`}
            >
              {validation.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="wallet-alias" className="mb-2 block text-sm font-medium text-slate-700">
            Alias o nombre
          </label>
          <input
            id="wallet-alias"
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            placeholder="Ej. Cuenta operativa"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
          />
          {validation.status === "available" && !alias.trim() ? (
            <p className="mt-2 text-xs font-medium text-red-600">
              Ingresa un alias para identificar la cuenta.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Ingresa una cuenta registrada en la app para vincularla a tu institución.
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={!canAdd}
            className="rounded-lg bg-[#459151] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>
    </Modal2>
  );
}

export default function InstitutionalAccountPage() {
  const [wallets, setWallets] = useState<InstitutionalWallet[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void getInstitutionalWallets().then(setWallets);
  }, []);

  const activeWallets = useMemo(
    () => wallets.filter((wallet) => wallet.status === "VALIDATED").length,
    [wallets],
  );

  const handleCopy = async (address: string) => {
    const copied = await copyTextToClipboard(address);
    setFeedback(copied ? "Dirección copiada." : "No se pudo copiar la dirección.");
  };

  const handleDisable = async (wallet: InstitutionalWallet) => {
    const disabled = await disableInstitutionalWallet(wallet);
    setWallets((current) =>
      current.map((item) => (item.id === wallet.id ? disabled : item)),
    );
    setFeedback("Cuenta deshabilitada.");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Cuenta institucional</h1>
            <p className="mt-2 max-w-xl text-slate-500">
              Cuentas vinculadas a tu institución para operar votaciones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#459151] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#3a7a44]"
          >
            <PlusIcon className="h-5 w-5" />
            Agregar cuenta
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {activeWallets} cuenta{activeWallets === 1 ? "" : "s"} validada{activeWallets === 1 ? "" : "s"} para operar votaciones.
        </div>

        {feedback ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-[#2E6A38]">
            {feedback}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {wallets.map((wallet) => {
            const validated = wallet.status === "VALIDATED";
            return (
              <article
                key={wallet.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  validated ? "border-green-200" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{wallet.alias}</h2>
                    <p className="mt-1 font-mono text-sm text-slate-500">
                      {shortAddress(wallet.address)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{wallet.email}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      validated
                        ? "bg-green-50 text-[#2E6A38] ring-1 ring-green-200"
                        : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                    }`}
                  >
                    {validated ? "Validada" : "Deshabilitada"}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy(wallet.address)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    Copiar
                  </button>
                  <a
                    href={`${explorerBaseUrl}/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    Explorer
                  </a>
                  {validated ? (
                    <button
                      type="button"
                      onClick={() => void handleDisable(wallet)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <NoSymbolIcon className="h-4 w-4" />
                      Deshabilitar
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <AddWalletModal
        isOpen={addOpen}
        wallets={wallets}
        onClose={() => setAddOpen(false)}
        onAdd={(wallet) => {
          setWallets((current) => [wallet, ...current]);
          setFeedback("Cuenta agregada correctamente.");
        }}
      />
    </div>
  );
}
