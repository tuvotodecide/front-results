// Sección "Elecciones activas" del landing público
// Basado en captura 03_active_elections.png

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActiveElection, ElectionStatus } from '../types';
import PadronCheckModal from '../../padronCheck/PadronCheckModal';

// Badge de estado
const StatusBadge: React.FC<{ status: ElectionStatus }> = ({ status }) => {
  const styles = {
    ACTIVA: 'bg-green-100 text-green-700 border-green-200',
    FINALIZADA: 'bg-gray-100 text-gray-600 border-gray-200',
    PROXIMA: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const labels = {
    ACTIVA: 'ACTIVA',
    FINALIZADA: 'FINALIZADA',
    PROXIMA: 'PRÓXIMA',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {status === 'ACTIVA' && (
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
      {labels[status]}
    </span>
  );
};

// Badge de tiempo restante
const TimeBadge: React.FC<{ closesIn: string }> = ({ closesIn }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
    Cierra en {closesIn}
  </span>
);

interface ActiveElectionsSectionProps {
  title: string;
  featured: ActiveElection | null;
  others: ActiveElection[];
  onConsultarHabilitado?: () => void;
}

const ActiveElectionsSection: React.FC<ActiveElectionsSectionProps> = ({
  title,
  featured,
  others,
  onConsultarHabilitado,
}) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleConsultar = () => {
    if (onConsultarHabilitado) {
      onConsultarHabilitado();
    } else {
      setShowModal(true);
    }
  };

  const handleViewElection = (electionId: string) => {
    navigate(`/elections/${electionId}/public`);
  };

  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
            {title}
          </h2>
        </div>

        {/* Featured Election Card */}
        {featured && (
          <div className="mb-12">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleViewElection(featured.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleViewElection(featured.id);
                }
              }}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                {/* Left: Election Info */}
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                    {featured.title}
                  </h3>
                  <p className="text-slate-500 mb-4">
                    {featured.organization}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={featured.status} />
                    {featured.closesIn && <TimeBadge closesIn={featured.closesIn} />}
                  </div>
                </div>

                {/* Right: Voting Schedule */}
                {featured.votingSchedule && (
                  <div className="lg:text-right">
                    <div className="inline-flex items-start gap-3 bg-slate-100/80 rounded-xl p-4 border border-slate-200/80">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200/80">
                        <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 mb-1">Horario de Votación</p>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Desde: {featured.votingSchedule.from}
                          </p>
                          <p className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Hasta: {featured.votingSchedule.to}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleConsultar();
                }}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Consultar si estoy habilitado
              </button>
            </div>
          </div>
        )}

        {/* Other Elections */}
        {others.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-6 tracking-tight">
              Otras votaciones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {others.map((election) => (
                <div
                  key={election.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleViewElection(election.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleViewElection(election.id);
                    }
                  }}
                  className="bg-white border border-slate-200/80 rounded-xl p-5 hover:shadow-lg transition-shadow duration-200 group"
                >
                  <div className="mb-3">
                    <StatusBadge status={election.status} />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">
                    {election.title}
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">
                    {election.organization}
                  </p>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleViewElection(election.id);
                    }}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold flex items-center gap-1 transition-colors group-hover:gap-2"
                  >
                    Ver información
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para consultar habilitado */}
      <PadronCheckModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </section>
  );
};

export default ActiveElectionsSection;
