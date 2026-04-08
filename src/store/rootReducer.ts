import { combineReducers } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { authSlice } from "./auth/authSlice";
import { recintosSlice } from "./recintos/recintosSlice";
import { departmentsSlice } from "./departments/departmentsSlice";
import { resultsSlice } from "./resultados/resultadosSlice";
import { electoralLocationsSlice } from "./electoralLocations/electoralLocationsSlice";
import electionReducer from "./election/electionSlice";

export const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authSlice.reducer,
  recintos: recintosSlice.reducer,
  departments: departmentsSlice.reducer,
  electoralLocations: electoralLocationsSlice.reducer,
  results: resultsSlice.reducer,
  election: electionReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
