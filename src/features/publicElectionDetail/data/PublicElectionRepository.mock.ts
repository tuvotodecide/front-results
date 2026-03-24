// Mock implementation del repositorio de elecciones públicas
// Incluye 3 estados: FINISHED, LIVE, UPCOMING

import type { IPublicElectionRepository, PublicElectionDetail } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data para los 3 estados
const mockElections: PublicElectionDetail[] = [
  // FINISHED - Elección finalizada con ganador
  {
    id: 'featured-1',
    title: 'Elecciones Universitarias',
    subtitle: 'Carrera de Informática',
    status: 'FINISHED',
    schedule: {
      from: '12 de febrero de 2026 - 08:00 hrs',
      to: '12 de febrero de 2026 - 18:00 hrs',
    },
    results: {
      totalVotes: 7500000,
      candidates: [
        {
          id: 'c1',
          name: 'Luis Arce Catacora',
          party: 'Movimiento Al Socialismo (MAS)',
          avatarUrl: 'https://ui-avatars.com/api/?name=Luis+Arce&background=1e40af&color=fff&size=128',
          colorHex: '#1e40af',
          votes: 3375000,
          percent: 45,
        },
        {
          id: 'c2',
          name: 'Carlos Mesa Gisbert',
          party: 'Comunidad Ciudadana (CC)',
          avatarUrl: 'https://ui-avatars.com/api/?name=Carlos+Mesa&background=059669&color=fff&size=128',
          colorHex: '#059669',
          votes: 2475000,
          percent: 33,
        },
        {
          id: 'c3',
          name: 'Fernando Camacho',
          party: 'Creemos',
          avatarUrl: 'https://ui-avatars.com/api/?name=Fernando+Camacho&background=dc2626&color=fff&size=128',
          colorHex: '#dc2626',
          votes: 1125000,
          percent: 15,
        },
        {
          id: 'c4',
          name: 'Chi Hyun Chung',
          party: 'Frente Para la Victoria (FPV)',
          avatarUrl: 'https://ui-avatars.com/api/?name=Chi+Hyun&background=7c3aed&color=fff&size=128',
          colorHex: '#7c3aed',
          votes: 525000,
          percent: 7,
        },
      ],
    },
    winnerCandidateId: 'c1',
    publicEligibilityEnabled: true,
    ballotParties: [],
  },
  // LIVE - Elección en curso
  {
    id: 'other-1',
    title: 'Elección Centro Estudiantes',
    subtitle: 'Facultad de Ingeniería',
    status: 'LIVE',
    schedule: {
      from: '2 de marzo de 2026 - 08:00 hrs',
      to: '2 de marzo de 2026 - 20:00 hrs',
    },
    results: {
      totalVotes: 1250,
      candidates: [
        {
          id: 'c1',
          name: 'María González',
          party: 'Frente Estudiantil Unido',
          avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Gonzalez&background=f59e0b&color=fff&size=128',
          colorHex: '#f59e0b',
          votes: 520,
          percent: 42,
        },
        {
          id: 'c2',
          name: 'Jorge Mendoza',
          party: 'Movimiento Renovación',
          avatarUrl: 'https://ui-avatars.com/api/?name=Jorge+Mendoza&background=3b82f6&color=fff&size=128',
          colorHex: '#3b82f6',
          votes: 450,
          percent: 36,
        },
        {
          id: 'c3',
          name: 'Ana Quispe',
          party: 'Independientes',
          avatarUrl: 'https://ui-avatars.com/api/?name=Ana+Quispe&background=8b5cf6&color=fff&size=128',
          colorHex: '#8b5cf6',
          votes: 280,
          percent: 22,
        },
      ],
    },
    winnerCandidateId: null,
    publicEligibilityEnabled: true,
    ballotParties: [],
  },
  // UPCOMING - Próxima elección
  {
    id: 'other-2',
    title: 'Elección Consejo Académico',
    subtitle: 'Universidad Pública',
    status: 'UPCOMING',
    schedule: {
      from: '15 de marzo de 2026 - 09:00 hrs',
      to: '15 de marzo de 2026 - 17:00 hrs',
    },
    results: null,
    winnerCandidateId: null,
    publicEligibilityEnabled: true,
    ballotParties: [],
  },
  // FINISHED - Otra elección finalizada
  {
    id: 'other-3',
    title: 'Elección Sindicato Docente',
    subtitle: 'Colegio Nacional',
    status: 'FINISHED',
    schedule: {
      from: '20 de enero de 2026 - 08:00 hrs',
      to: '20 de enero de 2026 - 16:00 hrs',
    },
    results: {
      totalVotes: 450,
      candidates: [
        {
          id: 'c1',
          name: 'Roberto Flores',
          party: 'Lista Azul',
          avatarUrl: 'https://ui-avatars.com/api/?name=Roberto+Flores&background=2563eb&color=fff&size=128',
          colorHex: '#2563eb',
          votes: 280,
          percent: 62,
        },
        {
          id: 'c2',
          name: 'Patricia Vargas',
          party: 'Lista Verde',
          avatarUrl: 'https://ui-avatars.com/api/?name=Patricia+Vargas&background=16a34a&color=fff&size=128',
          colorHex: '#16a34a',
          votes: 170,
          percent: 38,
        },
      ],
    },
    winnerCandidateId: 'c1',
    publicEligibilityEnabled: true,
    ballotParties: [],
  },
];

export class PublicElectionRepositoryMock implements IPublicElectionRepository {
  async listPublicElections(): Promise<PublicElectionDetail[]> {
    await delay(150);
    return mockElections;
  }

  async getPublicElectionDetail(electionId: string): Promise<PublicElectionDetail | null> {
    await delay(200);
    return mockElections.find(e => e.id === electionId) || null;
  }
}

// Singleton para uso global
export const publicElectionRepository = new PublicElectionRepositoryMock();
