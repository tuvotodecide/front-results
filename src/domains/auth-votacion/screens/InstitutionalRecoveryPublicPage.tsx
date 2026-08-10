"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import {
  initialInstitutionalRecoveryPublicDraft,
  getPublicRecoveryErrorMessage,
  validateInstitutionalRecoveryPublicDraft,
  type InstitutionalRecoveryPublicDraft,
  type InstitutionalRecoveryPublicField,
  type InstitutionalRecoveryPublicErrors,
} from "../utils/institutionalRecoveryPublicForm";
import { useCreateInstitutionalRecoveryRequestMutation } from "@/store/institutionalRecovery";
import type { InstitutionalRecoveryPublicReceipt } from "@/store/institutionalRecovery";
import { Link } from "../navigation/compat";
import PublicInstitutionAutocomplete from "../components/PublicInstitutionAutocomplete";
import type { PublicInstitutionTenant } from "@/store/institutionalTenants";

const inputClassName =
  "mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-300 focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/20";

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 text-xs font-medium text-red-500" role="alert">
      {message}
    </p>
  ) : null;

export default function InstitutionalRecoveryPublicPage() {
  const [draft, setDraft] = useState<InstitutionalRecoveryPublicDraft>(
    initialInstitutionalRecoveryPublicDraft,
  );
  const [errors, setErrors] = useState<InstitutionalRecoveryPublicErrors>({});
  const [receipt, setReceipt] =
    useState<InstitutionalRecoveryPublicReceipt | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedInstitution, setSelectedInstitution] =
    useState<PublicInstitutionTenant | null>(null);
  const [createRequest, createState] =
    useCreateInstitutionalRecoveryRequestMutation();

  const updateField = (
    field: InstitutionalRecoveryPublicField,
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validation = validateInstitutionalRecoveryPublicDraft(draft);
    setErrors(validation.errors);
    if (!validation.isValid || createState.isLoading) return;

    try {
      const response = await createRequest(validation.payload).unwrap();
      setReceipt(response);
    } catch (error) {
      setFormError(getPublicRecoveryErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#459151] px-4 py-10">
      <div className="w-full max-w-[620px] rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
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

            <form onSubmit={submit} className="space-y-4" noValidate>
              <PublicInstitutionAutocomplete
                id="institution-search"
                value={draft.institutionId}
                error={errors.institutionId}
                label="Nombre de la institución"
                onChange={(institutionId) => updateField("institutionId", institutionId)}
                onSelectInstitution={setSelectedInstitution}
              />

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Nombre completo
                </span>
                <input
                  value={draft.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  className={inputClassName}
                  autoComplete="name"
                />
                <FieldError message={errors.fullName} />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Número de teléfono
                </span>
                <input
                  value={draft.phoneNumber}
                  onChange={(event) =>
                    updateField("phoneNumber", event.target.value)
                  }
                  type="tel"
                  className={inputClassName}
                  autoComplete="tel"
                />
                <FieldError message={errors.phoneNumber} />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Nuevo correo
                </span>
                <input
                  value={draft.newEmail}
                  onChange={(event) =>
                    updateField("newEmail", event.target.value)
                  }
                  placeholder="admin@institucion.bo"
                  type="email"
                  className={inputClassName}
                  autoComplete="email"
                />
                <FieldError message={errors.newEmail} />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Número de su inmediato superior para verificación
                </span>
                <input
                  value={draft.supervisorPhoneNumber}
                  onChange={(event) =>
                    updateField("supervisorPhoneNumber", event.target.value)
                  }
                  type="tel"
                  className={inputClassName}
                  autoComplete="tel"
                />
                <FieldError message={errors.supervisorPhoneNumber} />
              </label>

              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
                <Info className="h-4 w-4 shrink-0 text-[#459151]" />
                La solicitud será revisada antes de aplicar cambios.
              </div>

              {formError ? (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={createState.isLoading}
                className="w-full rounded-xl bg-[#287c36] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#287c36]/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createState.isLoading ? "Enviando..." : "Enviar solicitud"}
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
            <p className="mx-auto mt-3 max-w-md text-base text-gray-500">
              Solicitud enviada correctamente. Será revisada y se te notificará cuando exista una actualización.
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-xl border border-gray-100 bg-gray-50 p-4 text-left text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <h2 className="font-semibold text-gray-800">Estado de la solicitud</h2>
                <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                  {receipt.status === "PENDING" ? "Pendiente" : receipt.status}
                </span>
              </div>
              <div className="mt-3 grid gap-3">
                {selectedInstitution?.institutionName ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Institución</span>
                    <span className="text-right font-semibold text-gray-700">
                      {selectedInstitution.institutionName}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Correo solicitado</span>
                  <span className="break-all text-right font-semibold text-gray-700">
                    {draft.newEmail.trim().toLowerCase()}
                  </span>
                </div>
                {receipt.requestedAt ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Fecha</span>
                    <span className="text-right font-semibold text-gray-700">
                      {new Date(receipt.requestedAt).toLocaleString("es-BO")}
                    </span>
                  </div>
                ) : null}
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
