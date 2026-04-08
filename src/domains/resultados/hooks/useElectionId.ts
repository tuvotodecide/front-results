"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "../navigation/compat";
import { RootState } from "../../../store";
import { useGetConfigurationStatusQuery } from "../../../store/configurations/configurationsEndpoints";

export default function useElectionId() {
  const location = useLocation();
  const selected = useSelector((s: RootState) => s.election.selectedElectionId);
  const { data: status } = useGetConfigurationStatusQuery();
  const electionIdFromUrl = useMemo(() => {
    const value = new URLSearchParams(location.search).get("electionId");
    return value?.trim() || null;
  }, [location.search]);

  if (electionIdFromUrl) return electionIdFromUrl;

  // If user has selected an election, use that
  if (selected) return selected;

  // Otherwise, return first active election from array or legacy config
  if (status?.elections?.length) {
    const activeElection = status.elections.find(e => e.isActive);
    return activeElection?.id ?? null;
  }

  // Legacy fallback
  return status?.config?.id ?? null;
}
