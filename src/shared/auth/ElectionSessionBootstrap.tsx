"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  hydrateElectionFromStorage,
} from "@/store/election/electionSlice";
import type { RootState } from "@/store";

export default function ElectionSessionBootstrap() {
  const dispatch = useDispatch();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId,
  );

  useEffect(() => {
    if (selectedElectionId) {
      return;
    }

    dispatch(hydrateElectionFromStorage());
  }, [dispatch, selectedElectionId]);

  return null;
}
