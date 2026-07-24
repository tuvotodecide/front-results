"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import CopyButton from "../components/CopyButton";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import {
  allInstitutionsOptionLabel,
  tvdAdminOperationLabels,
  tvdAdminOperationStatusLabels,
  tvdAdminOperationStatuses,
  tvdAdminOperationTypes,
  useListTvdAdminInstitutionsQuery,
  useListTvdAdminOperationsQuery,
  type TvdAdminOperation,
  type TvdAdminOperationStatus,
  type TvdAdminOperationType,
  type TvdAdminOperationsFilters,
  type TvdAdminOperationsSummary,
  type TvdInstitutionOption,
} from "@/store/tvd";

const PAGE_SIZE = 20;
const ALL_INSTITUTIONS = "";
const ALL_TYPES = "";
const ALL_STATUSES = "";

const formatTvdAmount = (value: string | null) => {
  const amount = String(value ?? "").trim();
  return amount ? `${amount} $TVD` : "Monto no disponible";
};

const parseRangeDate = (value: string) => {
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value.trim())) return null;

  const [day, month, year] = value.split("/");
  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  if (
    !Number.isInteger(dayNumber) ||
    !Number.isInteger(monthNumber) ||
    !Number.isInteger(yearNumber)
  ) {
    return null;
  }

  const date = new Date(yearNumber, monthNumber - 1, dayNumber);
  if (
    date.getFullYear() !== yearNumber ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return null;
  }

  return date;
};

const toApiDate = (value: string) => {
  const date = parseRangeDate(value);
  return date ? date.toISOString() : null;
};

const formatOperationDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const shortenTxHash = (value: string) =>
  value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;

const isTooBroadError = (error: unknown) => {
  if (!error || typeof error !== "object" || !("data" in error)) return false;
  const data = (error as { data?: unknown }).data;
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    data.code === "TVD_OPERATION_FILTER_TOO_BROAD"
  );
};

const operationTypeOptions = tvdAdminOperationTypes.map((value) => ({
  value,
  label: tvdAdminOperationLabels[value],
}));

const statusOptions = tvdAdminOperationStatuses.map((value) => ({
  value,
  label: tvdAdminOperationStatusLabels[value],
}));

const SummaryCards = ({ summary }: { summary: TvdAdminOperationsSummary }) => (
  <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
    <article className="rounded-lg border border-[#dfe6df] bg-white p-4 shadow-sm">
      <p className="text-xs text-[#777]">Cantidad de operaciones</p>
      <p className="mt-2 text-2xl font-semibold text-[#3f3f3f]">
        {summary.totalOperations}
      </p>
    </article>
    <article className="rounded-lg border border-[#dfe6df] bg-white p-4 shadow-sm">
      <p className="text-xs text-[#777]">Total asignado</p>
      <p className="mt-2 text-2xl font-semibold text-[#1d4ed8]">
        {formatTvdAmount(summary.totalAssigned)}
      </p>
    </article>
    <article className="rounded-lg border border-[#dfe6df] bg-white p-4 shadow-sm">
      <p className="text-xs text-[#777]">Total consumido</p>
      <p className="mt-2 text-2xl font-semibold text-[#c2410c]">
        {formatTvdAmount(summary.totalConsumed)}
      </p>
    </article>
  </div>
);

const selectClassName =
  "h-12 w-full appearance-none rounded-lg border border-[#dfe3df] bg-white px-4 py-3 pr-11 text-sm text-[#444] outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10";

const SelectChevron = () => (
  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777]" />
);

const OperationMobileCard = ({
  operation,
}: {
  operation: TvdAdminOperation;
}) => (
  <article className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#3f3f3f]">
            {operation.operationLabel}
          </p>
          <p className="mt-1 text-sm text-[#666]">
            {operation.institutionName}
          </p>
        </div>
        <p className="font-mono text-sm font-semibold text-[#287c36]">
          {formatTvdAmount(operation.amount)}
        </p>
      </div>

      <div className="grid gap-3 rounded-lg bg-[#f8faf8] p-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-[#777]">Estado</span>
          <span className="text-right font-medium text-[#444]">
            {operation.statusLabel}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[#777]">Fecha</span>
          <span className="text-right font-medium text-[#444]">
            {formatOperationDate(operation.date)}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[#777]">Código de transacción</span>
          <p className="break-all font-mono text-xs text-[#555]">
            {operation.txHash ?? "Operación aún no confirmada"}
          </p>
        </div>
      </div>

      <div className="grid gap-2 pt-1 sm:grid-cols-2">
        {operation.txHash ? (
          <CopyButton value={operation.txHash} label="Copiar código" />
        ) : null}
        {operation.explorerUrl ? (
          <a
            href={operation.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3df] px-3 py-2 text-xs font-medium text-[#444] hover:border-[#287c36] hover:text-[#287c36]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Comprobar operación
          </a>
        ) : (
          <span className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#e8ece8] px-3 py-2 text-xs font-medium text-[#777]">
            Operación aún no confirmada
          </span>
        )}
      </div>
    </div>
  </article>
);

export default function TvdOperationsPage() {
  const [institution, setInstitution] = useState(ALL_INSTITUTIONS);
  const [type, setType] = useState<TvdAdminOperationType | "">(ALL_TYPES);
  const [status, setStatus] = useState<TvdAdminOperationStatus | "">(
    ALL_STATUSES,
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const institutionsQuery = useListTvdAdminInstitutionsQuery({
    limit: 100,
  });

  const fromDate = from ? toApiDate(from) : null;
  const toDate = to ? toApiDate(to) : null;
  const hasInvalidDateFormat = Boolean((from && !fromDate) || (to && !toDate));
  const hasInvalidDateRange = Boolean(
    fromDate && toDate && new Date(fromDate) > new Date(toDate),
  );
  const canQueryOperations = !hasInvalidDateFormat && !hasInvalidDateRange;

  const operationFilters = useMemo<TvdAdminOperationsFilters>(
    () => ({
      tenantId: institution || undefined,
      operationType: type || undefined,
      status: status || undefined,
      dateFrom: fromDate ?? undefined,
      dateTo: toDate ?? undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [fromDate, institution, page, status, toDate, type],
  );

  const operationsQuery = useListTvdAdminOperationsQuery(operationFilters, {
    skip: !canQueryOperations,
  });

  const institutionOptions = useMemo<TvdInstitutionOption[]>(
    () =>
      (institutionsQuery.data?.items ?? []).map((item) => ({
        label: item.name,
        value: item.tenantId,
      })),
    [institutionsQuery.data?.items],
  );

  const operations = canQueryOperations
    ? (operationsQuery.data?.items ?? [])
    : [];
  const total = canQueryOperations ? (operationsQuery.data?.total ?? 0) : 0;
  const summary = canQueryOperations
    ? (operationsQuery.data?.summary ?? {
        totalOperations: 0,
        totalAssigned: "0",
        totalConsumed: "0",
      })
    : {
        totalOperations: 0,
        totalAssigned: "0",
        totalConsumed: "0",
      };
  const hasActiveFilters = Boolean(institution || type || status || from || to);
  const operationsErrorMessage = isTooBroadError(operationsQuery.error)
    ? "Hay demasiadas operaciones para mostrar. Selecciona una institución o reduce el rango de fechas."
    : "No se pudieron cargar las operaciones.";

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setInstitution(ALL_INSTITUTIONS);
    setType(ALL_TYPES);
    setStatus(ALL_STATUSES);
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SuperadminPageHeader
          title="Operaciones $TVD"
          subtitle="Consulta y auditoría de movimientos del ecosistema $TVD"
        />
      </div>

      <div className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Institución</span>
            <select
              value={institution}
              onChange={(event) => {
                setInstitution(event.target.value);
                resetPage();
              }}
              className={selectClassName}
            >
              <option value={ALL_INSTITUTIONS}>
                {allInstitutionsOptionLabel}
              </option>
              {institutionOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </label>
          <label className="relative block">
            <span className="sr-only">Tipo de operación</span>
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as TvdAdminOperationType | "");
                resetPage();
              }}
              className={selectClassName}
            >
              <option value={ALL_TYPES}>Todos los tipos</option>
              {operationTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </label>
          <label className="relative block">
            <span className="sr-only">Estado</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as TvdAdminOperationStatus | "");
                resetPage();
              }}
              className={selectClassName}
            >
              <option value={ALL_STATUSES}>Todos los estados</option>
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </label>
          <label className="grid gap-1 text-xs text-[#666] sm:grid-cols-[auto_1fr] sm:items-center sm:gap-2">
            <span>Fecha desde</span>
            <input
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                resetPage();
              }}
              placeholder="dd/mm/aaaa"
              className="h-12 w-full rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10 md:w-36"
            />
          </label>
          <label className="grid gap-1 text-xs text-[#666] sm:grid-cols-[auto_1fr] sm:items-center sm:gap-2">
            <span>Fecha hasta</span>
            <input
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                resetPage();
              }}
              placeholder="dd/mm/aaaa"
              className="h-12 w-full rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10 md:w-36"
            />
          </label>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="h-12 rounded-lg border border-[#dfe3df] px-4 text-sm font-medium text-[#444] hover:border-[#287c36] hover:text-[#287c36] disabled:cursor-not-allowed disabled:text-[#aaa]"
          >
            Limpiar filtros
          </button>
        </div>
        {institutionsQuery.isLoading ? (
          <p className="mt-3 text-xs text-[#777]">Cargando instituciones...</p>
        ) : null}
        {institutionsQuery.isError ? (
          <p className="mt-3 text-xs font-medium text-[#b45309]">
            No se pudieron cargar las instituciones.
          </p>
        ) : null}
        {!institutionsQuery.isLoading &&
        !institutionsQuery.isError &&
        institutionOptions.length === 0 ? (
          <p className="mt-3 text-xs text-[#777]">
            No hay instituciones disponibles.
          </p>
        ) : null}
        {hasInvalidDateFormat ? (
          <p className="mt-3 text-xs font-medium text-[#b45309]">
            Ingresa las fechas con el formato dd/mm/aaaa.
          </p>
        ) : null}
        {hasInvalidDateRange ? (
          <p className="mt-3 text-xs font-medium text-[#b45309]">
            La fecha desde debe ser anterior a la fecha hasta.
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <SummaryCards summary={summary} />
      </div>

      {operationsQuery.isFetching ? (
        <p className="mt-4 rounded-lg border border-[#dfe6df] bg-white px-4 py-3 text-sm text-[#777] shadow-sm">
          Cargando operaciones...
        </p>
      ) : null}

      {operationsQuery.isError && canQueryOperations ? (
        <div className="mt-4 rounded-lg border border-[#f3d5b5] bg-[#fff8f1] px-4 py-3 text-sm text-[#92400e]">
          <p>{operationsErrorMessage}</p>
          <button
            type="button"
            onClick={() => operationsQuery.refetch()}
            className="mt-2 rounded-md border border-[#e9c39d] px-3 py-2 text-xs font-medium hover:border-[#92400e]"
          >
            Intentar nuevamente
          </button>
        </div>
      ) : null}

      <div className="mt-5 space-y-3 md:hidden">
        {operations.map((operation) => (
          <OperationMobileCard key={operation.id} operation={operation} />
        ))}
        {!operationsQuery.isLoading &&
        !operationsQuery.isError &&
        canQueryOperations &&
        operations.length === 0 ? (
          <div className="rounded-2xl border border-[#dfe6df] bg-white px-4 py-6 text-sm text-[#777] shadow-sm">
            <p>No existen operaciones para los filtros seleccionados.</p>
            <p className="mt-1">Prueba cambiando o limpiando los filtros.</p>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#dfe6df] bg-white px-4 py-4 text-sm text-[#777] shadow-sm">
          <span>
            Página {page}. {operations.length} operaciones de {total}
          </span>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-md border border-[#e8ece8] px-3 py-2 text-[#555] disabled:text-[#bbb]"
              disabled={page === 1 || operationsQuery.isFetching}
            >
              Anterior
            </button>
            <span className="rounded-md bg-[#287c36] px-4 py-2 font-semibold text-white">
              {page}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!operationsQuery.data?.hasNextPage || operationsQuery.isFetching}
              className="rounded-md border border-[#e8ece8] px-3 py-2 text-[#555] disabled:text-[#bbb]"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <article className="mt-5 hidden overflow-hidden rounded-2xl border border-[#dfe6df] bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#f7f7f7] text-xs uppercase text-[#777]">
              <tr>
                <th className="px-5 py-4">Tipo de operación</th>
                <th className="px-5 py-4">Institución</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Monto</th>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Código de transacción</th>
                <th className="px-5 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => (
                <tr key={operation.id} className="border-t border-[#e8ece8]">
                  <td className="px-5 py-4 text-[#555]">
                    {operation.operationLabel}
                  </td>
                  <td className="px-5 py-4 text-[#555]">
                    {operation.institutionName}
                  </td>
                  <td className="px-5 py-4 text-[#555]">
                    {operation.statusLabel}
                  </td>
                  <td className="px-5 py-4 font-mono text-[#287c36]">
                    {formatTvdAmount(operation.amount)}
                  </td>
                  <td className="px-5 py-4 text-[#777]">
                    {formatOperationDate(operation.date)}
                  </td>
                  <td className="px-5 py-4">
                    {operation.txHash ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#666]">
                          {shortenTxHash(operation.txHash)}
                        </span>
                        <CopyButton value={operation.txHash} label="Copiar" />
                      </div>
                    ) : (
                      <span className="text-xs text-[#777]">
                        Operación aún no confirmada
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {operation.explorerUrl ? (
                      <a
                        href={operation.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-[#dfe3df] px-3 py-2 text-xs font-medium text-[#444] hover:border-[#287c36] hover:text-[#287c36]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Comprobar operación
                      </a>
                    ) : (
                      <span className="text-xs text-[#777]">
                        Operación aún no confirmada
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!operationsQuery.isLoading &&
              !operationsQuery.isError &&
              canQueryOperations &&
              operations.length === 0 ? (
                <tr className="border-t border-[#e8ece8]">
                  <td className="px-5 py-8 text-center text-[#777]" colSpan={7}>
                    No existen operaciones para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#e8ece8] px-5 py-4 text-sm text-[#777] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Página {page}. {operations.length} operaciones de {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-md border border-[#e8ece8] px-4 py-2 text-[#555] disabled:text-[#bbb]"
              disabled={page === 1 || operationsQuery.isFetching}
            >
              Anterior
            </button>
            <span className="rounded-md bg-[#287c36] px-4 py-2 font-semibold text-white">
              {page}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!operationsQuery.data?.hasNextPage || operationsQuery.isFetching}
              className="rounded-md border border-[#e8ece8] px-4 py-2 text-[#555] disabled:text-[#bbb]"
            >
              Siguiente
            </button>
          </div>
        </div>
      </article>

      <p className="mt-4 flex items-center gap-2 text-xs text-[#777]">
        <Search className="h-3.5 w-3.5" />
        Montos consultados desde las operaciones registradas y confirmadas.
      </p>
    </section>
  );
}
