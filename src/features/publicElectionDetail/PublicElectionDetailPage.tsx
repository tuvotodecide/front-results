// Página de detalle público de una elección
// Muestra resultados, estado y distribución de votos

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicElectionRepository } from './data/PublicElectionRepository.api';
import type { PublicElectionDetail, Candidate } from './types';
import { PadronCheckModal } from '../padronCheck';

// Iconos
const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

// Componente de Spinner
const Spinner: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
);

// Formateador de números
const formatNumber = (num: number): string => {
  return num.toLocaleString('es-BO');
};

// Badge de estado
const StatusBadge: React.FC<{ status: PublicElectionDetail['status'] }> = ({ status }) => {
  const styles = {
    FINISHED: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      label: 'Votación Finalizada',
    },
    LIVE: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      dot: 'bg-blue-500 animate-pulse',
      label: 'En votación',
    },
    UPCOMING: {
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-600',
      dot: 'bg-slate-400',
      label: 'Próxima',
    },
  };

  const s = styles[status];

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// Card de Horario de Votación
const ScheduleCard: React.FC<{ schedule: PublicElectionDetail['schedule'] }> = ({ schedule }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
        <ClockIcon className="w-6 h-6 text-slate-500" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-800 mb-3">Horario de Votación</h3>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 text-slate-600">
            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
            <span>Desde: {schedule.from}</span>
          </p>
          <p className="flex items-center gap-2 text-slate-600">
            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
            <span>Hasta: {schedule.to}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Card de Estado Actual
const StatusCard: React.FC<{ status: PublicElectionDetail['status'] }> = ({ status }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-center">
    <div className="text-center">
      <p className="text-sm text-slate-500 mb-3">Estado Actual</p>
      <StatusBadge status={status} />
    </div>
  </div>
);

// Card del Ganador
const WinnerCard: React.FC<{ candidate: Candidate }> = ({ candidate }) => (
  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-300">
          {candidate.avatarUrl ? (
            <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: candidate.colorHex }}
            >
              {candidate.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          GANADOR
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-800">{candidate.name}</h3>
        <p className="text-slate-600">{candidate.party}</p>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-3xl font-bold text-emerald-700">{candidate.percent}%</span>
          <span className="text-slate-500">{formatNumber(candidate.votes)} votos</span>
        </div>
      </div>
    </div>
  </div>
);

// Card de votación en curso (para LIVE)
const LiveVotingCard: React.FC = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-blue-800">Votación en curso</h3>
          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
            EN VIVO
          </span>
        </div>
        <p className="text-sm text-blue-700">
          Los resultados son preliminares y pueden cambiar hasta el cierre de la votación.
        </p>
      </div>
    </div>
  </div>
);

// Card sin resultados (para UPCOMING)
const NoResultsCard: React.FC = () => (
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 shadow-sm text-center">
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <ClockIcon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="font-semibold text-slate-700 mb-2">Aún no hay resultados disponibles</h3>
    <p className="text-sm text-slate-500">
      La votación aún no ha comenzado. Los resultados estarán disponibles una vez finalice el proceso.
    </p>
  </div>
);

// Fila de candidato en distribución
const CandidateRow: React.FC<{ candidate: Candidate; isLeading?: boolean; isPreliminary?: boolean }> = ({
  candidate,
  isLeading,
  isPreliminary,
}) => (
  <div className={`py-4 ${isLeading ? 'bg-emerald-50/50 -mx-4 px-4 rounded-lg' : ''}`}>
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200">
        {candidate.avatarUrl ? (
          <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: candidate.colorHex }}
          >
            {candidate.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info + Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-slate-800 truncate">{candidate.name}</h4>
          {isLeading && (
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-slate-500 truncate mb-2">{candidate.party}</p>

        {/* Progress bar */}
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${candidate.percent}%`,
              backgroundColor: candidate.colorHex,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold text-slate-800">{candidate.percent}%</span>
          {isPreliminary && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
              PRELIMINAR
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">{formatNumber(candidate.votes)} votos</p>
      </div>
    </div>
  </div>
);

// Sección de distribución de votos
const VoteDistributionSection: React.FC<{
  candidates: Candidate[];
  winnerId: string | null;
  isPreliminary?: boolean;
}> = ({ candidates, winnerId, isPreliminary }) => {
  // Ordenar por porcentaje descendente
  const sortedCandidates = [...candidates].sort((a, b) => b.percent - a.percent);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">Distribución de Votos</h3>
      <div className="divide-y divide-slate-100">
        {sortedCandidates.map((candidate) => (
          <CandidateRow
            key={candidate.id}
            candidate={candidate}
            isLeading={candidate.id === winnerId || (winnerId === null && candidate === sortedCandidates[0])}
            isPreliminary={isPreliminary}
          />
        ))}
      </div>
    </div>
  );
};

// Sección de consulta de padrón
const PadronCheckSection: React.FC<{ onOpenModal: () => void }> = ({ onOpenModal }) => (
  <div className="bg-slate-100 py-12 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mt-8">
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        CONSULTA SI ESTÁS <span className="text-emerald-600">HABILITADO</span>
      </h2>
      <button
        onClick={onOpenModal}
        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
      >
        <SearchIcon className="w-5 h-5" />
        Consultar mi estado
      </button>
    </div>
  </div>
);

// Componente principal
const PublicElectionDetailPage: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const [election, setElection] = useState<PublicElectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPadronModal, setShowPadronModal] = useState(false);

  useEffect(() => {
    const loadElection = async () => {
      if (!electionId) {
        setError('ID de elección no válido');
        setIsLoading(false);
        return;
      }

      try {
        const data = await publicElectionRepository.getPublicElectionDetail(electionId);
        if (!data) {
          setError('Elección no encontrada');
        } else {
          setElection(data);
        }
      } catch (err) {
        setError('Error al cargar la elección');
      } finally {
        setIsLoading(false);
      }
    };

    loadElection();
  }, [electionId]);

  const handleBack = () => {
    navigate('/');
  };

  // Obtener el candidato ganador
  const getWinnerCandidate = (): Candidate | null => {
    if (!election || !election.results || !election.winnerCandidateId) return null;
    return election.results.candidates.find(c => c.id === election.winnerCandidateId) || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Spinner />
      </div>
    );
  }

  if (error || !election) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">{error || 'Elección no encontrada'}</p>
          <button
            onClick={handleBack}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const winnerCandidate = getWinnerCandidate();
  const hasResults = Boolean(election.results && election.results.candidates.length > 0);
  const ballotDescription =
    election.status === 'FINISHED'
      ? 'Conoce a los candidatos y partidos políticos que participaron en esta elección'
      : 'Conoce a los candidatos y partidos políticos que participan en esta elección';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              {election.title}
            </h1>
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards superiores: Horario y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ScheduleCard schedule={election.schedule} />
          <StatusCard status={election.status} />
        </div>

        {/* Contenido según estado */}
        {election.status === 'FINISHED' && hasResults && winnerCandidate && (
          <>
            <div className="mb-6">
              <WinnerCard candidate={winnerCandidate} />
            </div>
            <VoteDistributionSection
              candidates={election.results!.candidates}
              winnerId={election.winnerCandidateId}
            />
          </>
        )}

        {election.status === 'FINISHED' && !hasResults && (
          <NoResultsCard />
        )}

        {election.status === 'LIVE' && (
          <>
            <div className="mb-6">
              <LiveVotingCard />
            </div>
            {hasResults ? (
              <VoteDistributionSection
                candidates={election.results!.candidates}
                winnerId={null}
                isPreliminary
              />
            ) : (
              <NoResultsCard />
            )}
          </>
        )}

        {election.status === 'UPCOMING' && (
          <NoResultsCard />
        )}

        {/* Papeleta y candidaturas */}
        <div className="mt-8 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Papeleta Electoral</h2>
            <p className="mt-1 text-slate-500">{ballotDescription}</p>
          </div>
          {election.ballotParties.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Esta elección todavía no tiene candidaturas públicas configuradas.
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {election.ballotParties.map((party) => (
                <div key={party.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-2" style={{ backgroundColor: party.colorHex }} />
                  <div className="p-6">
                    <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
                      {party.logoUrl ? (
                        <img
                          src={party.logoUrl}
                          alt={party.name}
                          className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                          {party.name.charAt(0)}
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-slate-800">{party.name}</h3>
                    </div>

                    <div className="space-y-5 pt-5">
                      {party.candidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-center gap-4">
                          {candidate.photoUrl ? (
                            <img
                              src={candidate.photoUrl}
                              alt={candidate.fullName}
                              className="h-16 w-16 rounded-full object-cover border-2 border-slate-200"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                              {candidate.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                              {candidate.positionName}
                            </p>
                            <p className="text-xl font-semibold text-slate-800">{candidate.fullName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección consulta padrón */}
        {election.publicEligibilityEnabled && (
          <PadronCheckSection onOpenModal={() => setShowPadronModal(true)} />
        )}
      </main>

      {/* Modal de consulta de padrón */}
      <PadronCheckModal
        isOpen={showPadronModal}
        onClose={() => setShowPadronModal(false)}
        eventId={electionId}
      />
    </div>
  );
};

export default PublicElectionDetailPage;
