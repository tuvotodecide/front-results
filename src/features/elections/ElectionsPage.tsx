// Página principal de Elecciones
// Muestra EmptyState si no hay elecciones, o lista si hay

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useElections } from './data/useElectionRepository';
import EmptyState from './components/EmptyState';
import PublicLayout from '../../components/PublicLayout';

const ElectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { elections, loading, isEmpty, refetch } = useElections();

  const handleCreateClick = () => {
    navigate('/elections/new');
  };

  const handleElectionClick = (electionId: string, status: string) => {
    if (status === 'DRAFT') {
      // Ir a configuración (Paso 1)
      navigate(`/elections/${electionId}/config/cargos`);
    } else if (status === 'ACTIVE' || status === 'CLOSED' || status === 'RESULTS') {
      // Elección activa o cerrada - ir a vista de estado (read-only)
      navigate(`/elections/${electionId}/status`);
    } else {
      // Fallback a review
      navigate(`/elections/${electionId}/config/review`);
    }
  };

  // Loading
  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#459151] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <PublicLayout>
        <EmptyState onCreateClick={handleCreateClick} />
      </PublicLayout>
    );
  }

  // Lista de elecciones (cuando hay al menos una)
  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Mis Elecciones</h1>
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
            {elections.map((election) => (
              <div
                key={election.id}
                onClick={() => handleElectionClick(election.id, election.status)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#459151] transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {election.institution}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {election.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          election.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-700'
                            : election.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : election.status === 'CLOSED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {election.status === 'DRAFT' && 'Borrador'}
                        {election.status === 'ACTIVE' && 'Activa'}
                        {election.status === 'CLOSED' && 'Cerrada'}
                        {election.status === 'RESULTS' && 'Resultados'}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>
                      Votación:{' '}
                      {new Date(election.votingStartDate).toLocaleDateString('es-ES')}
                      {' - '}
                      {new Date(election.votingEndDate).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ElectionsPage;
