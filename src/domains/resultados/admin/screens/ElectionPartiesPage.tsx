"use client";

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from '@/domains/resultados/navigation/compat';
import BackButton from '@/domains/resultados/components/BackButton';
import { useGetConfigurationsQuery } from '@/store/configurations/configurationsEndpoints';
import { useGetPoliticalPartiesQuery } from '@/store/politicalParties/politicalPartiesEndpoints';
import { useGetDepartmentsQuery } from '@/store/departments/departmentsEndpoints';
import {
  useAssignElectionPartiesMutation,
  useGetElectionPartiesQuery,
  useGetMunicipalitiesByDepartmentIdQuery,
  useUpdateElectionPartyMutation,
} from '@/store/electionParties/electionPartiesEndpoints';
import type { ElectionConfigType, ElectionPartyType } from '@/types';

type Scope = 'nacional' | 'departamento' | 'municipio';

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: 'nacional', label: 'Nacional (todo el país)' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'municipio', label: 'Municipio' },
];

const ELECTION_TYPE_LABELS: Record<ElectionConfigType, string> = {
  presidential: 'Nacional (Presidencial)',
  departamental: 'Departamental',
  municipal: 'Municipal',
  congress: 'Congreso',
  parlacen: 'Parlacen',
  referendum: 'Referéndum',
};

const defaultScopeFor = (type?: ElectionConfigType): Scope => {
  if (type === 'departamental') return 'departamento';
  if (type === 'municipal') return 'municipio';
  return 'nacional';
};

// El backend compara partyId sin distinguir mayúsculas (collation strength 2)
const normalizeId = (value: string) => value.trim().toLowerCase();

const matchesScope = (
  row: ElectionPartyType,
  scope: Scope,
  departmentId: string,
  municipalityId: string
) => {
  if (scope === 'nacional') return !row.departmentId && !row.municipalityId;
  if (scope === 'departamento')
    return row.departmentId === departmentId && !row.municipalityId;
  return row.municipalityId === municipalityId;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    if ('data' in error) {
      const data = (error as { data?: unknown }).data;
      if (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message?: unknown }).message === 'string'
      ) {
        return (data as { message: string }).message;
      }
    }
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
  }
  return 'Ocurrió un error inesperado al guardar los partidos';
};

interface PartyRow {
  partyId: string;
  shortName: string;
  fullName: string;
  color: string | null;
  inCatalog: boolean;
  catalogActive: boolean;
}

const selectClassName =
  'w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-400';

const ElectionPartiesPage = () => {
  const [searchParams] = useSearchParams();
  const [electionId, setElectionId] = useState(searchParams.get('election') ?? '');
  const [scopeOverride, setScopeOverride] = useState<Scope | null>(null);
  const [departmentId, setDepartmentId] = useState('');
  const [municipalityId, setMunicipalityId] = useState('');
  // Borrador de selección ligado al ámbito actual; si cambia el ámbito se descarta
  const [draft, setDraft] = useState<{ key: string; ids: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: configurations = [], isLoading: loadingConfigs } =
    useGetConfigurationsQuery();
  const { data: catalog = [], isLoading: loadingCatalog } =
    useGetPoliticalPartiesQuery();
  const { data: departmentsResponse } = useGetDepartmentsQuery({ limit: 100 });
  const departments = useMemo(
    () => departmentsResponse?.data ?? [],
    [departmentsResponse]
  );

  const elections = useMemo(
    () =>
      [...configurations].sort(
        (a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)
      ),
    [configurations]
  );
  const effectiveElectionId = electionId || elections.find((c) => c.isActive)?.id || '';
  const selectedElection = elections.find((c) => c.id === effectiveElectionId);
  const scope = scopeOverride ?? defaultScopeFor(selectedElection?.type);

  const { data: assignments = [], isFetching: loadingAssignments } =
    useGetElectionPartiesQuery(effectiveElectionId, { skip: !effectiveElectionId });
  const { data: municipalities = [], isFetching: loadingMunicipalities } =
    useGetMunicipalitiesByDepartmentIdQuery(departmentId, {
      skip: scope !== 'municipio' || !departmentId,
    });

  const [assignParties] = useAssignElectionPartiesMutation();
  const [updateElectionParty] = useUpdateElectionPartyMutation();

  const scopeReady =
    Boolean(effectiveElectionId) &&
    (scope === 'nacional' ||
      (scope === 'departamento' && Boolean(departmentId)) ||
      (scope === 'municipio' && Boolean(municipalityId)));
  const scopeKey = `${effectiveElectionId}|${scope}|${departmentId}|${municipalityId}`;

  const activeAssignments = useMemo(
    () => assignments.filter((row) => row.active),
    [assignments]
  );
  const activeScopeRows = useMemo(
    () =>
      scopeReady
        ? activeAssignments.filter((row) =>
            matchesScope(row, scope, departmentId, municipalityId)
          )
        : [],
    [activeAssignments, scopeReady, scope, departmentId, municipalityId]
  );

  const baselineIds = useMemo(
    () => activeScopeRows.map((row) => normalizeId(row.partyId)),
    [activeScopeRows]
  );
  const selectedIds = draft?.key === scopeKey ? draft.ids : baselineIds;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const isDirty =
    selectedSet.size !== baselineIds.length ||
    baselineIds.some((id) => !selectedSet.has(id));

  // Primero los partidos ya habilitados (en su orden de asignación), luego el resto del catálogo
  const partyRows = useMemo<PartyRow[]>(() => {
    const catalogById = new Map(catalog.map((p) => [normalizeId(p.partyId), p]));
    const rows: PartyRow[] = [];
    const seen = new Set<string>();

    for (const row of activeScopeRows) {
      const key = normalizeId(row.partyId);
      if (seen.has(key)) continue;
      seen.add(key);
      const party = catalogById.get(key);
      rows.push({
        partyId: party?.partyId ?? row.partyId,
        shortName: party?.shortName ?? row.shortName ?? row.partyId,
        fullName: party?.fullName ?? row.fullName ?? '',
        color: party?.color ?? row.color,
        inCatalog: Boolean(party),
        catalogActive: party?.active ?? false,
      });
    }

    const rest = catalog
      .filter((p) => !seen.has(normalizeId(p.partyId)))
      .sort((a, b) => a.shortName.localeCompare(b.shortName));
    for (const party of rest) {
      rows.push({
        partyId: party.partyId,
        shortName: party.shortName,
        fullName: party.fullName,
        color: party.color,
        inCatalog: true,
        catalogActive: party.active,
      });
    }
    return rows;
  }, [catalog, activeScopeRows]);

  // Cantidad de partidos activos por ámbito, para el resumen y las etiquetas de los selectores
  const summary = useMemo(() => {
    const national = activeAssignments.filter(
      (row) => !row.departmentId && !row.municipalityId
    ).length;
    const byDepartment = new Map<string, number>();
    const byMunicipality = new Map<string, { name: string; count: number }>();
    for (const row of activeAssignments) {
      if (row.municipalityId) {
        const current = byMunicipality.get(row.municipalityId);
        byMunicipality.set(row.municipalityId, {
          name: row.municipalityName ?? row.municipalityId,
          count: (current?.count ?? 0) + 1,
        });
      } else if (row.departmentId) {
        byDepartment.set(row.departmentId, (byDepartment.get(row.departmentId) ?? 0) + 1);
      }
    }
    return { national, byDepartment, byMunicipality };
  }, [activeAssignments]);

  const departmentsWithoutParties =
    selectedElection?.type === 'departamental' && summary.national === 0
      ? departments.filter((d) => !summary.byDepartment.has(d._id))
      : [];

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const setSelection = (ids: string[]) => {
    clearMessages();
    setDraft({ key: scopeKey, ids });
  };

  const toggleParty = (partyId: string) => {
    const key = normalizeId(partyId);
    setSelection(
      selectedSet.has(key)
        ? selectedIds.filter((id) => id !== key)
        : [...selectedIds, key]
    );
  };

  const handleElectionChange = (value: string) => {
    clearMessages();
    setElectionId(value);
    setScopeOverride(null);
    setDepartmentId('');
    setMunicipalityId('');
    setDraft(null);
  };

  const handleScopeChange = (value: Scope) => {
    clearMessages();
    setScopeOverride(value);
    setMunicipalityId('');
    if (value === 'nacional') setDepartmentId('');
    setDraft(null);
  };

  const handleSave = async () => {
    if (!scopeReady || !isDirty) return;
    clearMessages();
    setIsSaving(true);

    // Se envían en el orden de la lista: define assignmentOrder en el backend
    const toAssign = partyRows
      .filter((row) => selectedSet.has(normalizeId(row.partyId)))
      .map((row) => row.partyId);
    const toDeactivate = activeScopeRows.filter(
      (row) => !selectedSet.has(normalizeId(row.partyId))
    );

    try {
      // Se desactiva por id (PATCH) y no con remove-bulk: remove-bulk sin territorio
      // desactiva el partido en todos los ámbitos, no solo en el nacional.
      await Promise.all(
        toDeactivate.map((row) =>
          updateElectionParty({
            id: row._id,
            electionId: effectiveElectionId,
            item: { active: false },
          }).unwrap()
        )
      );
      if (toAssign.length > 0) {
        await assignParties({
          electionId: effectiveElectionId,
          partyIds: toAssign,
          ...(scope === 'departamento' ? { departmentId } : {}),
          ...(scope === 'municipio' ? { municipalityId } : {}),
        }).unwrap();
      }
      setDraft(null);
      setSuccessMessage(
        `Cambios guardados: ${toAssign.length} partido(s) habilitado(s)` +
          (toDeactivate.length ? `, ${toDeactivate.length} deshabilitado(s).` : '.')
      );
    } catch (error) {
      console.error('Error saving election parties:', error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const scopeLabel =
    scope === 'nacional'
      ? 'todo el país'
      : scope === 'departamento'
        ? departments.find((d) => d._id === departmentId)?.name ?? ''
        : municipalities.find((m) => m._id === municipalityId)?.name ?? '';

  return (
    <div className="p-6 bg-gray-100">
      <div className="w-full p-8 bg-white rounded shadow-md">
        <div className="flex items-center mb-6 border-b pb-4 border-gray-400">
          <BackButton className="mr-4" />
          <h1 className="text-2xl font-bold text-gray-700">Partidos por elección</h1>
        </div>

        <p className="text-sm text-gray-600 mb-6 max-w-3xl">
          Las actas solo se aceptan si todos sus partidos están habilitados para la
          elección y el territorio del recinto. Un partido habilitado a nivel nacional
          vale en todo el país; uno habilitado en un departamento o municipio solo vale ahí.
        </p>

        {!loadingConfigs && elections.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            No hay configuraciones electorales.{' '}
            <Link to="/resultados/configuraciones/nuevo" className="underline font-medium">
              Crea una elección
            </Link>{' '}
            primero.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div>
                <label htmlFor="election" className="block text-sm font-medium text-gray-700 mb-1">
                  Elección
                </label>
                <select
                  id="election"
                  className={selectClassName}
                  value={effectiveElectionId}
                  onChange={(e) => handleElectionChange(e.target.value)}
                  disabled={loadingConfigs}
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
                <label htmlFor="scope" className="block text-sm font-medium text-gray-700 mb-1">
                  Ámbito
                </label>
                <select
                  id="scope"
                  className={selectClassName}
                  value={scope}
                  onChange={(e) => handleScopeChange(e.target.value as Scope)}
                  disabled={!effectiveElectionId}
                >
                  {SCOPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {scope !== 'nacional' && (
                <div className="grid gap-4 grid-cols-1">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento
                    </label>
                    <select
                      id="department"
                      className={selectClassName}
                      value={departmentId}
                      onChange={(e) => {
                        clearMessages();
                        setDepartmentId(e.target.value);
                        setMunicipalityId('');
                        setDraft(null);
                      }}
                    >
                      <option value="">Selecciona un departamento</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                          {scope === 'departamento'
                            ? ` (${summary.byDepartment.get(d._id) ?? 0})`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {scope === 'municipio' && (
                    <div>
                      <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
                        Municipio
                      </label>
                      <select
                        id="municipality"
                        className={selectClassName}
                        value={municipalityId}
                        onChange={(e) => {
                          clearMessages();
                          setMunicipalityId(e.target.value);
                          setDraft(null);
                        }}
                        disabled={!departmentId || loadingMunicipalities}
                      >
                        <option value="">
                          {loadingMunicipalities ? 'Cargando…' : 'Selecciona un municipio'}
                        </option>
                        {municipalities.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({summary.byMunicipality.get(m._id)?.count ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedElection && !selectedElection.type && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Esta elección no tiene tipo definido.{' '}
                <Link
                  to={`/resultados/configuraciones/editar/${selectedElection.id}`}
                  className="underline font-medium"
                >
                  Edítala
                </Link>{' '}
                para indicar si es nacional, departamental, etc.
              </div>
            )}

            {effectiveElectionId && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                  Resumen de la elección
                </h2>
                {activeAssignments.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    {loadingAssignments ? 'Cargando…' : 'Todavía no hay partidos habilitados.'}
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2 text-xs">
                    {summary.national > 0 && (
                      <li className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        Nacional: {summary.national}
                      </li>
                    )}
                    {departments
                      .filter((d) => summary.byDepartment.has(d._id))
                      .map((d) => (
                        <li key={d._id} className="px-2 py-1 rounded-full bg-green-100 text-green-800">
                          {d.name}: {summary.byDepartment.get(d._id)}
                        </li>
                      ))}
                    {Array.from(summary.byMunicipality.entries()).map(([id, item]) => (
                      <li key={id} className="px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                        {item.name}: {item.count}
                      </li>
                    ))}
                  </ul>
                )}
                {departmentsWithoutParties.length > 0 && (
                  <p className="text-xs text-yellow-800 mt-2">
                    Departamentos sin partidos (sus actas serán rechazadas):{' '}
                    {departmentsWithoutParties.map((d) => d.name).join(', ')}
                  </p>
                )}
              </div>
            )}

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

            {!scopeReady ? (
              <p className="text-sm text-gray-500">
                {scope === 'municipio'
                  ? 'Selecciona un departamento y un municipio para ver sus partidos.'
                  : 'Selecciona un departamento para ver sus partidos.'}
              </p>
            ) : !loadingCatalog && partyRows.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                No hay partidos en el catálogo.{' '}
                <Link to="/resultados/partidos-politicos/nuevo" className="underline font-medium">
                  Crea un partido
                </Link>{' '}
                primero.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Partidos habilitados en {scopeLabel}{' '}
                    <span className="text-sm font-normal text-gray-500">
                      ({selectedSet.size} de {partyRows.length})
                    </span>
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      onClick={() =>
                        setSelection(
                          partyRows
                            .filter((row) => row.catalogActive || selectedSet.has(normalizeId(row.partyId)))
                            .map((row) => normalizeId(row.partyId))
                        )
                      }
                    >
                      Seleccionar todos
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      onClick={() => setSelection([])}
                    >
                      Ninguno
                    </button>
                  </div>
                </div>

                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  {partyRows.map((row) => {
                    const key = normalizeId(row.partyId);
                    const checked = selectedSet.has(key);
                    // Un partido inactivo en el catálogo no se puede habilitar: by-territory lo excluye de los resultados
                    const disabled = !checked && !row.catalogActive;
                    return (
                      <li key={key}>
                        <label
                          className={`flex items-center gap-3 px-4 py-3 ${
                            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleParty(row.partyId)}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                            style={{ backgroundColor: row.color ?? 'transparent' }}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium text-gray-800">{row.shortName}</span>
                          <span className="text-sm text-gray-500 truncate">{row.fullName}</span>
                          <span className="ml-auto text-xs text-gray-400 font-mono">{row.partyId}</span>
                          {!row.inCatalog && (
                            <span className="text-xs text-red-600">no existe en el catálogo</span>
                          )}
                          {row.inCatalog && !row.catalogActive && (
                            <span className="text-xs text-gray-500">inactivo en el catálogo</span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => setDraft(null)}
                    disabled={!isDirty || isSaving}
                  >
                    Descartar cambios
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-slate-600 rounded hover:bg-gray-300 disabled:opacity-50"
                    onClick={handleSave}
                    disabled={!isDirty || isSaving || loadingAssignments}
                  >
                    {isSaving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ElectionPartiesPage;
