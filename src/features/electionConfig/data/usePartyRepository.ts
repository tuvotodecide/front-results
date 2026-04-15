import { useMemo } from 'react';
import {
  useCreateVotingOptionMutation,
  useDeleteVotingOptionMutation,
  useGetEventOptionsQuery,
  useUpdateVotingOptionMutation,
  useReplaceOptionCandidatesMutation,
} from '../../../store/votingEvents';
import type {
  Party,
  CreatePartyPayload,
  UpdatePartyPayload,
  Candidate,
  CandidateInput,
  PartyWithCandidates,
} from '../types';
import { getOptionColors, stableCreatedAt } from '../renderUtils';

interface UsePartiesResult {
  parties: PartyWithCandidates[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  createParty: (payload: CreatePartyPayload) => Promise<Party>;
  updateParty: (payload: UpdatePartyPayload) => Promise<Party>;
  deleteParty: (partyId: string) => Promise<void>;
  saveCandidates: (partyId: string, candidates: CandidateInput[]) => Promise<Candidate[]>;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  savingCandidates: boolean;
}

export const useParties = (electionId: string): UsePartiesResult => {
  const { data = [], isLoading, error, refetch } = useGetEventOptionsQuery(electionId, {
    skip: !electionId,
  });

  const [createOption, createState] = useCreateVotingOptionMutation();
  const [updateOption, updateState] = useUpdateVotingOptionMutation();
  const [deleteOption, deleteState] = useDeleteVotingOptionMutation();
  const [replaceCandidates, candidatesState] = useReplaceOptionCandidatesMutation();

  const parties = useMemo(
    () =>
      data.map((option) => ({
        id: option.id,
        electionId: option.eventId,
        name: option.name,
        colorHex: option.color,
        colors: getOptionColors(option),
        logoUrl: option.logoUrl,
        createdAt: stableCreatedAt(option.createdAt),
        candidates: (option.candidates ?? []).map((c) => ({
          id: c.id,
          partyId: option.id,
          positionId: c.roleName,
          positionName: c.roleName,
          fullName: c.name,
          photoUrl: c.photoUrl,
        })),
      })),
    [data],
  );

  return {
    parties,
    loading: isLoading,
    error: error ? new Error('Error cargando planchas') : null,
    refetch,
    createParty: async (payload) => {
      const created = await createOption({
        eventId: electionId,
        data: {
          name: payload.name,
          color: payload.colorHex,
          colors: payload.colors,
          logoUrl: payload.logoBase64,
          candidates: [],
        },
      }).unwrap();
      return {
        id: created.id,
        electionId: created.eventId,
        name: created.name,
        colorHex: created.color,
        colors: getOptionColors(created),
        logoUrl: created.logoUrl,
        createdAt: stableCreatedAt(created.createdAt),
      };
    },
    updateParty: async (payload) => {
      const updated = await updateOption({
        eventId: electionId,
        optionId: payload.id,
        data: {
          name: payload.name,
          color: payload.colorHex,
          colors: payload.colors,
          logoUrl: payload.logoBase64,
        },
      }).unwrap();
      return {
        id: updated.id,
        electionId: updated.eventId,
        name: updated.name,
        colorHex: updated.color,
        colors: getOptionColors(updated),
        logoUrl: updated.logoUrl,
        createdAt: stableCreatedAt(updated.createdAt),
      };
    },
    deleteParty: async (partyId) => {
      await deleteOption({ eventId: electionId, optionId: partyId }).unwrap();
    },
    saveCandidates: async (partyId, candidates) => {
      const updated = await replaceCandidates({
        eventId: electionId,
        optionId: partyId,
        data: {
          candidates: candidates.map((c) => ({
            name: c.fullName,
            photoUrl: c.photoBase64,
            roleName: c.positionName,
          })),
        },
      }).unwrap();

      return (updated.candidates ?? []).map((c) => ({
        id: c.id,
        partyId,
        positionId: c.roleName,
        positionName: c.roleName,
        fullName: c.name,
        photoUrl: c.photoUrl,
      }));
    },
    creating: createState.isLoading,
    updating: updateState.isLoading,
    deleting: deleteState.isLoading,
    savingCandidates: candidatesState.isLoading,
  };
};
