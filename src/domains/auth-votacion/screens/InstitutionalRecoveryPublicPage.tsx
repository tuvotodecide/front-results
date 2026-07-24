"use client";

import { FormEvent, useRef, useState } from "react";
import { CheckCircle2, Info, Search } from "lucide-react";
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
import {
  useLazyListPublicInstitutionalTenantsQuery,
  type PublicInstitutionTenant,
} from "@/store/institutionalTenants";
import { Link } from "../navigation/compat";

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
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [institutionOptions, setInstitutionOptions] = useState<
    PublicInstitutionTenant[]
  >([]);
  const [institutionSearchError, setInstitutionSearchError] =
    useState<string | null>(null);
  const [institutionSearchStatus, setInstitutionSearchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const searchSequenceRef = useRef(0);
  const [createRequest, createState] =
    useCreateInstitutionalRecoveryRequestMutation();
  const [listPublicInstitutions] = useLazyListPublicInstitutionalTenantsQuery();

  const updateField = (
    field: InstitutionalRecoveryPublicField,
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const selectedInstitution =
    institutionOptions.find(
      (institution) => institution.institutionId === draft.institutionId,
    ) ?? null;

  const updateInstitutionSearch = (value: string) => {
    searchSequenceRef.current += 1;
    setInstitutionSearch(value);
    setInstitutionOptions([]);
    setInstitutionSearchError(null);
    setInstitutionSearchStatus("idle");
    setFormError(null);
    setErrors((current) => ({ ...current, institutionId: undefined }));

    if (selectedInstitution && value !== selectedInstitution.institutionName) {
      setDraft((current) => ({ ...current, institutionId: "" }));
    }
  };

  const runInstitutionSearch = async () => {
    const search = institutionSearch.trim().replace(/\s+/g, " ");
    if (search.length < 2) {
      setInstitutionSearchError(
        "Ingresa al menos 2 caracteres para buscar la institución.",
      );
      setInstitutionOptions([]);
      setInstitutionSearchStatus("idle");
      return;
    }

    const sequence = searchSequenceRef.current + 1;
    searchSequenceRef.current = sequence;
    setInstitutionSearchStatus("loading");
    setInstitutionSearchError(null);
    setInstitutionOptions([]);
    setDraft((current) => ({ ...current, institutionId: "" }));

    try {
      const response = await listPublicInstitutions({
        search,
        page: 1,
        limit: 10,
      }).unwrap();
      if (sequence !== searchSequenceRef.current) return;
      setInstitutionOptions(response.items);
      setInstitutionSearchStatus("success");
      if (response.items.length === 0) {
        setInstitutionSearchError(
          "No encontramos instituciones activas con ese nombre.",
        );
      }
    } catch {
      if (sequence !== searchSequenceRef.current) return;
      setInstitutionSearchStatus("error");
      setInstitutionSearchError(
        "No pudimos buscar instituciones. Intenta nuevamente.",
      );
    }
  };

  const selectInstitution = (institution: PublicInstitutionTenant) => {
    setDraft((current) => ({
      ...current,
      institutionId: institution.institutionId,
    }));
    setInstitutionSearch(institution.institutionName);
    setInstitutionSearchError(null);
    setErrors((current) => ({ ...current, institutionId: undefined }));
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
                Actualizar correo institucional
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Solicita la actualización del correo del mismo administrador
                institucional. La institución, wallet, rol y asignación no
                cambiarán.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <label className="block" htmlFor="institution-search">
                  <span className="text-sm font-semibold text-gray-700">
                    Institución
                  </span>
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="institution-search"
                    value={institutionSearch}
                    onChange={(event) =>
                      updateInstitutionSearch(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void runInstitutionSearch();
                      }
                    }}
                    placeholder="Busca tu institución por nombre"
                    className={inputClassName.replace("mt-1 ", "")}
                    autoComplete="organization"
                    aria-describedby="institution-search-help"
                  />
                  <button
                    type="button"
                    onClick={runInstitutionSearch}
                    disabled={institutionSearchStatus === "loading"}
                    className="inline-flex items-center justify-center rounded-xl bg-[#287c36] px-4 text-sm font-bold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Search className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Buscar institución</span>
                  </button>
                </div>
                <p
                  id="institution-search-help"
                  className="mt-1 text-xs text-gray-500"
                >
                  Selecciona una institución activa del catálogo público. El ID
                  técnico se enviará internamente al backend.
                </p>
                <FieldError message={errors.institutionId} />
                {institutionSearchStatus === "loading" ? (
                  <p className="mt-2 text-sm text-gray-500" role="status">
                    Buscando instituciones...
                  </p>
                ) : null}
                {institutionSearchError ? (
                  <div
                    className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-800"
                    role="alert"
                  >
                    {institutionSearchError}
                  </div>
                ) : null}
                {institutionOptions.length > 0 ? (
                  <div
                    className="mt-2 overflow-hidden rounded-xl border border-gray-200"
                    role="listbox"
                    aria-label="Instituciones encontradas"
                  >
                    {institutionOptions.map((institution) => {
                      const isSelected =
                        draft.institutionId === institution.institutionId;
                      return (
                        <button
                          key={institution.institutionId}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => selectInstitution(institution)}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
                            isSelected
                              ? "bg-[#459151]/10 font-semibold text-[#287c36]"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span>{institution.institutionName}</span>
                          {isSelected ? (
                            <span className="text-xs font-bold">
                              Seleccionada
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

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
                    className={inputClassName}
                    autoComplete="tel"
                  />
                  <FieldError message={errors.phoneNumber} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    Confirmar nuevo correo
                  </span>
                  <input
                    value={draft.confirmNewEmail}
                    onChange={(event) =>
                      updateField("confirmNewEmail", event.target.value)
                    }
                    placeholder="admin@institucion.bo"
                    type="email"
                    className={inputClassName}
                    autoComplete="email"
                  />
                  <FieldError message={errors.confirmNewEmail} />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  Teléfono del superior inmediato para verificación
                </span>
                <input
                  value={draft.supervisorPhoneNumber}
                  onChange={(event) =>
                    updateField("supervisorPhoneNumber", event.target.value)
                  }
                  className={inputClassName}
                  autoComplete="tel"
                />
                <FieldError message={errors.supervisorPhoneNumber} />
              </label>

              <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
                <Info className="mt-0.5 h-4 w-4 flex-none text-[#459151]" />
                <p>
                  No solicitaremos wallet, firma, contraseña ni claves privadas.
                  Si la información corresponde a una cuenta institucional
                  válida, la solicitud será revisada.
                </p>
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
              Si la información corresponde a una cuenta institucional válida,
              la solicitud será revisada. El enlace para establecer contraseña
              llegará al nuevo correo cuando sea aprobada.
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-xl bg-gray-50 p-4 text-left text-sm">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <span className="text-gray-500">Referencia</span>
                <span className="break-all text-right font-semibold text-gray-700">
                  {receipt.requestId}
                </span>
                <span className="text-gray-500">Estado</span>
                <span className="font-semibold text-gray-700">
                  {receipt.status === "PENDING" ? "Pendiente" : receipt.status}
                </span>
                <span className="text-gray-500">Fecha</span>
                <span className="text-right font-semibold text-gray-700">
                  {new Date(receipt.requestedAt).toLocaleString("es-BO")}
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
