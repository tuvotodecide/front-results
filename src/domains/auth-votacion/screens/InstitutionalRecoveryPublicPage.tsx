"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { tvdInstitutionsMock } from "@/domains/superadmin/data/superadminTvd.mock";
import { createInstitutionalRecoveryRequest } from "@/domains/superadmin/services/superadminTvdApi";
import type {
  PublicInstitutionalRecoveryDraft,
  PublicInstitutionalRecoveryReceipt,
} from "@/domains/superadmin/types";
import { Link } from "../navigation/compat";

const initialDraft: PublicInstitutionalRecoveryDraft = {
  institutionName: "",
  fullName: "",
  phone: "",
  newEmail: "",
  supervisorContact: "",
};

export default function InstitutionalRecoveryPublicPage() {
  const [draft, setDraft] =
    useState<PublicInstitutionalRecoveryDraft>(initialDraft);
  const [receipt, setReceipt] =
    useState<PublicInstitutionalRecoveryReceipt | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const institutionOptions = useMemo(
    () => tvdInstitutionsMock.map((institution) => institution.name),
    [],
  );

  const updateField = (
    field: keyof PublicInstitutionalRecoveryDraft,
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const hasMissingField = Object.values(draft).some(
      (value) => !value.trim(),
    );
    if (hasMissingField) return;

    const response = await createInstitutionalRecoveryRequest(draft);
    setReceipt(response);
  };

  const fieldError = (value: string) =>
    submitted && !value.trim() ? (
      <p className="mt-1 text-xs font-medium text-red-500">
        Este campo es obligatorio.
      </p>
    ) : null;

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#459151] px-4 py-10">
      <div className="w-full max-w-[560px] rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
        {!receipt ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-800">
                Recuperar acceso institucional
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Envía una solicitud para recuperar la administración de tu institución.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Nombre de la institución
                </span>
                <select
                  value={draft.institutionName}
                  onChange={(event) =>
                    updateField("institutionName", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
                >
                  <option value="">Nombre de la institución</option>
                  {institutionOptions.map((institution) => (
                    <option key={institution} value={institution}>
                      {institution}
                    </option>
                  ))}
                </select>
                {fieldError(draft.institutionName)}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">
                    Nombre completo
                  </span>
                  <input
                    value={draft.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
                  />
                  {fieldError(draft.fullName)}
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">
                    Número de teléfono
                  </span>
                  <input
                    value={draft.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
                  />
                  {fieldError(draft.phone)}
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Nuevo Correo
                </span>
                <input
                  value={draft.newEmail}
                  onChange={(event) => updateField("newEmail", event.target.value)}
                  placeholder="correo@activo.com"
                  type="email"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-300 focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
                />
                {fieldError(draft.newEmail)}
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Introduzca el número de su inmediato superior para verificación
                </span>
                <input
                  value={draft.supervisorContact}
                  onChange={(event) =>
                    updateField("supervisorContact", event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20"
                />
                {fieldError(draft.supervisorContact)}
              </label>

              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
                <Info className="h-4 w-4 text-[#459151]" />
                La solicitud será revisada antes de aplicar cambios.
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#287c36] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#287c36]/20 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Enviar solicitud
              </button>

              <Link
                to="/votacion/login"
                style={{ borderColor: "#287c36", color: "#287c36" }}
                className="inline-block w-full rounded-xl border-2 py-3 text-center text-sm font-bold transition-all hover:bg-[#287c36]/5 active:scale-[0.98]"
              >
                Volver al login
              </Link>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50">
              <CheckCircle2 className="h-12 w-12 text-yellow-500" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-800">
              Solicitud enviada
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-base text-gray-500">
              Revisaremos la información y te contactaremos al correo indicado.
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-xl bg-gray-50 p-4 text-left text-sm">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <span className="text-gray-500">Institución</span>
                <span className="font-semibold text-gray-700">
                  {receipt.institutionName}
                </span>
                <span className="text-gray-500">Correo de contacto</span>
                <span className="font-semibold text-gray-700">
                  {receipt.contactEmail}
                </span>
                <span className="text-gray-500">Estado</span>
                <span className="font-semibold text-gray-700">
                  {receipt.status}
                </span>
              </div>
            </div>

            <Link
              to="/votacion/login"
              className="mt-6 inline-block w-full max-w-md rounded-xl bg-[#287c36] px-4 py-3.5 text-center text-sm font-bold text-white transition-all hover:bg-[#1f642b]"
            >
              Volver al login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
