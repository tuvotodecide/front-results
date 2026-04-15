"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/auth/authSlice";
import {
  useApproveInstitutionalApplicationMutation,
  useGetInstitutionalApplicationQuery,
  useGetInstitutionalApplicationsQuery,
  useRejectInstitutionalApplicationMutation,
  useReopenInstitutionalApplicationMutation,
  useRevokeInstitutionalApplicationMutation,
  type ApprovalStatus,
  type InstitutionalApplication,
} from "@/store/accessApprovals";

type InstitutionalTab = "pending" | "approved" | "rejected";
type FeedbackState = { kind: "success" | "error"; message: string } | null;
type ActionTone = "primary" | "danger" | "secondary";

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  REVOKED: "Revocado",
  PENDING_EMAIL_VERIFICATION: "Verificación pendiente",
};

const TAB_LABELS: Record<InstitutionalTab, string> = {
  pending: "Pendientes",
  approved: "Aprobados",
  rejected: "Rechazados",
};

const EMPTY_MESSAGES: Record<InstitutionalTab, string> = {
  pending: "No hay solicitudes institucionales pendientes.",
  approved: "No hay solicitudes institucionales aprobadas.",
  rejected: "No hay solicitudes institucionales rechazadas o revocadas.",
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ACCESS_APPROVER: "Aprobador",
};

const normalizeSearchText = (value?: string | null) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const statusLabel = (status?: ApprovalStatus) =>
  STATUS_LABELS[status ?? ""] ?? status ?? "Sin estado";

const getStatusBucket = (status?: ApprovalStatus): InstitutionalTab | null => {
  if (status === "PENDING_APPROVAL") return "pending";
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED" || status === "REVOKED") return "rejected";
  return null;
};

const formatDate = (value?: string) => {
  if (!value) return "No informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const matchesSearch = (row: InstitutionalApplication, search: string) => {
  const term = normalizeSearchText(search);
  if (!term) return true;

  return [
    row.name,
    row.dni,
    row.email,
    row.institutionName,
    row.tenantName,
  ].some((value) => normalizeSearchText(value).includes(term));
};

const badgeClassName = (status?: ApprovalStatus) => {
  if (status === "APPROVED") {
    return "border-[#5fd08b] bg-[#ebfff1] text-[#15703c]";
  }

  if (status === "PENDING_APPROVAL") {
    return "border-[#f2d88a] bg-[#fff8de] text-[#8a6a14]";
  }

  if (status === "REVOKED") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  if (status === "REJECTED") {
    return "border-[#ffb4b4] bg-[#fff0f0] text-[#cc2e2e]";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
};

const actionClassName = (tone: ActionTone) => {
  if (tone === "primary") {
    return "bg-[#2f8b3c] text-white hover:bg-[#287633]";
  }

  if (tone === "danger") {
    return "bg-[#db3732] text-white hover:bg-[#c02e29]";
  }

  return "border border-[#f0bc68] text-[#a86600] hover:bg-[#fff8ec]";
};

const InfoLine = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
      {label}
    </p>
    <p className="text-sm text-gray-800">{value || "No informado"}</p>
  </div>
);

export default function AccessApprovalsPage() {
  const auth = useSelector(selectAuth);
  const [tab, setTab] = useState<InstitutionalTab>("pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(true);

  const institutional = useGetInstitutionalApplicationsQuery();
  const institutionalRows = [...(institutional.data ?? [])].sort((a, b) =>
    String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
  );

  const filteredRows = institutionalRows.filter(
    (row) => getStatusBucket(row.status) === tab && matchesSearch(row, search),
  );

  const counts = {
    pending: institutionalRows.filter((row) => getStatusBucket(row.status) === "pending").length,
    approved: institutionalRows.filter((row) => getStatusBucket(row.status) === "approved").length,
    rejected: institutionalRows.filter((row) => getStatusBucket(row.status) === "rejected").length,
  };

  useEffect(() => {
    if (!filteredRows.length) {
      if (selectedId) {
        setSelectedId(null);
      }
      return;
    }

    if (!isDetailOpen) {
      return;
    }

    const hasSelected = filteredRows.some((row) => row.id === selectedId);
    if (!hasSelected) {
      setSelectedId(filteredRows[0].id);
    }
  }, [filteredRows, isDetailOpen, selectedId]);

  const selectedSummary =
    filteredRows.find((row) => row.id === selectedId) ??
    institutionalRows.find((row) => row.id === selectedId);

  const institutionalDetail = useGetInstitutionalApplicationQuery(selectedId ?? "", {
    skip: !selectedId || !isDetailOpen,
  });

  const selected = institutionalDetail.data ?? selectedSummary;

  const [approveInstitutional, approveInstitutionalState] =
    useApproveInstitutionalApplicationMutation();
  const [rejectInstitutional, rejectInstitutionalState] =
    useRejectInstitutionalApplicationMutation();
  const [revokeInstitutional, revokeInstitutionalState] =
    useRevokeInstitutionalApplicationMutation();
  const [reopenInstitutional, reopenInstitutionalState] =
    useReopenInstitutionalApplicationMutation();

  const busy =
    approveInstitutionalState.isLoading ||
    rejectInstitutionalState.isLoading ||
    revokeInstitutionalState.isLoading ||
    reopenInstitutionalState.isLoading;

  const canReopen = auth.user?.role === "SUPERADMIN";
  const roleLabel = ROLE_LABELS[String(auth.user?.role ?? "")] ?? "Aprobador";

  const runAction = async (message: string, action: () => Promise<unknown>) => {
    setFeedback(null);

    try {
      await action();
      setFeedback({ kind: "success", message });
    } catch {
      setFeedback({
        kind: "error",
        message: "No se pudo completar la acción. Revisa el estado actual y vuelve a intentarlo.",
      });
    }
  };

  const actionItems =
    selected?.status === "PENDING_APPROVAL"
      ? [
          {
            key: "approve",
            label: "Aprobar registro",
            tone: "primary" as const,
            onClick: () =>
              runAction("La solicitud institucional fue aprobada.", () =>
                approveInstitutional(selected.id).unwrap(),
              ),
          },
          {
            key: "reject",
            label: "Rechazar registro",
            tone: "danger" as const,
            onClick: () =>
              runAction("La solicitud institucional fue rechazada.", () =>
                rejectInstitutional({ applicationId: selected.id }).unwrap(),
              ),
          },
        ]
      : selected?.status === "APPROVED"
        ? [
            {
              key: "revoke",
              label: "Revocar registro",
              tone: "danger" as const,
              onClick: () =>
                runAction("El acceso institucional fue revocado.", () =>
                  revokeInstitutional({ applicationId: selected.id }).unwrap(),
                ),
            },
          ]
        : selected?.status === "REJECTED" || selected?.status === "REVOKED"
          ? canReopen
            ? [
                {
                  key: "reopen",
                  label: "Marcar como pendiente",
                  tone: "secondary" as const,
                  onClick: () =>
                    runAction("La solicitud institucional volvió a pendiente.", () =>
                      reopenInstitutional(selected.id).unwrap(),
                    ),
                },
              ]
            : []
          : [];

  return (
    <main className="min-h-screen bg-[#f5f7f8] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-[#e6ebef] bg-white px-5 py-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)] sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#3b3b3b]">
                Gestión de registros
              </h1>
              <p className="mt-2 text-sm text-[#7a7a7a]">
                Revisa y actualiza el estado de las solicitudes institucionales.
              </p>
            </div>
            <span className="inline-flex items-center rounded-xl bg-[#f8f8f8] px-3 py-2 text-sm font-medium text-[#666]">
              {roleLabel}
            </span>
          </div>
        </header>

        <section className="rounded-2xl border border-[#e6ebef] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)] sm:px-5">
          <label className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3">
            <SearchIcon />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, carnet, correo o institución..."
              className="w-full bg-transparent text-sm text-[#4b5563] outline-none placeholder:text-[#9ca3af]"
            />
          </label>
        </section>

        {feedback ? (
          <section
            className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_6px_18px_rgba(15,23,42,0.04)] ${
              feedback.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.message}
          </section>
        ) : null}

        <section className="rounded-2xl border border-[#e6ebef] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
          <div className="border-b border-[#eceff3] px-4 pt-3 sm:px-5">
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {(["pending", "approved", "rejected"] as InstitutionalTab[]).map((currentTab) => {
                const isActive = currentTab === tab;
                return (
                  <button
                    key={currentTab}
                    type="button"
                    onClick={() => {
                      setTab(currentTab);
                      setIsDetailOpen(true);
                      setFeedback(null);
                    }}
                    className={`inline-flex items-center gap-2 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? currentTab === "approved"
                          ? "border-[#2f8b3c] text-[#2f8b3c]"
                          : currentTab === "rejected"
                            ? "border-[#db3732] text-[#db3732]"
                            : "border-[#c59a2a] text-[#8a6a14]"
                        : "border-transparent text-[#555] hover:text-[#2f8b3c]"
                    }`}
                  >
                    {TAB_LABELS[currentTab]}
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        currentTab === "approved"
                          ? "bg-[#dbf8e5] text-[#22873a]"
                          : currentTab === "rejected"
                            ? "bg-[#ffe3e3] text-[#d13939]"
                            : "bg-[#fff1c7] text-[#8a6a14]"
                      }`}
                    >
                      {counts[currentTab]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 p-4 lg:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1fr)] lg:p-5">
            <div className="space-y-3">
              {institutional.isLoading ? (
                <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-8 text-sm text-[#6b7280]">
                  Cargando solicitudes institucionales...
                </div>
              ) : null}

              {!institutional.isLoading && filteredRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d7dbe1] bg-[#fbfcfd] px-4 py-10 text-sm text-[#6b7280]">
                  {EMPTY_MESSAGES[tab]}
                </div>
              ) : null}

              {filteredRows.map((row) => {
                const isSelected = isDetailOpen && row.id === selectedId;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(row.id);
                      setIsDetailOpen(true);
                      setFeedback(null);
                    }}
                    className={`w-full rounded-2xl border bg-white p-4 text-left shadow-[0_4px_14px_rgba(15,23,42,0.03)] transition-all ${
                      isSelected
                        ? "border-[#48a95c] ring-1 ring-[#48a95c]/30"
                        : "border-[#e4e7eb] hover:border-[#48a95c]/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#313131]">
                          {row.name || row.email || "Solicitud institucional"}
                        </p>
                        <p className="mt-1 text-sm text-[#8a8a8a]">
                          CI: {row.dni || "No informado"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClassName(
                          row.status,
                        )}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </div>
                    <div className="mt-4 space-y-1.5 text-sm text-[#6b7280]">
                      <p className="truncate">{row.email || "Sin correo registrado"}</p>
                      <p className="truncate">
                        {row.institutionName || row.tenantName || "Institución no informada"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <aside className="min-h-[320px] rounded-2xl border border-[#48a95c] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              {isDetailOpen && selected ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-[#3c3c3c]">
                        Detalle del registro
                      </h2>
                      <p className="mt-1 text-sm text-[#9a9a9a]">
                        Información completa y acciones disponibles
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDetailOpen(false)}
                      className="rounded-full p-2 text-[#666] transition-colors hover:bg-[#f3f4f6]"
                      aria-label="Cerrar detalle"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  <div className="border-t border-[#eef1f4] pt-4">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Estado actual
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClassName(
                            selected.status,
                          )}`}
                        >
                          {statusLabel(selected.status)}
                        </span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <InfoLine label="Nombre completo" value={selected.name} />
                        <InfoLine label="Carnet de identidad" value={selected.dni} />
                        <InfoLine label="Correo electrónico" value={selected.email} />
                        <InfoLine
                          label="Institución o empresa"
                          value={selected.institutionName || selected.tenantName}
                        />
                        <InfoLine label="Fecha de registro" value={formatDate(selected.createdAt)} />
                        <InfoLine label="Tenant" value={selected.tenantId} />
                        {selected.reason ? (
                          <InfoLine label="Observación registrada" value={selected.reason} />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#eef1f4] pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Cambiar estado
                    </p>

                    <div className="mt-3 space-y-2">
                      {actionItems.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          disabled={busy}
                          onClick={action.onClick}
                          className={`flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${actionClassName(
                            action.tone,
                          )}`}
                        >
                          {action.label}
                        </button>
                      ))}

                      {actionItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#d8dde3] bg-[#fafbfc] px-4 py-4 text-sm text-[#7a7f87]">
                          {selected.status === "REJECTED" || selected.status === "REVOKED"
                            ? canReopen
                              ? "No hay más acciones disponibles para este estado."
                              : "Tu rol no puede reabrir solicitudes institucionales rechazadas o revocadas."
                            : "No hay acciones disponibles para este estado."}
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-3 text-center text-xs text-[#b0b5bc]">
                      Los cambios se reflejan inmediatamente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-[#d8dde3] bg-[#fbfcfd] px-6 text-center text-sm text-[#7a7f87]">
                  Selecciona una solicitud institucional para revisar su detalle y acciones disponibles.
                </div>
              )}
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-5 w-5 text-[#9ca3af]"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
    <circle cx="11" cy="11" r="6.5" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
  </svg>
);
