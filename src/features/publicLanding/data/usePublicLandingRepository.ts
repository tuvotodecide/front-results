// Hook selector para el repositorio del landing público
// Permite cambiar entre mock y API sin tocar componentes

import { useState, useEffect } from 'react';
import type { IPublicLandingRepository } from './PublicLandingRepository';
import { publicLandingRepositoryMock } from './PublicLandingRepository.mock';
import type { PublicLandingData, ActiveElection } from '../types';

// Selecciona la implementación del repositorio
// TODO: Cambiar a API real cuando esté disponible
const getRepository = (): IPublicLandingRepository => {
  // Por ahora siempre usa mock
  // En el futuro: verificar config o env para usar API real
  return publicLandingRepositoryMock;
};

interface UseLandingDataResult {
  data: PublicLandingData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useLandingData = (): UseLandingDataResult => {
  const [data, setData] = useState<PublicLandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const repository = getRepository();
      const result = await repository.getLandingData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

interface UseActiveElectionsResult {
  featured: ActiveElection | null;
  others: ActiveElection[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useActiveElections = (): UseActiveElectionsResult => {
  const [featured, setFeatured] = useState<ActiveElection | null>(null);
  const [others, setOthers] = useState<ActiveElection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const repository = getRepository();
      const result = await repository.getActiveElections();
      setFeatured(result.featured);
      setOthers(result.others);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { featured, others, loading, error, refetch: fetchData };
};
