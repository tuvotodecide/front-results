import {
  BaseQueryApi,
  FetchArgs,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { RootState } from "./index";
import { logOut } from "./auth/authSlice";

import { storageService } from "../services/storage.service";


const { VITE_BASE_API_URL } = import.meta.env;
const baseApiUrl = (VITE_BASE_API_URL as string) || "http://localhost:3000/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: baseApiUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    const apiKey = import.meta.env.VITE_API_KEY;

    // Debug log for troubleshooting auth headers
    if (import.meta.env.DEV) {
      console.log(`[API] Path: ${window.location.pathname} | Token present: ${!!token}`);
    }

    headers.set("Accept", "application/json");

    if (token && typeof token === 'string' && token.length > 5) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (apiKey) {
      headers.set("x-api-key", apiKey);
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
    p.startsWith("/geographic/electoral-tables/attested-only") ||
    p.startsWith("/client-reports")

  );
};

const baseQueryWrapper = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: {},
) => {
  const state = api.getState() as RootState;
  const eid =
    state.election.selectedElectionId ??
    storageService.getItem("selectedElectionId");

  let adjusted: FetchArgs =
    typeof args === "string" ? { url: args } : { ...args };


  const urlPath = typeof args === "string" ? args : (args.url as string);
  if (eid && needsElectionId(urlPath)) {
    const prevParams = (adjusted.params as Record<string, string | number | boolean | undefined>) || {};
    if (!("electionId" in prevParams)) {
      adjusted.params = { ...prevParams, electionId: eid };
    }
  }

  const result = await baseQuery(adjusted, api, extraOptions);

  if (result.error?.status === 401) {
    const isLoginPage = window.location.pathname === "/login";
    if (!isLoginPage) {
      api.dispatch(logOut());
      if (typeof window !== "undefined") {
        window.location.assign("/login");
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
  ],
  endpoints: () => ({}),
});
