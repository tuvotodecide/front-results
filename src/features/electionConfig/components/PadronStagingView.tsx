import React, { useEffect, useState } from "react";
import type { Voter, PadronFile } from "../types";

interface PadronStagingViewProps {
  file: PadronFile;
  voters: Voter[];
  totalVoters: number;
  enabledCount: number;
  disabledCount: number;
  observedCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  searchValue?: string;
  loading?: boolean;
  downloading?: boolean;
  confirming?: boolean;
  parsedLabel?: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onInspectObservations?: () => void;
  onAddRecord?: () => void;
  onEditRecord?: (voter: Voter) => void;
  onDeleteRecord?: (voter: Voter) => void;
  onToggleEnabled?: (voter: Voter, nextEnabled: boolean) => void;
  onReplaceFile?: () => void;
  onDeleteFile?: () => void;
  onExport?: () => void;
  onConfirm?: () => void;
}

const SummaryCard: React.FC<{
  title: string;
  value: number;
  note: string;
  tone: "blue" | "green" | "slate" | "red";
}> = ({ title, value, note, tone }) => {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-white text-slate-700",
    red: "border-red-200 bg-red-50 text-red-700",
  } as const;

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <p className="text-sm font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-3 text-4xl font-bold">{value.toLocaleString("es-ES")}</p>
      <p className="mt-2 text-sm opacity-90">{note}</p>
    </div>
  );
};

const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={() => {
      if (!disabled) {
        onChange(!checked);
      }
    }}
    disabled={disabled}
    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
      checked ? "bg-[#2f8f3a]" : "bg-slate-300"
    } ${disabled ? "opacity-50" : ""}`}
    aria-pressed={checked}
  >
    <span
      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-7" : "translate-x-1"
      }`}
    />
  </button>
);

const getPageNumbers = (page: number, totalPages: number) => {
  const pages: Array<number | string> = [];
  if (totalPages <= 7) {
    for (let current = 1; current <= totalPages; current += 1) {
      pages.push(current);
    }
    return pages;
  }

  pages.push(1);
  if (page > 3) pages.push("...");
  const windowStart = Math.max(2, page - 1);
  const windowEnd = Math.min(totalPages - 1, page + 1);
  for (let current = windowStart; current <= windowEnd; current += 1) {
    pages.push(current);
  }
  if (page < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
};

const PadronStagingView: React.FC<PadronStagingViewProps> = ({
  file,
  voters,
  totalVoters,
  enabledCount,
  disabledCount,
  observedCount,
  page,
  totalPages,
  pageSize,
  searchValue = "",
  loading = false,
  downloading = false,
  confirming = false,
  parsedLabel: _parsedLabel = "Parseado",
  onPageChange,
  onSearchChange,
  onInspectObservations,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onToggleEnabled,
  onReplaceFile,
  onDeleteFile,
  onExport,
  onConfirm,
}) => {
  const [search, setSearch] = useState(searchValue);
  const totalRecords = enabledCount + disabledCount;

  useEffect(() => {
    setSearch(searchValue);
  }, [searchValue]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearchChange(search);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total"
          value={totalRecords}
          note="Registros cargados al padrón"
          tone="blue"
        />
        <SummaryCard
          title="Habilitados"
          value={enabledCount}
          note="Pueden votar"
          tone="green"
        />
        <SummaryCard
          title="Inhabilitados"
          value={disabledCount}
          note="No pueden votar"
          tone="slate"
        />
        <SummaryCard
          title="Observados"
          value={observedCount}
          note="Registros que requieren revisión manual"
          tone="red"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Padrón Electoral
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Revisa y corrige el padrón antes de confirmar la versión final.
              </p>
              {observedCount > 0 && onInspectObservations ? (
                <button
                  type="button"
                  onClick={onInspectObservations}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
                >
                  Revisar observaciones
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por carnet"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-sm text-slate-800 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15 sm:w-72"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      onSearchChange("");
                    }}
                    className="absolute right-11 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 6l12 12M18 6L6 18"
                      />
                    </svg>
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </form>

              {onAddRecord ? (
                <button
                  type="button"
                  onClick={onAddRecord}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f8f3a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#277531]"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v14m7-7H5"
                    />
                  </svg>
                  Agregar registro
                </button>
              ) : null}

              {onExport ? (
                <button
                  type="button"
                  onClick={onExport}
                  disabled={downloading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2f8f3a] px-5 py-3 text-sm font-semibold text-[#2f8f3a] transition-colors hover:bg-[#2f8f3a]/5 disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v10m0 0l4-4m-4 4l-4-4M5 19h14"
                    />
                  </svg>
                  {downloading ? "Descargando..." : "Descargar padrón"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Carnet de identidad
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Habilitado
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <div className="mx-auto h-8 w-8 rounded-full border-4 border-[#459151] border-t-transparent animate-spin" />
                    <p className="mt-4 text-sm text-slate-500">
                      Cargando registros del padrón...
                    </p>
                  </td>
                </tr>
              ) : voters.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No se encontraron registros en esta página.
                  </td>
                </tr>
              ) : (
                voters.map((voter) => (
                  <tr key={voter.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {voter.carnet}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Toggle
                          checked={voter.enabled}
                          onChange={(nextEnabled) =>
                            onToggleEnabled?.(voter, nextEnabled)
                          }
                        />
                        <span
                          className={`text-sm font-semibold ${voter.enabled ? "text-[#2f8f3a]" : "text-slate-500"}`}
                        >
                          {voter.enabled ? "Sí" : "No"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {onEditRecord ? (
                          <button
                            type="button"
                            onClick={() => onEditRecord(voter)}
                            className="rounded-lg p-2 text-[#2f8f3a] transition-colors hover:bg-[#2f8f3a]/10"
                            aria-label={`Editar ${voter.carnet}`}
                          >
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.586-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.414-8.586z"
                              />
                            </svg>
                          </button>
                        ) : null}
                        {onDeleteRecord ? (
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(voter)}
                            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                            aria-label={`Eliminar ${voter.carnet}`}
                          >
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              Mostrando {Math.min((page - 1) * pageSize + 1, totalVoters)} -{" "}
              {Math.min(page * pageSize, totalVoters)} de{" "}
              {totalVoters.toLocaleString("es-ES")} registros
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              {getPageNumbers(page, totalPages).map((item, index) =>
                typeof item === "number" ? (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    onClick={() => onPageChange(item)}
                    className={`h-10 w-10 rounded-lg text-sm font-semibold transition-colors ${
                      item === page
                        ? "bg-[#2f8f3a] text-white"
                        : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ) : (
                  <span
                    key={`${item}-${index}`}
                    className="px-1 text-slate-400"
                  >
                    ...
                  </span>
                ),
              )}
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2f8f3a] shadow-sm">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 2v6h6"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 13h8M8 17h6"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{file.fileName}</p>

          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {onReplaceFile ? (
            <button
              type="button"
              onClick={onReplaceFile}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-white"
            >
              Reemplazar archivo
            </button>
          ) : null}
          {onDeleteFile ? (
            <button
              type="button"
              onClick={onDeleteFile}
              className="rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Eliminar archivo
            </button>
          ) : null}
          {onConfirm ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirming}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f8f3a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#277531] disabled:opacity-50"
            >
              {confirming ? (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              <span>{confirming ? "Confirmando..." : "Confirmar padrón"}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PadronStagingView;
