// Mock Repository para Padrón Electoral
// Simula operaciones de backend con localStorage

import type {
  Voter,
  PadronUploadResult,
  PadronFile,
  PadronState,
  CorrectionInput,
  VoterStatus,
  InvalidReason,
} from '../types';

const STORAGE_KEY = 'mock_padron';

// Datos mock para simular votantes
const MOCK_NAMES = [
  'Juan Carlos Pérez Mamani',
  'María Elena Quispe Flores',
  'Ana Lucía Morales Vega',
  'Carlos Eduardo Mamani Quispe',
  'Rosa María Condori Huanca',
  'Pedro Pablo García López',
  'Silvia Andrea Mendoza Cruz',
  'Jorge Luis Vargas Rojas',
  'Carmen Patricia Flores Soto',
  'Roberto Daniel Choque Nina',
];


// Genera una cédula aleatoria válida (solo números)
const generateCarnet = (): string => {
  const num = Math.floor(1000000 + Math.random() * 9000000);
  return `${num}`;
};

// Genera votantes mock
const generateMockVoters = (count: number, invalidCount: number): Voter[] => {
  const voters: Voter[] = [];

  for (let i = 0; i < count; i++) {
    const isInvalid = i < invalidCount;
    let status: VoterStatus = 'valid';
    let invalidReason: InvalidReason | undefined;
    let carnet = generateCarnet();
    const fullName = MOCK_NAMES[i % MOCK_NAMES.length];

    if (isInvalid) {
      status = 'invalid';
      if (i === 0) {
        // Primer inválido: vacío
        invalidReason = 'empty';
        carnet = '';
      } else {
        // Segundo inválido: formato con letras
        invalidReason = 'invalid_format';
        carnet = 'ABC123';
      }
    }

    voters.push({
      id: `voter-${i + 1}`,
      rowNumber: i + 1,
      carnet,
      fullName,
      status,
      invalidReason,
    });
  }

  return voters;
};

// Helper para obtener estado del localStorage
const getStoredState = (electionId: string): PadronState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allStates: Record<string, PadronState> = JSON.parse(stored);
      return allStates[electionId] || null;
    }
  } catch {
    // Ignorar errores de parsing
  }
  return null;
};

// Helper para guardar estado en localStorage
const saveState = (electionId: string, state: PadronState): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allStates: Record<string, PadronState> = stored ? JSON.parse(stored) : {};
    allStates[electionId] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
  } catch {
    // Ignorar errores
  }
};

// Simula delay de red
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// =====================
// Repository Interface
// =====================

export interface PadronRepository {
  // Obtener estado actual del padrón
  getPadronState(electionId: string): Promise<PadronState>;

  // Subir archivo CSV (simula procesamiento)
  uploadCSV(
    electionId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<PadronUploadResult>;

  // Obtener votantes con paginación y búsqueda
  getVoters(
    electionId: string,
    options?: {
      page?: number;
      pageSize?: number;
      search?: string;
      statusFilter?: VoterStatus | 'all';
    }
  ): Promise<{
    voters: Voter[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;

  // Obtener solo registros inválidos
  getInvalidVoters(electionId: string): Promise<Voter[]>;

  // Guardar correcciones de registros inválidos
  saveCorrections(
    electionId: string,
    corrections: CorrectionInput[],
    onProgress?: (progress: number) => void
  ): Promise<PadronUploadResult>;

  // Eliminar registro
  deleteVoter(electionId: string, voterId: string): Promise<void>;

  // Eliminar padrón completo
  deletePadron(electionId: string): Promise<void>;

  // Reemplazar archivo (elimina actual y sube nuevo)
  replacePadron(
    electionId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<PadronUploadResult>;
}

// =====================
// Mock Implementation
// =====================

export const createMockPadronRepository = (): PadronRepository => {
  return {
    async getPadronState(electionId: string): Promise<PadronState> {
      await delay(200);
      const state = getStoredState(electionId);
      return (
        state || {
          electionId,
          file: null,
          voters: [],
          isLoaded: false,
        }
      );
    },

    async uploadCSV(
      electionId: string,
      file: File,
      onProgress?: (progress: number) => void
    ): Promise<PadronUploadResult> {
      // Simular procesamiento con progreso
      const steps = [10, 25, 40, 55, 70, 85, 100];
      for (const progress of steps) {
        await delay(300);
        onProgress?.(progress);
      }

      // Generar datos mock - solo 3 registros para testing (1 válido, 2 inválidos)
      const totalRecords = 3;
      const invalidCount = 2;
      const validCount = totalRecords - invalidCount;
      const voters = generateMockVoters(totalRecords, invalidCount);

      const padronFile: PadronFile = {
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        totalRecords,
        validCount,
        invalidCount,
      };

      const state: PadronState = {
        electionId,
        file: padronFile,
        voters,
        isLoaded: true,
      };

      saveState(electionId, state);

      return {
        totalRecords,
        validCount,
        invalidCount,
        voters,
      };
    },

    async getVoters(
      electionId: string,
      options = {}
    ): Promise<{
      voters: Voter[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }> {
      await delay(150);

      const { page = 1, pageSize = 10, search = '', statusFilter = 'all' } = options;
      const state = getStoredState(electionId);

      if (!state || !state.voters.length) {
        return {
          voters: [],
          total: 0,
          page: 1,
          pageSize,
          totalPages: 0,
        };
      }

      let filtered = [...state.voters];

      // Filtrar por búsqueda
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.carnet.toLowerCase().includes(searchLower) ||
            v.fullName.toLowerCase().includes(searchLower)
        );
      }

      // Filtrar por estado
      if (statusFilter !== 'all') {
        filtered = filtered.filter((v) => v.status === statusFilter);
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const paginatedVoters = filtered.slice(start, start + pageSize);

      return {
        voters: paginatedVoters,
        total,
        page,
        pageSize,
        totalPages,
      };
    },

    async getInvalidVoters(electionId: string): Promise<Voter[]> {
      await delay(100);
      const state = getStoredState(electionId);
      if (!state) return [];
      return state.voters.filter((v) => v.status === 'invalid');
    },

    async saveCorrections(
      electionId: string,
      corrections: CorrectionInput[],
      onProgress?: (progress: number) => void
    ): Promise<PadronUploadResult> {
      // Simular revalidación
      const steps = [15, 35, 55, 75, 100];
      for (const progress of steps) {
        await delay(250);
        onProgress?.(progress);
      }

      const state = getStoredState(electionId);
      if (!state) {
        throw new Error('Padrón no encontrado');
      }

      // Aplicar correcciones
      const correctionMap = new Map(corrections.map((c) => [c.id, c.carnet]));
      const updatedVoters = state.voters.map((voter) => {
        if (correctionMap.has(voter.id)) {
          const newCarnet = correctionMap.get(voter.id) || '';
          const cleanedCarnet = newCarnet.trim();
          // Validar el nuevo carnet (solo números, mínimo 6 dígitos)
          const isValid = /^\d{6,10}$/.test(cleanedCarnet);
          return {
            ...voter,
            carnet: cleanedCarnet,
            status: isValid ? ('valid' as const) : ('invalid' as const),
            invalidReason: isValid
              ? undefined
              : cleanedCarnet.length === 0
                ? ('empty' as const)
                : ('invalid_format' as const),
          };
        }
        return voter;
      });

      const validCount = updatedVoters.filter((v) => v.status === 'valid').length;
      const invalidCount = updatedVoters.filter((v) => v.status === 'invalid').length;

      const newState: PadronState = {
        ...state,
        voters: updatedVoters,
        file: state.file
          ? {
              ...state.file,
              validCount,
              invalidCount,
            }
          : null,
      };

      saveState(electionId, newState);

      return {
        totalRecords: updatedVoters.length,
        validCount,
        invalidCount,
        voters: updatedVoters,
      };
    },

    async deleteVoter(electionId: string, voterId: string): Promise<void> {
      await delay(100);
      const state = getStoredState(electionId);
      if (!state) return;

      const updatedVoters = state.voters.filter((v) => v.id !== voterId);
      const validCount = updatedVoters.filter((v) => v.status === 'valid').length;
      const invalidCount = updatedVoters.filter((v) => v.status === 'invalid').length;

      const newState: PadronState = {
        ...state,
        voters: updatedVoters,
        file: state.file
          ? {
              ...state.file,
              totalRecords: updatedVoters.length,
              validCount,
              invalidCount,
            }
          : null,
      };

      saveState(electionId, newState);
    },

    async deletePadron(electionId: string): Promise<void> {
      await delay(200);
      const state: PadronState = {
        electionId,
        file: null,
        voters: [],
        isLoaded: false,
      };
      saveState(electionId, state);
    },

    async replacePadron(
      electionId: string,
      file: File,
      onProgress?: (progress: number) => void
    ): Promise<PadronUploadResult> {
      // Primero eliminar el actual
      await this.deletePadron(electionId);
      // Luego subir el nuevo
      return this.uploadCSV(electionId, file, onProgress);
    },
  };
};

// Exportar instancia singleton
export const padronRepository = createMockPadronRepository();
