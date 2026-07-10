"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import CopyButton from "../components/CopyButton";
import SuperadminPageHeader from "../components/SuperadminPageHeader";
import { tvdOperationsMock } from "../data/superadminTvd.mock";
import type { TvdOperation } from "../types";

const operationTypes = ["Todas", ...Array.from(new Set(tvdOperationsMock.map((op) => op.type)))];
const institutions = ["Todas", ...Array.from(new Set(tvdOperationsMock.map((op) => op.institution)))];

const amountNumber = (value: string) =>
  Number(value.replace("$TVD", "").replace(",", ".").trim()) || 0;

const formatAmount = (value: number) => {
  if (!value) return "0 $TVD";
  return `${value.toLocaleString("es-BO", {
    maximumFractionDigits: 1,
  })} $TVD`;
};

const monthByName: Record<string, number> = {
  Ene: 0,
  Feb: 1,
  Mar: 2,
  Abr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Ago: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dic: 11,
};

const parseOperationDate = (value: string) => {
  const [day, month, year] = value.split(" ");
  const monthIndex = monthByName[month];
  if (!day || monthIndex === undefined || !year) return null;

  return new Date(Number(year), monthIndex, Number(day));
};

const parseRangeDate = (value: string) => {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return null;

  return new Date(Number(year), Number(month) - 1, Number(day));
};

const SummaryCards = ({ operations }: { operations: TvdOperation[] }) => {
  const totalAssigned = operations
    .filter((op) => op.type === "Asignación manual" || op.type === "Recarga")
    .reduce((sum, op) => sum + amountNumber(op.amount), 0);
  const totalConsumed = operations
    .filter((op) => op.type === "Consumo por voto" || op.type === "Quema")
    .reduce((sum, op) => sum + amountNumber(op.amount), 0);

  return (
    <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
      <article className="rounded-lg border border-[#dfe6df] bg-white p-4 shadow-sm">
        <p className="text-xs text-[#777]">Total operaciones</p>
        <p className="mt-2 text-2xl font-semibold text-[#3f3f3f]">
          {operations.length}
        </p>
      </article>
      <article className="rounded-lg border border-[#dfe6df] bg-white p-4 shadow-sm">
        <p className="text-xs text-[#777]">Total asignado</p>
        <p className="mt-2 text-2xl font-semibold text-[#1d4ed8]">
          {formatAmount(totalAssigned)}
        </p>
      </article>
      <article className="rounded-lg border border-[#dfe6df] bg-white p-4 shadow-sm">
        <p className="text-xs text-[#777]">Total consumido</p>
        <p className="mt-2 text-2xl font-semibold text-[#c2410c]">
          {formatAmount(totalConsumed)}
        </p>
      </article>
    </div>
  );
};

const selectClassName =
  "h-12 w-full appearance-none rounded-lg border border-[#dfe3df] bg-white px-4 py-3 pr-11 text-sm text-[#444] outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10";

const SelectChevron = () => (
  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777]" />
);

const OperationMobileCard = ({
  operation,
  actionLabel,
}: {
  operation: TvdOperation;
  actionLabel: string;
}) => (
  <article className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#3f3f3f]">
            {operation.type}
          </p>
          <p className="mt-1 text-sm text-[#666]">{operation.institution}</p>
        </div>
        <p className="font-mono text-sm font-semibold text-[#287c36]">
          {operation.amount}
        </p>
      </div>

      <div className="grid gap-3 rounded-lg bg-[#f8faf8] p-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-[#777]">Fecha</span>
          <span className="text-right font-medium text-[#444]">
            {operation.date}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[#777]">txHash</span>
          <p className="break-all font-mono text-xs text-[#555]">
            {operation.txHash}
          </p>
        </div>
      </div>

      <div className="grid gap-2 pt-1 sm:grid-cols-2">
        <CopyButton value={operation.txHash} label="Copiar txHash" />
        <a
          href={operation.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3df] px-3 py-2 text-xs font-medium text-[#444] hover:border-[#287c36] hover:text-[#287c36]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {actionLabel}
        </a>
      </div>
    </div>
  </article>
);

export default function TvdOperationsPage() {
  const [institution, setInstitution] = useState("Todas");
  const [type, setType] = useState("Todas");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () =>
      tvdOperationsMock.filter((operation) => {
        const matchesInstitution =
          institution === "Todas" || operation.institution === institution;
        const matchesType = type === "Todas" || operation.type === type;
        const operationDate = parseOperationDate(operation.date);
        const fromDate = from ? parseRangeDate(from) : null;
        const toDate = to ? parseRangeDate(to) : null;
        const matchesFrom =
          !operationDate || !fromDate || operationDate >= fromDate;
        const matchesTo = !operationDate || !toDate || operationDate <= toDate;

        return matchesInstitution && matchesType && matchesFrom && matchesTo;
      }),
    [from, institution, to, type],
  );

  const isInstitutionFiltered = institution !== "Todas";

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SuperadminPageHeader
          title="Operaciones $TVD"
          subtitle="Consulta y auditoría de operaciones on-chain del ecosistema $TVD"
        />
      </div>

      <div className="rounded-2xl border border-[#dfe6df] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
          <label className="relative block">
            <span className="sr-only">Institución</span>
            <select
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              className={selectClassName}
            >
              {institutions.map((item) => (
                <option key={item} value={item}>
                  {item === "Todas" ? "Institución" : item}
                </option>
              ))}
            </select>
            <SelectChevron />
          </label>
          <label className="relative block">
            <span className="sr-only">Tipo</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className={selectClassName}
            >
              {operationTypes.map((item) => (
                <option key={item} value={item}>
                  {item === "Todas" ? "Tipo" : item}
                </option>
              ))}
            </select>
            <SelectChevron />
          </label>
          <label className="grid gap-1 text-xs text-[#666] sm:grid-cols-[auto_1fr] sm:items-center sm:gap-2">
            <span>Rango:</span>
            <input
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              placeholder="dd/mm/aaaa"
              className="h-12 w-full rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10 md:w-36"
            />
          </label>
          <label className="grid gap-1 text-xs text-[#666] sm:grid-cols-[auto_1fr] sm:items-center sm:gap-2">
            <span>hasta</span>
            <input
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="dd/mm/aaaa"
              className="h-12 w-full rounded-lg border border-[#dfe3df] px-4 py-3 text-sm outline-none focus:border-[#287c36] focus:ring-2 focus:ring-[#287c36]/10 md:w-36"
            />
          </label>
        </div>
      </div>

      {isInstitutionFiltered ? (
        <div className="mt-5">
          <SummaryCards operations={filtered} />
        </div>
      ) : null}

      <div className="mt-5 space-y-3 md:hidden">
        {filtered.map((operation) => (
          <OperationMobileCard
            key={operation.id}
            operation={operation}
            actionLabel={
              isInstitutionFiltered ? "Comprobar en la web" : "Abrir explorer"
            }
          />
        ))}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#dfe6df] bg-white px-4 py-4 text-sm text-[#777] shadow-sm">
          <span>
            Mostrando {filtered.length} de {tvdOperationsMock.length} operaciones
          </span>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <button
              className="rounded-md border border-[#e8ece8] px-3 py-2 text-[#bbb]"
              disabled
            >
              Anterior
            </button>
            <span className="rounded-md bg-[#287c36] px-4 py-2 font-semibold text-white">
              1
            </span>
            <button className="rounded-md border border-[#e8ece8] px-3 py-2 text-[#555]">
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
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Institución</th>
                <th className="px-5 py-4">Monto consultado</th>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">txHash</th>
                <th className="px-5 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((operation) => (
                <tr key={operation.id} className="border-t border-[#e8ece8]">
                  <td className="px-5 py-4 text-[#555]">{operation.type}</td>
                  <td className="px-5 py-4 text-[#555]">{operation.institution}</td>
                  <td className="px-5 py-4 font-mono text-[#287c36]">
                    {operation.amount}
                  </td>
                  <td className="px-5 py-4 text-[#777]">{operation.date}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#666]">
                        {operation.txHash}
                      </span>
                      <CopyButton value={operation.txHash} label="Copiar" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={operation.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-[#dfe3df] px-3 py-2 text-xs font-medium text-[#444] hover:border-[#287c36] hover:text-[#287c36]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {isInstitutionFiltered ? "Comprobar en la web" : "Explorer"}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#e8ece8] px-5 py-4 text-sm text-[#777] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {filtered.length} de {tvdOperationsMock.length} operaciones
          </span>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-[#e8ece8] px-4 py-2 text-[#bbb]" disabled>
              Anterior
            </button>
            <span className="rounded-md bg-[#287c36] px-4 py-2 font-semibold text-white">
              1
            </span>
            <button className="rounded-md border border-[#e8ece8] px-4 py-2 text-[#555]">
              Siguiente
            </button>
          </div>
        </div>
      </article>

      <p className="mt-4 flex items-center gap-2 text-xs text-[#777]">
        <Search className="h-3.5 w-3.5" />
        Montos y saldos consultados desde contrato, wallet, explorer o servicio de lectura.
      </p>
    </section>
  );
}
