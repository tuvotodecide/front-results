import React from "react";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { InstitutionalWalletMigrationGateReason } from "@/store/institutionalWalletMigration";
import type { WalletMigrationGate } from "../data/useWalletMigrationGate";

type NoticeCopy = { title: string; body: string };

const resolveCopy = (
  reason: InstitutionalWalletMigrationGateReason,
  institutionalRole: WalletMigrationGate["institutionalRole"],
): NoticeCopy | null => {
  const isPrimary = institutionalRole === "PRIMARY";
  switch (reason) {
    case "PRIMARY_LOGIN_PENDING":
      return {
        title: "Billetera institucional pendiente de actualizar",
        body: "La administración principal debe iniciar sesión para vincular su nueva billetera a la institución.",
      };
    case "WALLET_NOT_FOUND":
      return isPrimary
        ? {
            title: "No encontramos tu nueva billetera",
            body: "Registra tu billetera en la app Tu Voto Decide con tu CI y luego vuelve a verificar.",
          }
        : {
            title: "Billetera institucional pendiente de actualizar",
            body: "La administración principal todavía no registró su nueva billetera en la app Tu Voto Decide.",
          };
    case "IN_PROGRESS":
      return {
        title: "Estamos actualizando la billetera de la institución",
        body: "La vinculación de la nueva billetera se está confirmando en la red. Puede tardar unos minutos.",
      };
    case "NEEDS_REVIEW":
      return {
        title: "La actualización de la billetera requiere revisión",
        body: "No pudimos completar la vinculación de la nueva billetera. Contacta a soporte para continuar.",
      };
    case "SECONDARY_REAUTHORIZATION_REQUIRED":
      return {
        title: "Tu acceso necesita volver a autorizarse",
        body: "Tu billetera anterior dejó de ser válida tras la migración. Pide a la administración principal que vuelva a autorizar tu acceso con tu nueva billetera.",
      };
    default:
      return null;
  }
};

type WalletMigrationNoticeProps = {
  gate: WalletMigrationGate;
  className?: string;
};

const WalletMigrationNotice: React.FC<WalletMigrationNoticeProps> = ({ gate, className = "" }) => {
  if (!gate.blocking) return null;
  const copy = resolveCopy(gate.reason, gate.institutionalRole);
  if (!copy) return null;

  return (
    <div
      role="alert"
      data-testid="wallet-migration-notice"
      className={`rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-900 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{copy.title}</p>
          <p className="mt-1 text-sm leading-6">{copy.body}</p>
          <p className="mt-1 text-sm leading-6">
            Mientras tanto no es posible crear ni publicar votaciones.
          </p>
        </div>
        <button
          type="button"
          onClick={gate.recheck}
          disabled={gate.isChecking}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${gate.isChecking ? "animate-spin" : ""}`} aria-hidden="true" />
          Volver a verificar
        </button>
      </div>
    </div>
  );
};

export default WalletMigrationNotice;
