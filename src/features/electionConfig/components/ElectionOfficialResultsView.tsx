import React from "react";
import type { Candidate } from "@/features/publicElectionDetail/types";

const formatNumber = (num: number): string => num.toLocaleString("es-BO");

const getNonBlankCandidates = (candidates: Candidate[]): Candidate[] =>
  candidates.filter((candidate) => candidate.id !== "blank");

const getBlankCandidate = (candidates: Candidate[]): Candidate | null =>
  candidates.find((candidate) => candidate.id === "blank") ?? null;

const getTopCandidates = (candidates: Candidate[]): Candidate[] => {
  const eligibleCandidates = getNonBlankCandidates(candidates);
  if (eligibleCandidates.length === 0) return [];
  const maxVotes = Math.max(
    ...eligibleCandidates.map((candidate) => candidate.votes),
  );
  if (maxVotes <= 0) return [];
  return eligibleCandidates.filter((candidate) => candidate.votes === maxVotes);
};

type ElectionOfficialResultsViewProps = {
  candidates: Candidate[];
  winnerCandidateId?: string | null;
  totalVotes?: number;
  isReferendum?: boolean;
  title?: string;
  description?: string;
};

const ElectionOfficialResultsView: React.FC<ElectionOfficialResultsViewProps> = ({
  candidates,
  winnerCandidateId,
  totalVotes,
  isReferendum = false,
  title = "Resultados oficiales",
  description = "Resultados finales de la eleccion. Datos verificables en blockchain.",
}) => {
  const nonBlankCandidates = getNonBlankCandidates(candidates);
  const blankCandidate = getBlankCandidate(candidates);
  const tiedCandidates = getTopCandidates(candidates);
  const hasTie = tiedCandidates.length > 1;
  const winner =
    !hasTie && winnerCandidateId
      ? nonBlankCandidates.find((candidate) => candidate.id === winnerCandidateId)
      : !hasTie
        ? tiedCandidates[0] ?? null
        : null;
  const computedTotal =
    totalVotes ?? candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>

      {hasTie ? (
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <span className="inline-flex rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
            EMPATE
          </span>
          <h3 className="mt-3 text-xl font-bold text-amber-900">
            {isReferendum
              ? "El referéndum registra un empate"
              : "La elección registra un empate"}
          </h3>
          <p className="mt-2 text-sm text-amber-800">
            {tiedCandidates
              .map((candidate) => candidate.name)
              .join(", ")}
          </p>
        </article>
      ) : winner ? (
        <article className="flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E7D32] text-sm font-bold text-white">
            OK
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#2E7D32]">
              Opcion ganadora
            </p>
            <h3 className="text-2xl font-bold text-[#2E7D32]">
              {winner.name}
            </h3>
            {!isReferendum && winner.party ? (
              <p className="text-sm text-[#2E7D32]">{winner.party}</p>
            ) : null}
            <p className="text-sm text-[#2E7D32]">
              {winner.percent}% de los votos - {formatNumber(winner.votes)} votos
            </p>
          </div>
        </article>
      ) : null}

      <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">
          Distribucion de votos
        </p>
        <div className="space-y-4">
          {nonBlankCandidates
            .slice()
            .sort((a, b) => b.votes - a.votes)
            .map((candidate) => (
              <div key={candidate.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-800">
                    {candidate.name}
                  </span>
                  <span className="text-gray-500">
                    {candidate.percent}% - {formatNumber(candidate.votes)} votos
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, candidate.percent))}%`,
                      backgroundColor: candidate.colorHex || "#2E7D32",
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </article>

      {blankCandidate ? (
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Votos en blanco
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatNumber(blankCandidate.votes)}
            </span>
            <span className="text-sm text-gray-500">votos</span>
            <span className="text-lg font-semibold text-gray-700">
              ({blankCandidate.percent}%)
            </span>
          </div>
        </article>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-400">
            Total votos validos
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(computedTotal)}
          </p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-400">Votos observados</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </article>
      </div>
    </div>
  );
};

export default ElectionOfficialResultsView;
