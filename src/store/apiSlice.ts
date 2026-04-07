import {
  type BaseQueryApi,
  FetchArgs,
  createApi,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logOut } from "./auth/authSlice";
import { publicEnv } from "@/shared/env/public";
import { isBrowser } from "@/shared/platform/browser";
import { readStorageItem } from "@/shared/auth/storage";
import type { RootState } from "./index";

const baseApiUrl = publicEnv.baseApiUrl;

const baseQuery = fetchBaseQuery({
  baseUrl: baseApiUrl,

  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    headers.set("Accept", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const needsElectionId = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p.startsWith("/auth")) return false;
  if (p.startsWith("/client-reports/my-active-contract")) return false;
  return (
    p.startsWith("/results") ||
    p.startsWith("/attestations") ||
    p.startsWith("/ballots") ||
    p.startsWith("/geographic/electoral-") ||
    p.startsWith("/geographic/electoral_") ||
    p.startsWith("/geographic/electoral-tables/attested-only")||
    p.startsWith("/client-reports")

  );
};

const baseQueryWrapper = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: Parameters<typeof baseQuery>[2],
) => {
  const state = api.getState() as RootState;
  const urlElectionId =
    isBrowser()
      ? new URLSearchParams(window.location.search).get("electionId")
      : null;
  const eid =
    urlElectionId ??
    state?.election?.selectedElectionId ??
    readStorageItem("selectedElectionId");

  const adjusted: FetchArgs =
    typeof args === "string" ? { url: args } : { ...args };


  const urlPath = typeof args === "string" ? args : (args.url as string);
  if (eid && needsElectionId(urlPath)) {
    const prevParams = (adjusted.params as Record<string, unknown>) || {};
    if (!("electionId" in prevParams)) {
      adjusted.params = { ...prevParams, electionId: eid };
    }
  }

  const result = await baseQuery(adjusted, api, extraOptions);

  if ((result.error as FetchBaseQueryError | undefined)?.status === 401 && state?.auth?.token) {
    api.dispatch(logOut());
    if (isBrowser()) {
      const target = publicEnv.appMode === "voting" ? "/" : "/login";
      if (window.location.pathname !== target) {
        window.location.assign(target);
      }
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWrapper,
  tagTypes: [
    "Partidos",
    "Recintos",
    "Ballots",
    "Resultados",
    "Profile",
    "Departments",
    "Provinces",
    "Municipalities",
    "ElectoralSeats",
    "ElectoralLocations",
    "ElectoralTables",
    "Configurations",
    "PoliticalParties",
    "Attestations",
    "ClientReports",
    "Contracts",
    // Institutional Voting
    "VotingEvents",
    "VotingEventRoles",
    "VotingEventOptions",
    "VotingEventPadron",
    "VotingEventResults",
    "VotingEventNews",
    "InstitutionalTenants",
  ],
  endpoints: () => ({}),
});
