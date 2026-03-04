// Hook para gestionar la publicación de elecciones

import { useState, useEffect, useCallback } from 'react';
import {
  electionPublishRepository,
  type BallotPreviewData,
  type ConfigSummary,
  type ActivationResult,
  type ElectionStatus,
} from './ElectionPublishRepository.mock';

export interface UseElectionPublishReturn {
  // Estado
  ballotPreview: BallotPreviewData | null;
  configSummary: ConfigSummary | null;
  electionStatus: ElectionStatus;
  loading: boolean;
  error: string | null;

  // Operaciones
  activateElection: () => Promise<ActivationResult>;
  activating: boolean;
  activationResult: ActivationResult | null;

  // Utilities
  getShareUrl: () => Promise<string>;
  copyToClipboard: (text: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useElectionPublish = (electionId: string): UseElectionPublishReturn => {
  const [ballotPreview, setBallotPreview] = useState<BallotPreviewData | null>(null);
  const [configSummary, setConfigSummary] = useState<ConfigSummary | null>(null);
  const [electionStatus, setElectionStatus] = useState<ElectionStatus>('DRAFT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [preview, summary, status] = await Promise.all([
        electionPublishRepository.getBallotPreview(electionId),
        electionPublishRepository.getConfigSummary(electionId),
        electionPublishRepository.getElectionStatus(electionId),
      ]);

      setBallotPreview(preview);
      setConfigSummary(summary);
      setElectionStatus(status);
    } catch (err) {
      setError('Error al cargar los datos de la elección');
      console.error('Error fetching election publish data:', err);
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activateElection = useCallback(async (): Promise<ActivationResult> => {
    setActivating(true);
    try {
      const result = await electionPublishRepository.activateElection(electionId);
      setActivationResult(result);
      setElectionStatus('ACTIVE');
      return result;
    } finally {
      setActivating(false);
    }
  }, [electionId]);

  const getShareUrl = useCallback(async (): Promise<string> => {
    return electionPublishRepository.getPublicShareUrl(electionId);
  }, [electionId]);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      return false;
    }
  }, []);

  return {
    ballotPreview,
    configSummary,
    electionStatus,
    loading,
    error,
    activateElection,
    activating,
    activationResult,
    getShareUrl,
    copyToClipboard,
    refetch: fetchData,
  };
};
