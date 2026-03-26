// Página principal de Elecciones
// Muestra EmptyState si no hay elecciones, o lista si hay
// Conectado a backend real con RTK Query

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDeleteVotingEventMutation, useGetVotingEventsQuery } from '../../store/votingEvents';
import { selectTenantId, selectIsLoggedIn } from '../../store/auth/authSlice';
import EmptyState from './components/EmptyState';
import type { VotingEvent } from '../../store/votingEvents/types';

// Mapear estados del backend a labels en español
const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  ACTIVE: 'Activa',
  CLOSED: 'Finalizada',
  RESULTS_PUBLISHED: 'Resultados publicados',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-amber-100 text-amber-700',
  RESULTS_PUBLISHED: 'bg-violet-100 text-violet-700',
};

const hasDraftAlreadyStarted = (event: VotingEvent) =>
  event.status === 'DRAFT' &&
  Boolean(event.votingStart && new Date(event.votingStart).getTime() <= Date.now());

const ElectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const tenantId = useSelector(selectTenantId);
  const [deleteVotingEvent, { isLoading: deleting }] = useDeleteVotingEventMutation();

  // Query de eventos - skip si no hay tenantId
  const { data: events = [], isLoading, error, refetch } = useGetVotingEventsQuery(
    tenantId ? { tenantId } : undefined,
    { skip: !isLoggedIn }
  );

  const isEmpty = events.length === 0;

  const handleCreateClick = () => {
    navigate('/elections/new');
  };

  const handleElectionClick = (event: VotingEvent) => {
    if (hasDraftAlreadyStarted(event)) {
      return;
    }

    if (event.status === 'DRAFT') {
      // Ir a configuración (Paso 1)
      navigate(`/elections/${event.id}/config/cargos`);
    } else if (
      event.status === 'PUBLISHED' ||
      event.status === 'CLOSED' ||
      event.status === 'RESULTS_PUBLISHED'
    ) {
      // Elección publicada/activa/terminada - ir a vista de estado (read-only)
      navigate(`/elections/${event.id}/status`);
    } else {
      // Fallback a review
      navigate(`/elections/${event.id}/config/review`);
    }
  };

  const handleDeleteElection = async (event: VotingEvent) => {
    if (!window.confirm(`¿Eliminar la votación "${event.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteVotingEvent(event.id).unwrap();
    } catch (error) {
      console.error('Error eliminando votación:', error);
    }
  };

  // Formatear fecha
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Si no está logueado, redirigir a login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus elecciones</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold px-6 py-2 rounded-lg"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#459151] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Cargando votaciones...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">Error al cargar las votaciones</p>
          <button
            onClick={() => refetch()}
            className="bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (isEmpty) {
    return <EmptyState onCreateClick={handleCreateClick} />;
  }

  // Lista de elecciones (cuando hay al menos una)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mis Votaciones</h1>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Votación
          </button>
        </div>

        {/* Lista de elecciones */}
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => handleElectionClick(event)}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all ${
                hasDraftAlreadyStarted(event)
                  ? 'border-amber-200 bg-amber-50/40 cursor-default'
                  : 'hover:shadow-md hover:border-[#459151] cursor-pointer'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {event.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {event.objective}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[event.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabels[event.status] || event.status}
                    </span>
                    {event.status === 'DRAFT' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Pendiente de configurar
                      </span>
                    )}
                    {hasDraftAlreadyStarted(event) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Inicio vencido
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-500 space-y-2">
                  <p>
                    <span className="font-medium">Inicio:</span> {formatDate(event.votingStart)}
                  </p>
                  <p>
                    <span className="font-medium">Cierre:</span> {formatDate(event.votingEnd)}
                  </p>
                  {event.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteElection(event);
                      }}
                      disabled={deleting}
                      className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
              {hasDraftAlreadyStarted(event) && (
                <p className="mt-4 text-sm text-amber-800">
                  Esta votación ya alcanzó su hora de inicio sin estar lista. No debería seguir configurándose; elimínala y crea una nueva.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ElectionsPage;
