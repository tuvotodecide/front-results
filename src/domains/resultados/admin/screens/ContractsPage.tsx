"use client";

import { useMemo, useState } from 'react';
import { Link } from '@/domains/resultados/navigation/compat';
import BackButton from '@/domains/resultados/components/BackButton';
import Modal from '@/components/Modal';
import { useGetConfigurationsQuery } from '@/store/configurations/configurationsEndpoints';
import { useGetDepartmentsQuery } from '@/store/departments/departmentsEndpoints';
import { useGetMunicipalityQuery } from '@/store/municipalities/municipalitiesEndpoints';
import { useGetMunicipalitiesByDepartmentIdQuery } from '@/store/electionParties/electionPartiesEndpoints';
import { useGetTerritorialAccessRequestsQuery } from '@/store/accessApprovals';
import {
  useCreateContractMutation,
  useDeactivateContractMutation,
  useGetActiveContractsQuery,
  type AdminContract,
} from '@/store/contracts/contractsEndpoints';
import type { ElectionConfigType } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  MAYOR: 'Alcalde/sa',
  GOVERNOR: 'Gobernador/a',
};

const ELECTION_TYPE_LABELS: Record<ElectionConfigType, string> = {
  presidential: 'Nacional (Presidencial)',
  departamental: 'Departamental',
  municipal: 'Municipal',
  congress: 'Congreso',
  parlacen: 'Parlacen',
  referendum: 'Referéndum',
};

const selectClassName =
  'w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-400';

const todayIsoDate = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

const getErrorMessage = (error: unknown) => {
  const data = (error as { data?: unknown })?.data;
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.join(' ');
  }
  return 'No se pudo completar la operación. Intenta nuevamente.';
};

const contractTerritoryLabel = (contract: AdminContract) =>
  contract.territory.municipalityName
    ? `Municipio de ${contract.territory.municipalityName}`
    : contract.territory.departmentName
      ? `Departamento de ${contract.territory.departmentName}`
      : 'Sin territorio';

const ContractsPage = () => {
  const [clientId, setClientId] = useState('');
  const [electionId, setElectionId] = useState('');
  // Territorio elegido a mano; vacío = se usa el territorio registrado del cliente
  const [departmentId, setDepartmentId] = useState('');
  const [municipalityId, setMunicipalityId] = useState('');
  const [startDate, setStartDate] = useState(todayIsoDate);
  const [filterElectionId, setFilterElectionId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [contractToDeactivate, setContractToDeactivate] = useState<AdminContract | null>(null);

  const { data: configurations = [] } = useGetConfigurationsQuery();
  const { data: departmentsResponse } = useGetDepartmentsQuery({ limit: 100 });
  const departments = useMemo(() => departmentsResponse?.data ?? [], [departmentsResponse]);
  const { data: approvedClients = [], isLoading: loadingClients } =
    useGetTerritorialAccessRequestsQuery({ status: 'APPROVED' });
  const { data: contractsResponse, isLoading: loadingContracts } = useGetActiveContractsQuery();
  const contracts = useMemo(() => contractsResponse?.data ?? [], [contractsResponse]);

  const [createContract, { isLoading: creating }] = useCreateContractMutation();
  const [deactivateContract, { isLoading: deactivating }] = useDeactivateContractMutation();

  const elections = useMemo(
    () =>
      [...configurations].sort(
        (a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)
      ),
    [configurations]
  );
  const electionsById = useMemo(
    () => new Map(configurations.map((c) => [c.id, c])),
    [configurations]
  );
  const effectiveElectionId = electionId || elections.find((c) => c.isActive)?.id || '';
  const selectedElection = electionsById.get(effectiveElectionId);

  const clients = useMemo(
    () =>
      approvedClients
        .filter((c) => c.role === 'MAYOR' || c.role === 'GOVERNOR')
        .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''))),
    [approvedClients]
  );
  const selectedClient = clients.find((c) => c.userId === clientId);
  const isMayor = selectedClient?.role === 'MAYOR';

  // Para un alcalde solo se conoce el municipio registrado; su departamento se obtiene del detalle
  const registeredMunicipalityId = isMayor ? selectedClient?.votingMunicipalityId ?? '' : '';
  const { data: registeredMunicipality } = useGetMunicipalityQuery(registeredMunicipalityId, {
    skip: !registeredMunicipalityId,
  });
  const registeredDepartmentId = isMayor
    ? registeredMunicipality?.provinceId?.departmentId?._id ?? ''
    : selectedClient?.votingDepartmentId ?? '';

  const effectiveDepartmentId = departmentId || registeredDepartmentId;
  const effectiveMunicipalityId = isMayor
    ? municipalityId || (departmentId ? '' : registeredMunicipalityId)
    : '';

  const { data: municipalities = [], isFetching: loadingMunicipalities } =
    useGetMunicipalitiesByDepartmentIdQuery(effectiveDepartmentId, {
      skip: !isMayor || !effectiveDepartmentId,
    });

  const duplicate = contracts.find(
    (c) => c.clientId === clientId && c.electionId === effectiveElectionId
  );
  const territoryReady = isMayor ? Boolean(effectiveMunicipalityId) : Boolean(effectiveDepartmentId);
  const differsFromRegistered = selectedClient
    ? isMayor
      ? Boolean(effectiveMunicipalityId) && effectiveMunicipalityId !== registeredMunicipalityId
      : Boolean(effectiveDepartmentId) && effectiveDepartmentId !== registeredDepartmentId
    : false;
  const roleMismatch =
    selectedClient && selectedElection?.type
      ? (selectedElection.type === 'municipal' && !isMayor) ||
        (selectedElection.type === 'departamental' && isMayor)
      : false;
  const canSubmit =
    Boolean(selectedClient) &&
    Boolean(effectiveElectionId) &&
    territoryReady &&
    Boolean(startDate) &&
    !duplicate &&
    !creating;

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleClientChange = (value: string) => {
    clearMessages();
    setClientId(value);
    setDepartmentId('');
    setMunicipalityId('');
  };

  const handleCreate = async () => {
    if (!canSubmit || !selectedClient) return;
    clearMessages();
    try {
      await createContract({
        clientId: selectedClient.userId,
        electionId: effectiveElectionId,
        ...(isMayor
          ? { municipalityId: effectiveMunicipalityId }
          : { departmentId: effectiveDepartmentId }),
        startDate: new Date(`${startDate}T00:00:00`).toISOString(),
      }).unwrap();
      setSuccessMessage(
        `Contrato creado para ${selectedClient.name ?? selectedClient.email} en ${selectedElection?.name ?? 'la elección'}.`
      );
      setClientId('');
      setDepartmentId('');
      setMunicipalityId('');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleDeactivate = async () => {
    if (!contractToDeactivate) return;
    clearMessages();
    try {
      await deactivateContract(contractToDeactivate.id).unwrap();
      setSuccessMessage('Contrato desactivado.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setContractToDeactivate(null);
    }
  };

  const visibleContracts = contracts
    .filter((c) => !filterElectionId || c.electionId === filterElectionId)
    .sort(
      (a, b) =>
        String(electionsById.get(a.electionId)?.name ?? '').localeCompare(
          String(electionsById.get(b.electionId)?.name ?? '')
        ) || contractTerritoryLabel(a).localeCompare(contractTerritoryLabel(b))
    );

  return (
    <div className="p-6 bg-gray-100">
      <div className="w-full p-8 bg-white rounded shadow-md">
        <div className="flex items-center mb-6 border-b pb-4 border-gray-400">
          <BackButton className="mr-4" />
          <h1 className="text-2xl font-bold text-gray-700">Contratos</h1>
        </div>

        <p className="text-sm text-gray-600 mb-6 max-w-3xl">
          Un contrato habilita a un alcalde o gobernador aprobado para una elección y un
          territorio. La portada de /resultados muestra los contratos activos de las elecciones
          activas.
        </p>

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700" role="status">
            {successMessage}
          </div>
        )}

        <section className="mb-10 p-6 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nuevo contrato</h2>

          {!loadingClients && clients.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              No hay alcaldes ni gobernadores aprobados. Apruébalos primero en{' '}
              <Link to="/aprobaciones" className="underline font-medium">
                Aprobaciones → Territoriales
              </Link>
              .
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente aprobado *
                  </label>
                  <select
                    id="client"
                    className={selectClassName}
                    value={clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    disabled={loadingClients}
                  >
                    <option value="">{loadingClients ? 'Cargando…' : 'Selecciona un cliente'}</option>
                    {clients.map((client) => (
                      <option key={client.userId} value={client.userId}>
                        {client.name ?? client.email} · {ROLE_LABELS[client.role ?? ''] ?? client.role}
                        {client.municipalityName
                          ? ` · ${client.municipalityName}`
                          : client.departmentName
                            ? ` · ${client.departmentName}`
                            : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="election" className="block text-sm font-medium text-gray-700 mb-1">
                    Elección *
                  </label>
                  <select
                    id="election"
                    className={selectClassName}
                    value={effectiveElectionId}
                    onChange={(e) => {
                      clearMessages();
                      setElectionId(e.target.value);
                    }}
                  >
                    {!effectiveElectionId && <option value="">Selecciona una elección</option>}
                    {elections.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name}
                        {config.type ? ` · ${ELECTION_TYPE_LABELS[config.type]}` : ' · sin tipo'}
                        {config.isActive ? ' (activa)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento *
                  </label>
                  <select
                    id="department"
                    className={selectClassName}
                    value={effectiveDepartmentId}
                    onChange={(e) => {
                      clearMessages();
                      setDepartmentId(e.target.value);
                      setMunicipalityId('');
                    }}
                    disabled={!selectedClient}
                  >
                    <option value="">Selecciona un departamento</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {isMayor && (
                  <div>
                    <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
                      Municipio *
                    </label>
                    <select
                      id="municipality"
                      className={selectClassName}
                      value={effectiveMunicipalityId}
                      onChange={(e) => {
                        clearMessages();
                        setMunicipalityId(e.target.value);
                      }}
                      disabled={!effectiveDepartmentId || loadingMunicipalities}
                    >
                      <option value="">
                        {loadingMunicipalities ? 'Cargando…' : 'Selecciona un municipio'}
                      </option>
                      {municipalities.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio *
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className={selectClassName}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {duplicate && (
                  <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    Este cliente ya tiene un contrato activo en esta elección (
                    {contractTerritoryLabel(duplicate)}). Desactívalo abajo si quieres reemplazarlo.
                  </p>
                )}
                {differsFromRegistered && (
                  <p className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                    El territorio elegido no es el que el cliente registró. Al iniciar sesión, el
                    cliente solo puede consultar su territorio registrado.
                  </p>
                )}
                {roleMismatch && (
                  <p className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                    {selectedElection?.type === 'municipal'
                      ? 'Es una elección municipal: lo habitual es un contrato de alcalde.'
                      : 'Es una elección departamental: lo habitual es un contrato de gobernador.'}{' '}
                    Los resultados públicos de esta elección solo se habilitan para territorios de
                    ese nivel.
                  </p>
                )}
                {selectedElection && !selectedElection.isActive && (
                  <p className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                    La elección no está activa: el contrato no aparecerá en la portada hasta que
                    se active.
                  </p>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-slate-600 rounded hover:bg-gray-300 disabled:opacity-50"
                  onClick={handleCreate}
                  disabled={!canSubmit}
                >
                  {creating ? 'Creando…' : 'Crear contrato'}
                </button>
              </div>
            </>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-700">
              Contratos activos{' '}
              <span className="text-sm font-normal text-gray-500">({visibleContracts.length})</span>
            </h2>
            <div className="w-full max-w-xs">
              <label htmlFor="filterElection" className="sr-only">
                Filtrar por elección
              </label>
              <select
                id="filterElection"
                className={selectClassName}
                value={filterElectionId}
                onChange={(e) => setFilterElectionId(e.target.value)}
              >
                <option value="">Todas las elecciones</option>
                {elections.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingContracts ? (
            <p className="text-sm text-gray-500">Cargando contratos…</p>
          ) : visibleContracts.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
              No hay contratos activos.
            </p>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Elección', 'Cliente', 'Rol', 'Territorio', 'Desde', ''].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {visibleContracts.map((contract) => {
                    const election = electionsById.get(contract.electionId);
                    return (
                      <tr key={contract.id}>
                        <td className="px-4 py-3 text-gray-700">
                          {election?.name ?? contract.electionId}
                          {election && !election.isActive && (
                            <span className="ml-2 text-xs text-gray-400">(inactiva)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div>{contract.client?.name ?? '—'}</div>
                          <div className="text-xs text-gray-400">{contract.client?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {ROLE_LABELS[contract.clientRole] ?? contract.clientRole}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{contractTerritoryLabel(contract)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(contract.startDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="px-3 py-1 text-sm text-red-700 border border-red-300 rounded hover:bg-red-50"
                            onClick={() => setContractToDeactivate(contract)}
                          >
                            Desactivar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={Boolean(contractToDeactivate)}
        onClose={() => setContractToDeactivate(null)}
        title="Desactivar contrato"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            ¿Desactivar el contrato de {contractToDeactivate?.client?.name ?? 'este cliente'} (
            {contractToDeactivate ? contractTerritoryLabel(contractToDeactivate) : ''})? Dejará de
            aparecer en la portada de resultados.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setContractToDeactivate(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={deactivating}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Desactivar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContractsPage;
