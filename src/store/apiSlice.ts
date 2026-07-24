import {
  BaseQueryApi,
  FetchArgs,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { logOut } from "./auth/authSlice";
import {
  AUTH_VERSION_MISMATCH_CODE,
  persistAuthSessionEndReason,
} from "./auth/sessionInvalidation";
import { getRuntimeEnv } from "../shared/system/runtimeEnv";
import { readStorage } from "../shared/system/browserStorage";

type ApiStateShape = {
  auth?: {
    token?: string | null;
  };
  election?: {
    selectedElectionId?: string | null;
  };
};

const baseApiUrl =
  getRuntimeEnv("VITE_BASE_API_URL", "NEXT_PUBLIC_BASE_API_URL") ||
  "http://localhost:3000/api/v1";
const appMode = String(
  getRuntimeEnv("VITE_APP_MODE", "NEXT_PUBLIC_APP_MODE") || "voting",
).toLowerCase();

const baseQuery = fetchBaseQuery({
  baseUrl: baseApiUrl,

  prepareHeaders: (headers, { getState }) => {
    const state = getState() as ApiStateShape;
    const token = state.auth?.token;
    headers.set("Accept", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const getErrorCode = (errorData: unknown) => {
  if (
    typeof errorData === "object" &&
    errorData !== null &&
    "code" in errorData &&
    typeof errorData.code === "string"
  ) {
    return errorData.code;
  }

  return null;
};

const getUnauthorizedRedirectTarget = (isAuthVersionMismatch: boolean) => {
  if (isAuthVersionMismatch) {
    if (appMode === "voting") return "/votacion/login";
    if (appMode === "resultados") return "/resultados/login";
    return "/login";
  }

  return appMode === "voting" ? "/" : "/login";
};

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
  extraOptions: {},
) => {
  const state = api.getState() as ApiStateShape;
  const urlElectionId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("electionId")
      : null;
  const eid =
    urlElectionId ??
    state?.election?.selectedElectionId ??
    readStorage("selectedElectionId");

  const adjusted: FetchArgs =
    typeof args === "string" ? { url: args } : { ...args };


  const urlPath = typeof args === "string" ? args : (args.url as string);
  if (eid && needsElectionId(urlPath)) {
    const prevParams =
      (adjusted.params as Record<string, unknown> | undefined) || {};
    if (!("electionId" in prevParams)) {
      adjusted.params = { ...prevParams, electionId: eid };
    }
  }

  const result = await baseQuery(adjusted, api, extraOptions);

  if (result.error?.status === 401 && state?.auth?.token) {
    const code = getErrorCode(result.error.data);
    const isAuthVersionMismatch = code === AUTH_VERSION_MISMATCH_CODE;
    if (isAuthVersionMismatch) {
      persistAuthSessionEndReason(AUTH_VERSION_MISMATCH_CODE);
    }
    api.dispatch(logOut());
    if (isAuthVersionMismatch) {
      api.dispatch(apiSlice.util.resetApiState());
    }
    if (typeof window !== "undefined") {
      const target = getUnauthorizedRedirectTarget(isAuthVersionMismatch);
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
    "VotingEventPadronSummary",
    "VotingEventResults",
    "VotingEventNews",
    "OfficialPublicationRequests",
    "InstitutionalTenants",
    "AccessApprovals",
    "TvdPayments",
    "TvdPayment",
    "TvdAccreditations",
    "TvdEventCapacity",
    "InstitutionalRecoveryRequests",
    "InstitutionalRecoveryRequest",
  ],
  endpoints: () => ({}),
});
