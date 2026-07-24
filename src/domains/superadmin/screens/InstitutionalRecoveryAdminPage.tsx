"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Modal2 from "@/components/Modal2";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import {
  canApproveInstitutionalRecovery,
  formatRecoveryDate,
  getAdminRecoveryErrorMessage,
  maskRecoveryWallet,
  normalizeOptionalRecoveryReason,
  recoveryStatusLabels,
  recoveryStatusOptions,
  recoveryStatusStyles,
} from "../utils/institutionalRecoveryAdminUi";
import {
  useApproveInstitutionalRecoveryRequestMutation,
  useGetInstitutionalRecoveryRequestQuery,
  useListInstitutionalRecoveryRequestsQuery,
  useRejectInstitutionalRecoveryRequestMutation,
  type InstitutionalRecoveryDetail,
  type InstitutionalRecoveryListItem,
  type InstitutionalRecoveryStatus,
} from "@/store/institutionalRecovery";

const StatusBadge = ({ status }: { status: InstitutionalRecoveryStatus }) => (
  <span
    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${recoveryStatusStyles[status]}`}
  >
    {recoveryStatusLabels[status]}
  </span>
);

const selectClassName =
  "h-12 w-full appearance-none rounded-lg border border-[#dfe3df] bg-white px-4 py-3 pr-11 text-sm text-[#444] outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10";

const SelectChevron = () => (
  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777]" />
);

const getRequestKey = (request: InstitutionalRecoveryListItem) =>
  request.requestId;

const RecoveryMobileCard = ({
  request,
  onOpen,
}: {
  request: InstitutionalRecoveryListItem;
  onOpen: (requestId: string) => void;
}) => (
  <article className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-sm font-semibold text-[#3f3f3f]">
            {request.institutionName}
          </h2>
          <p className="mt-1 break-all text-sm text-[#666]">
            {request.newEmail}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-3 rounded-lg bg-[#f8faf8] p-3 text-sm">
        <div>
          <span className="text-[#777]">Administrador</span>
          <p className="mt-1 text-[#444]">{request.fullName}</p>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[#777]">Fecha</span>
          <span className="text-right font-medium text-[#444]">
            {formatRecoveryDate(request.requestedAt)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(request.requestId)}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3df] px-3 py-2 text-xs font-medium text-[#444] hover:border-[#287c36] hover:text-[#287c36]"
      >
        <Eye className="h-3.5 w-3.5" />
        Ver detalle
      </button>
    </div>
  </article>
);

const DetailField = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div>
    <p className="text-xs text-[#777]">{label}</p>
    <p className="mt-1 break-words font-medium text-[#444]">
      {value?.trim() ? value : "No informado"}
    </p>
  </div>
);

const filterRequests = (
  requests: InstitutionalRecoveryListItem[],
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return requests;
  return requests.filter((request) =>
    [
      request.institutionName,
      request.fullName,
      request.newEmail,
      request.requestId,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
};

export default function InstitutionalRecoveryAdminPage() {
  const [status, setStatus] = useState<InstitutionalRecoveryStatus | "ALL">(
    "ALL",
  );
  const [query, setQuery] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [reviewerNote, setReviewerNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const listQuery = status === "ALL" ? undefined : { status };
  const {
    data: listResponse,
    isLoading: listLoading,
    isFetching: listFetching,
    isError: listFailed,
    error: listError,
    refetch: refetchList,
  } = useListInstitutionalRecoveryRequestsQuery(listQuery);

  const {
    data: detailResponse,
    isFetching: detailFetching,
    isError: detailFailed,
    error: detailError,
    refetch: refetchDetail,
  } = useGetInstitutionalRecoveryRequestQuery(selectedRequestId ?? "", {
    skip: !selectedRequestId,
  });

  const [approveRequest, approveState] =
    useApproveInstitutionalRecoveryRequestMutation();
  const [rejectRequest, rejectState] =
    useRejectInstitutionalRecoveryRequestMutation();

  useEffect(() => {
    setReviewerNote("");
    setConfirmOpen(false);
  }, [selectedRequestId]);

  const requests = listResponse?.data ?? [];
  const filtered = useMemo(
    () => filterRequests(requests, query),
    [query, requests],
  );
  const selectedListItem = selectedRequestId
    ? requests.find((request) => request.requestId === selectedRequestId)
    : null;
  const selected: InstitutionalRecoveryDetail | InstitutionalRecoveryListItem | null =
    detailResponse ?? selectedListItem ?? null;
  const detailedSelected = detailResponse ?? null;
  const canApprove = canApproveInstitutionalRecovery(detailedSelected);
  const actionBusy = approveState.isLoading || rejectState.isLoading;
  const hasOpenPendingDetail = selected?.status === "PENDING";

  const closeDetail = () => {
    setSelectedRequestId(null);
    setConfirmOpen(false);
  };

  const approve = async () => {
    if (!detailedSelected || !canApprove) return;

    try {
      await approveRequest({
        requestId: detailedSelected.requestId,
        body: {
          targetUserId: detailedSelected.candidateUserId ?? "",
          targetAssignmentId: detailedSelected.candidateAssignmentId ?? "",
          reason: normalizeOptionalRecoveryReason(reviewerNote),
        },
      }).unwrap();
      setConfirmOpen(false);
      setActionMessage({
        kind: "success",
        text: "Cambio de correo aprobado. Las sesiones anteriores quedarán invalidadas y el administrador deberá establecer una nueva contraseña.",
      });
      await refetchList();
      closeDetail();
    } catch (error) {
      setConfirmOpen(false);
      setActionMessage({
        kind: "error",
        text: getAdminRecoveryErrorMessage(error),
      });
    }
  };

  const reject = async () => {
    if (!selectedRequestId || !hasOpenPendingDetail || actionBusy) return;

    try {
      await rejectRequest({
        requestId: selectedRequestId,
        body: {
          reason: normalizeOptionalRecoveryReason(reviewerNote),
        },
      }).unwrap();
      setActionMessage({
        kind: "success",
        text: "Solicitud rechazada. No se modificó el correo ni el acceso institucional.",
      });
      await refetchList();
      closeDetail();
    } catch (error) {
      setActionMessage({
        kind: "error",
        text: getAdminRecoveryErrorMessage(error),
      });
    }
  };

  return (
    <section>
      {actionMessage ? (
        <div
          className={`fixed right-4 top-4 z-[120] w-[min(420px,calc(100vw-32px))] rounded-2xl border-2 bg-white p-4 shadow-xl ${
            actionMessage.kind === "success"
              ? "border-green-200"
              : "border-red-200"
          }`}
          role="status"
        >
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="absolute right-3 top-3 text-[#888] hover:text-[#333]"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="font-semibold text-[#333]">
            {actionMessage.kind === "success"
              ? "Operación completada"
              : "No pudimos completar la operación"}
          </p>
          <p className="mt-1 pr-4 text-sm text-[#777]">
            {actionMessage.text}
          </p>
        </div>
      ) : null}

      <SuperadminPageHeader
        title="Cambio de correo institucional"
        subtitle="Revisa solicitudes para actualizar el correo del mismo administrador institucional"
      />

      <div className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar institución, administrador o correo"
              className="w-full rounded-lg border border-[#dfe3df] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Estado</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as InstitutionalRecoveryStatus | "ALL")
              }
              className={selectClassName}
            >
              {recoveryStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </label>
          <button
            type="button"
            onClick={() => void refetchList()}
            disabled={listFetching}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#dfe3df] px-4 py-3 text-sm font-semibold text-[#444] hover:border-[#287c36] hover:text-[#287c36] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>

      {listFailed ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{getAdminRecoveryErrorMessage(listError)}</p>
          <button
            type="button"
            onClick={() => void refetchList()}
            className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {listLoading ? (
        <div className="mt-5 rounded-2xl border border-[#dfe6df] bg-white p-6 text-sm text-[#777] shadow-sm">
          Cargando solicitudes...
        </div>
      ) : null}

      {!listLoading && !listFailed && filtered.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-[#dfe6df] bg-white p-6 text-sm text-[#777] shadow-sm">
          No hay solicitudes para los filtros seleccionados.
        </div>
      ) : null}

      <div className="mt-5 space-y-3 md:hidden">
        {filtered.map((request) => (
          <RecoveryMobileCard
            key={getRequestKey(request)}
            request={request}
            onOpen={setSelectedRequestId}
          />
        ))}
        <div className="rounded-2xl border border-[#dfe6df] bg-white px-4 py-4 text-sm text-[#777] shadow-sm">
          Mostrando {filtered.length} de {listResponse?.total ?? 0} solicitudes
        </div>
      </div>

      <article className="mt-5 hidden overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#f7f7f7] text-xs uppercase text-[#777]">
              <tr>
                <th className="px-5 py-4">Institución</th>
                <th className="px-5 py-4">Administrador</th>
                <th className="px-5 py-4">Nuevo correo</th>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => (
                <tr key={getRequestKey(request)} className="border-t border-[#e8ece8]">
                  <td className="px-5 py-4 font-medium text-[#444]">
                    {request.institutionName}
                  </td>
                  <td className="px-5 py-4 text-[#666]">
                    {request.fullName}
                  </td>
                  <td className="break-all px-5 py-4 text-[#666]">
                    {request.newEmail}
                  </td>
                  <td className="px-5 py-4 text-[#777]">
                    {formatRecoveryDate(request.requestedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRequestId(request.requestId)}
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
          Mostrando {filtered.length} de {listResponse?.total ?? 0} solicitudes
        </div>
      </article>

      <Modal2
        isOpen={Boolean(selectedRequestId)}
        onClose={closeDetail}
        title="Detalle de cambio de correo"
        size="lg"
        type="plain"
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex justify-end">
              <StatusBadge status={selected.status} />
            </div>

            {detailFetching ? (
              <p className="rounded-lg bg-[#f8faf8] px-4 py-3 text-sm text-[#777]">
                Actualizando detalle...
              </p>
            ) : null}

            {detailFailed ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{getAdminRecoveryErrorMessage(detailError)}</p>
                <button
                  type="button"
                  onClick={() => void refetchDetail()}
                  className="mt-3 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700"
                >
                  Reintentar
                </button>
              </div>
            ) : null}

            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <DetailField label="Institución" value={selected.institutionName} />
              <DetailField label="Administrador" value={selected.fullName} />
              <DetailField
                label="Correo actual"
                value={detailedSelected?.currentEmail}
              />
              <DetailField label="Nuevo correo" value={selected.newEmail} />
              <DetailField
                label="Usuario preservado"
                value={detailedSelected?.candidateUserId}
              />
              <DetailField
                label="Assignment preservado"
                value={detailedSelected?.candidateAssignmentId}
              />
              <DetailField
                label="Wallet preservada"
                value={maskRecoveryWallet(detailedSelected?.accountAddress ?? null)}
              />
              <DetailField
                label="Rol preservado"
                value={detailedSelected?.institutionalRole}
              />
              <DetailField
                label="Teléfono"
                value={selected.phoneNumber}
              />
              <DetailField
                label="Teléfono de verificación"
                value={selected.supervisorPhoneNumber}
              />
              <DetailField
                label="Fecha solicitud"
                value={formatRecoveryDate(selected.requestedAt)}
              />
              <DetailField
                label="Fecha resolución"
                value={formatRecoveryDate(selected.resolvedAt)}
              />
            </div>

            {detailedSelected?.resolutionReason ? (
              <div className="rounded-lg bg-[#f8faf8] p-3 text-sm text-[#555]">
                <p className="text-xs font-semibold text-[#777]">
                  Motivo registrado
                </p>
                <p className="mt-1">{detailedSelected.resolutionReason}</p>
              </div>
            ) : null}

            {detailedSelected && detailedSelected.warnings.length > 0 ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">
                  Los datos del administrador cambiaron o no son consistentes.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {detailedSelected.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <label className="block">
              <span className="text-sm font-semibold text-red-600">
                Justificación de decisión
              </span>
              <textarea
                value={reviewerNote}
                onChange={(event) => setReviewerNote(event.target.value)}
                placeholder="Indica una nota administrativa segura"
                className="mt-2 min-h-[92px] w-full rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10"
                disabled={!hasOpenPendingDetail || actionBusy}
              />
            </label>

            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <p>
                Esta operación cambia únicamente el correo del mismo
                administrador. Usuario, institución, assignment, wallet y rol
                permanecen sin cambios. Al aprobar, las sesiones anteriores se
                cerrarán y el administrador deberá establecer una nueva
                contraseña desde el nuevo correo.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void reject()}
                disabled={!hasOpenPendingDetail || actionBusy}
                className="rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rejectState.isLoading ? "Rechazando..." : "Rechazar"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={!canApprove || actionBusy}
                className="rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aprobar cambio
              </button>
            </div>
          </div>
        ) : null}
      </Modal2>

      <Modal2
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Aprobar cambio de correo?"
        size="sm"
        type="plain"
        showClose={false}
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-[#287c36]" />
          </div>
          <p className="text-sm text-[#777]">
            Se actualizará únicamente el correo del mismo administrador
            institucional. La wallet, el rol y el assignment permanecerán sin
            cambios.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={approveState.isLoading}
              className="rounded-lg bg-[#f4f4f4] px-4 py-3 text-sm font-semibold text-[#444] hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void approve()}
              disabled={approveState.isLoading}
              className="rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {approveState.isLoading ? "Aprobando..." : "Aprobar cambio"}
            </button>
          </div>
        </div>
      </Modal2>
    </section>
  );
}
