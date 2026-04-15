// Página principal de Elecciones
// Muestra EmptyState si no hay elecciones, o lista si hay
// Conectado a backend real con RTK Query

import React, { useState } from 'react';
import { useNavigate } from '@/domains/votacion/navigation/compat-private';
import { useSelector } from 'react-redux';
import { useDeleteVotingEventMutation, useGetVotingEventsQuery } from '../../store/votingEvents';
import { selectTenantId, selectIsLoggedIn } from '../../store/auth/authSlice';
import Modal2 from '../../components/Modal2';
import EmptyState from './components/EmptyState';
import type { VotingEvent } from '../../store/votingEvents/types';
import { formatDateTimeForUi, hasDraftAlreadyStarted, useClientNow } from '../electionConfig/renderUtils';

// Mapear estados del backend a labels en español
const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  READY_FOR_REVIEW: 'En revisión previa',
  OFFICIALLY_PUBLISHED: 'Publicada oficialmente',
  PUBLICATION_EXPIRED: 'Publicación vencida',
  ACTIVE: 'Activa',
  CLOSED: 'Finalizada',
  RESULTS_PUBLISHED: 'Resultados publicados',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-blue-100 text-blue-700',
  READY_FOR_REVIEW: 'bg-cyan-100 text-cyan-700',
  OFFICIALLY_PUBLISHED: 'bg-blue-100 text-blue-700',
  PUBLICATION_EXPIRED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-amber-100 text-amber-700',
  RESULTS_PUBLISHED: 'bg-violet-100 text-violet-700',
};

const canDeleteEvent = (event: VotingEvent) =>
  ['DRAFT', 'READY_FOR_REVIEW', 'PUBLICATION_EXPIRED'].includes(event.status);

const ElectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const tenantId = useSelector(selectTenantId);
  const nowMs = useClientNow();
  const [deleteVotingEvent, { isLoading: deleting }] = useDeleteVotingEventMutation();
  const [deleteConfirm, setDeleteConfirm] = useState<VotingEvent | null>(null);

  // Query de eventos - skip si no hay tenantId
  const { data: events = [], isLoading, error, refetch } = useGetVotingEventsQuery(
    tenantId ? { tenantId } : undefined,
    { skip: !isLoggedIn }
  );

  const isEmpty = events.length === 0;

  const handleCreateClick = () => {
    navigate('/votacion/elecciones/new');
  };

  const handleElectionClick = (event: VotingEvent) => {
    if (hasDraftAlreadyStarted(event, nowMs) || event.status === 'PUBLICATION_EXPIRED') {
      return;
    }

    if (event.status === 'DRAFT') {
      // Ir a configuración (Paso 1)
      navigate(`/votacion/elecciones/${event.id}/config/cargos`);
    } else if (event.status === 'READY_FOR_REVIEW') {
      navigate(`/votacion/elecciones/${event.id}/config/review`);
    } else if (
      event.status === 'PUBLISHED' ||
      event.status === 'OFFICIALLY_PUBLISHED' ||
      event.status === 'CLOSED' ||
      event.status === 'RESULTS_PUBLISHED'
    ) {
      // Elección publicada/activa/terminada - ir a vista de estado (read-only)
      navigate(`/votacion/elecciones/${event.id}/status`);
    } else {
      // Fallback a review
      navigate(`/votacion/elecciones/${event.id}/config/review`);
    }
  };

  const handleDeleteElection = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteVotingEvent(deleteConfirm.id).unwrap();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error eliminando votación:', error);
    }
  };

  // Si no está logueado, redirigir a login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus elecciones</p>
          <button
            onClick={() => navigate('/votacion/login')}
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
                hasDraftAlreadyStarted(event, nowMs) || event.status === 'PUBLICATION_EXPIRED'
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
                    {hasDraftAlreadyStarted(event, nowMs) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Inicio vencido
                      </span>
                    )}
                    {event.status === 'PUBLICATION_EXPIRED' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Publicación vencida
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-500 space-y-2">
                  <p>
                    <span className="font-medium">Inicio:</span> {formatDateTimeForUi(event.votingStart)}
                  </p>
                  <p>
                    <span className="font-medium">Cierre:</span> {formatDateTimeForUi(event.votingEnd)}
                  </p>
                  {canDeleteEvent(event) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(event);
                      }}
                      disabled={deleting}
                      className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
              {hasDraftAlreadyStarted(event, nowMs) && (
                <p className="mt-4 text-sm text-amber-800">
                  Esta votación ya alcanzó su hora de inicio sin estar lista. No debería seguir configurándose; elimínala y crea una nueva.
                </p>
              )}
              {event.status === 'PUBLICATION_EXPIRED' && (
                <p className="mt-4 text-sm text-red-800">
                  La ventana de publicación oficial venció. Puedes eliminarla para crear una nueva.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal2
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar votación"
        size="sm"
        type="plain"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.65 18h16.7a1 1 0 00.86-1.5l-7.5-13a1 1 0 00-1.72 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  ¿Estás seguro de eliminar la votación "{deleteConfirm?.name}"?
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Esta acción eliminará la votación y no se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteElection()}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              <span>{deleting ? 'Eliminando...' : 'Eliminar'}</span>
            </button>
          </div>
        </div>
      </Modal2>
    </div>
  );
};

export default ElectionsPage;
