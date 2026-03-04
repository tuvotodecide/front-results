// Página de estado de elección activa (READ-ONLY)
// Para elecciones que ya fueron configuradas y están en votación

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfigStepsTabs from './components/ConfigStepsTabs';
import PositionsTable from './components/PositionsTable';
import NotificationModal from './components/NotificationModal';
import { usePositions } from './data/usePositionRepository';
import { useParties } from './data/usePartyRepository';
import { usePadron } from './data/usePadronRepository';
import { notificationRepository } from './data/NotificationRepository.mock';
import type { ConfigStep } from './types';

// Tipos de estado de elección
type ElectionActiveStatus = 'ACTIVE' | 'LIVE' | 'FINISHED';

// Mock: obtener datos de elección
const getElectionData = (electionId: string) => {
  try {
    const stored = localStorage.getItem('mock_elections');
    if (stored) {
      const elections = JSON.parse(stored);
      const election = elections.find((e: { id: string }) => e.id === electionId);
      if (election) {
        return {
          title: election.institution || 'Elecciones universitarias',
          schedule: {
            from: election.votingStartDate
              ? new Date(election.votingStartDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) + ' hrs'
              : '12 de febrero de 2026 - 08:00 hrs',
            to: election.votingEndDate
              ? new Date(election.votingEndDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) + ' hrs'
              : '12 de febrero de 2026 - 18:00 hrs',
          },
          status: (election.status === 'ACTIVE' ? 'LIVE' : election.status) as ElectionActiveStatus,
        };
      }
    }
  } catch {}
  return {
    title: 'Elecciones universitarias',
    schedule: {
      from: '12 de febrero de 2026 - 08:00 hrs',
      to: '12 de febrero de 2026 - 18:00 hrs',
    },
    status: 'LIVE' as ElectionActiveStatus,
  };
};

// Mock: obtener otras elecciones del usuario
const getUserOtherElections = (currentElectionId: string) => {
  try {
    const stored = localStorage.getItem('mock_elections');
    if (stored) {
      const elections = JSON.parse(stored);
      return elections
        .filter((e: { id: string }) => e.id !== currentElectionId)
        .slice(0, 3)
        .map((e: any) => ({
          id: e.id,
          title: e.institution,
          organization: e.description || 'Organización',
          status: e.status === 'ACTIVE' ? 'ACTIVA' : e.status === 'DRAFT' ? 'BORRADOR' : 'FINALIZADA',
        }));
    }
  } catch {}
  return [];
};

// Iconos
const ClockIcon = () => (
  <svg className="w-6 h-6 text-[#459151]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

// Badge de estado
const StatusBadge: React.FC<{ status: ElectionActiveStatus }> = ({ status }) => {
  const styles = {
    LIVE: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-700',
      dot: 'bg-amber-500 animate-pulse',
      label: 'En votación',
    },
    ACTIVE: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-700',
      dot: 'bg-green-500 animate-pulse',
      label: 'Activa',
    },
    FINISHED: {
      bg: 'bg-gray-100',
      border: 'border-gray-300',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
      label: 'Finalizada',
    },
  };

  const s = styles[status] || styles.LIVE;

  return (
    <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-semibold border-2 ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// Card de elección para "Otras votaciones"
const ElectionCard: React.FC<{
  election: { id: string; title: string; organization: string; status: string };
  onClick: () => void;
}> = ({ election, onClick }) => {
  const statusStyles: Record<string, string> = {
    ACTIVA: 'bg-green-100 text-green-700 border-green-200',
    BORRADOR: 'bg-gray-100 text-gray-600 border-gray-200',
    FINALIZADA: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
    >
      <div className="mb-3">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[election.status] || statusStyles.BORRADOR}`}>
          {election.status}
        </span>
      </div>
      <h4 className="font-semibold text-gray-800 mb-1">{election.title}</h4>
      <p className="text-sm text-gray-500 mb-4">{election.organization}</p>
      <button className="text-[#459151] hover:text-[#3a7a44] text-sm font-semibold flex items-center gap-1 transition-colors group-hover:gap-2">
        Ver información
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
};

const ActiveElectionStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || 'demo-election';

  const [electionData, setElectionData] = useState(() => getElectionData(actualElectionId));
  const [otherElections, setOtherElections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ConfigStep>(1);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { positions, loading: loadingPositions } = usePositions(actualElectionId);
  const { parties, loading: loadingParties } = useParties(actualElectionId);
  const { voters, validCount, loading: loadingPadron } = usePadron(actualElectionId);

  useEffect(() => {
    setElectionData(getElectionData(actualElectionId));
    setOtherElections(getUserOtherElections(actualElectionId));
  }, [actualElectionId]);

  // Handler para enviar notificación
  const handleSendNotification = async (title: string, message: string) => {
    setSendingNotification(true);
    try {
      await notificationRepository.createNotification(actualElectionId, { title, message });
      setToastMessage('Notificación enviada correctamente');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSendingNotification(false);
    }
  };

  // Handler para ver otra elección
  const handleViewElection = (elId: string) => {
    navigate(`/elections/${elId}/status`);
  };

  // Renderizar contenido según tab activo
  const renderTabContent = () => {
    if (activeTab === 1) {
      return (
        <div className="mt-6">
          {loadingPositions ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Cargando cargos...</p>
            </div>
          ) : (
            <PositionsTable positions={positions} readOnly />
          )}
        </div>
      );
    }

    if (activeTab === 2) {
      return (
        <div className="mt-6">
          {loadingParties ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Cargando planchas...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">Planchas / Partidos</h3>
              </div>
              {parties.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No hay planchas registradas.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {parties.map((party) => (
                    <div key={party.id} className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {party.logoUrl ? (
                          <img src={party.logoUrl} alt={party.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                            {party.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-800">{party.name}</h4>
                          <p className="text-sm text-gray-500">{party.candidates.length} candidato(s)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 3) {
      return (
        <div className="mt-6">
          {loadingPadron ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Cargando padrón...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">Padrón Electoral</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{validCount}</p>
                    <p className="text-sm text-green-600">Votantes habilitados</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-700">{voters.length}</p>
                    <p className="text-sm text-gray-500">Total registrados</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {validCount > 0 ? Math.round((validCount / voters.length) * 100) : 0}%
                    </p>
                    <p className="text-sm text-blue-600">Tasa de habilitación</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  El padrón electoral está cargado y listo para la votación.
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Título de la elección */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          {electionData.title}
        </h1>

        {/* Cards superiores: Horario y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Card Horario de Votación */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 border border-green-200">
                <ClockIcon />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-3">Horario de Votación</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon />
                    <span>Desde: {electionData.schedule.from}</span>
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon />
                    <span>Hasta: {electionData.schedule.to}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Estado Actual */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Estado Actual</p>
              <StatusBadge status={electionData.status} />
            </div>
          </div>
        </div>

        {/* Stepper + Botón Crear Notificación */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <ConfigStepsTabs
            currentStep={activeTab}
            completedSteps={[1, 2, 3]}
            onStepChange={(step) => setActiveTab(step)}
            canNavigate={() => true}
          />

          <button
            onClick={() => setShowNotificationModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <BellIcon />
            Crear notificación
          </button>
        </div>

        {/* Contenido del tab activo (READ-ONLY) */}
        {renderTabContent()}

        {/* Sección "Otras votaciones" */}
        {otherElections.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Otras votaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {otherElections.map((election) => (
                <ElectionCard
                  key={election.id}
                  election={election}
                  onClick={() => handleViewElection(election.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de notificación */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSend={handleSendNotification}
        isLoading={sendingNotification}
      />

      {/* Toast de éxito */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default ActiveElectionStatusPage;
