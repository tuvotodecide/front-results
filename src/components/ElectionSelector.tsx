import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetConfigurationsQuery,
  useGetConfigurationStatusQuery,
} from "../store/configurations/configurationsEndpoints";
import { RootState } from "../store";
import {
  hydrateElectionFromStorage,
  setSelectedElection,
} from "../store/election/electionSlice";
import { useMyContract } from "../hooks/useMyContract";
import { AlertCircle, Lock } from "lucide-react";

export default function ElectionSelector() {
  const dispatch = useDispatch();
  const { data: configs, isLoading: configsLoading } =
    useGetConfigurationsQuery();
  const { data: status, isLoading: statusLoading } =
    useGetConfigurationStatusQuery();
  const selectedId = useSelector(
    (s: RootState) => s.election.selectedElectionId
  );

  const { status: contractStatus, contract, isClient, elections } =
    useMyContract();

  // Hidratar elección del localStorage al inicio
  useEffect(() => {
    dispatch(hydrateElectionFromStorage());
  }, [dispatch]);

  // Auto-seleccionar elección basada en contrato o elección activa
  useEffect(() => {
    // Si es cliente con contrato activo, forzar esa elección
    if (contractStatus === "has_active" && contract?.electionId) {
      const electionName =
        configs?.find((c) => c.id === contract.electionId)?.name ??
        elections.find((e) => e.electionId === contract.electionId)
          ?.electionName ??
        null;

      dispatch(
        setSelectedElection({
          id: contract.electionId,
          name: electionName,
        })
      );
      return;
    }

    // Si no hay elección seleccionada, usar la activa del sistema
    if (!selectedId && status?.config?.id && status.config.isActive) {
      dispatch(
        setSelectedElection({
          id: status.config.id,
          name: status.config.name,
        })
      );
    }
  }, [
    dispatch,
    selectedId,
    status,
    contractStatus,
    contract,
    configs,
    elections,
  ]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Si es cliente con contrato activo, no permitir cambiar
    if (contractStatus === "has_active") {
      return;
    }
    const id = e.target.value || null;
    const name = configs?.find((c) => c.id === id)?.name ?? null;
    dispatch(setSelectedElection({ id, name }));
  };

  const isLoading = configsLoading || statusLoading;
  const isLocked = contractStatus === "has_active";

  // Obtener territorio para mostrar
  const territoryName = contract?.territory
    ? contract.territory.type === "municipality"
      ? contract.territory.municipalityName
      : contract.territory.departmentName
    : null;

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm text-gray-600">Elección:</span>

      {isLoading ? (
        <span className="text-sm text-gray-400">Cargando...</span>
      ) : (
        <div className="flex items-center gap-2">
          <select
            data-cy="election-select"
            value={selectedId ?? ""}
            onChange={onChange}
            disabled={isLocked}
            className={`border rounded px-2 py-1 text-sm w-auto ${
              isLocked
                ? "bg-gray-100 cursor-not-allowed border-green-300"
                : "hover:border-gray-400"
            }`}
          >
            {/* Opción de elección activa del sistema */}
            {status?.config?.id && status.config.isActive && (
              <option value={status.config.id}>
                {status.config.name} (activa)
              </option>
            )}

            {/* Otras configuraciones disponibles */}
            {configs
              ?.filter(
                (cfg) => cfg.isActive && cfg.id !== status?.config?.id
              )
              .map((cfg) => (
                <option key={cfg.id} value={cfg.id}>
                  {cfg.name}
                </option>
              ))}

            {/* Si no hay elección activa ni configs, mostrar placeholder */}
            {(!status?.config?.id || !status.config.isActive) &&
              (!configs || configs.filter((cfg) => cfg.isActive).length === 0) && (
                <option value="">Sin elecciones disponibles</option>
              )}
          </select>

          {/* Indicador de bloqueo para clientes con contrato */}
          {isLocked && (
            <div
              className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded"
              title="Tu elección está vinculada a tu contrato activo"
            >
              <Lock size={12} />
              <span>{territoryName}</span>
            </div>
          )}

          {/* Warning si es cliente sin contrato activo */}
          {isClient && contractStatus === "no_contracts" && (
            <div
              className="flex items-center gap-1 text-xs text-amber-700"
              title="No tienes contratos asignados"
            >
              <AlertCircle size={14} />
            </div>
          )}

          {isClient && contractStatus === "all_inactive" && (
            <div
              className="flex items-center gap-1 text-xs text-amber-700"
              title="Todos tus contratos están inactivos"
            >
              <AlertCircle size={14} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
