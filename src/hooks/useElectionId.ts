"use client";

import { useSelector } from "react-redux";
import { readElectionIdParam } from "@/domains/results/lib/queryParams";
import { useBrowserSearchParams } from "@/shared/routing/browserLocation";
import type { RootState } from "../store";
import { useGetConfigurationStatusQuery } from "../store/configurations/configurationsEndpoints";

export default function useElectionId() {
  const searchParams = useBrowserSearchParams();
  const selected = useSelector((s: RootState) => s.election.selectedElectionId);
  const { data: status } = useGetConfigurationStatusQuery();
  const electionIdFromUrl = readElectionIdParam(searchParams);

  if (electionIdFromUrl) return electionIdFromUrl;

  // If user has selected an election, use that
  if (selected) return selected;

  // Otherwise, return the first active election from the configuration response
  if (status?.elections?.length) {
    const activeElection = status.elections.find(e => e.isActive);
    return activeElection?.id ?? null;
  }

  // Fallback for single-config responses
  return status?.config?.id ?? null;
}
