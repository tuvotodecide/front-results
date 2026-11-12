"use client";

import { useState } from "react";
import {
  useApproveTerritorialAccessRequestMutation,
  useRejectTerritorialAccessRequestMutation,
  useReopenTerritorialAccessRequestMutation,
  useRevokeTerritorialAccessRequestMutation,
  type ApprovalStatus,
  type TerritorialAccessRequest,
} from "@/store/accessApprovals";
import {
  CloseIcon,
  InfoLine,
  SearchIcon,
  actionClassName,
  badgeClassName,
  formatDate,
  getActionErrorMessage,
  normalizeSearchText,
  type ActionTone,
  type FeedbackState,
} from "./approvalsUi";

type TerritorialTab = "pending" | "approved" | "rejected";

interface TerritorialQuery {
  data?: TerritorialAccessRequest[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
}

interface TerritorialApprovalsSectionProps {
  query: TerritorialQuery;
  canReopen: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_EMAIL_VERIFICATION: "Correo sin verificar",
  PENDING_APPROVAL: "Pendiente de aprobación",
  APPROVED: "Acceso habilitado",
  REJECTED: "Rechazado",
  REVOKED: "Revocado",
};

const ROLE_LABELS: Record<string, string> = {
  MAYOR: "Alcalde/sa",
  GOVERNOR: "Gobernador/a",
};

const TAB_LABELS: Record<TerritorialTab, string> = {
  pending: "Pendientes",
  approved: "Aprobados",
  rejected: "Rechazados",
};

const EMPTY_MESSAGES: Record<TerritorialTab, string> = {
  pending: "No hay solicitudes territoriales pendientes.",
  approved: "No hay accesos territoriales aprobados.",
  rejected: "No hay solicitudes territoriales rechazadas o revocadas.",
};

const statusLabel = (status?: ApprovalStatus) =>
  STATUS_LABELS[status ?? ""] ?? status ?? "Sin estado";

// Las solicitudes con correo sin verificar se listan como pendientes, pero no se pueden aprobar aún
const getStatusBucket = (status?: ApprovalStatus): TerritorialTab | null => {
  if (status === "PENDING_APPROVAL" || status === "PENDING_EMAIL_VERIFICATION") return "pending";
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED" || status === "REVOKED") return "rejected";
  return null;
};

const territoryLabel = (row: TerritorialAccessRequest) => {
  if (row.role === "MAYOR") {
    return row.municipalityName
      ? `Municipio de ${row.municipalityName}`
      : "Municipio no informado";
  }
  return row.departmentName
    ? `Departamento de ${row.departmentName}`
    : "Departamento no informado";
};

const matchesSearch = (row: TerritorialAccessRequest, search: string) => {
  const term = normalizeSearchText(search);
  if (!term) return true;

  return [row.name, row.dni, row.email, row.departmentName, row.municipalityName].some((value) =>
    normalizeSearchText(value).includes(term),
  );
};

export default function TerritorialApprovalsSection({
  query,
  canReopen,
}: TerritorialApprovalsSectionProps) {
  const [tab, setTab] = useState<TerritorialTab>("pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const [approve, approveState] = useApproveTerritorialAccessRequestMutation();
  const [reject, rejectState] = useRejectTerritorialAccessRequestMutation();
  const [revoke, revokeState] = useRevokeTerritorialAccessRequestMutation();
  const [reopen, reopenState] = useReopenTerritorialAccessRequestMutation();
  const busy =
    approveState.isLoading ||
    rejectState.isLoading ||
    revokeState.isLoading ||
    reopenState.isLoading;

  const rows = [...(query.data ?? [])].sort((a, b) =>
    String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
  );
  const filteredRows = rows.filter(
    (row) => getStatusBucket(row.status) === tab && matchesSearch(row, search),
  );
  const counts: Record<TerritorialTab, number> = {
    pending: rows.filter((row) => getStatusBucket(row.status) === "pending").length,
    approved: rows.filter((row) => getStatusBucket(row.status) === "approved").length,
    rejected: rows.filter((row) => getStatusBucket(row.status) === "rejected").length,
  };

  // Sin selección explícita (o si la seleccionada ya no está visible) se muestra la primera de la lista
  const selected = isDetailOpen
    ? (filteredRows.find((row) => row.userId === selectedId) ?? filteredRows[0] ?? null)
    : null;

  const runAction = async (message: string, action: () => Promise<unknown>) => {
    setFeedback(null);
    try {
      await action();
      setFeedback({ kind: "success", message });
      setReason("");
    } catch (error) {
      setFeedback({ kind: "error", message: getActionErrorMessage(error) });
    } finally {
      await query.refetch();
    }
  };

  const trimmedReason = reason.trim() || undefined;
  const actionItems: { key: string; label: string; tone: ActionTone; onClick: () => void }[] =
    !selected
      ? []
      : selected.status === "PENDING_APPROVAL"
        ? [
            {
              key: "approve",
              label: "Aprobar acceso",
              tone: "primary",
              onClick: () =>
                runAction("El acceso territorial fue aprobado.", () =>
                  approve(selected.userId).unwrap(),
                ),
            },
            {
              key: "reject",
              label: "Rechazar solicitud",
              tone: "danger",
              onClick: () =>
                runAction("La solicitud territorial fue rechazada.", () =>
                  reject({ userId: selected.userId, reason: trimmedReason }).unwrap(),
                ),
            },
          ]
        : selected.status === "APPROVED"
          ? [
              {
                key: "revoke",
                label: "Revocar acceso",
                tone: "danger",
                onClick: () =>
                  runAction("El acceso territorial fue revocado.", () =>
                    revoke({ userId: selected.userId, reason: trimmedReason }).unwrap(),
                  ),
              },
            ]
          : (selected.status === "REJECTED" || selected.status === "REVOKED") && canReopen
            ? [
                {
                  key: "reopen",
                  label: "Marcar como pendiente",
                  tone: "secondary",
                  onClick: () =>
                    runAction("La solicitud territorial volvió a pendiente.", () =>
                      reopen(selected.userId).unwrap(),
                    ),
                },
              ]
            : [];
  const acceptsReason = actionItems.some(
    (action) => action.key === "reject" || action.key === "revoke",
  );

  const noActionsMessage =
    selected?.status === "PENDING_EMAIL_VERIFICATION"
      ? "El usuario debe verificar su correo antes de que se pueda aprobar su acceso."
      : selected?.status === "REJECTED" || selected?.status === "REVOKED"
        ? "Tu rol no puede reabrir solicitudes territoriales rechazadas o revocadas."
        : "No hay acciones disponibles para este estado.";

  return (
    <>
      <section className="rounded-2xl border border-[#e6ebef] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)] sm:px-5">
        <label className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3">
          <SearchIcon />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, carnet, correo o territorio..."
            className="w-full bg-transparent text-sm text-[#4b5563] outline-none placeholder:text-[#9ca3af]"
          />
        </label>
      </section>

      {feedback ? (
        <section
          className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_6px_18px_rgba(15,23,42,0.04)] ${
            feedback.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : feedback.kind === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.message}
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#e6ebef] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
        <div className="border-b border-[#eceff3] px-4 pt-3 sm:px-5">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {(["pending", "approved", "rejected"] as TerritorialTab[]).map((currentTab) => {
              const isActive = currentTab === tab;
              return (
                <button
                  key={currentTab}
                  type="button"
                  onClick={() => {
                    setTab(currentTab);
                    setSelectedId(null);
                    setIsDetailOpen(true);
                    setFeedback(null);
                    setReason("");
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
            {query.isLoading ? (
              <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-8 text-sm text-[#6b7280]">
                Cargando solicitudes territoriales...
              </div>
            ) : null}

            {!query.isLoading && query.isError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-sm text-red-800">
                No se pudieron cargar las solicitudes territoriales. Intenta nuevamente.
              </div>
            ) : null}

            {!query.isLoading && !query.isError && filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d7dbe1] bg-[#fbfcfd] px-4 py-10 text-sm text-[#6b7280]">
                {EMPTY_MESSAGES[tab]}
              </div>
            ) : null}

            {!query.isError &&
              filteredRows.map((row) => {
                const isSelected = selected?.userId === row.userId;
                return (
                  <button
                    key={row.userId}
                    type="button"
                    onClick={() => {
                      setSelectedId(row.userId);
                      setIsDetailOpen(true);
                      setFeedback(null);
                      setReason("");
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
                          {row.name || row.email || "Solicitud territorial"}
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
                      <p className="truncate">
                        {ROLE_LABELS[row.role ?? ""] ?? row.role ?? "Rol no informado"} ·{" "}
                        {territoryLabel(row)}
                      </p>
                      <p className="truncate">{row.email || "Sin correo registrado"}</p>
                    </div>
                  </button>
                );
              })}
          </div>

          <aside className="min-h-[320px] rounded-2xl border border-[#48a95c] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            {selected ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#3c3c3c]">Detalle de la solicitud</h2>
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
                        label="Correo verificado"
                        value={
                          selected.emailVerified === undefined
                            ? undefined
                            : selected.emailVerified
                              ? "Sí"
                              : "No"
                        }
                      />
                      <InfoLine
                        label="Rol solicitado"
                        value={ROLE_LABELS[selected.role ?? ""] ?? selected.role}
                      />
                      <InfoLine label="Territorio" value={territoryLabel(selected)} />
                      <InfoLine label="Fecha de registro" value={formatDate(selected.createdAt)} />
                      <InfoLine label="ID de usuario" value={selected.userId} technicalHash />
                      {selected.reason ? (
                        <InfoLine label="Observación registrada" value={selected.reason} />
                      ) : null}
                    </div>
                    {selected.status === "APPROVED" ? (
                      <p className="rounded-lg border border-[#d9ecdd] bg-[#f4fbf5] px-3 py-2 text-xs text-[#3c6b45]">
                        Para que vea resultados en la portada, crea un contrato para este usuario
                        con su ID, la elección y su territorio.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-[#eef1f4] pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Cambiar estado
                  </p>

                  {acceptsReason ? (
                    <label className="mt-3 block">
                      <span className="text-xs text-[#7a7f87]">
                        Observación (opcional, se guarda al rechazar o revocar)
                      </span>
                      <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-3 py-2 text-sm text-[#4b5563] outline-none focus:border-[#48a95c]"
                      />
                    </label>
                  ) : null}

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
                        {noActionsMessage}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-[#d8dde3] bg-[#fbfcfd] px-6 text-center text-sm text-[#7a7f87]">
                Selecciona una solicitud territorial para revisar su detalle y acciones disponibles.
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
