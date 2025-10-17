import {
  BaseQueryApi,
  FetchArgs,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
// import { RootState } from './index';

const { VITE_BASE_API_URL } = import.meta.env;
const baseApiUrl = VITE_BASE_API_URL || "http://localhost:3000/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: baseApiUrl,
  // prepareHeaders: (headers, { getState }) => {
  //   const state: RootState = getState() as RootState;
  //   const token = state.auth.token;
  //   headers.set('Accept', 'application/json');
  //   if (token) {
  //     headers.set('Authorization', `Bearer ${token}`);
  //   }
  //   return headers;
  // },
});

const needsElectionId = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return (
    p.startsWith("/results") ||
    p.startsWith("/attestations") ||
    p.startsWith("/ballots") ||
    p.startsWith("/geographic/electoral-tables/attested-only")
  );
};



const baseQueryWrapper = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: {}
) => {
  const state = api.getState() as any;
  const eid =
    state?.election?.selectedElectionId ??
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("selectedElectionId")
      : null);

  let adjusted: FetchArgs =
    typeof args === "string" ? { url: args } : { ...args };

  // Solo añadimos electionId a endpoints que lo requieren
  const urlPath = typeof args === "string" ? args : (args.url as string);
  if (eid && needsElectionId(urlPath)) {
    const prevParams = (adjusted.params as Record<string, any>) || {};
    if (!("electionId" in prevParams)) {
      adjusted.params = { ...prevParams, electionId: eid };
    }
  }

  const result = await baseQuery(adjusted, api, extraOptions);

  // const result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    // api.dispatch(logOut());
    console.log("Unauthorized, logout");
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
  ],
  endpoints: () => ({}),
});
