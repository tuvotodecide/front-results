import type {
  ConfigStep,
  PartyWithCandidates,
  Position,
} from "@/features/electionConfig/types";
import type {
  EventRole,
  OptionCandidate,
  VotingOption,
} from "@/store/votingEvents/types";

export const buildElectionConfigPath = (
  electionId: string,
  step: "cargos" | "planchas" | "padron" | "review" | "status",
) => {
  if (step === "status") {
    return `/elections/${electionId}/status`;
  }

  return `/elections/${electionId}/config/${step}`;
};

export const roleToPosition = (role: EventRole): Position => ({
  id: role.id,
  name: role.name,
  electionId: role.eventId,
  createdAt: role.createdAt ?? new Date().toISOString(),
});

export const optionToPartyWithCandidates = (
  option: VotingOption,
): PartyWithCandidates => ({
  id: option.id,
  electionId: option.eventId,
  name: option.name,
  colorHex: option.color,
  logoUrl: option.logoUrl,
  createdAt: option.createdAt ?? new Date().toISOString(),
  candidates: (option.candidates ?? []).map((candidate: OptionCandidate) => ({
    id: candidate.id,
    partyId: option.id,
    positionId: candidate.roleName,
    positionName: candidate.roleName,
    fullName: candidate.name,
    photoUrl: candidate.photoUrl,
  })),
});

export const hydratePartyCandidates = (
  party: PartyWithCandidates,
  positions: Position[],
): PartyWithCandidates => ({
  ...party,
  candidates: party.candidates.map((candidate) => {
    const matchedPosition =
      positions.find((position) => position.name === candidate.positionName) ?? null;

    return {
      ...candidate,
      positionId: matchedPosition?.id ?? candidate.positionId,
    };
  }),
});

export const partyHasCompleteCandidates = (
  party: PartyWithCandidates,
  positions: Position[],
) => {
  if (positions.length === 0) return false;
  if (party.candidates.length !== positions.length) return false;

  return positions.every((position) =>
    party.candidates.some(
      (candidate) =>
        candidate.positionName === position.name &&
        candidate.fullName.trim().length > 0 &&
        String(candidate.photoUrl || "").trim().length > 0,
    ),
  );
};

export const hasDraftAlreadyStarted = (event?: {
  status?: string | null;
  votingStart?: string | null;
}) =>
  event?.status === "DRAFT" &&
  Boolean(event.votingStart && new Date(event.votingStart).getTime() <= Date.now());

export const canNavigateConfigStep = ({
  step,
  hasPositions,
  hasCompleteParties,
}: {
  step: ConfigStep;
  hasPositions: boolean;
  hasCompleteParties: boolean;
}) => {
  if (step === 1) return true;
  if (step === 2) return hasPositions;
  return hasPositions && hasCompleteParties;
};
