"use client";

import type { ActiveElection, ElectionStatus } from "@/features/publicLanding/types";
import { usePastElections } from "@/features/publicLanding/data/usePublicLandingRepository";
import React, { useMemo, useState } from "react";
import { useNavigate } from "../navigation/compat";

const StatusBadge: React.FC<{ status: ElectionStatus }> = ({ status }) => {
  const styles = {
    ACTIVA: "bg-green-100 text-green-700 border-green-200",
    FINALIZADA: "bg-slate-100 text-slate-600 border-slate-200",
    PROXIMA: "bg-amber-100 text-amber-700 border-amber-200",
  };

  const labels = {
    ACTIVA: "ACTIVA",
    FINALIZADA: "FINALIZADA",
    PROXIMA: "PRÓXIMA",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const ElectionCard: React.FC<{ election: ActiveElection; onOpen: (id: string) => void }> = ({
  election,
  onOpen,
}) => (
  <article
    role="button"
    tabIndex={0}
    onClick={() => onOpen(election.id)}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen(election.id);
      }
    }}
    className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.12)]"
  >
    <div className="mb-4 flex items-start justify-between gap-4">
      <StatusBadge status={election.status} />
      <svg className="h-5 w-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </div>

    <h3 className="text-xl font-bold text-slate-950">
      {election.title}
    </h3>
    <p className="mt-2 text-sm leading-6 text-slate-500">
      {election.organization}
    </p>

    {election.votingSchedule && (
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Fecha de votación</p>
        <p className="mt-1">Desde: {election.votingSchedule.from}</p>
        <p>Hasta: {election.votingSchedule.to}</p>
      </div>
    )}

    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen(election.id);
      }}
      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
    >
      Ver elección
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  </article>
);

const PastElectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { elections, loading, error } = usePastElections();
  const [query, setQuery] = useState("");

  const filteredElections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return elections;
    }

    return elections.filter((election) =>
      `${election.title} ${election.organization}`.toLowerCase().includes(normalizedQuery),
    );
  }, [elections, query]);

  const openElection = (electionId: string) => {
    navigate(`/votacion/elecciones/${electionId}/publica`);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-slate-600">Cargando elecciones pasadas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">No se pudieron cargar las elecciones</h1>
          <p className="mt-3 text-slate-600">Intenta de nuevo en unos minutos.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-[calc(100vh-64px)] bg-slate-50 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
            Elecciones 
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-600">
            Busca una elección pública y entra directamente a su vista correspondiente.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <label htmlFor="past-election-search" className="sr-only">
            Buscar elección
          </label>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              id="past-election-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o institución"
              className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          {filteredElections.length} elecciones encontradas
        </div>

        {filteredElections.length === 0 ? (
          <div className="mx-auto mt-10 max-w-2xl rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">No hay coincidencias</h2>
            <p className="mt-3 text-slate-600">Prueba con otro nombre de elección o institución.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredElections.map((election) => (
              <ElectionCard key={election.id} election={election} onOpen={openElection} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PastElectionsPage;
