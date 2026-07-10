"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Eye, Search, X } from "lucide-react";
import Modal2 from "@/components/Modal2";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import { institutionalRecoveryRequestsMock } from "../data/superadminTvd.mock";
import {
  approveInstitutionalRecoveryRequest,
  rejectInstitutionalRecoveryRequest,
} from "../services/superadminTvdApi";
import type {
  InstitutionalRecoveryRequest,
  InstitutionalRecoveryStatus,
} from "../types";

const statusStyles: Record<InstitutionalRecoveryStatus, string> = {
  Pendiente: "border-amber-200 bg-amber-50 text-amber-700",
  Aprobada: "border-green-200 bg-green-50 text-[#287c36]",
  Rechazada: "border-red-200 bg-red-50 text-red-600",
};

const StatusBadge = ({ status }: { status: InstitutionalRecoveryStatus }) => (
  <span
    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
  >
    {status}
  </span>
);

const selectClassName =
  "h-12 w-full appearance-none rounded-lg border border-[#dfe3df] bg-white px-4 py-3 pr-11 text-sm text-[#444] outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10";

const SelectChevron = () => (
  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777]" />
);

const RecoveryMobileCard = ({
  request,
  onOpen,
}: {
  request: InstitutionalRecoveryRequest;
  onOpen: (request: InstitutionalRecoveryRequest) => void;
}) => (
  <article className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-sm font-semibold text-[#3f3f3f]">
            {request.institutionName}
          </h2>
          <p className="mt-1 break-all text-sm text-[#666]">
            {request.newAdminEmail}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-3 rounded-lg bg-[#f8faf8] p-3 text-sm">
        <div>
          <span className="text-[#777]">Motivo</span>
          <p className="mt-1 text-[#444]">{request.reason}</p>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[#777]">Fecha</span>
          <span className="text-right font-medium text-[#444]">
            {request.requestedAt}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(request)}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3df] px-3 py-2 text-xs font-medium text-[#444] hover:border-[#287c36] hover:text-[#287c36]"
      >
        <Eye className="h-3.5 w-3.5" />
        Ver detalle
      </button>
    </div>
  </article>
);

export default function InstitutionalRecoveryAdminPage() {
  const [requests, setRequests] = useState<InstitutionalRecoveryRequest[]>(
    institutionalRecoveryRequestsMock,
  );
  const [status, setStatus] = useState<InstitutionalRecoveryStatus | "Todas">(
    "Todas",
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] =
    useState<InstitutionalRecoveryRequest | null>(null);
  const [reviewerNote, setReviewerNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  const filtered = useMemo(
    () =>
      requests.filter((request) => {
        const matchesStatus = status === "Todas" || request.status === status;
        const normalizedQuery = query.trim().toLowerCase();
        const matchesQuery =
          !normalizedQuery ||
          request.institutionName.toLowerCase().includes(normalizedQuery) ||
          request.newAdminEmail.toLowerCase().includes(normalizedQuery);

        return matchesStatus && matchesQuery;
      }),
    [query, requests, status],
  );

  const openDetail = (request: InstitutionalRecoveryRequest) => {
    setSelected(request);
    setReviewerNote(request.reviewerNote ?? "");
  };

  const updateRequest = (updated: InstitutionalRecoveryRequest) => {
    setRequests((current) =>
      current.map((request) => (request.id === updated.id ? updated : request)),
    );
    setSelected(updated);
  };

  const approve = async () => {
    if (!selected) return;

    const updated = await approveInstitutionalRecoveryRequest(
      selected.id,
      reviewerNote,
    );
    updateRequest(updated);
    setConfirmOpen(false);
    setSelected(null);
    setToastOpen(true);
  };

  const reject = async () => {
    if (!selected) return;

    const updated = await rejectInstitutionalRecoveryRequest(
      selected.id,
      reviewerNote,
    );
    updateRequest(updated);
    setSelected(null);
  };

  return (
    <section>
      {toastOpen ? (
        <div className="fixed right-4 top-4 z-[120] w-[min(360px,calc(100vw-32px))] rounded-2xl border-2 border-green-200 bg-white p-4 shadow-xl">
          <button
            type="button"
            onClick={() => setToastOpen(false)}
            className="absolute right-3 top-3 text-[#888] hover:text-[#333]"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="font-semibold text-[#333]">Cuenta restablecida</p>
          <p className="mt-1 text-sm text-[#777]">
            Se le envió un correo de confirmación
          </p>
        </div>
      ) : null}

      <SuperadminPageHeader
        title="Recuperación institucional"
        subtitle="Gestión de solicitudes de recuperación de accesos institucionales"
      />

      <div className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar institución o correo"
              className="w-full rounded-lg border border-[#dfe3df] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Estado</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as InstitutionalRecoveryStatus | "Todas")
              }
              className={selectClassName}
            >
              <option value="Todas">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
            </select>
            <SelectChevron />
          </label>
        </div>
      </div>

      <div className="mt-5 space-y-3 md:hidden">
        {filtered.map((request) => (
          <RecoveryMobileCard
            key={request.id}
            request={request}
            onOpen={openDetail}
          />
        ))}
        <div className="rounded-2xl border border-[#dfe6df] bg-white px-4 py-4 text-sm text-[#777] shadow-sm">
          Mostrando {filtered.length} de {requests.length} solicitudes
        </div>
      </div>

      <article className="mt-5 hidden overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead className="bg-[#f7f7f7] text-xs uppercase text-[#777]">
              <tr>
                <th className="px-5 py-4">Institución</th>
                <th className="px-5 py-4">Nuevo administrador</th>
                <th className="px-5 py-4">Motivo</th>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => (
                <tr key={request.id} className="border-t border-[#e8ece8]">
                  <td className="px-5 py-4 font-medium text-[#444]">
                    {request.institutionName}
                  </td>
                  <td className="px-5 py-4 text-[#666]">
                    {request.newAdminEmail}
                  </td>
                  <td className="px-5 py-4 text-[#666]">{request.reason}</td>
                  <td className="px-5 py-4 text-[#777]">{request.requestedAt}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => openDetail(request)}
                      className="inline-flex items-center gap-2 rounded-md border border-[#dfe3df] px-3 py-2 text-xs font-medium text-[#444] hover:border-[#287c36] hover:text-[#287c36]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#e8ece8] px-5 py-4 text-sm text-[#777]">
          Mostrando {filtered.length} de {requests.length} solicitudes
        </div>
      </article>

      <Modal2
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Detalle de solicitud"
        size="lg"
        type="plain"
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex justify-end">
              <StatusBadge status={selected.status} />
            </div>

            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#777]">Institución</p>
                <p className="mt-1 font-medium text-[#444]">
                  {selected.institutionName}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#777]">Motivo</p>
                <p className="mt-1 font-medium text-[#444]">{selected.reason}</p>
              </div>
              <div>
                <p className="text-xs text-[#777]">Administrador anterior</p>
                <p className="mt-1 font-medium text-[#444]">
                  {selected.previousAdminEmail}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#777]">Nuevo administrador</p>
                <p className="mt-1 font-medium text-[#444]">
                  {selected.newAdminEmail}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#777]">Fecha solicitud</p>
                <p className="mt-1 font-medium text-[#444]">
                  {selected.requestedAt}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#777]">Número de contacto</p>
                <p className="mt-1 font-medium text-[#444]">
                  {selected.contactPhone}
                </p>
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-red-600">
                Justificación de decisión
              </span>
              <textarea
                value={reviewerNote}
                onChange={(event) => setReviewerNote(event.target.value)}
                placeholder="Indique las razones por las que tomó esa decisión"
                className="mt-2 min-h-[92px] w-full rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
              />
            </label>

            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <p>
                La aprobación transfiere el acceso administrativo. Verifique la
                identidad del nuevo administrador antes de proceder.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void reject()}
                disabled={selected.status !== "Pendiente"}
                className="rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={selected.status !== "Pendiente"}
                className="rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aprobar
              </button>
            </div>
          </div>
        ) : null}
      </Modal2>

      <Modal2
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Estás seguro?"
        size="sm"
        type="plain"
        showClose={false}
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-[#287c36]" />
          </div>
          <p className="text-sm text-[#777]">
            Confirmación de que darás acceso a esta institución
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-lg bg-[#f4f4f4] px-4 py-3 text-sm font-semibold text-[#444] hover:bg-[#ececec]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void approve()}
              className="rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f642b]"
            >
              Sí, dar acceso
            </button>
          </div>
        </div>
      </Modal2>
    </section>
  );
}
