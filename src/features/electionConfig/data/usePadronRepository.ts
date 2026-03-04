// Hook para gestionar el padrón electoral
// Abstrae la comunicación con el repository

import { useState, useEffect, useCallback } from 'react';
import { padronRepository } from './PadronRepository.mock';
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
  // Estado del padrón
  file: PadronFile | null;
  isLoaded: boolean;
  loading: boolean;

  // Votantes paginados
  voters: Voter[];
  totalVoters: number;
  page: number;
  pageSize: number;
  totalPages: number;

  // Stats
  validCount: number;
  invalidCount: number;

  // Operaciones
  uploadCSV: (
    file: File,
    onProgress?: (progress: number) => void
  ) => Promise<PadronUploadResult>;
  uploading: boolean;

  getInvalidVoters: () => Promise<Voter[]>;

  saveCorrections: (
    corrections: CorrectionInput[],
    onProgress?: (progress: number) => void
  ) => Promise<PadronUploadResult>;
  savingCorrections: boolean;

  deleteVoter: (voterId: string) => Promise<void>;
  deletingVoter: boolean;

  deletePadron: () => Promise<void>;
  deletingPadron: boolean;

  replacePadron: (
    file: File,
    onProgress?: (progress: number) => void
  ) => Promise<PadronUploadResult>;
  replacingPadron: boolean;

  // Refetch
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
}

export const usePadron = (
  electionId: string,
  options: UsePadronOptions = {}
): UsePadronReturn => {
  const { pageSize = 10, statusFilter = 'all' } = options;

  // Estado local
  const [file, setFile] = useState<PadronFile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  // Estados de operaciones
  const [uploading, setUploading] = useState(false);
  const [savingCorrections, setSavingCorrections] = useState(false);
  const [deletingVoter, setDeletingVoter] = useState(false);
  const [deletingPadron, setDeletingPadron] = useState(false);
  const [replacingPadron, setReplacingPadron] = useState(false);

  // Cargar estado inicial y votantes
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Obtener estado del padrón
      const state = await padronRepository.getPadronState(electionId);
      setFile(state.file);
      setIsLoaded(state.isLoaded);
      setValidCount(state.file?.validCount || 0);
      setInvalidCount(state.file?.invalidCount || 0);

      // Obtener votantes paginados
      if (state.isLoaded) {
        const result = await padronRepository.getVoters(electionId, {
          page,
          pageSize,
          search,
          statusFilter,
        });
        setVoters(result.voters);
        setTotalVoters(result.total);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error('Error fetching padron:', error);
    } finally {
      setLoading(false);
    }
  }, [electionId, page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subir CSV
  const uploadCSV = useCallback(
    async (
      csvFile: File,
      onProgress?: (progress: number) => void
    ): Promise<PadronUploadResult> => {
      setUploading(true);
      try {
        const result = await padronRepository.uploadCSV(electionId, csvFile, onProgress);
        setFile({
          fileName: csvFile.name,
          uploadedAt: new Date().toISOString(),
          totalRecords: result.totalRecords,
          validCount: result.validCount,
          invalidCount: result.invalidCount,
        });
        setIsLoaded(true);
        setValidCount(result.validCount);
        setInvalidCount(result.invalidCount);
        await fetchData();
        return result;
      } finally {
        setUploading(false);
      }
    },
    [electionId, fetchData]
  );

  // Obtener votantes inválidos
  const getInvalidVoters = useCallback(async (): Promise<Voter[]> => {
    return padronRepository.getInvalidVoters(electionId);
  }, [electionId]);

  // Guardar correcciones
  const saveCorrections = useCallback(
    async (
      corrections: CorrectionInput[],
      onProgress?: (progress: number) => void
    ): Promise<PadronUploadResult> => {
      setSavingCorrections(true);
      try {
        const result = await padronRepository.saveCorrections(
          electionId,
          corrections,
          onProgress
        );
        setValidCount(result.validCount);
        setInvalidCount(result.invalidCount);
        if (file) {
          setFile({
            ...file,
            validCount: result.validCount,
            invalidCount: result.invalidCount,
          });
        }
        await fetchData();
        return result;
      } finally {
        setSavingCorrections(false);
      }
    },
    [electionId, file, fetchData]
  );

  // Eliminar votante
  const deleteVoter = useCallback(
    async (voterId: string): Promise<void> => {
      setDeletingVoter(true);
      try {
        await padronRepository.deleteVoter(electionId, voterId);
        await fetchData();
      } finally {
        setDeletingVoter(false);
      }
    },
    [electionId, fetchData]
  );

  // Eliminar padrón completo
  const deletePadron = useCallback(async (): Promise<void> => {
    setDeletingPadron(true);
    try {
      await padronRepository.deletePadron(electionId);
      setFile(null);
      setIsLoaded(false);
      setVoters([]);
      setTotalVoters(0);
      setValidCount(0);
      setInvalidCount(0);
    } finally {
      setDeletingPadron(false);
    }
  }, [electionId]);

  // Reemplazar padrón
  const replacePadron = useCallback(
    async (
      csvFile: File,
      onProgress?: (progress: number) => void
    ): Promise<PadronUploadResult> => {
      setReplacingPadron(true);
      try {
        const result = await padronRepository.replacePadron(electionId, csvFile, onProgress);
        setFile({
          fileName: csvFile.name,
          uploadedAt: new Date().toISOString(),
          totalRecords: result.totalRecords,
          validCount: result.validCount,
          invalidCount: result.invalidCount,
        });
        setIsLoaded(true);
        setValidCount(result.validCount);
        setInvalidCount(result.invalidCount);
        await fetchData();
        return result;
      } finally {
        setReplacingPadron(false);
      }
    },
    [electionId, fetchData]
  );

  return {
    file,
    isLoaded,
    loading,
    voters,
    totalVoters,
    page,
    pageSize,
    totalPages,
    validCount,
    invalidCount,
    uploadCSV,
    uploading,
    getInvalidVoters,
    saveCorrections,
    savingCorrections,
    deleteVoter,
    deletingVoter,
    deletePadron,
    deletingPadron,
    replacePadron,
    replacingPadron,
    refetch: fetchData,
    setPage,
    setSearch,
  };
};
