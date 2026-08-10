"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  useLazyListPublicInstitutionalTenantsQuery,
  type PublicInstitutionTenant,
} from "@/store/institutionalTenants";

type PublicInstitutionAutocompleteProps = {
  id: string;
  value: string;
  onChange: (institutionId: string) => void;
  onSelectInstitution?: (institution: PublicInstitutionTenant | null) => void;
  error?: string;
  dataCy?: string;
  label?: string;
};

const inputClassName =
  "min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#459151]";

export default function PublicInstitutionAutocomplete({
  id,
  value,
  onChange,
  onSelectInstitution,
  error,
  dataCy,
  label = "Institución",
}: PublicInstitutionAutocompleteProps) {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<PublicInstitutionTenant[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [queryError, setQueryError] = useState("");
  const [listPublicInstitutions] = useLazyListPublicInstitutionalTenantsQuery();
  const sequenceRef = useRef(0);
  const selected =
    options.find((institution) => institution.institutionId === value) ?? null;

  const updateSearch = (nextSearch: string) => {
    sequenceRef.current += 1;
    setSearch(nextSearch);
    setOptions([]);
    setStatus("idle");
    setQueryError("");
    if (selected && nextSearch !== selected.institutionName) {
      onChange("");
      onSelectInstitution?.(null);
    }
  };

  const runSearch = async () => {
    const normalizedSearch = search.trim().replace(/\s+/g, " ");
    if (normalizedSearch.length < 2) {
      setOptions([]);
      setStatus("success");
      setQueryError("");
      return;
    }

    const sequence = sequenceRef.current + 1;
    sequenceRef.current = sequence;
    setStatus("loading");
    setQueryError("");
    setOptions([]);
    onChange("");
    onSelectInstitution?.(null);

    try {
      const response = await listPublicInstitutions({
        search: normalizedSearch,
        page: 1,
        limit: 10,
      }).unwrap();
      if (sequence !== sequenceRef.current) return;
      setOptions(response.items);
      setStatus("success");
    } catch {
      if (sequence !== sequenceRef.current) return;
      setOptions([]);
      setStatus("error");
      setQueryError("No pudimos cargar las instituciones. Intenta nuevamente.");
    }
  };

  const selectInstitution = (institution: PublicInstitutionTenant) => {
    onChange(institution.institutionId);
    onSelectInstitution?.(institution);
    setSearch(institution.institutionName);
    setOptions([institution]);
    setStatus("success");
    setQueryError("");
  };

  const clearSelection = () => {
    sequenceRef.current += 1;
    onChange("");
    onSelectInstitution?.(null);
    setSearch("");
    setOptions([]);
    setStatus("idle");
    setQueryError("");
  };

  const showEmpty =
    status === "success" && search.trim().length >= 2 && options.length === 0;

  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-gray-700 mb-1 ml-1" htmlFor={id}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          data-cy={dataCy}
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void runSearch();
            }
          }}
          className={inputClassName}
          autoComplete="organization"
          aria-invalid={Boolean(error)}
        />
        {value ? (
          <button
            type="button"
            onClick={clearSelection}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-gray-200 px-3 text-gray-500 hover:bg-gray-50"
            aria-label="Limpiar institución"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={status === "loading"}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#459151] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Buscar</span>
        </button>
      </div>
      {status === "loading" ? (
        <p className="mt-1 ml-1 text-xs font-medium text-gray-500" role="status">
          Cargando instituciones...
        </p>
      ) : null}
      {queryError ? (
        <p className="mt-1 ml-1 text-xs font-medium text-red-600" role="alert">
          {queryError}
        </p>
      ) : null}
      {showEmpty ? (
        <p className="mt-1 ml-1 text-xs font-medium text-gray-500" role="status">
          No hay instituciones disponibles con ese nombre.
        </p>
      ) : null}
      {options.length > 0 ? (
        <div
          className="mt-2 max-h-44 overflow-auto rounded-xl border border-gray-200 bg-white"
          role="listbox"
          aria-label="Instituciones encontradas"
        >
          {options.map((institution) => {
            const isSelected = value === institution.institutionId;
            return (
              <button
                key={institution.institutionId}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-cy="institution-autocomplete-option"
                onClick={() => selectInstitution(institution)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-all hover:bg-green-50 ${
                  isSelected
                    ? "bg-green-50 font-semibold text-[#276331]"
                    : "text-gray-700"
                }`}
              >
                <span>{institution.institutionName}</span>
                {isSelected ? (
                  <span className="text-xs font-bold text-[#276331]">
                    Seleccionada
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
      {error ? (
        <p className="mt-1 ml-1 text-xs font-medium text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
