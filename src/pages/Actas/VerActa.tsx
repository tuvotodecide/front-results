import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLazyGetBallotQuery } from '../../store/actas/actasEndpoints';
import { VerificationHistory } from '../../types/ballot';

const VerActa: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchId, setSearchId] = useState(
    searchParams.get('trackingId') || ''
  );
  const [getBallot, { data: ballot, isLoading, error }] =
    useLazyGetBallotQuery();

  useEffect(() => {
    if (searchParams.get('trackingId')) {
      getBallot(searchParams.get('trackingId')!);
    }
  }, [searchParams, getBallot]);

  const handleSearch = () => {
    if (searchId.trim()) {
      setSearchParams({ trackingId: searchId });
      getBallot(searchId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Consulta de Acta</h1>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={searchId}
          onChange={(e) => {
            setSearchId(e.target.value);
            if (!e.target.value) {
              setSearchParams({});
            }
          }}
          placeholder="Ingrese ID de seguimiento"
          className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mb-4">
          No se encontró el acta con el ID especificado
        </div>
      )}

      {ballot && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                ID de Seguimiento
              </h3>
              <p className="text-lg">{ballot.trackingId}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                Número de Mesa
              </h3>
              <p className="text-lg">{ballot.tableNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                Código de Mesa
              </h3>
              <p className="text-lg">{ballot.tableCode}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500">Estado</h3>
              <p className="text-lg">{ballot.status}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">
              Historial de Verificación
            </h3>
            <div className="space-y-4">
              {ballot.verificationHistory.map(
                (history: VerificationHistory) => (
                  <div
                    key={history._id}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">{history.status}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(history.verifiedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{history.notes}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerActa;
