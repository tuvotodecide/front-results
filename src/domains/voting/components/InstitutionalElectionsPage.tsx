"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Modal2 from "@/components/Modal2";
import EmptyState from "@/features/elections/components/EmptyState";
import {
  formatVotingDate,
  hasDraftAlreadyStarted,
  resolveVotingEventRoute,
  votingStatusColors,
  votingStatusLabels,
} from "@/domains/voting/lib/elections";
import { selectIsLoggedIn, selectTenantId } from "@/store/auth/authSlice";
import { setSelectedElection } from "@/store/election/electionSlice";
import { useDeleteVotingEventMutation, useGetVotingEventsQuery } from "@/store/votingEvents";
import type { VotingEvent } from "@/store/votingEvents/types";

export default function InstitutionalElectionsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const tenantId = useSelector(selectTenantId);
  const [deleteVotingEvent, { isLoading: deleting }] = useDeleteVotingEventMutation();
  const [deleteConfirm, setDeleteConfirm] = useState<VotingEvent | null>(null);

  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useGetVotingEventsQuery(tenantId ? { tenantId } : undefined, {
    skip: !isLoggedIn,
  });

  const handleCreateClick = () => {
    router.push("/elections/new");
  };

  const handleElectionClick = (event: VotingEvent) => {
    const target = resolveVotingEventRoute(event);
    if (!target) {
      return;
    }

    dispatch(
      setSelectedElection({
        id: event.id,
        name: event.name,
      }),
    );
    router.push(target);
  };

  const handleDeleteElection = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteVotingEvent(deleteConfirm.id).unwrap();
      setDeleteConfirm(null);
    } catch (deleteError) {
      console.error("Error eliminando votacion:", deleteError);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus elecciones</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold px-6 py-2 rounded-lg"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

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

  if (events.length === 0) {
    return <EmptyState onCreateClick={handleCreateClick} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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

        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => handleElectionClick(event)}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all ${
                hasDraftAlreadyStarted(event)
                  ? "border-amber-200 bg-amber-50/40 cursor-default"
                  : "hover:shadow-md hover:border-[#459151] cursor-pointer"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{event.objective}</p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        votingStatusColors[event.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {votingStatusLabels[event.status] || event.status}
                    </span>
                    {event.status === "DRAFT" && (
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
                    <span className="font-medium">Inicio:</span> {formatVotingDate(event.votingStart)}
                  </p>
                  <p>
                    <span className="font-medium">Cierre:</span> {formatVotingDate(event.votingEnd)}
                  </p>
                  {event.status === "DRAFT" && (
                    <button
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
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
              {hasDraftAlreadyStarted(event) && (
                <p className="mt-4 text-sm text-amber-800">
                  Esta votación ya alcanzó su hora de inicio sin estar lista. No debería seguir configurándose; elimínala y crea una nueva.
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
                  Esta acción eliminará la votación borrador y no se puede deshacer.
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
              <span>{deleting ? "Eliminando..." : "Eliminar"}</span>
            </button>
          </div>
        </div>
      </Modal2>
    </div>
  );
}
