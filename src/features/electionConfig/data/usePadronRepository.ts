import { useMemo, useState, useCallback } from 'react';
import {
  useGetPadronVersionsQuery,
  useGetPadronVotersQuery,
  useImportPadronMutation,
} from '../../../store/votingEvents';
import type {
  Voter,
  PadronFile,
  PadronUploadResult,
  CorrectionInput,
  VoterStatus,
} from '../types';

export interface UsePadronOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  statusFilter?: VoterStatus | 'all';
}

export interface UsePadronReturn {
  file: PadronFile | null;
  isLoaded: boolean;
  loading: boolean;
  voters: Voter[];
  totalVoters: number;
  page: number;
  pageSize: number;
  totalPages: number;
  validCount: number;
  invalidCount: number;
  uploadCSV: (file: File, onProgress?: (progress: number) => void) => Promise<PadronUploadResult>;
  uploading: boolean;
  getInvalidVoters: () => Promise<Voter[]>;
  saveCorrections: (
    corrections: CorrectionInput[],
    onProgress?: (progress: number) => void,
  ) => Promise<PadronUploadResult>;
  savingCorrections: boolean;
  deleteVoter: (voterId: string) => Promise<void>;
  deletingVoter: boolean;
  deletePadron: () => Promise<void>;
  deletingPadron: boolean;
  replacePadron: (
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<PadronUploadResult>;
  replacingPadron: boolean;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
}

export const usePadron = (electionId: string, options: UsePadronOptions = {}): UsePadronReturn => {
  const { pageSize = 50, statusFilter = 'all' } = options;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(options.search ?? '');

  const { data: versions = [], isLoading: loadingVersions, refetch: refetchVersions } =
    useGetPadronVersionsQuery(electionId, { skip: !electionId });

  const { data: votersResp, isLoading: loadingVoters, refetch: refetchVoters } =
    useGetPadronVotersQuery(
      { eventId: electionId, page, limit: pageSize },
      { skip: !electionId || versions.length === 0 },
    );

  const [importPadron, importState] = useImportPadronMutation();

  const currentVersion = versions.find((v) => v.isCurrent) ?? versions[0] ?? null;

  const voters = useMemo(() => {
    const rows = (votersResp?.voters ?? []).map((v, index) => ({
      id: v.id,
      rowNumber: (page - 1) * pageSize + index + 1,
      carnet: v.carnet,
      fullName: v.fullName || '',
      enabled: v.enabled !== false,
      hasIdentity: true,
      status: 'valid' as const,
      invalidReason: undefined,
    }));

    const searched = search.trim()
      ? rows.filter(
          (r) =>
            r.carnet.toLowerCase().includes(search.toLowerCase()) ||
            r.fullName.toLowerCase().includes(search.toLowerCase()),
        )
      : rows;

    if (statusFilter === 'all') return searched;
    return searched.filter((r) => r.status === statusFilter);
  }, [votersResp?.voters, page, pageSize, search, statusFilter]);

  const file: PadronFile | null = currentVersion
    ? {
        fileName: currentVersion.fileName,
        uploadedAt: currentVersion.uploadedAt,
        totalRecords: currentVersion.totalRecords,
        validCount: currentVersion.validCount,
        invalidCount: currentVersion.invalidCount,
      }
    : null;

  const uploadCSV = useCallback(
    async (fileToUpload: File, onProgress?: (progress: number) => void): Promise<PadronUploadResult> => {
      onProgress?.(30);
      const out = await importPadron({ eventId: electionId, file: fileToUpload }).unwrap();
      onProgress?.(100);
      return {
        totalRecords: out.totalRecords,
        validCount: out.validCount,
        invalidCount: out.invalidCount,
        voters: [],
      };
    },
    [importPadron, electionId],
  );

  const refetch = useCallback(async () => {
    await Promise.all([refetchVersions(), refetchVoters()]);
  }, [refetchVersions, refetchVoters]);

  return {
    file,
    isLoaded: Boolean(currentVersion),
    loading: loadingVersions || loadingVoters,
    voters,
    totalVoters: votersResp?.total ?? 0,
    page,
    pageSize,
    totalPages: votersResp?.totalPages ?? 0,
    validCount: currentVersion?.validCount ?? 0,
    invalidCount: currentVersion?.invalidCount ?? 0,
    uploadCSV,
    uploading: importState.isLoading,
    getInvalidVoters: async () => [],
    saveCorrections: async () => {
      throw new Error('Las correcciones del padrón no están disponibles en este momento.');
    },
    savingCorrections: false,
    deleteVoter: async () => {
      throw new Error('No se puede eliminar este registro en este momento.');
    },
    deletingVoter: false,
    deletePadron: async () => {
      throw new Error('No se puede eliminar el padrón en este momento.');
    },
    deletingPadron: false,
    replacePadron: uploadCSV,
    replacingPadron: importState.isLoading,
    refetch,
    setPage,
    setSearch,
  };
};
